type IdentityEvent = Readonly<{
  type: "user.created" | "user.updated" | "user.deleted";
  subject: string;
  emailVerified: boolean;
  updatedAt: number;
  eventTimestamp: number;
}>;

type ParsedIdentityEvent =
  | Readonly<{ kind: "accepted"; event: IdentityEvent }>
  | Readonly<{ kind: "ignored" | "invalid" }>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

// Call only after signature verification. Return only the scalar identity facts
// we persist; never pass email addresses or the original payload to storage.
export function parseIdentityEvent(value: unknown): ParsedIdentityEvent {
  if (!isRecord(value) || typeof value.type !== "string") {
    return { kind: "invalid" };
  }
  if (
    value.type !== "user.created" &&
    value.type !== "user.updated" &&
    value.type !== "user.deleted"
  ) {
    return { kind: "ignored" };
  }

  const data = value.data;
  if (
    !isRecord(data) ||
    typeof data.id !== "string" ||
    data.id.length < 1 ||
    data.id.length > 255 ||
    !isTimestamp(value.timestamp)
  ) {
    return { kind: "invalid" };
  }
  if (value.type === "user.deleted") {
    return {
      kind: "accepted",
      event: {
        type: value.type,
        subject: data.id,
        emailVerified: false,
        updatedAt: value.timestamp,
        eventTimestamp: value.timestamp,
      },
    };
  }
  if (
    !isTimestamp(data.updated_at) ||
    !Array.isArray(data.email_addresses) ||
    (data.primary_email_address_id !== null &&
      typeof data.primary_email_address_id !== "string")
  ) {
    return { kind: "invalid" };
  }

  const primaryAddress: unknown = data.email_addresses.find(
    (address: unknown) =>
      isRecord(address) && address.id === data.primary_email_address_id,
  );
  const emailVerified =
    typeof data.primary_email_address_id === "string" &&
    isRecord(primaryAddress) &&
    isRecord(primaryAddress.verification) &&
    primaryAddress.verification.status === "verified";

  return {
    kind: "accepted",
    event: {
      type: value.type,
      subject: data.id,
      emailVerified,
      updatedAt: data.updated_at,
      eventTimestamp: value.timestamp,
    },
  };
}
