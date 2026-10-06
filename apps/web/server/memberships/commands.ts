import { createHash, randomBytes } from "node:crypto";
import { storedCommandResultSchema } from "@cadence/contracts/access";
import type {
  AccessCommandResult,
  MembershipCommand,
} from "@cadence/contracts/access";
import type { CommandTransaction } from "@cadence/database/command-transaction";

export async function executeMembershipCommand(
  transaction: CommandTransaction,
  workspaceId: string,
  command: MembershipCommand,
): Promise<AccessCommandResult> {
  if (command.action === "invitation.issue") {
    const secret = randomBytes(32).toString("base64url");
    const digest = createHash("sha256").update(secret).digest("hex");
    const [row] = await transaction<
      { result: unknown }[]
    >`select private.issue_workspace_invitation(
      ${workspaceId}::uuid, ${command.requestId}::uuid, ${command.recipientId}::uuid,
      ${command.role}::private.workspace_role, ${digest}, ${command.validHours}) as result`;
    const result = storedCommandResultSchema.parse(row?.result);
    if (result.replayed) {
      return {
        ...result,
        kind: "invitation_replayed",
        replayed: true,
        recovery: "revoke_and_reissue",
      };
    }
    return { ...result, kind: "invitation_issued", replayed: false, secret };
  }
  let rows: { result: unknown }[];
  switch (command.action) {
    case "member.role":
    case "member.remove":
      rows = await transaction`select private.change_workspace_member(
        ${workspaceId}::uuid, ${command.requestId}::uuid, ${command.userId}::uuid,
        ${command.expectedVersion}, ${command.action === "member.role" ? command.role : null}::private.workspace_role) as result`;
      break;
    case "invitation.revoke":
      rows = await transaction`select private.revoke_workspace_invitation(
        ${workspaceId}::uuid, ${command.requestId}::uuid, ${command.invitationId}::uuid, ${command.expectedVersion}) as result`;
      break;
    case "invitation.accept": {
      const digest = createHash("sha256").update(command.secret).digest("hex");
      rows = await transaction`select private.accept_workspace_invitation(
        ${workspaceId}::uuid, ${command.requestId}::uuid, ${command.invitationId}::uuid, ${digest}) as result`;
      break;
    }
  }
  return {
    ...storedCommandResultSchema.parse(rows[0]?.result),
    kind: "committed",
  };
}
