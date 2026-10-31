import { z } from "zod";
import { LIMITS } from "./limits";
import {
  ChecklistIdSchema,
  ChecklistItemSchema,
  ImportanceSchema,
} from "./coverage.schema";
import {
  QuoteVerificationSchema,
  SourceIdSchema,
  VerifiedClaimSchema,
  VerifiedDateSignalSchema,
} from "./claims.schema";

/* ---------- Sources ---------- */

export const SourceKindSchema = z.enum(["url", "pdf", "paste"]);
export const SourceStatusSchema = z.enum(["ok", "truncated", "failed"]);

export const SourceMetaSchema = z.object({
  id: SourceIdSchema,
  kind: SourceKindSchema,
  url: z.string().url().optional(),
  title: z.string().max(200),
  charCount: z.number().int().nonnegative(),
  status: SourceStatusSchema,
  error: z.string().optional(),
  /** Filled after /api/extract. Empty before. */
  dateSignals: z.array(VerifiedDateSignalSchema),
});
export type SourceMeta = z.infer<typeof SourceMetaSchema>;

export const SourceRecordSchema = SourceMetaSchema.extend({
  /** Original extracted text (cleaned), used by the evidence viewer. */
  text: z.string(),
});
export type SourceRecord = z.infer<typeof SourceRecordSchema>;

/* ---------- Gemini call 3 output (PROPOSED — must be reconciled in code) ---------- */

export const ProposedBlunderSchema = z.object({
  type: z.enum(["conflict", "outdated"]),
  checklistId: ChecklistIdSchema.nullable(),
  severity: ImportanceSchema,
  description: z.string().min(10).max(400),
  /** Claim ids from the input only. Quotes are resolved by code. */
  claimIds: z.array(z.string()).min(1).max(6),
});

export const ProposedMissedMoveSchema = z.object({
  checklistId: ChecklistIdSchema,
  kind: z.enum(["missing", "unanswered"]),
  description: z.string().min(10).max(300),
  whyItMatters: z.string().min(10).max(300),
});

export const ProposedHangingPieceSchema = z.object({
  checklistId: ChecklistIdSchema.nullable(),
  impact: ImportanceSchema,
  description: z.string().min(10).max(300),
});

export const ProposedVerifyNextSchema = z.object({
  priority: ImportanceSchema,
  action: z.string().min(10).max(250),
  reason: z.string().min(10).max(300),
  /** Describe WHERE (e.g. "the foundation's official notice page"). Never invent URLs. */
  whereToVerify: z.string().min(5).max(200),
  relatedChecklistId: ChecklistIdSchema.nullable(),
});

export const ProposedAnalysisSchema = z.object({
  evalReasoning: z.string().min(20).max(700),
  blunders: z.array(ProposedBlunderSchema).max(8),
  missedMoves: z.array(ProposedMissedMoveSchema).max(12),
  hangingPieces: z.array(ProposedHangingPieceSchema).max(6),
  verifyNext: z.array(ProposedVerifyNextSchema).min(3).max(10),
});
export type ProposedAnalysis = z.infer<typeof ProposedAnalysisSchema>;

/* ---------- POST /api/analyze request ---------- */

export const AnalyzeRequestSchema = z.object({
  question: z.string().min(5).max(LIMITS.MAX_QUESTION_CHARS),
  goal: z.string().min(5).max(LIMITS.MAX_QUESTION_CHARS),
  checklist: z.array(ChecklistItemSchema).min(5).max(12),
  sources: z.array(SourceMetaSchema).min(1).max(LIMITS.MAX_SOURCES),
  claims: z.array(VerifiedClaimSchema).max(LIMITS.MAX_TOTAL_CLAIMS),
});
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

/* ---------- Reconciled, final result ---------- */

/** sourced = a verified quote backs it; ai_inferred = AI interpretation; unknown = not established. */
export const EvidenceLabelSchema = z.enum(["sourced", "ai_inferred", "unknown"]);
export type EvidenceLabel = z.infer<typeof EvidenceLabelSchema>;

export const CoverageStatusSchema = z.enum(["covered", "conflicted", "unanswered", "missing"]);
export type CoverageStatus = z.infer<typeof CoverageStatusSchema>;

export const EvidenceRefSchema = z.object({
  claimId: z.string(),
  sourceId: SourceIdSchema,
  claim: z.string(),
  quote: z.string(),
  verification: QuoteVerificationSchema,
});
export type EvidenceRef = z.infer<typeof EvidenceRefSchema>;

export const BlunderSchema = z.object({
  id: z.string(),
  type: z.enum(["conflict", "outdated"]),
  checklistId: ChecklistIdSchema.nullable(),
  severity: ImportanceSchema,
  description: z.string(),
  evidence: z.array(EvidenceRefSchema).min(1),
  label: EvidenceLabelSchema,
});
export type Blunder = z.infer<typeof BlunderSchema>;

export const MissedMoveSchema = z.object({
  id: z.string(),
  checklistId: ChecklistIdSchema,
  kind: z.enum(["missing", "unanswered"]),
  importance: ImportanceSchema,
  description: z.string(),
  whyItMatters: z.string(),
  /** e.g. "Not found in the 4 reviewed sources." Absence is always scoped. */
  scope: z.string(),
  label: EvidenceLabelSchema,
});
export type MissedMove = z.infer<typeof MissedMoveSchema>;

export const HangingPieceSchema = z.object({
  id: z.string(),
  checklistId: ChecklistIdSchema.nullable(),
  impact: ImportanceSchema,
  description: z.string(),
  label: EvidenceLabelSchema,
});
export type HangingPiece = z.infer<typeof HangingPieceSchema>;

export const VerifyNextSchema = z.object({
  id: z.string(),
  /** 1 = do first. Computed in code. */
  rank: z.number().int().positive(),
  priority: ImportanceSchema,
  action: z.string(),
  reason: z.string(),
  whereToVerify: z.string(),
  relatedChecklistId: ChecklistIdSchema.nullable(),
  /** Ids of blunders / missed moves / hanging pieces tied to the same checklist item. */
  triggers: z.array(z.string()),
  label: EvidenceLabelSchema,
});
export type VerifyNext = z.infer<typeof VerifyNextSchema>;

export const ChecklistCoverageSchema = ChecklistItemSchema.extend({
  status: CoverageStatusSchema,
  supportingClaimIds: z.array(z.string()),
});
export type ChecklistCoverage = z.infer<typeof ChecklistCoverageSchema>;

/* ---------- Score ---------- */

export const ScoreFactorSchema = z.object({
  key: z.string(),
  label: z.string(),
  /** Points added (+) or removed (-). The first factor ("coverage") is the starting value. */
  delta: z.number(),
  detail: z.string(),
});
export type ScoreFactor = z.infer<typeof ScoreFactorSchema>;

export const ScoreResultSchema = z.object({
  /** -5 .. +5, one decimal. Labelled "Information Position". */
  value: z.number().min(-5).max(5),
  /** Importance-weighted coverage, 0..1. */
  coverage: z.number().min(0).max(1),
  version: z.string(),
  factors: z.array(ScoreFactorSchema),
  capApplied: z.object({ cap: z.number(), reason: z.string() }).nullable(),
});
export type ScoreResult = z.infer<typeof ScoreResultSchema>;

/* ---------- Final result returned by POST /api/analyze ---------- */

export const AnalyzeResultSchema = z.object({
  /** AI-written narrative. Label as AI-inferred. It never chooses the score. */
  evalReasoning: z.string(),
  coverage: z.array(ChecklistCoverageSchema),
  blunders: z.array(BlunderSchema),
  missedMoves: z.array(MissedMoveSchema),
  hangingPieces: z.array(HangingPieceSchema),
  verifyNext: z.array(VerifyNextSchema),
  score: ScoreResultSchema,
  warnings: z.array(z.string()),
  scopeNote: z.string(),
  disclaimer: z.string(),
});
export type AnalyzeResult = z.infer<typeof AnalyzeResultSchema>;

/* ---------- Full analysis held in client state / localStorage / demo JSON ---------- */

export const AnalysisSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  mode: z.enum(["live", "demo_cached"]),
  question: z.string(),
  goal: z.string(),
  checklist: z.array(ChecklistItemSchema),
  sources: z.array(SourceRecordSchema),
  claims: z.array(VerifiedClaimSchema),
  result: AnalyzeResultSchema,
});
export type Analysis = z.infer<typeof AnalysisSchema>;
