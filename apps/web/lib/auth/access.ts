import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import type { AuthenticationPolicyMode } from "@/lib/auth/session-policy";
import { hasRecentSecondFactor } from "@/lib/auth/session-policy";

export type WorkspaceAccess =
  | Readonly<{ kind: "allowed"; mode: AuthenticationPolicyMode }>
  | Readonly<{ kind: "signed_out" }>
  | Readonly<{ kind: "mfa_required" }>
  | Readonly<{ kind: "denied" }>;

type SessionAccessRow = Readonly<{
  auth_mode: AuthenticationPolicyMode;
  workspace_allowed: boolean;
  security_settings_allowed: boolean;
}>;

function isSessionAccessRow(value: unknown): value is SessionAccessRow {
  if (typeof value !== "object" || value === null) return false;

  const row = value as Record<string, unknown>;
  return (
    (row.auth_mode === "closed_pilot" || row.auth_mode === "require_mfa") &&
    typeof row.workspace_allowed === "boolean" &&
    typeof row.security_settings_allowed === "boolean"
  );
}

async function fetchSessionAccess(
  token: string,
): Promise<SessionAccessRow | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !publishableKey) return null;

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/current_session_access`,
    {
      method: "POST",
      headers: {
        apikey: publishableKey,
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        "accept-profile": "auth_api",
        "content-profile": "auth_api",
      },
      body: "{}",
      cache: "no-store",
    },
  );
  if (!response.ok) return null;

  const payload: unknown = await response.json();
  if (!Array.isArray(payload) || !isSessionAccessRow(payload[0])) return null;
  return payload[0];
}

export async function getWorkspaceAccess(): Promise<WorkspaceAccess> {
  if (
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    !process.env.CLERK_SECRET_KEY
  ) {
    return { kind: "denied" };
  }

  const session = await auth();
  if (!session.userId) return { kind: "signed_out" };

  const user = await currentUser();
  if (
    !user ||
    user.id !== session.userId ||
    user.primaryEmailAddress?.verification?.status !== "verified"
  ) {
    return { kind: "denied" };
  }

  const token = await session.getToken();
  if (!token) return { kind: "denied" };

  const access = await fetchSessionAccess(token);
  if (!access) return { kind: "denied" };
  const recentMfa =
    access.auth_mode !== "require_mfa" ||
    hasRecentSecondFactor(session.sessionClaims);
  if (access.workspace_allowed && recentMfa)
    return { kind: "allowed", mode: access.auth_mode };
  if (access.auth_mode === "require_mfa" && access.security_settings_allowed) {
    return { kind: "mfa_required" };
  }

  return { kind: "denied" };
}
