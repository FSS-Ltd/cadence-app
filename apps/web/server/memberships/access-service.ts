import "server-only";
import { withCommandTransaction } from "@cadence/database/command-transaction";
import type { CommandIdentity } from "@cadence/database/command-transaction";
import {
  accessCommandResultSchema,
  accessReadResultSchema,
} from "@cadence/contracts/access";
import type {
  AccessCommand,
  AccessCommandResult,
  AccessRead,
  AccessReadResult,
} from "@cadence/contracts/access";
import { commandDatabase } from "../auth/command-database.ts";
import { executeDestinationCommand } from "../entitlements/destination-commands.ts";
import { executeMembershipCommand } from "./commands.ts";

export async function executeAccessCommand(
  workspaceId: string,
  identity: CommandIdentity,
  command: AccessCommand,
): Promise<AccessCommandResult> {
  const result = await withCommandTransaction(
    commandDatabase(),
    identity,
    async (transaction) => {
      switch (command.action) {
        case "member.role":
        case "member.remove":
        case "invitation.issue":
        case "invitation.revoke":
        case "invitation.accept":
          return executeMembershipCommand(transaction, workspaceId, command);
        case "destination.activate":
        case "destination.disable":
        case "destination.grant":
          return executeDestinationCommand(transaction, workspaceId, command);
      }
    },
  );
  return accessCommandResultSchema.parse(result);
}

export async function readWorkspaceAccess(
  workspaceId: string,
  identity: CommandIdentity,
  query: AccessRead,
): Promise<AccessReadResult> {
  const result = await withCommandTransaction(
    commandDatabase(),
    identity,
    async (transaction) => {
      const [row] = await transaction<
        { result: unknown }[]
      >`select private.read_workspace_access(
      ${workspaceId}::uuid, ${query.resource}, ${query.after ?? null}::uuid, ${query.limit}) as result`;
      return accessReadResultSchema.parse(row?.result);
    },
  );
  return accessReadResultSchema.parse(result);
}
