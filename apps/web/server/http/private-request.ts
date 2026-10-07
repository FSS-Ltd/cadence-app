import {
  AccessError,
  accessErrorStatus,
  publicAccessError,
} from "@cadence/contracts/access-errors";

export const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Cookie, Authorization",
};

export function requireSameOrigin(
  request: Request,
  origin: string | undefined,
): void {
  if (!origin) throw new AccessError("SERVICE_UNAVAILABLE");
  if (request.headers.get("origin") !== new URL(origin).origin)
    throw new AccessError("ACCESS_DENIED");
}

export async function readPrivateJson(
  request: Request,
  maximumBodyBytes: number,
): Promise<unknown> {
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
  let body = "";
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > maximumBodyBytes) {
        await reader.cancel();
        throw new AccessError("PAYLOAD_TOO_LARGE");
      }
      body += decoder.decode(chunk.value, { stream: true });
    }
    return JSON.parse(body + decoder.decode());
  } catch (error) {
    if (error instanceof AccessError) throw error;
    throw new AccessError("INVALID_INPUT");
  } finally {
    reader.releaseLock();
  }
}

export function privateErrorResponse(error: unknown): Response {
  const code = publicAccessError(error);
  return Response.json(
    { code },
    { status: accessErrorStatus(code), headers: privateHeaders },
  );
}
