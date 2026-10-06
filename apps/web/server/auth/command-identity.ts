import "server-only";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { AccessError } from "@cadence/contracts/access-errors";
import type { CommandIdentity } from "@cadence/database/command-transaction";
import { validateCommandSession } from "./command-session.ts";

export async function getCommandIdentity(): Promise<CommandIdentity> {
  if (
    !process.env.CLERK_SECRET_KEY ||
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ) {
    throw new AccessError("SERVICE_UNAVAILABLE");
  }
  const session = await auth();
  if (!session.userId || !session.sessionId)
    throw new AccessError("AUTH_REQUIRED");
  const client = await clerkClient();
  const [liveSession, liveUser] = await Promise.all([
    client.sessions.getSession(session.sessionId),
    client.users.getUser(session.userId),
  ]);
  return validateCommandSession(
    {
      subject: session.userId,
      sessionId: session.sessionId,
      claims: session.sessionClaims,
      liveSession,
      liveUser: {
        id: liveUser.id,
        banned: liveUser.banned,
        locked: liveUser.locked,
        emailVerified:
          liveUser.primaryEmailAddress?.verification?.status === "verified",
      },
    },
    Date.now(),
  );
}
