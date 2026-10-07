import assert from "node:assert/strict";
import { test } from "node:test";
import { handleLibraryRequest } from "../server/http/library-handler.ts";
import { AccessError } from "@cadence/contracts/access-errors";
const workspaceId = "20000000-0000-4000-8000-000000000001";
const objectId = "10000000-0000-4000-8000-000000000001";
const origin = "https://cadence.example.invalid";
const capture = {
  action: "source.capture",
  requestId: objectId,
  brandId: null,
  title: "Synthetic private note",
  body: "Synthetic body",
  category: "personal_draft",
  purposes: ["editorial_reuse"],
  clientAuthorityConfirmed: false,
  allowedDataConfirmed: true,
  expiresAt: null,
};
function post(body, source = origin) {
  return new Request(`${origin}/api/v1/workspaces/${workspaceId}/library`, {
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
      kind: "committed",
      id: objectId,
      version: 1,
      replayed: false,
    }),
    ...overrides,
  };
}
test("private capture command returns a bounded no-store response", async () => {
  const response = await handleLibraryRequest(
    post(capture),
    workspaceId,
    dependencies(),
  );
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.deepEqual(await response.json(), {
    kind: "committed",
    id: objectId,
    version: 1,
    replayed: false,
  });
});
test("wrong origin and missing live session never reach source service", async () => {
  const execute = async () => assert.fail("source service must not run");
  assert.equal(
    (
      await handleLibraryRequest(
        post(capture, "https://attacker.invalid"),
        workspaceId,
        dependencies({ execute }),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handleLibraryRequest(
        post(capture),
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
test("forged actor, highly sensitive data and oversized input are rejected", async () => {
  const deps = dependencies({
    execute: async () => assert.fail("invalid source body must not run"),
  });
  for (const bad of [
    { ...capture, actorId: objectId },
    { ...capture, category: "highly_sensitive" },
    { ...capture, category: "client_confidential" },
    { ...capture, allowedDataConfirmed: false },
  ]) {
    assert.equal(
      (await handleLibraryRequest(post(bad), workspaceId, deps)).status,
      400,
    );
  }
  assert.equal(
    (await handleLibraryRequest(post("x".repeat(229_377)), workspaceId, deps))
      .status,
    413,
  );
});
test("service errors cannot reveal source text or SQL details", async () => {
  const response = await handleLibraryRequest(
    post(capture),
    workspaceId,
    dependencies({
      execute: async () => {
        throw new Error("Synthetic private secret SQL marker");
      },
    }),
  );
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { code: "SERVICE_UNAVAILABLE" });
});
test("excerpt responses reject original metadata even if a service adds it", async () => {
  const response = await handleLibraryRequest(
    post({
      action: "excerpt.read",
      excerptId: objectId,
      purpose: "editorial_reuse",
    }),
    workspaceId,
    dependencies({
      execute: async () => ({
        kind: "excerpt",
        id: objectId,
        body: "Reviewed excerpt",
        reviewedVersion: 1,
        createdAt: "2026-10-06T23:00:00+00:00",
        sourceId: objectId,
      }),
    }),
  );
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { code: "SERVICE_UNAVAILABLE" });
});
