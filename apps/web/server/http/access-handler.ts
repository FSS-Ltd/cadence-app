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
import {
  AccessError,
  publicAccessError,
  accessErrorStatus,
} from "@cadence/contracts/access-errors";
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
const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Cookie, Authorization",
};
const maximumBodyBytes = 16_384;

async function readBody(request: Request): Promise<unknown> {
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  ) {
    throw new AccessError("INVALID_INPUT");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new AccessError("INVALID_INPUT");
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let length = 0;
  let text = "";
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > maximumBodyBytes) {
        await reader.cancel();
        throw new AccessError("PAYLOAD_TOO_LARGE");
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } catch (error) {
    if (error instanceof AccessError) throw error;
    throw new AccessError("INVALID_INPUT");
  } finally {
    reader.releaseLock();
  }
}

export async function handleAccessRequest(
  request: Request,
  workspaceId: string,
  dependencies: AccessDependencies,
): Promise<Response> {
  try {
    if (!workspaceIdSchema.safeParse(workspaceId).success)
      throw new AccessError("INVALID_INPUT");
    if (request.method === "POST") {
      if (!dependencies.origin) throw new AccessError("SERVICE_UNAVAILABLE");
      if (request.headers.get("origin") !== new URL(dependencies.origin).origin)
        throw new AccessError("ACCESS_DENIED");
    } else if (request.method !== "GET") {
      return Response.json(
        { code: "INVALID_INPUT" },
        { status: 405, headers: { ...headers, Allow: "GET, POST" } },
      );
    }
    const identity = await dependencies.authenticate();
    if (request.method === "POST") {
      const command = accessCommandSchema.safeParse(await readBody(request));
      if (!command.success) throw new AccessError("INVALID_INPUT");
      const result = await dependencies.execute(
        workspaceId,
        identity,
        command.data,
      );
      return Response.json(accessCommandResultSchema.parse(result), {
        headers,
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
    return Response.json(accessReadResultSchema.parse(result), { headers });
  } catch (error) {
    const code = publicAccessError(error);
    return Response.json(
      { code },
      { status: accessErrorStatus(code), headers },
    );
  }
}
