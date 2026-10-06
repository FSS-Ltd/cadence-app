import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createCommandClient,
  withCommandTransaction,
} from "../../packages/database/src/command-transaction.ts";
import { executeMembershipCommand } from "../../apps/web/server/memberships/commands.ts";
import { accessReadResultSchema } from "../../packages/contracts/src/access.ts";

// Deliberately no production URL override: this suite provisions disposable
// principals and records on the local Supabase CI stack only.
const baseUrl = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const root = createCommandClient(baseUrl);
const workspace = "a0000000-0000-4000-8000-000000000001";
const owner = "b0000000-0000-4000-8000-000000000001";
const recipient = "b0000000-0000-4000-8000-000000000002";
const identity = () => ({
  subject: "synthetic-driver-owner",
  sessionId: "synthetic-driver-session",
  factorAges: [1, 1],
  checkedAt: Date.now(),
});
let seeded = false;
let client;

test("restricted driver commits, rolls back and clears pooled identity context", async (t) => {
  try {
    await root.begin(async (tx) => {
      await tx`create role cadence_driver_test login password 'synthetic-local-test-only' noinherit nosuperuser nocreatedb nocreaterole nobypassrls`;
      await tx`grant cadence_command to cadence_driver_test`;
      await tx`insert into private.app_users(id,clerk_subject_id,email_verified) values (${owner},'synthetic-driver-owner',true),(${recipient},'synthetic-driver-recipient',true)`;
      await tx`insert into private.workspaces(id,name) values (${workspace},'Synthetic driver workspace')`;
      await tx`insert into private.workspace_memberships(workspace_id,user_id,role) values (${workspace},${owner},'owner')`;
      await tx`insert into private.workspace_plan_assignments(workspace_id,plan_key,catalog_version,origin) values (${workspace},'teams',1,'internal_operations')`;
      await tx`insert into private.access_policy(mode) values ('require_mfa')`;
    });
    seeded = true;
    client = createCommandClient(
      "postgresql://cadence_driver_test:synthetic-local-test-only@127.0.0.1:54322/postgres",
    );
    await t.test("privileged credentials fail closed", async () => {
      await assert.rejects(
        withCommandTransaction(root, identity(), async () => null),
        { code: "SERVICE_UNAVAILABLE" },
      );
    });
    await t.test(
      "indirect privileged role membership fails closed",
      async () => {
        await root`create role cadence_driver_privileged nologin bypassrls`;
        try {
          await root`grant cadence_driver_privileged to cadence_driver_test`;
          await assert.rejects(
            withCommandTransaction(client, identity(), async () => null),
            { code: "SERVICE_UNAVAILABLE" },
          );
        } finally {
          await root`revoke cadence_driver_privileged from cadence_driver_test`;
          await root`drop role cadence_driver_privileged`;
        }
      },
    );
    let invitation;
    const command = {
      action: "invitation.issue",
      requestId: "c0000000-0000-4000-8000-000000000001",
      recipientId: recipient,
      role: "editor",
      validHours: 24,
    };
    await t.test(
      "invitation response reveals a secret only once and stores only its hash",
      async () => {
        invitation = await withCommandTransaction(client, identity(), (tx) =>
          executeMembershipCommand(tx, workspace, command),
        );
        assert.equal(invitation.kind, "invitation_issued");
        assert.equal(invitation.secret.length, 43);
        const [stored] =
          await root`select encode(secret_hash,'hex') as hash from private.workspace_invitations where id = ${invitation.id}`;
        const { createHash } = await import("node:crypto");
        assert.equal(
          stored.hash,
          createHash("sha256").update(invitation.secret).digest("hex"),
        );
        const replay = await withCommandTransaction(client, identity(), (tx) =>
          executeMembershipCommand(tx, workspace, command),
        );
        assert.equal(replay.kind, "invitation_replayed");
        assert.equal("secret" in replay, false);
        const [records] =
          await root`select (select jsonb_agg(r)::text from private.access_command_receipts r where workspace_id = ${workspace}) as receipts`;
        assert.equal(records.receipts.includes(invitation.secret), false);
      },
    );
    await t.test(
      "read model conforms to public schema without secret material",
      async () => {
        const result = await withCommandTransaction(
          client,
          identity(),
          async (tx) => {
            const [row] =
              await tx`select private.read_workspace_access(${workspace},'invitations',null,50) as data`;
            return accessReadResultSchema.parse(row.data);
          },
        );
        assert.equal(result.items.length, 1);
        assert.equal(JSON.stringify(result).includes(invitation.secret), false);
        assert.equal(JSON.stringify(result).includes("secret_hash"), false);
      },
    );
    await t.test("callback failure rolls back the mutation", async () => {
      await assert.rejects(
        withCommandTransaction(client, identity(), async (tx) => {
          await tx`select private.activate_workspace_destination(${workspace},'c0000000-0000-4000-8000-000000000002','instagram','synthetic-rollback',0)`;
          throw new Error("synthetic rollback");
        }),
        /synthetic rollback/,
      );
      const [count] =
        await root`select count(*)::int as count from private.workspace_destinations where workspace_id = ${workspace}`;
      assert.equal(count.count, 0);
    });
    await t.test(
      "all pooled connections have no actor, claims or elevated role",
      async () => {
        const connections = await Promise.all([
          client.reserve(),
          client.reserve(),
          client.reserve(),
        ]);
        try {
          for (const connection of connections) {
            const [state] =
              await connection`select nullif(current_setting('app.actor_id',true),'') is null as actor_clean,
            nullif(current_setting('request.jwt.claims',true),'') is null as claims_clean, current_user = session_user as role_clean`;
            assert.deepEqual(
              { ...state },
              { actor_clean: true, claims_clean: true, role_clean: true },
            );
          }
        } finally {
          connections.forEach((connection) => connection.release());
        }
      },
    );
  } finally {
    if (client) await client.end();
    if (seeded) {
      await root.begin(async (tx) => {
        await tx`delete from private.access_command_receipts where workspace_id = ${workspace}`;
        await tx`delete from private.access_audit_events where workspace_id = ${workspace}`;
        await tx`delete from private.workspace_invitations where workspace_id = ${workspace}`;
        await tx`delete from private.workspace_destinations where workspace_id = ${workspace}`;
        await tx`delete from private.workspace_plan_assignments where workspace_id = ${workspace}`;
        await tx`delete from private.workspace_memberships where workspace_id = ${workspace}`;
        await tx`delete from private.access_policy`;
        await tx`delete from private.workspaces where id = ${workspace}`;
        await tx`delete from private.app_users where id in (${owner},${recipient})`;
        await tx`drop role cadence_driver_test`;
      });
    }
    await root.end();
  }
});
