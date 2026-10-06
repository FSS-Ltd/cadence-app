import { z } from "zod";

export const workspaceIdSchema = z.uuid();
export const workspaceRoleSchema = z.enum([
  "owner",
  "admin",
  "editor",
  "publisher",
  "viewer",
]);
export const launchNetworkSchema = z.enum([
  "linkedin",
  "facebook",
  "instagram",
  "tiktok",
  "x",
]);
const versionSchema = z.number().int().min(1).max(Number.MAX_SAFE_INTEGER);
const requestId = z.uuid();
const invitationSecret = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

export const accessCommandSchema = z.discriminatedUnion("action", [
  z.strictObject({
    action: z.literal("member.role"),
    requestId,
    userId: z.uuid(),
    expectedVersion: versionSchema,
    role: workspaceRoleSchema,
  }),
  z.strictObject({
    action: z.literal("member.remove"),
    requestId,
    userId: z.uuid(),
    expectedVersion: versionSchema,
  }),
  z.strictObject({
    action: z.literal("invitation.issue"),
    requestId,
    recipientId: z.uuid(),
    role: workspaceRoleSchema,
    validHours: z.number().int().min(1).max(168),
  }),
  z.strictObject({
    action: z.literal("invitation.revoke"),
    requestId,
    invitationId: z.uuid(),
    expectedVersion: versionSchema,
  }),
  z.strictObject({
    action: z.literal("invitation.accept"),
    requestId,
    invitationId: z.uuid(),
    secret: invitationSecret,
  }),
  z.strictObject({
    action: z.literal("destination.activate"),
    requestId,
    provider: launchNetworkSchema,
    externalIdentity: z
      .string()
      .min(1)
      .max(255)
      .refine((value) => value === value.trim()),
    expectedVersion: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  }),
  z.strictObject({
    action: z.literal("destination.disable"),
    requestId,
    destinationId: z.uuid(),
    expectedVersion: versionSchema,
  }),
  z.strictObject({
    action: z.literal("destination.grant"),
    requestId,
    destinationId: z.uuid(),
    userId: z.uuid(),
    expectedVersion: versionSchema,
    allowed: z.boolean(),
  }),
]);
export type AccessCommand = z.infer<typeof accessCommandSchema>;
export type MembershipCommand = Extract<
  AccessCommand,
  { action: `member.${string}` | `invitation.${string}` }
>;
export type DestinationCommand = Extract<
  AccessCommand,
  { action: `destination.${string}` }
>;

export const storedCommandResultSchema = z.strictObject({
  id: z.uuid(),
  version: versionSchema,
  replayed: z.boolean(),
});
export type StoredCommandResult = z.infer<typeof storedCommandResultSchema>;
export const accessCommandResultSchema = z.discriminatedUnion("kind", [
  storedCommandResultSchema.extend({ kind: z.literal("committed") }),
  storedCommandResultSchema.extend({
    kind: z.literal("invitation_issued"),
    replayed: z.literal(false),
    secret: invitationSecret,
  }),
  storedCommandResultSchema.extend({
    kind: z.literal("invitation_replayed"),
    replayed: z.literal(true),
    recovery: z.literal("revoke_and_reissue"),
  }),
]);
export type AccessCommandResult = z.infer<typeof accessCommandResultSchema>;

export const accessReadSchema = z.strictObject({
  resource: z
    .enum(["summary", "members", "invitations", "destinations"])
    .default("summary"),
  after: z.uuid().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});
export type AccessRead = z.infer<typeof accessReadSchema>;
const dateTime = z.iso.datetime({ offset: true });
const page = { nextCursor: z.uuid().nullable() };
export const accessReadResultSchema = z.discriminatedUnion("resource", [
  z.strictObject({
    resource: z.literal("summary"),
    actor: z.strictObject({ userId: z.uuid(), role: workspaceRoleSchema }),
    plan: z
      .strictObject({
        key: z.enum(["free", "creator", "professional", "teams"]),
        version: versionSchema,
        networkLimit: z.number().int().min(1).max(5),
        accountLimit: z.number().int().positive().nullable(),
        perNetworkLimit: z.number().int().positive().nullable(),
        seatCapacity: z.number().int().nonnegative().nullable(),
      })
      .nullable(),
  }),
  z.strictObject({
    resource: z.literal("members"),
    ...page,
    items: z
      .array(
        z.strictObject({
          id: z.uuid(),
          userId: z.uuid(),
          role: workspaceRoleSchema,
          version: versionSchema,
          removedAt: dateTime.nullable(),
        }),
      )
      .max(100),
  }),
  z.strictObject({
    resource: z.literal("invitations"),
    ...page,
    items: z
      .array(
        z.strictObject({
          id: z.uuid(),
          recipientId: z.uuid(),
          role: workspaceRoleSchema,
          version: versionSchema,
          expiresAt: dateTime,
          acceptedAt: dateTime.nullable(),
          revokedAt: dateTime.nullable(),
        }),
      )
      .max(100),
  }),
  z.strictObject({
    resource: z.literal("destinations"),
    ...page,
    items: z
      .array(
        z.strictObject({
          id: z.uuid(),
          provider: launchNetworkSchema,
          externalIdentity: z.string().min(1).max(255),
          enabled: z.boolean(),
          version: versionSchema,
        }),
      )
      .max(100),
  }),
]);
export type AccessReadResult = z.infer<typeof accessReadResultSchema>;
