import { describe, expect, it, vi } from "vitest";
import {
  loadAnalysesFromStorage,
  runAnalysisPipeline,
  saveAnalysisToStorage,
  STORAGE_KEY,
} from "../pipeline";
import { AnalysisSchema, type SourceRecord } from "../../schemas";
import mockAnalysis from "../../public/demo/scholarship/analysis.mock.json";

describe("lib/pipeline.ts", () => {
  const sources: SourceRecord[] = [
    {
      id: "s1",
      kind: "url",
      title: "Official Page",
      charCount: 200,
      status: "ok",
      text: "Official scholarship guidelines and deadlines.",
      dateSignals: [],
    },
    {
      id: "s2",
      kind: "url",
      title: "Blog Review",
      charCount: 200,
      status: "ok",
      text: "Blog post mentioning contradictory deadline.",
      dateSignals: [],
    },
    {
      id: "s3",
      kind: "pdf",
      title: "Foundation Notice",
      charCount: 200,
      status: "ok",
      text: "Foundation circular extending deadline.",
      dateSignals: [],
    },
  ];

  it("completes full pipeline and returns schema-valid Analysis even if one extraction fails", async () => {
    const stageEvents: string[] = [];

    const mockFetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.includes("/api/checklist")) {
        return {
          ok: true,
          json: async () => ({
            topicType: "scholarship application",
            items: mockAnalysis.checklist,
          }),
        };
      }

      if (url.includes("/api/extract")) {
        const body = JSON.parse((init?.body as string) || "{}");
        // Simulate s2 extraction failure
        if (body.sourceId === "s2") {
          return {
            ok: false,
            status: 500,
            json: async () => ({ error: { message: "Simulated extraction failure for s2" } }),
          };
        }

        const sourceClaims = mockAnalysis.claims.filter(
          (c) => c.sourceId === body.sourceId
        );
        return {
          ok: true,
          json: async () => ({
            sourceId: body.sourceId,
            claims: sourceClaims,
            dateSignals: [],
            droppedClaimCount: 0,
            warnings: [],
          }),
        };
      }

      if (url.includes("/api/analyze")) {
        return {
          ok: true,
          json: async () => mockAnalysis.result,
        };
      }

      throw new Error(`Unhandled URL: ${url}`);
    });

    const result = await runAnalysisPipeline({
      question: "What should I verify before applying for Aurora Scholarship?",
      goal: "Apply successfully",
      sources,
      customFetch: mockFetch as unknown as typeof fetch,
      onStageUpdate: (stage) => stageEvents.push(`${stage.id}:${stage.status}`),
    });

    // 1. Result validates against AnalysisSchema
    const parseResult = AnalysisSchema.safeParse(result);
    expect(parseResult.success).toBe(true);

    // 2. Contains warning from failing s2 without crashing
    expect(result.result.warnings.some((w) => w.includes("s2"))).toBe(true);

    // 3. Emitted expected stage events
    expect(stageEvents).toContain("checklist:running");
    expect(stageEvents).toContain("checklist:done");
    expect(stageEvents).toContain("extract:running");
    expect(stageEvents).toContain("extract:done");
    expect(stageEvents).toContain("analyze:running");
    expect(stageEvents).toContain("analyze:done");
    expect(stageEvents).toContain("finalize:done");
  });

  it("handles localStorage save and retrieval safely", () => {
    const store = new Map<string, string>();
    const fakeLocalStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
      clear: () => store.clear(),
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      length: store.size,
    };

    vi.stubGlobal("window", { localStorage: fakeLocalStorage });

    saveAnalysisToStorage(mockAnalysis as any);
    const loaded = loadAnalysesFromStorage();

    expect(loaded.length).toBe(1);
    expect(loaded[0].id).toBe(mockAnalysis.id);

    vi.unstubAllGlobals();
  });
});

