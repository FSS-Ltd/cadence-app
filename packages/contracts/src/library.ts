import { z } from "zod";
import { storedCommandResultSchema } from "./access.ts";
import { brandCommandSchema, brandSchema } from "./brands.ts";
import {
  sourceCommandSchema,
  sourcePurposeSchema,
  positiveVersionSchema,
  sourceReadResultSchema,
  excerptReadResultSchema,
} from "./sources.ts";

export const libraryRequestSchema = z.discriminatedUnion("action", [
  ...sourceCommandSchema.options,
  ...brandCommandSchema.options,
  z.strictObject({
    action: z.literal("source.read"),
    sourceId: z.uuid(),
    version: positiveVersionSchema.nullable(),
    purpose: sourcePurposeSchema,
  }),
  z.strictObject({
    action: z.literal("excerpt.read"),
    excerptId: z.uuid(),
    purpose: sourcePurposeSchema,
  }),
  z.strictObject({
    action: z.literal("library.search"),
    resource: z.enum(["sources", "excerpts", "brands"]),
    query: z.string().max(200),
    after: z.uuid().nullable(),
    limit: z.number().int().min(1).max(100),
    purpose: sourcePurposeSchema,
  }),
]);
export type LibraryRequest = z.infer<typeof libraryRequestSchema>;
export type LibraryRead = Extract<
  LibraryRequest,
  { action: "source.read" | "excerpt.read" | "library.search" }
>;
const page = { nextCursor: z.uuid().nullable() };
export const librarySearchResultSchema = z.discriminatedUnion("resource", [
  z.strictObject({
    resource: z.literal("sources"),
    ...page,
    items: z
      .array(
        z.strictObject({
          id: z.uuid(),
          title: z.string().min(1).max(240),
          preview: z.string().max(240),
          contentVersion: positiveVersionSchema,
          accessVersion: positiveVersionSchema,
          visibility: z.enum(["private", "shared"]),
          isCustodian: z.boolean(),
        }),
      )
      .max(100),
  }),
  z.strictObject({
    resource: z.literal("excerpts"),
    ...page,
    items: z
      .array(
        z.strictObject({
          id: z.uuid(),
          preview: z.string().max(240),
          reviewedVersion: positiveVersionSchema,
          createdAt: z.iso.datetime({ offset: true }),
        }),
      )
      .max(100),
  }),
  z.strictObject({
    resource: z.literal("brands"),
    ...page,
    items: z.array(brandSchema).max(100),
  }),
]);
export const libraryResultSchema = z.union([
  storedCommandResultSchema.extend({ kind: z.literal("committed") }),
  sourceReadResultSchema,
  excerptReadResultSchema,
  librarySearchResultSchema,
]);
export type LibraryResult = z.infer<typeof libraryResultSchema>;
export type LibraryPage = z.infer<typeof librarySearchResultSchema>;
