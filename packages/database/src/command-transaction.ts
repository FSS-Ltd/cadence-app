import postgres from "postgres";
import type { Sql, TransactionSql } from "postgres";
import { workspaceIdSchema } from "@cadence/contracts/access";
import { AccessError } from "@cadence/contracts/access-errors";
import type { Database } from "./database.types.ts";

export type CommandIdentity = Readonly<{
  subject: string;
  sessionId: string;
  factorAges: readonly [number, number];
  checkedAt: number;
}>;
export type CommandTransaction = TransactionSql;

export function createCommandClient(connectionString: string): Sql {
  const url = new URL(connectionString);
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new AccessError("SERVICE_UNAVAILABLE");
  }
  const local = url.hostname === "127.0.0.1" || url.hostname === "localhost";
  return postgres(connectionString, {
    max: 3,
    prepare: false,
    ssl: local ? false : { rejectUnauthorized: true },
    idle_timeout: 20,
    connect_timeout: 10,
    connection: {
      application_name: "cadence-web-command",
      statement_timeout: 5000,
      lock_timeout: 3000,
      idle_in_transaction_session_timeout: 5000,
    },
    onnotice: () => {},
    debug: false,
  });
}

export async function withCommandTransaction(
  database: Sql,
  identity: CommandIdentity,
  operation: (transaction: CommandTransaction) => Promise<unknown>,
): Promise<unknown> {
  if (
    Date.now() - identity.checkedAt > 30_000 ||
    identity.checkedAt > Date.now()
  ) {
    throw new AccessError("AUTHENTICATION_TOO_OLD");
  }
  return database.begin(
    "isolation level read committed",
    async (transaction) => {
      if (Date.now() - identity.checkedAt > 30_000) {
        throw new AccessError("AUTHENTICATION_TOO_OLD");
      }
      const [principal] = await transaction<{ safe: boolean }[]>`
      select not exists (
        select 1 from pg_roles
        where (rolsuper or rolbypassrls or rolcreaterole or rolcreatedb)
          and pg_has_role(session_user, oid, 'MEMBER')
      )
        and not pg_has_role(session_user, 'service_role', 'MEMBER')
        and not pg_has_role(session_user, 'cadence_operator', 'MEMBER') as safe`;
      if (principal?.safe !== true)
        throw new AccessError("SERVICE_UNAVAILABLE");
      await transaction`set local role cadence_command`;
      // Only verified, allow-listed claims enter the transaction. SET LOCAL scope
      // clears both identity values on commit and rollback, including pooled use.
      await transaction`select set_config('request.jwt.claims', ${JSON.stringify({ sub: identity.subject, sid: identity.sessionId, fva: identity.factorAges })}, true)`;
      const [actor] = await transaction<
        {
          id: Database["private"]["Functions"]["resolve_command_actor"]["Returns"];
        }[]
      >`select private.resolve_command_actor() as id`;
      const parsed = workspaceIdSchema.safeParse(actor?.id);
      if (!parsed.success) throw new AccessError("AUTH_REQUIRED");
      await transaction`select set_config('app.actor_id', ${parsed.data}, true)`;
      return operation(transaction);
    },
  );
}
