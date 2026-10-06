import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { parseIdentityEvent } from "@/lib/auth/identity-event";

const privateResponseHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

function jsonResponse(status: number, message: string): Response {
  return Response.json(
    { message },
    { status, headers: privateResponseHeaders },
  );
}

export async function POST(request: NextRequest): Promise<Response> {
  if (!process.env.CLERK_WEBHOOK_SIGNING_SECRET) {
    return jsonResponse(503, "Webhook is not configured.");
  }

  let event: unknown;
  try {
    event = await verifyWebhook(request);
  } catch {
    return jsonResponse(400, "Invalid webhook signature.");
  }

  const parsed = parseIdentityEvent(event);
  if (parsed.kind === "ignored") return jsonResponse(200, "Event ignored.");
  if (parsed.kind !== "accepted")
    return jsonResponse(400, "Invalid identity event.");

  const eventId = request.headers.get("svix-id");
  const signedTimestamp = request.headers.get("svix-timestamp");
  if (
    !eventId ||
    eventId.length > 255 ||
    !signedTimestamp ||
    !/^\d{1,12}$/.test(signedTimestamp)
  ) {
    return jsonResponse(400, "Invalid webhook delivery.");
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(503, "Identity service is unavailable.");
    }
    const response = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/process_clerk_identity_event`,
      {
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          authorization: `Bearer ${serviceRoleKey}`,
          "content-type": "application/json",
          "accept-profile": "auth_api",
          "content-profile": "auth_api",
        },
        body: JSON.stringify({
          p_event_id: eventId,
          p_event_type: parsed.event.type,
          p_clerk_subject_id: parsed.event.subject,
          p_email_verified: parsed.event.emailVerified,
          p_signed_delivery_at: new Date(
            Number(signedTimestamp) * 1000,
          ).toISOString(),
          p_updated_at: parsed.event.updatedAt,
          p_event_timestamp: parsed.event.eventTimestamp,
        }),
        cache: "no-store",
      },
    );
    return response.ok
      ? jsonResponse(200, "Event accepted.")
      : jsonResponse(503, "Identity service is unavailable.");
  } catch {
    return jsonResponse(503, "Identity service is unavailable.");
  }
}
