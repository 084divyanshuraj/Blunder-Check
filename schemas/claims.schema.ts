import { z } from "zod";
import { LIMITS } from "./limits";
import { ChecklistIdSchema, ChecklistItemSchema } from "./coverage.schema";

/* ---------- Quote verification (computed in code, never by the model) ---------- */

export const QuoteStatusSchema = z.enum(["exact", "normalized", "unverified"]);
export const QuoteVerificationSchema = z.object({
  status: QuoteStatusSchema,
  /** Character offsets into the ORIGINAL source text (end is exclusive). */
  start: z.number().int().nonnegative().nullable(),
  end: z.number().int().nonnegative().nullable(),
});
export type QuoteVerification = z.infer<typeof QuoteVerificationSchema>;

/* ---------- Gemini call 2 output ---------- */

export const DateSignalKindSchema = z.enum([
  "published",
  "updated",
  "cycle",
  "deadline",
  "other",
]);

export const DateSignalSchema = z.object({
  kind: DateSignalKindSchema,
  /** e.g. "12 August 2026", "2025-26". Copied from the text, never inferred. */
  value: z.string().min(2).max(60),
  /** Verbatim text containing the date, with a few surrounding words. */
  quote: z.string().min(8).max(300),
});
export type DateSignal = z.infer<typeof DateSignalSchema>;

export const ExtractedClaimSchema = z.object({
  checklistId: ChecklistIdSchema.nullable(),
  claim: z.string().min(5).max(300),
  /** Verbatim, contiguous text copied from the source. */
  quote: z.string().min(8).max(400),
  /** Only if a date is explicitly attached to this claim in the text. */
  visibleDate: z.string().max(60).nullable(),
});
export type ExtractedClaim = z.infer<typeof ExtractedClaimSchema>;

export const ExtractClaimsResponseSchema = z.object({
  claims: z.array(ExtractedClaimSchema).max(LIMITS.MAX_CLAIMS_PER_SOURCE),
  dateSignals: z.array(DateSignalSchema).max(10),
});
export type ExtractClaimsResponse = z.infer<typeof ExtractClaimsResponseSchema>;

/* ---------- Server-verified versions ---------- */

export const SourceIdSchema = z.string().regex(/^s[1-9]$/, "source ids look like s1..s9");

export const VerifiedClaimSchema = ExtractedClaimSchema.extend({
  /** `${sourceId}-k${n}` assigned by the server. Models never choose ids. */
  id: z.string().regex(/^s[1-9]-k\d{1,3}$/),
  sourceId: SourceIdSchema,
  verification: QuoteVerificationSchema,
});
export type VerifiedClaim = z.infer<typeof VerifiedClaimSchema>;

export const VerifiedDateSignalSchema = DateSignalSchema.extend({
  verification: QuoteVerificationSchema,
});
export type VerifiedDateSignal = z.infer<typeof VerifiedDateSignalSchema>;

/* ---------- POST /api/extract ---------- */

export const ExtractRequestSchema = z.object({
  sourceId: SourceIdSchema,
  title: z.string().max(200),
  text: z.string().min(LIMITS.MIN_SOURCE_CHARS).max(LIMITS.MAX_SOURCE_CHARS),
  checklist: z.array(ChecklistItemSchema).min(5).max(12),
});
export type ExtractRequest = z.infer<typeof ExtractRequestSchema>;

export const ExtractResultSchema = z.object({
  sourceId: SourceIdSchema,
  /** Includes claims whose quote failed verification (status "unverified"). */
  claims: z.array(VerifiedClaimSchema),
  /** Only date signals whose quote was found in the source. */
  dateSignals: z.array(VerifiedDateSignalSchema),
  droppedClaimCount: z.number().int().nonnegative(),
  warnings: z.array(z.string()),
});
export type ExtractResult = z.infer<typeof ExtractResultSchema>;
