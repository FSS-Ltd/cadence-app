import {
  accessCommandSchema,
  accessCommandResultSchema,
  accessReadSchema,
  accessReadResultSchema,
  workspaceIdSchema,
} from "@cadence/contracts/access";
import type {
  AccessCommand,
  AccessCommandResult,
  AccessRead,
  AccessReadResult,
} from "@cadence/contracts/access";
import { AccessError } from "@cadence/contracts/access-errors";
import {
  privateHeaders,
  privateErrorResponse,
  readPrivateJson,
  requireSameOrigin,
} from "./private-request.ts";
import type { CommandIdentity } from "@cadence/database/command-transaction";

type AccessDependencies = Readonly<{
  origin: string | undefined;
  authenticate: () => Promise<CommandIdentity>;
  execute: (
    workspaceId: string,
    identity: CommandIdentity,
    command: AccessCommand,
  ) => Promise<AccessCommandResult>;
  read: (
    workspaceId: string,
    identity: CommandIdentity,
    query: AccessRead,
  ) => Promise<AccessReadResult>;
}>;
export async function handleAccessRequest(
  request: Request,
  workspaceId: string,
  dependencies: AccessDependencies,
): Promise<Response> {
  try {
    if (!workspaceIdSchema.safeParse(workspaceId).success)
      throw new AccessError("INVALID_INPUT");
    if (request.method === "POST") {
      requireSameOrigin(request, dependencies.origin);
    } else if (request.method !== "GET") {
      return Response.json(
        { code: "INVALID_INPUT" },
        { status: 405, headers: { ...privateHeaders, Allow: "GET, POST" } },
      );
    }
    const identity = await dependencies.authenticate();
    if (request.method === "POST") {
      const command = accessCommandSchema.safeParse(
        await readPrivateJson(request, 16_384),
      );
      if (!command.success) throw new AccessError("INVALID_INPUT");
      const result = await dependencies.execute(
        workspaceId,
        identity,
        command.data,
      );
      return Response.json(accessCommandResultSchema.parse(result), {
        headers: privateHeaders,
      });
    }
    const params = new URL(request.url).searchParams;
    if (
      [...params.keys()].some(
        (key) =>
          !["resource", "after", "limit"].includes(key) ||
          params.getAll(key).length !== 1,
      )
    ) {
      throw new AccessError("INVALID_INPUT");
    }
    const query = accessReadSchema.safeParse({
      resource: params.get("resource") ?? undefined,
      after: params.get("after") ?? undefined,
      limit: params.has("limit") ? Number(params.get("limit")) : undefined,
    });
    if (!query.success) throw new AccessError("INVALID_INPUT");
    const result = await dependencies.read(workspaceId, identity, query.data);
    return Response.json(accessReadResultSchema.parse(result), {
      headers: privateHeaders,
    });
  } catch (error) {
    return privateErrorResponse(error);
  }
}
