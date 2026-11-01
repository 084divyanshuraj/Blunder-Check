/**
 * Shared limits. Used by Zod schemas, API routes and the UI.
 * Change a number here, never hard-code it elsewhere.
 */
export const LIMITS = {
  MIN_SOURCES: 2,
  MAX_SOURCES: 6,
  /** Extracted text longer than this is truncated (status "truncated"). */
  MAX_SOURCE_CHARS: 60_000,
  MIN_SOURCE_CHARS: 50,
  MAX_PDF_BYTES: 5 * 1024 * 1024,
  MAX_CLAIMS_PER_SOURCE: 25,
  MAX_QUESTION_CHARS: 500,
  MAX_TOTAL_CLAIMS: 150,
  /** API Rate Limiting (per IP sliding window) */
  RATE_LIMIT_WINDOW_MS: 60_000,
  RATE_LIMIT_MAX_REQUESTS: 30,
} as const;

export const DISCLAIMER =
  "Based on reviewed sources only. Absence in these sources does not mean absence in reality.";

export const SCORING_LABEL = "Information Position";
