import { getCommandIdentity } from "@/server/auth/command-identity";
import {
  executeAccessCommand,
  readWorkspaceAccess,
} from "@/server/memberships/access-service";
import { handleAccessRequest } from "@/server/http/access-handler";

type RouteContext = Readonly<{ params: Promise<{ workspaceId: string }> }>;
export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { workspaceId } = await context.params;
  return handleAccessRequest(request, workspaceId, {
    origin: process.env.CADENCE_APP_ORIGIN,
    authenticate: getCommandIdentity,
    execute: executeAccessCommand,
    read: readWorkspaceAccess,
  });
}
export const POST = GET;
export const runtime = "nodejs";
