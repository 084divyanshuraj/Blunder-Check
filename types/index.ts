/**
 * Types come from the Zod schemas (single source of truth).
 * Only UI-only types live here.
 */
export * from "../schemas";

export type StageStatus = "pending" | "running" | "done" | "error";

export type PipelineStage = {
  id: "ingest" | "checklist" | "extract" | "analyze" | "finalize";
  label: string;
  status: StageStatus;
  /** e.g. "Reading source 2/4" */
  detail?: string;
  error?: string;
};

/** Standard error body returned by every API route. */
export type ApiError = { error: { code: string; message: string } };
