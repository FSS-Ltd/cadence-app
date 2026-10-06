import assert from "node:assert/strict";
import { test } from "node:test";
import { parseIdentityEvent } from "../lib/auth/identity-event.ts";
import { hasRecentSecondFactor } from "../lib/auth/session-policy.ts";

function userEvent() {
  return {
    type: "user.updated",
    timestamp: 2100,
    data: {
      id: "synthetic-user",
      updated_at: 2000,
      primary_email_address_id: "synthetic-email-id",
      email_addresses: [
        {
          id: "synthetic-email-id",
          email_address: "synthetic@example.invalid",
          verification: { status: "verified" },
        },
      ],
    },
  };
}

test("identity boundary retains source versions but excludes contact data", () => {
  assert.deepEqual(parseIdentityEvent(userEvent()), {
    kind: "accepted",
    event: {
      type: "user.updated",
      subject: "synthetic-user",
      emailVerified: true,
      updatedAt: 2000,
      eventTimestamp: 2100,
    },
  });
});

test("verification must belong to the primary address", () => {
  const event = userEvent();
  event.data.primary_email_address_id = "another-address";
  assert.equal(parseIdentityEvent(event).event?.emailVerified, false);
  event.data.primary_email_address_id = null;
  assert.equal(parseIdentityEvent(event).event?.emailVerified, false);
});

test("missing or malformed identity versions are rejected", () => {
  for (const timestamp of [
    undefined,
    null,
    "2000",
    -1,
    1.5,
    Infinity,
    2 ** 53,
  ]) {
    const event = userEvent();
    event.data.updated_at = timestamp;
    assert.equal(parseIdentityEvent(event).kind, "invalid");
    const another = userEvent();
    another.timestamp = timestamp;
    assert.equal(parseIdentityEvent(another).kind, "invalid");
  }
});

test("malformed signed payloads cannot cross the storage boundary", () => {
  for (const event of [null, [], {}, { type: "user.updated", data: null }]) {
    assert.equal(parseIdentityEvent(event).kind, "invalid");
  }
  const event = userEvent();
  event.data.email_addresses = null;
  assert.equal(parseIdentityEvent(event).kind, "invalid");
});

test("deletion uses the event timestamp without needing a user profile", () => {
  assert.deepEqual(
    parseIdentityEvent({
      type: "user.deleted",
      timestamp: 2200,
      data: { id: "synthetic-user", deleted: true },
    }),
    {
      kind: "accepted",
      event: {
        type: "user.deleted",
        subject: "synthetic-user",
        emailVerified: false,
        updatedAt: 2200,
        eventTimestamp: 2200,
      },
    },
  );
});

test("unsubscribed event types are ignored", () => {
  assert.equal(parseIdentityEvent({ type: "session.created" }).kind, "ignored");
});

test("both factors must be within the inclusive ten-minute window", () => {
  for (const fva of [
    [0, 0],
    [1, 10],
    [10, 10],
  ]) {
    assert.equal(hasRecentSecondFactor({ fva }), true);
  }
  for (const fva of [
    [11, 1],
    [1, 11],
    [-1, 1],
    [1, -1],
    [1, 2 ** 53],
    [1, "1"],
    [1, 1.5],
    [1, 1, 1],
    [],
    null,
    { 0: 1, 1: 1 },
  ]) {
    assert.equal(hasRecentSecondFactor({ fva }), false);
  }
  assert.equal(hasRecentSecondFactor(null), false);
  assert.equal(hasRecentSecondFactor({}), false);
});
