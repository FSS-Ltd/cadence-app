import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { UserWebhookEvent } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";

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

function isUserWebhook(event: unknown): event is UserWebhookEvent {
  if (typeof event !== "object" || event === null || !("type" in event)) {
    return false;
  }
  return (
    event.type === "user.created" ||
    event.type === "user.updated" ||
    event.type === "user.deleted"
  );
}

function isVerifiedEmail(event: UserWebhookEvent): boolean {
  if (event.type === "user.deleted") return false;

  const primaryId = event.data.primary_email_address_id;
  if (!primaryId) return false;
  const primaryAddress = event.data.email_addresses.find(
    (address) => address.id === primaryId,
  );
  return primaryAddress?.verification?.status === "verified";
}

async function storeIdentityEvent(
  eventId: string,
  event: UserWebhookEvent,
  signedTimestamp: string,
): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return false;

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
        p_event_type: event.type,
        p_clerk_subject_id: event.data.id,
        p_email_verified: isVerifiedEmail(event),
        p_signed_delivery_at: new Date(
          Number(signedTimestamp) * 1000,
        ).toISOString(),
      }),
      cache: "no-store",
    },
  );

  return response.ok;
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

  if (!isUserWebhook(event)) return jsonResponse(200, "Event ignored.");

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
    const stored = await storeIdentityEvent(eventId, event, signedTimestamp);
    return stored
      ? jsonResponse(200, "Event accepted.")
      : jsonResponse(503, "Identity service is unavailable.");
  } catch {
    return jsonResponse(503, "Identity service is unavailable.");
  }
}
