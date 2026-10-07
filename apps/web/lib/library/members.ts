import { accessReadResultSchema } from "@cadence/contracts/access";
import type { AccessReadResult } from "@cadence/contracts/access";
import { LibraryRequestError } from "./client";

type MemberPage = Extract<AccessReadResult, { resource: "members" }>;

async function readAccess(
  workspaceId: string,
  resource: "members" | "summary",
  signal: AbortSignal,
): Promise<AccessReadResult> {
  let response: Response;
  try {
    response = await fetch(
      `/api/v1/workspaces/${workspaceId}/access?resource=${resource}`,
      { cache: "no-store", credentials: "same-origin", signal },
    );
  } catch (error) {
    if (signal.aborted) throw error;
    throw new LibraryRequestError("SERVICE_UNAVAILABLE");
  }
  if (!response.ok) throw new LibraryRequestError("SERVICE_UNAVAILABLE");
  const parsed = accessReadResultSchema.safeParse(
    await response.json().catch(() => null),
  );
  if (!parsed.success) throw new LibraryRequestError("SERVICE_UNAVAILABLE");
  return parsed.data;
}

export async function readOtherMembers(
  workspaceId: string,
  signal: AbortSignal,
): Promise<MemberPage["items"]> {
  const [summary, members] = await Promise.all([
    readAccess(workspaceId, "summary", signal),
    readAccess(workspaceId, "members", signal),
  ]);
  if (summary.resource !== "summary" || members.resource !== "members")
    throw new LibraryRequestError("SERVICE_UNAVAILABLE");
  return members.items.filter(
    (member) =>
      member.removedAt === null && member.userId !== summary.actor.userId,
  );
}
