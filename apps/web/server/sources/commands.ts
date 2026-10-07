import { storedCommandResultSchema } from "@cadence/contracts/access";
import type { SourceCommand } from "@cadence/contracts/sources";
import type { CommandTransaction } from "@cadence/database/command-transaction";

type CommandResult = ReturnType<typeof storedCommandResultSchema.parse> & {
  kind: "committed";
};

export async function executeSourceCommand(
  transaction: CommandTransaction,
  workspaceId: string,
  command: SourceCommand,
): Promise<CommandResult> {
  let rows: { result: unknown }[];
  switch (command.action) {
    case "source.capture":
      rows = await transaction`select private.create_private_capture(
        ${workspaceId}::uuid,${command.requestId}::uuid,${command.brandId}::uuid,
        ${command.title},${command.body},${command.category}::private.source_category,
        ${command.purposes}::private.source_purpose[],${command.clientAuthorityConfirmed},
        ${command.allowedDataConfirmed},${command.expiresAt}::timestamptz) as result`;
      break;
    case "source.revise":
      rows = await transaction`select private.revise_private_capture(
        ${workspaceId}::uuid,${command.requestId}::uuid,${command.sourceId}::uuid,
        ${command.expectedContentVersion},${command.expectedAccessVersion},${command.brandId}::uuid,
        ${command.title},${command.body},${command.category}::private.source_category,
        ${command.purposes}::private.source_purpose[],${command.clientAuthorityConfirmed},
        ${command.allowedDataConfirmed},${command.expiresAt}::timestamptz) as result`;
      break;
    case "source.share":
      rows = await transaction`select private.share_source_original(
        ${workspaceId}::uuid,${command.requestId}::uuid,${command.sourceId}::uuid,
        ${command.expectedContentVersion},${command.expectedAccessVersion},
        ${command.recipients}::uuid[],${command.purposes}::private.source_purpose[],${command.shareConfirmed}) as result`;
      break;
    case "excerpt.release":
      rows = await transaction`select private.release_reviewed_excerpt(
        ${workspaceId}::uuid,${command.requestId}::uuid,${command.sourceId}::uuid,
        ${command.expectedContentVersion},${command.expectedAccessVersion},${command.body},
        ${command.recipients}::uuid[],${command.purposes}::private.source_purpose[],${command.reviewConfirmed}) as result`;
      break;
    case "source.revoke":
      rows = await transaction`select private.revoke_source_sharing(
        ${workspaceId}::uuid,${command.requestId}::uuid,${command.sourceId}::uuid,
        ${command.expectedContentVersion},${command.expectedAccessVersion}) as result`;
      break;
    case "source.erase":
      rows = await transaction`select private.erase_private_source(
        ${workspaceId}::uuid,${command.requestId}::uuid,${command.sourceId}::uuid,
        ${command.expectedContentVersion},${command.expectedAccessVersion}) as result`;
      break;
    case "source.recover":
      rows = await transaction`select private.recover_orphaned_source(
        ${workspaceId}::uuid,${command.requestId}::uuid,${command.sourceId}::uuid,
        ${command.expectedContentVersion},${command.expectedAccessVersion},
        ${command.custodianId}::uuid,${command.reason}) as result`;
      break;
  }
  return {
    ...storedCommandResultSchema.parse(rows[0]?.result),
    kind: "committed",
  };
}
