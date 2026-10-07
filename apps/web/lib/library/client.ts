import { accessErrorCodeSchema } from "@cadence/contracts/access-errors";
import type { AccessErrorCode } from "@cadence/contracts/access-errors";
import { libraryResultSchema } from "@cadence/contracts/library";
import type { LibraryRequest, LibraryResult } from "@cadence/contracts/library";

export class LibraryRequestError extends Error {
  constructor(readonly code: AccessErrorCode) {
    super(code);
    this.name = "LibraryRequestError";
  }
}

export async function requestLibrary(
  workspaceId: string,
  request: LibraryRequest,
  signal?: AbortSignal,
): Promise<LibraryResult> {
  let response: Response;
  try {
    response = await fetch(`/api/v1/workspaces/${workspaceId}/library`, {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new LibraryRequestError("SERVICE_UNAVAILABLE");
  }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const code =
      typeof payload === "object" && payload !== null && "code" in payload
        ? accessErrorCodeSchema.safeParse(payload.code)
        : null;
    throw new LibraryRequestError(
      code?.success ? code.data : "SERVICE_UNAVAILABLE",
    );
  }
  const parsed = libraryResultSchema.safeParse(payload);
  if (!parsed.success) throw new LibraryRequestError("SERVICE_UNAVAILABLE");
  return parsed.data;
}
