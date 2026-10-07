import { workspaceIdSchema } from "@cadence/contracts/access";
import { AccessError } from "@cadence/contracts/access-errors";
import {
  libraryRequestSchema,
  libraryResultSchema,
} from "@cadence/contracts/library";
import type { LibraryRequest, LibraryResult } from "@cadence/contracts/library";
import type { CommandIdentity } from "@cadence/database/command-transaction";
import {
  privateHeaders,
  privateErrorResponse,
  readPrivateJson,
  requireSameOrigin,
} from "./private-request.ts";

type LibraryDependencies = Readonly<{
  origin: string | undefined;
  authenticate: () => Promise<CommandIdentity>;
  execute: (
    workspaceId: string,
    identity: CommandIdentity,
    command: LibraryRequest,
  ) => Promise<LibraryResult>;
}>;

export async function handleLibraryRequest(
  request: Request,
  workspaceId: string,
  dependencies: LibraryDependencies,
): Promise<Response> {
  try {
    if (!workspaceIdSchema.safeParse(workspaceId).success)
      throw new AccessError("INVALID_INPUT");
    if (request.method !== "POST")
      return Response.json(
        { code: "INVALID_INPUT" },
        { status: 405, headers: { ...privateHeaders, Allow: "POST" } },
      );
    requireSameOrigin(request, dependencies.origin);
    const identity = await dependencies.authenticate();
    const parsed = libraryRequestSchema.safeParse(
      await readPrivateJson(request, 229_376),
    );
    if (!parsed.success) throw new AccessError("INVALID_INPUT");
    const result = await dependencies.execute(
      workspaceId,
      identity,
      parsed.data,
    );
    return Response.json(libraryResultSchema.parse(result), {
      headers: privateHeaders,
    });
  } catch (error) {
    return privateErrorResponse(error);
  }
}
