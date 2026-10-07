import { storedCommandResultSchema } from "@cadence/contracts/access";
import type { BrandCommand } from "@cadence/contracts/brands";
import type { CommandTransaction } from "@cadence/database/command-transaction";

type CommandResult = ReturnType<typeof storedCommandResultSchema.parse> & {
  kind: "committed";
};

export async function executeBrandCommand(
  transaction: CommandTransaction,
  workspaceId: string,
  command: BrandCommand,
): Promise<CommandResult> {
  let rows: { result: unknown }[];
  switch (command.action) {
    case "brand.write":
      rows = await transaction`select private.write_brand(
        ${workspaceId}::uuid,${command.requestId}::uuid,${command.brandId}::uuid,${command.expectedVersion},
        ${command.name},${command.audience},${command.voice},${command.guidance}) as result`;
      break;
    case "brand.assign":
      rows = await transaction`select private.set_brand_assignment(
        ${workspaceId}::uuid,${command.requestId}::uuid,${command.brandId}::uuid,${command.userId}::uuid,
        ${command.expectedAccessVersion},${command.allowed}) as result`;
      break;
  }
  return {
    ...storedCommandResultSchema.parse(rows[0]?.result),
    kind: "committed",
  };
}
