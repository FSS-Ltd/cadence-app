import assert from "node:assert/strict";
import { test } from "node:test";
import { accessCommandSchema, accessReadSchema } from "../src/access.ts";
import { publicAccessError } from "../src/access-errors.ts";
const id = "10000000-0000-4000-8000-000000000001";
const command = {
  action: "destination.activate",
  requestId: id,
  provider: "instagram",
  externalIdentity: "synthetic",
  expectedVersion: 0,
};
test("new manual destinations accept version zero, not unreleased providers", () => {
  assert.equal(accessCommandSchema.safeParse(command).success, true);
  assert.equal(
    accessCommandSchema.safeParse({ ...command, provider: "youtube" }).success,
    false,
  );
});
test("actors, plan grants, extra seats and optimistic versions cannot be forged", () => {
  for (const extra of [
    { actorId: id },
    { role: "owner" },
    { additionalSeats: 5 },
    { expectedVersion: -1 },
    { expectedVersion: 2 ** 53 },
    { action: "plan.assign" },
  ]) {
    assert.equal(
      accessCommandSchema.safeParse({ ...command, ...extra }).success,
      false,
    );
  }
});
test("invitation secret is required only for acceptance, and inputs are bounded", () => {
  assert.equal(
    accessCommandSchema.safeParse({
      action: "invitation.accept",
      requestId: id,
      invitationId: id,
      secret: "A".repeat(43),
    }).success,
    true,
  );
  assert.equal(
    accessCommandSchema.safeParse({
      action: "invitation.issue",
      requestId: id,
      recipientId: id,
      role: "editor",
      validHours: 169,
    }).success,
    false,
  );
  assert.equal(
    accessCommandSchema.safeParse({
      ...command,
      externalIdentity: "x".repeat(256),
    }).success,
    false,
  );
  assert.equal(accessReadSchema.safeParse({ limit: 101 }).success, false);
});
test("only allow-listed domain exceptions reach clients", () => {
  assert.equal(
    publicAccessError({
      code: "P0001",
      message: "LAST_OWNER",
      detail: "synthetic-secret",
    }),
    "LAST_OWNER",
  );
  assert.equal(
    publicAccessError({ code: "23505", message: "synthetic-secret" }),
    "SERVICE_UNAVAILABLE",
  );
  assert.equal(
    publicAccessError(new Error("synthetic-secret")),
    "SERVICE_UNAVAILABLE",
  );
});
