import { storedCommandResultSchema } from "@cadence/contracts/access";
import type {
  AccessCommandResult,
  DestinationCommand,
} from "@cadence/contracts/access";
import type { CommandTransaction } from "@cadence/database/command-transaction";

export async function executeDestinationCommand(
  transaction: CommandTransaction,
  workspaceId: string,
  command: DestinationCommand,
): Promise<AccessCommandResult> {
  let rows: { result: unknown }[];
  switch (command.action) {
    case "destination.activate":
      rows = await transaction`select private.activate_workspace_destination(
        ${workspaceId}::uuid, ${command.requestId}::uuid, ${command.provider},
        ${command.externalIdentity}, ${command.expectedVersion}) as result`;
      break;
    case "destination.disable":
      rows = await transaction`select private.disable_workspace_destination(
        ${workspaceId}::uuid, ${command.requestId}::uuid, ${command.destinationId}::uuid,
        ${command.expectedVersion}) as result`;
      break;
    case "destination.grant":
      rows = await transaction`select private.set_destination_grant(
        ${workspaceId}::uuid, ${command.requestId}::uuid, ${command.destinationId}::uuid,
        ${command.userId}::uuid, ${command.expectedVersion}, ${command.allowed}) as result`;
      break;
  }
  return {
    ...storedCommandResultSchema.parse(rows[0]?.result),
    kind: "committed",
  };
}
