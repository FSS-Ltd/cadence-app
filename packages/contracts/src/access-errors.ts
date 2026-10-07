import { z } from "zod";

export const accessErrorCodeSchema = z.enum([
  "AUTH_REQUIRED",
  "AUTHENTICATION_TOO_OLD",
  "MFA_REQUIRED",
  "ACCESS_DENIED",
  "SOURCE_ACCESS_DENIED",
  "SOURCE_GRANT_REVOKED",
  "ERASURE_PENDING",
  "INVALID_INPUT",
  "PAYLOAD_TOO_LARGE",
  "VERSION_CONFLICT",
  "IDEMPOTENCY_CONFLICT",
  "LAST_OWNER",
  "MEMBER_ALREADY_ACTIVE",
  "INVITATION_INVALID",
  "INVITATION_PENDING",
  "SEAT_LIMIT_REACHED",
  "ACCOUNT_LIMIT_REACHED",
  "PLAN_POLICY_UNAVAILABLE",
  "SERVICE_UNAVAILABLE",
]);
export type AccessErrorCode = z.infer<typeof accessErrorCodeSchema>;
export class AccessError extends Error {
  readonly code: AccessErrorCode;
  constructor(code: AccessErrorCode) {
    super(code);
    this.name = "AccessError";
    this.code = code;
  }
}

// Never pass driver/SDK messages, SQL details, input values or Zod issues to logs
// or HTTP responses. Only deliberately raised database domain codes are public.
export function publicAccessError(error: unknown): AccessErrorCode {
  if (error instanceof AccessError) return error.code;
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P0001" &&
    "message" in error
  ) {
    const parsed = accessErrorCodeSchema.safeParse(error.message);
    if (parsed.success) return parsed.data;
  }
  return "SERVICE_UNAVAILABLE";
}
export function accessErrorStatus(code: AccessErrorCode): number {
  if (code === "AUTH_REQUIRED") return 401;
  if (
    [
      "AUTHENTICATION_TOO_OLD",
      "MFA_REQUIRED",
      "ACCESS_DENIED",
      "SOURCE_ACCESS_DENIED",
      "SOURCE_GRANT_REVOKED",
    ].includes(code)
  )
    return 403;
  if (code === "INVALID_INPUT") return 400;
  if (code === "PAYLOAD_TOO_LARGE") return 413;
  if (code === "SERVICE_UNAVAILABLE") return 503;
  return 409;
}
