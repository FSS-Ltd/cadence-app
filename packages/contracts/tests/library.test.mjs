import assert from "node:assert/strict";
import { test } from "node:test";
import { libraryRequestSchema, libraryResultSchema } from "../src/library.ts";

const id = "10000000-0000-4000-8000-000000000001";
const capture = {
  action: "source.capture",
  requestId: id,
  brandId: null,
  title: "Synthetic private note",
  body: "Synthetic text",
  category: "personal_draft",
  purposes: ["editorial_reuse"],
  clientAuthorityConfirmed: false,
  allowedDataConfirmed: true,
  expiresAt: null,
};
test("capture requires an explicit allowed-data decision and client authority", () => {
  assert.equal(libraryRequestSchema.safeParse(capture).success, true);
  assert.equal(
    libraryRequestSchema.safeParse({ ...capture, allowedDataConfirmed: false })
      .success,
    false,
  );
  assert.equal(
    libraryRequestSchema.safeParse({
      ...capture,
      category: "client_confidential",
    }).success,
    false,
  );
  assert.equal(
    libraryRequestSchema.safeParse({
      ...capture,
      category: "client_confidential",
      clientAuthorityConfirmed: true,
    }).success,
    true,
  );
});
test("untrusted actors and unsupported categories and purposes are rejected", () => {
  for (const mutation of [
    { actorId: id },
    { category: "highly_sensitive" },
    { purposes: ["external_transfer"] },
    { purposes: ["editorial_reuse", "editorial_reuse"] },
    { body: " " },
  ]) {
    assert.equal(
      libraryRequestSchema.safeParse({ ...capture, ...mutation }).success,
      false,
    );
  }
});
test("source sharing requires an exact revision, selected recipients and confirmation", () => {
  const share = {
    action: "source.share",
    requestId: id,
    sourceId: id,
    expectedContentVersion: 1,
    expectedAccessVersion: 1,
    recipients: [id],
    purposes: ["editorial_reuse"],
    shareConfirmed: true,
  };
  assert.equal(libraryRequestSchema.safeParse(share).success, true);
  for (const mutation of [
    { shareConfirmed: false },
    { expectedAccessVersion: 0 },
    { recipients: [] },
    { recipients: [id, id] },
  ]) {
    assert.equal(
      libraryRequestSchema.safeParse({ ...share, ...mutation }).success,
      false,
    );
  }
});
test("excerpt DTO cannot contain original metadata or lineage", () => {
  const excerpt = {
    kind: "excerpt",
    id,
    body: "Synthetic selected text",
    reviewedVersion: 1,
    createdAt: "2026-10-06T23:00:00+00:00",
  };
  assert.equal(libraryResultSchema.safeParse(excerpt).success, true);
  assert.equal(
    libraryResultSchema.safeParse({ ...excerpt, sourceId: id }).success,
    false,
  );
  assert.equal(
    libraryResultSchema.safeParse({ ...excerpt, title: "Private title" })
      .success,
    false,
  );
});
