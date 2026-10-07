import "server-only";
import { workspaceIdSchema } from "@cadence/contracts/access";
import { AccessError } from "@cadence/contracts/access-errors";
import { withCommandTransaction } from "@cadence/database/command-transaction";
import { getCommandIdentity } from "../auth/command-identity.ts";
import { commandDatabase } from "../auth/command-database.ts";

export type CurrentWorkspace = Readonly<{ id: string; name: string }>;

function isCurrentWorkspace(value: unknown): value is CurrentWorkspace {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    workspaceIdSchema.safeParse(row.id).success &&
    typeof row.name === "string" &&
    row.name.trim().length > 0
  );
}

export async function getCurrentWorkspace(): Promise<CurrentWorkspace | null> {
  const identity = await getCommandIdentity();
  const rows = await withCommandTransaction(
    commandDatabase(),
    identity,
    (transaction) =>
      transaction<{ id: string; name: string }[]>`
        select workspace.id, workspace.name
        from private.workspaces as workspace
        join private.workspace_memberships as membership
          on membership.workspace_id = workspace.id
        where membership.user_id = private.current_actor_id()
          and membership.removed_at is null
        order by workspace.id
        limit 2`,
  );
  if (
    !Array.isArray(rows) ||
    rows.length > 1 ||
    !rows.every(isCurrentWorkspace)
  )
    throw new AccessError("SERVICE_UNAVAILABLE");
  return rows[0] ?? null;
}
