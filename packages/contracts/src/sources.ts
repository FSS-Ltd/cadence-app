import { z } from "zod";

export const sourcePurposeSchema = z.enum([
  "editorial_reuse",
  "excerpt_release",
  "analytics",
  "ai_proposal",
]);
export type SourcePurpose = z.infer<typeof sourcePurposeSchema>;
export const sourceCategorySchema = z.enum([
  "personal_draft",
  "client_confidential",
]);
export const positiveVersionSchema = z
  .number()
  .int()
  .min(1)
  .max(Number.MAX_SAFE_INTEGER);
const purposes = z
  .array(sourcePurposeSchema)
  .min(1)
  .max(4)
  .refine((items) => new Set(items).size === items.length);
const recipients = z
  .array(z.uuid())
  .min(1)
  .max(25)
  .refine((items) => new Set(items).size === items.length);
const request = { requestId: z.uuid() };
const versionedSource = {
  ...request,
  sourceId: z.uuid(),
  expectedContentVersion: positiveVersionSchema,
  expectedAccessVersion: positiveVersionSchema,
};
const text = {
  brandId: z.uuid().nullable(),
  title: z
    .string()
    .min(1)
    .max(240)
    .refine((value) => value.trim().length > 0),
  body: z
    .string()
    .min(1)
    .max(50_000)
    .refine((value) => value.trim().length > 0),
  category: sourceCategorySchema,
  purposes,
  clientAuthorityConfirmed: z.boolean(),
  allowedDataConfirmed: z.literal(true),
  expiresAt: z.iso.datetime({ offset: true }).nullable(),
};
const capture = z
  .strictObject({ action: z.literal("source.capture"), ...request, ...text })
  .refine(
    (value) =>
      value.category !== "client_confidential" ||
      value.clientAuthorityConfirmed,
  );
const revise = z
  .strictObject({
    action: z.literal("source.revise"),
    ...versionedSource,
    ...text,
  })
  .refine(
    (value) =>
      value.category !== "client_confidential" ||
      value.clientAuthorityConfirmed,
  );
export const sourceCommandSchema = z.discriminatedUnion("action", [
  capture,
  revise,
  z.strictObject({
    action: z.literal("source.share"),
    ...versionedSource,
    recipients,
    purposes,
    shareConfirmed: z.literal(true),
  }),
  z.strictObject({
    action: z.literal("excerpt.release"),
    ...versionedSource,
    body: z
      .string()
      .min(1)
      .max(10_000)
      .refine((value) => value.trim().length > 0),
    recipients,
    purposes,
    reviewConfirmed: z.literal(true),
  }),
  z.strictObject({ action: z.literal("source.revoke"), ...versionedSource }),
  z.strictObject({ action: z.literal("source.erase"), ...versionedSource }),
  z.strictObject({
    action: z.literal("source.recover"),
    ...versionedSource,
    custodianId: z.uuid(),
    reason: z.enum([
      "creator_departed",
      "creator_disabled",
      "custodian_departed",
      "custodian_disabled",
    ]),
  }),
]);
export type SourceCommand = z.infer<typeof sourceCommandSchema>;

export const sourceReadResultSchema = z.strictObject({
  kind: z.literal("source"),
  id: z.uuid(),
  brandId: z.uuid().nullable(),
  title: z.string().min(1).max(240),
  body: z.string().min(1).max(50_000),
  category: sourceCategorySchema,
  permittedPurposes: purposes,
  contentVersion: positiveVersionSchema,
  revisionVersion: positiveVersionSchema,
  accessVersion: positiveVersionSchema,
  expiresAt: z.iso.datetime({ offset: true }).nullable(),
  visibility: z.enum(["private", "shared"]),
  isCustodian: z.boolean(),
  grants: z
    .array(
      z.strictObject({ recipientId: z.uuid(), purpose: sourcePurposeSchema }),
    )
    .max(100)
    .nullable(),
});
export const excerptReadResultSchema = z.strictObject({
  kind: z.literal("excerpt"),
  id: z.uuid(),
  body: z.string().min(1).max(10_000),
  reviewedVersion: positiveVersionSchema,
  createdAt: z.iso.datetime({ offset: true }),
});
export type SourceDetail = z.infer<typeof sourceReadResultSchema>;
export type ReviewedExcerpt = z.infer<typeof excerptReadResultSchema>;
