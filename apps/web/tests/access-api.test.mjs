import assert from "node:assert/strict";
import { test } from "node:test";
import { handleAccessRequest } from "../server/http/access-handler.ts";
import { validateCommandSession } from "../server/auth/command-session.ts";
import { AccessError } from "@cadence/contracts/access-errors";
const workspaceId = "20000000-0000-4000-8000-000000000001";
const id = "10000000-0000-4000-8000-000000000001";
const origin = "https://cadence.example.invalid";
const command = {
  action: "member.remove",
  requestId: id,
  userId: id,
  expectedVersion: 1,
};
function post(body, source = origin) {
  return new Request(`${origin}/api/v1/workspaces/${workspaceId}/access`, {
    method: "POST",
    headers: { origin: source, "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
function dependencies(overrides = {}) {
  return {
    origin,
    authenticate: async () => ({ subject: "synthetic-user" }),
    execute: async () => ({
      id,
      version: 2,
      replayed: false,
      kind: "committed",
    }),
    read: async () => ({
      resource: "summary",
      actor: { userId: id, role: "owner" },
      plan: null,
    }),
    ...overrides,
  };
}
test("authenticated commands succeed with private responses", async () => {
  const response = await handleAccessRequest(
    post(command),
    workspaceId,
    dependencies(),
  );
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.equal((await response.json()).version, 2);
});
test("cross-origin posts and unauthenticated requests never call mutation service", async () => {
  const execute = async () => assert.fail("mutation must not run");
  assert.equal(
    (
      await handleAccessRequest(
        post(command, "https://attacker.invalid"),
        workspaceId,
        dependencies({ execute }),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handleAccessRequest(
        post(command),
        workspaceId,
        dependencies({
          execute,
          authenticate: async () => {
            throw new AccessError("AUTH_REQUIRED");
          },
        }),
      )
    ).status,
    401,
  );
});
test("invalid, oversized and forged-actor bodies cannot reach mutation service", async () => {
  const deps = dependencies({
    execute: async () => assert.fail("invalid command must not run"),
  });
  for (const value of [
    "{",
    { ...command, actorId: id },
    { ...command, expectedVersion: 0 },
  ]) {
    assert.equal(
      (await handleAccessRequest(post(value), workspaceId, deps)).status,
      400,
    );
  }
  assert.equal(
    (await handleAccessRequest(post("x".repeat(16_385)), workspaceId, deps))
      .status,
    413,
  );
});
test("database and SDK errors do not expose secret markers or raw details", async () => {
  const response = await handleAccessRequest(
    post(command),
    workspaceId,
    dependencies({
      execute: async () => {
        throw new Error("synthetic-secret-marker provider identity SQL");
      },
    }),
  );
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { code: "SERVICE_UNAVAILABLE" });
});
test("domain conflicts retain a safe recovery code", async () => {
  const response = await handleAccessRequest(
    post(command),
    workspaceId,
    dependencies({
      execute: async () => {
        throw {
          code: "P0001",
          message: "VERSION_CONFLICT",
          detail: "synthetic-secret",
        };
      },
    }),
  );
  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), { code: "VERSION_CONFLICT" });
});
test("reads reject unbounded, duplicate and secret-bearing query fields", async () => {
  for (const query of [
    "limit=101",
    "limit=1&limit=2",
    "secret=synthetic-secret",
  ]) {
    const response = await handleAccessRequest(
      new Request(`${origin}/access?${query}`),
      workspaceId,
      dependencies({
        read: async () => assert.fail("invalid read must not run"),
      }),
    );
    assert.equal(response.status, 400);
  }
});
const now = 1_000_000;
const evidence = {
  subject: "synthetic-user",
  sessionId: "synthetic-session",
  claims: { fva: [1, -1] },
  liveSession: {
    id: "synthetic-session",
    userId: "synthetic-user",
    status: "active",
    expireAt: now + 10_000,
  },
  liveUser: {
    id: "synthetic-user",
    banned: false,
    locked: false,
    emailVerified: true,
  },
};
test("live session must match verified token and currently verified user", () => {
  assert.deepEqual(validateCommandSession(evidence, now).factorAges, [1, -1]);
  for (const patch of [
    { status: "revoked" },
    { userId: "other" },
    { id: "other" },
    { expireAt: now },
  ]) {
    assert.throws(
      () =>
        validateCommandSession(
          { ...evidence, liveSession: { ...evidence.liveSession, ...patch } },
          now,
        ),
      { code: "AUTH_REQUIRED" },
    );
  }
  for (const patch of [
    { banned: true },
    { locked: true },
    { emailVerified: false },
    { id: "other" },
  ]) {
    assert.throws(
      () =>
        validateCommandSession(
          { ...evidence, liveUser: { ...evidence.liveUser, ...patch } },
          now,
        ),
      { code: "AUTH_REQUIRED" },
    );
  }
});
test("fresh-session boundary rejects missing, forged and old factor ages", () => {
  for (const fva of [null, [11, 1], ["1", 1], [1, 1, 1], [1, -2]]) {
    assert.throws(
      () => validateCommandSession({ ...evidence, claims: { fva } }, now),
      { code: "AUTHENTICATION_TOO_OLD" },
    );
  }
});
