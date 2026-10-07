import "server-only";
import {
  libraryResultSchema,
  librarySearchResultSchema,
} from "@cadence/contracts/library";
import type { LibraryRequest, LibraryResult } from "@cadence/contracts/library";
import {
  sourceReadResultSchema,
  excerptReadResultSchema,
} from "@cadence/contracts/sources";
import { withCommandTransaction } from "@cadence/database/command-transaction";
import type {
  CommandIdentity,
  CommandTransaction,
} from "@cadence/database/command-transaction";
import { commandDatabase } from "../auth/command-database.ts";
import { executeBrandCommand } from "../brands/commands.ts";
import { executeSourceCommand } from "./commands.ts";

async function readLibrary(
  transaction: CommandTransaction,
  workspaceId: string,
  request: Extract<
    LibraryRequest,
    { action: "source.read" | "excerpt.read" | "library.search" }
  >,
): Promise<LibraryResult> {
  switch (request.action) {
    case "source.read": {
      const [row] = await transaction<{ result: unknown }[]>`
        select private.read_source_revision(${workspaceId}::uuid,${request.sourceId}::uuid,
          ${request.version},${request.purpose}::private.source_purpose) as result`;
      return sourceReadResultSchema.parse(row?.result);
    }
    case "excerpt.read": {
      const [row] = await transaction<{ result: unknown }[]>`
        select private.read_reviewed_excerpt(${workspaceId}::uuid,${request.excerptId}::uuid,
          ${request.purpose}::private.source_purpose) as result`;
      return excerptReadResultSchema.parse(row?.result);
    }
    case "library.search": {
      const [row] = await transaction<{ result: unknown }[]>`
        select private.search_private_library(${workspaceId}::uuid,${request.resource},${request.query},
          ${request.after}::uuid,${request.limit},${request.purpose}::private.source_purpose) as result`;
      return librarySearchResultSchema.parse(row?.result);
    }
  }
}

export async function executeLibraryRequest(
  workspaceId: string,
  identity: CommandIdentity,
  request: LibraryRequest,
): Promise<LibraryResult> {
  const result = await withCommandTransaction(
    commandDatabase(),
    identity,
    (transaction) => {
      switch (request.action) {
        case "brand.write":
        case "brand.assign":
          return executeBrandCommand(transaction, workspaceId, request);
        case "source.capture":
        case "source.revise":
        case "source.share":
        case "excerpt.release":
        case "source.revoke":
        case "source.erase":
        case "source.recover":
          return executeSourceCommand(transaction, workspaceId, request);
        case "source.read":
        case "excerpt.read":
        case "library.search":
          return readLibrary(transaction, workspaceId, request);
      }
    },
  );
  return libraryResultSchema.parse(result);
}
