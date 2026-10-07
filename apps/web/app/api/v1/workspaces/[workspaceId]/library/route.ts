import { getCommandIdentity } from "@/server/auth/command-identity";
import { handleLibraryRequest } from "@/server/http/library-handler";
import { executeLibraryRequest } from "@/server/sources/library-service";

export const runtime = "nodejs";
type Params = Readonly<{ params: Promise<{ workspaceId: string }> }>;
export async function POST(
  request: Request,
  { params }: Params,
): Promise<Response> {
  const { workspaceId } = await params;
  return handleLibraryRequest(request, workspaceId, {
    origin: process.env.CADENCE_APP_ORIGIN,
    authenticate: getCommandIdentity,
    execute: executeLibraryRequest,
  });
}
