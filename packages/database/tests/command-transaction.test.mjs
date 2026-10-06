import assert from "node:assert/strict";
import { test } from "node:test";
import { withCommandTransaction } from "../src/command-transaction.ts";

test("stale identity evidence is rejected before entering the connection pool", async () => {
  const database = {
    begin() {
      assert.fail("must not start a transaction");
    },
  };
  await assert.rejects(
    withCommandTransaction(
      database,
      { checkedAt: Date.now() - 31_000 },
      async () => null,
    ),
    { code: "AUTHENTICATION_TOO_OLD" },
  );
  await assert.rejects(
    withCommandTransaction(
      database,
      { checkedAt: Date.now() + 31_000 },
      async () => null,
    ),
    { code: "AUTHENTICATION_TOO_OLD" },
  );
});
