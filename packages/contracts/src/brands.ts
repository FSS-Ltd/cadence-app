import { z } from "zod";
import { positiveVersionSchema } from "./sources.ts";

export const brandCommandSchema = z.discriminatedUnion("action", [
  z
    .strictObject({
      action: z.literal("brand.write"),
      requestId: z.uuid(),
      brandId: z.uuid().nullable(),
      expectedVersion: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
      name: z
        .string()
        .min(1)
        .max(120)
        .refine((value) => value.trim().length > 0),
      audience: z.string().max(4000),
      voice: z.string().max(4000),
      guidance: z.string().max(8000),
    })
    .refine((value) =>
      value.brandId === null
        ? value.expectedVersion === 0
        : value.expectedVersion > 0,
    ),
  z.strictObject({
    action: z.literal("brand.assign"),
    requestId: z.uuid(),
    brandId: z.uuid(),
    userId: z.uuid(),
    expectedAccessVersion: positiveVersionSchema,
    allowed: z.boolean(),
  }),
]);
export type BrandCommand = z.infer<typeof brandCommandSchema>;
export const brandSchema = z.strictObject({
  id: z.uuid(),
  name: z.string().min(1).max(120),
  version: positiveVersionSchema,
  accessVersion: positiveVersionSchema,
  audience: z.string().max(4000),
  voice: z.string().max(4000),
  guidance: z.string().max(8000),
});
export type Brand = z.infer<typeof brandSchema>;
