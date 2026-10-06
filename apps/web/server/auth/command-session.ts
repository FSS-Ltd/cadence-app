import { AccessError } from "@cadence/contracts/access-errors";
import type { CommandIdentity } from "@cadence/database/command-transaction";

type SessionEvidence = Readonly<{
  subject: string;
  sessionId: string;
  claims: unknown;
  liveSession: Readonly<{
    id: string;
    userId: string;
    status: string;
    expireAt: number;
  }>;
  liveUser: Readonly<{
    id: string;
    banned: boolean;
    locked: boolean;
    emailVerified: boolean;
  }>;
}>;

export function validateCommandSession(
  evidence: SessionEvidence,
  now: number,
): CommandIdentity {
  const { subject, sessionId, liveSession, liveUser, claims } = evidence;
  if (
    liveSession.id !== sessionId ||
    liveSession.userId !== subject ||
    liveSession.status !== "active" ||
    !Number.isFinite(liveSession.expireAt) ||
    liveSession.expireAt <= now ||
    liveUser.id !== subject ||
    liveUser.banned ||
    liveUser.locked ||
    !liveUser.emailVerified
  ) {
    throw new AccessError("AUTH_REQUIRED");
  }
  if (typeof claims !== "object" || claims === null || !("fva" in claims)) {
    throw new AccessError("AUTHENTICATION_TOO_OLD");
  }
  const ages = claims.fva;
  if (
    !Array.isArray(ages) ||
    ages.length !== 2 ||
    typeof ages[0] !== "number" ||
    typeof ages[1] !== "number" ||
    !Number.isSafeInteger(ages[0]) ||
    !Number.isSafeInteger(ages[1]) ||
    ages[0] < 0 ||
    ages[0] > 10 ||
    ages[1] < -1
  ) {
    throw new AccessError("AUTHENTICATION_TOO_OLD");
  }
  // The protected Postgres policy determines whether second-factor age is
  // required; browser metadata cannot turn the pilot exception on or off.
  return { subject, sessionId, factorAges: [ages[0], ages[1]], checkedAt: now };
}
