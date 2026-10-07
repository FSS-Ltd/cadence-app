import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createCommandClient,
  withCommandTransaction,
} from "../../packages/database/src/command-transaction.ts";
import { executeSourceCommand } from "../../apps/web/server/sources/commands.ts";
import {
  excerptReadResultSchema,
  sourceReadResultSchema,
} from "../../packages/contracts/src/sources.ts";

// A fixed disposable Supabase stack: production URLs cannot enter this test.
const root = createCommandClient(
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
);
const workspace = "a1000000-0000-4000-8000-000000000001";
const creator = "b1000000-0000-4000-8000-000000000001";
const recipient = "b1000000-0000-4000-8000-000000000002";
const principal = (n) => ({
  subject: `synthetic-source-${n}`,
  sessionId: `synthetic-source-session-${n}`,
  factorAges: [1, 1],
  checkedAt: Date.now(),
});
const requestId = () => crypto.randomUUID();
const capture = {
  action: "source.capture",
  requestId: requestId(),
  brandId: null,
  title: "Synthetic private driver capture",
  body: "Synthetic original secret for driver tests",
  category: "personal_draft",
  purposes: ["editorial_reuse", "excerpt_release"],
  clientAuthorityConfirmed: false,
  allowedDataConfirmed: true,
  expiresAt: null,
};
let seeded = false;
let client;
test("actual restricted driver preserves capture and excerpt isolation", async (t) => {
  try {
    await root.begin(async (tx) => {
      await tx`create role cadence_source_driver_test login password 'synthetic-local-test-only' noinherit nosuperuser nocreatedb nocreaterole nobypassrls`;
      await tx`grant cadence_command to cadence_source_driver_test`;
      await tx`insert into private.app_users(id,clerk_subject_id,email_verified) values
        (${creator},'synthetic-source-1',true),(${recipient},'synthetic-source-2',true)`;
      await tx`insert into private.workspaces(id,name) values (${workspace},'Synthetic source driver workspace')`;
      await tx`insert into private.workspace_memberships(workspace_id,user_id,role) values
        (${workspace},${creator},'owner'),(${workspace},${recipient},'owner')`;
      await tx`insert into private.access_policy(mode) values ('require_mfa')`;
    });
    seeded = true;
    client = createCommandClient(
      "postgresql://cadence_source_driver_test:synthetic-local-test-only@127.0.0.1:54322/postgres",
    );
    const created = await withCommandTransaction(client, principal(1), (tx) =>
      executeSourceCommand(tx, workspace, capture),
    );
    assert.equal(created.version, 1);
    await t.test(
      "another owner cannot search or fetch the private original",
      async () => {
        const page = await withCommandTransaction(
          client,
          principal(2),
          async (tx) => {
            const [row] =
              await tx`select private.search_private_library(${workspace},'sources','secret',null,20,'editorial_reuse') as result`;
            return row.result;
          },
        );
        assert.deepEqual(page.items, []);
        await assert.rejects(
          withCommandTransaction(
            client,
            principal(2),
            async (tx) =>
              tx`select private.read_source_revision(${workspace},${created.id},1,'editorial_reuse')`,
          ),
          { code: "P0001", message: "SOURCE_ACCESS_DENIED" },
        );
      },
    );
    const reviewed = await withCommandTransaction(client, principal(1), (tx) =>
      executeSourceCommand(tx, workspace, {
        action: "excerpt.release",
        requestId: requestId(),
        sourceId: created.id,
        expectedContentVersion: 1,
        expectedAccessVersion: 1,
        body: "Synthetic selected excerpt",
        recipients: [recipient],
        purposes: ["editorial_reuse"],
        reviewConfirmed: true,
      }),
    );
    await t.test(
      "excerpt reader receives reviewed fields without source lineage",
      async () => {
        const excerpt = await withCommandTransaction(
          client,
          principal(2),
          async (tx) => {
            const [row] =
              await tx`select private.read_reviewed_excerpt(${workspace},${reviewed.id},'editorial_reuse') as result`;
            return excerptReadResultSchema.parse(row.result);
          },
        );
        assert.equal(excerpt.body, "Synthetic selected excerpt");
        assert.equal(JSON.stringify(excerpt).includes(created.id), false);
        await withCommandTransaction(client, principal(1), async (tx) => {
          const [row] =
            await tx`select private.read_source_revision(${workspace},${created.id},1,'editorial_reuse') as result`;
          assert.equal(
            sourceReadResultSchema.parse(row.result).body,
            capture.body,
          );
        });
      },
    );
    await t.test("concurrent share and revoke have one winner", async () => {
      const results = await Promise.allSettled([
        withCommandTransaction(client, principal(1), (tx) =>
          executeSourceCommand(tx, workspace, {
            action: "source.share",
            requestId: requestId(),
            sourceId: created.id,
            expectedContentVersion: 1,
            expectedAccessVersion: 1,
            recipients: [recipient],
            purposes: ["editorial_reuse"],
            shareConfirmed: true,
          }),
        ),
        withCommandTransaction(client, principal(1), (tx) =>
          executeSourceCommand(tx, workspace, {
            action: "source.revoke",
            requestId: requestId(),
            sourceId: created.id,
            expectedContentVersion: 1,
            expectedAccessVersion: 1,
          }),
        ),
      ]);
      assert.equal(
        results.filter((result) => result.status === "fulfilled").length,
        1,
      );
      assert.equal(
        results.filter((result) => result.status === "rejected").length,
        1,
      );
      assert.equal(
        results.find((result) => result.status === "rejected").reason.message,
        "VERSION_CONFLICT",
      );
      const [state] =
        await root`select access_version from private.sources where id = ${created.id}`;
      assert.equal(Number(state.access_version), 2);
    });
    await t.test("driver rollback leaves no second revision", async () => {
      await assert.rejects(
        withCommandTransaction(client, principal(1), async (tx) => {
          await executeSourceCommand(tx, workspace, {
            ...capture,
            action: "source.revise",
            requestId: requestId(),
            sourceId: created.id,
            expectedContentVersion: 1,
            expectedAccessVersion: 2,
            body: "Synthetic rolled-back content",
          });
          throw new Error("synthetic rollback");
        }),
        /synthetic rollback/,
      );
      const [state] =
        await root`select count(*)::int as count from private.source_revisions where source_id = ${created.id}`;
      assert.equal(state.count, 1);
    });
  } finally {
    if (client) await client.end();
    if (seeded)
      await root.begin(async (tx) => {
        await tx`delete from private.access_command_receipts where workspace_id = ${workspace}`;
        await tx`delete from private.access_audit_events where workspace_id = ${workspace}`;
        await tx`delete from private.excerpt_grants where workspace_id = ${workspace}`;
        await tx`delete from private.source_excerpts where workspace_id = ${workspace}`;
        await tx`delete from private.source_grants where workspace_id = ${workspace}`;
        await tx`delete from private.source_revisions where workspace_id = ${workspace}`;
        await tx`delete from private.sources where workspace_id = ${workspace}`;
        await tx`delete from private.workspace_memberships where workspace_id = ${workspace}`;
        await tx`delete from private.access_policy`;
        await tx`delete from private.workspaces where id = ${workspace}`;
        await tx`delete from private.app_users where id in (${creator},${recipient})`;
        await tx`drop role cadence_source_driver_test`;
      });
    await root.end();
  }
});
