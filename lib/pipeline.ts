import {
  AnalysisSchema,
  LIMITS,
  type Analysis,
  type AnalyzeRequest,
  type AnalyzeResult,
  type ChecklistItem,
  type CoverageChecklist,
  type CoverageRequest,
  type ExtractRequest,
  type ExtractResult,
  type SourceMeta,
  type SourceRecord,
  type VerifiedClaim,
  type VerifiedDateSignal,
} from "../schemas";
import type { PipelineStage } from "../types";

export const STORAGE_KEY = "blunderCheck.analyses.v1";

export function saveAnalysisToStorage(analysis: Analysis): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    const existingRaw = window.localStorage.getItem(STORAGE_KEY);
    let list: Analysis[] = [];
    if (existingRaw) {
      try {
        list = JSON.parse(existingRaw);
      } catch {
        // ignore corrupted local storage
      }
    }
    list = [analysis, ...list.filter((a) => a.id !== analysis.id)].slice(0, 5);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // If quota exceeded or storage disabled, silently ignore per CONTRACTS.md §1
  }
}

export function loadAnalysesFromStorage(): Analysis[] {
  try {
    if (typeof window === "undefined" || !window.localStorage) return [];
    const existingRaw = window.localStorage.getItem(STORAGE_KEY);
    if (!existingRaw) return [];
    return JSON.parse(existingRaw);
  } catch {
    return [];
  }
}

export type RunPipelineOptions = {
  question: string;
  goal: string;
  sources: SourceRecord[];
  onStageUpdate?: (stage: PipelineStage) => void;
  customFetch?: typeof fetch;
  mode?: "live" | "demo_cached";
};

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const idx = nextIndex++;
      results[idx] = await fn(items[idx], idx);
    }
  }

  const workerCount = Math.max(1, Math.min(limit, items.length));
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function runAnalysisPipeline({
  question,
  goal,
  sources,
  onStageUpdate,
  customFetch = fetch,
  mode = "live",
}: RunPipelineOptions): Promise<Analysis> {
  // Validate minimum usable sources
  const usableSources = sources.filter(
    (s) => s.status === "ok" || s.status === "truncated"
  );

  if (usableSources.length < LIMITS.MIN_SOURCES) {
    const errorMsg = `At least ${LIMITS.MIN_SOURCES} readable sources are required (found ${usableSources.length}).`;
    onStageUpdate?.({
      id: "ingest",
      label: "Checking sources",
      status: "error",
      error: errorMsg,
    });
    throw new Error(errorMsg);
  }

  // Stage 1: Checklist
  onStageUpdate?.({
    id: "checklist",
    label: "Building expected coverage checklist",
    status: "running",
  });

  let checklist: ChecklistItem[];
  try {
    const reqBody: CoverageRequest = { question, goal };
    const res = await customFetch("/api/checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqBody),
    });

    if (!res.ok) {
      const errJson = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      throw new Error(
        errJson.error?.message || `Checklist generation failed with HTTP ${res.status}`
      );
    }

    const data = (await res.json()) as CoverageChecklist;
    checklist = data.items;

    onStageUpdate?.({
      id: "checklist",
      label: "Expected coverage checklist ready",
      status: "done",
      detail: `${checklist.length} coverage items generated`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    onStageUpdate?.({
      id: "checklist",
      label: "Checklist generation failed",
      status: "error",
      error: msg,
    });
    throw err;
  }

  // Stage 2: Claim extraction (concurrency 3)
  onStageUpdate?.({
    id: "extract",
    label: "Extracting claims and verifying quotes",
    status: "running",
    detail: `0/${usableSources.length} sources analyzed`,
  });

  const allClaims: VerifiedClaim[] = [];
  const warnings: string[] = [];
  const sourceDateSignals = new Map<string, VerifiedDateSignal[]>();
  let completedExtractCount = 0;

  const extractResults = await runWithConcurrency(
    usableSources,
    3,
    async (source) => {
      try {
        const reqBody: ExtractRequest = {
          sourceId: source.id,
          title: source.title,
          text: source.text,
          checklist,
        };

        const res = await customFetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reqBody),
        });

        if (!res.ok) {
          const errJson = (await res.json().catch(() => ({}))) as {
            error?: { message?: string };
          };
          throw new Error(
            errJson.error?.message ||
              `Extraction for ${source.id} failed with HTTP ${res.status}`
          );
        }

        const data = (await res.json()) as ExtractResult;
        completedExtractCount++;
        onStageUpdate?.({
          id: "extract",
          label: "Extracting claims and verifying quotes",
          status: "running",
          detail: `${completedExtractCount}/${usableSources.length} sources analyzed`,
        });

        return { success: true, sourceId: source.id, data };
      } catch (err: unknown) {
        completedExtractCount++;
        const msg = err instanceof Error ? err.message : String(err);
        warnings.push(`Source ${source.id} (${source.title}): extraction failed (${msg}).`);
        return { success: false, sourceId: source.id, error: msg };
      }
    }
  );

  for (const r of extractResults) {
    if (r.success && r.data) {
      allClaims.push(...r.data.claims);
      sourceDateSignals.set(r.sourceId, r.data.dateSignals);
      if (r.data.warnings) {
        warnings.push(...r.data.warnings);
      }
    }
  }

  if (allClaims.length === 0) {
    const errorMsg = "Could not extract any claims from the reviewed sources.";
    onStageUpdate?.({
      id: "extract",
      label: "Claim extraction failed",
      status: "error",
      error: errorMsg,
    });
    throw new Error(errorMsg);
  }

  onStageUpdate?.({
    id: "extract",
    label: "Claim extraction and quote verification complete",
    status: "done",
    detail: `${allClaims.length} verified claims across ${extractResults.filter((r) => r.success).length} sources`,
  });

  // Stage 3: Analysis
  onStageUpdate?.({
    id: "analyze",
    label: "Analyzing gaps, conflicts, and decision risks",
    status: "running",
  });

  const updatedSources: SourceRecord[] = sources.map((s) => ({
    ...s,
    dateSignals: sourceDateSignals.get(s.id) || s.dateSignals || [],
  }));

  const sourceMetas: SourceMeta[] = updatedSources.map(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ text, ...meta }) => meta
  );

  let analyzeResult: AnalyzeResult;
  try {
    const reqBody: AnalyzeRequest = {
      question,
      goal,
      checklist,
      sources: sourceMetas,
      claims: allClaims,
    };

    const res = await customFetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqBody),
    });

    if (!res.ok) {
      const errJson = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      throw new Error(
        errJson.error?.message || `Analysis failed with HTTP ${res.status}`
      );
    }

    analyzeResult = (await res.json()) as AnalyzeResult;

    // Merge any pipeline warnings
    if (warnings.length > 0) {
      analyzeResult.warnings = [...warnings, ...analyzeResult.warnings];
    }

    onStageUpdate?.({
      id: "analyze",
      label: "Analysis and scoring complete",
      status: "done",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    onStageUpdate?.({
      id: "analyze",
      label: "Analysis failed",
      status: "error",
      error: msg,
    });
    throw err;
  }

  // Stage 4: Finalize
  onStageUpdate?.({
    id: "finalize",
    label: "Saving and presenting findings",
    status: "running",
  });

  const analysis: Analysis = {
    id: "an-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString(),
    mode,
    question,
    goal,
    checklist,
    sources: updatedSources,
    claims: allClaims,
    result: analyzeResult,
  };

  // Validate with Zod schema
  const parsed = AnalysisSchema.safeParse(analysis);
  if (!parsed.success) {
    throw new Error(
      `Assembled analysis failed schema validation: ${JSON.stringify(parsed.error.issues)}`
    );
  }

  saveAnalysisToStorage(analysis);

  onStageUpdate?.({
    id: "finalize",
    label: "Ready",
    status: "done",
  });

  return analysis;
}
