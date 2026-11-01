import fs from "node:fs";
import path from "node:path";
import { POST as checklistRoute } from "../app/api/checklist/route";
import { POST as extractRoute } from "../app/api/extract/route";
import { POST as analyzeRoute } from "../app/api/analyze/route";
import { runAnalysisPipeline } from "../lib/pipeline";
import type { SourceRecord } from "../schemas";

if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(".env");
  } catch {}
  try {
    process.loadEnvFile(".env.local");
  } catch {}
}

const DEMO_DIR = path.join(process.cwd(), "public", "demo", "scholarship");

async function dispatchLocalRoute(pathname: string, body: unknown) {
  const req = new Request(`http://localhost:3000${pathname}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let res: Response;
  if (pathname === "/api/checklist") {
    res = await checklistRoute(req);
  } else if (pathname === "/api/extract") {
    res = await extractRoute(req);
  } else if (pathname === "/api/analyze") {
    res = await analyzeRoute(req);
  } else {
    throw new Error(`Unknown route: ${pathname}`);
  }

  return res;
}

async function runSmoke() {
  console.log("=== BLUNDER CHECK: BACKEND SMOKE TEST ===");
  console.log("Loading scholarship demo case data...");

  const metaRaw = fs.readFileSync(path.join(DEMO_DIR, "meta.json"), "utf8");
  const meta = JSON.parse(metaRaw);

  const sources: SourceRecord[] = meta.sources.map((s: any) => {
    const text = fs.readFileSync(path.join(DEMO_DIR, s.file), "utf8");
    return {
      id: s.id,
      kind: s.kind === "pdf" ? "pdf" : "paste",
      title: s.title,
      charCount: text.length,
      status: "ok",
      dateSignals: [],
      text,
    };
  });

  console.log(`Sources loaded: ${sources.length} sources.`);
  console.log(`Question: ${meta.question}`);
  console.log(`Goal: ${meta.goal}\n`);

  console.log("Running pipeline through API route handlers...");
  const start = Date.now();

  const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof input === "string" ? input : input.toString();
    const parsedPath = new URL(urlStr, "http://localhost:3000").pathname;
    const body = init?.body ? JSON.parse(init.body as string) : {};
    return dispatchLocalRoute(parsedPath, body);
  };

  const analysis = await runAnalysisPipeline({
    question: meta.question,
    goal: meta.goal,
    sources,
    customFetch: customFetch as unknown as typeof fetch,
    onStageUpdate: (stage) => {
      console.log(`[Stage: ${stage.id}] ${stage.label} (${stage.status}) ${stage.detail ? `-> ${stage.detail}` : ""}`);
    },
  });

  const durationSec = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nPipeline completed in ${durationSec}s!\n`);

  console.log("=== RESULTS SUMMARY ===");
  console.log(`Information Position Score: ${analysis.result.score.value >= 0 ? "+" : ""}${analysis.result.score.value}`);
  console.log(`Coverage: ${(analysis.result.score.coverage * 100).toFixed(1)}%`);
  console.log(`Reasoning: ${analysis.result.evalReasoning}\n`);

  console.log(`--- Blunders (${analysis.result.blunders.length}) ---`);
  for (const b of analysis.result.blunders) {
    console.log(`• [${b.type.toUpperCase()}] ${b.description}`);
    console.log(`  Evidence (${b.evidence.length} sources): ${b.evidence.map((e) => `${e.sourceId}: "${e.quote.slice(0, 50)}..."`).join(" | ")}`);
  }

  console.log(`\n--- Missed Moves (${analysis.result.missedMoves.length}) ---`);
  for (const m of analysis.result.missedMoves) {
    console.log(`• [${m.kind}] ${m.description} (${m.scope})`);
  }

  console.log(`\n--- Verify Next (${analysis.result.verifyNext.length}) ---`);
  for (const v of analysis.result.verifyNext) {
    console.log(`[${v.rank}] [${v.priority.toUpperCase()}] ${v.action} (${v.whereToVerify})`);
  }

  console.log("\n=== GROUND TRUTH ISSUE CHECKS (DEMO_CASES.md) ===");

  const blundersText = analysis.result.blunders.map((b) => b.description.toLowerCase()).join(" ");
  const missedText = analysis.result.missedMoves.map((m) => m.description.toLowerCase()).join(" ");

  // Issue 1: Deadline conflict
  const hasDeadlineConflict =
    analysis.result.blunders.some((b) => b.type === "conflict" && b.description.toLowerCase().includes("deadline")) ||
    blundersText.includes("deadline") ||
    blundersText.includes("november");

  // Issue 2: Income proof conflict
  const hasIncomeProofConflict =
    blundersText.includes("income") ||
    blundersText.includes("itr") ||
    blundersText.includes("certificate");

  // Issue 3: Outdated 2025-26 cycle
  const hasOutdatedSignal =
    analysis.result.blunders.some((b) => b.type === "outdated") ||
    blundersText.includes("2025-26") ||
    blundersText.includes("outdated");

  // Issue 6: Missing appeal / grievance
  const hasAppealMissing =
    missedText.includes("appeal") ||
    missedText.includes("grievance") ||
    analysis.result.coverage.some((c) => (c.item.toLowerCase().includes("appeal") || c.item.toLowerCase().includes("grievance")) && c.status === "missing");

  console.log(`1. Conflict: Deadline (15 vs 22 vs 30 Nov): ${hasDeadlineConflict ? "PASS [FOUND]" : "FAIL"}`);
  console.log(`2. Conflict: Income Proof (ITR allowed vs rejected): ${hasIncomeProofConflict ? "PASS [FOUND]" : "FAIL"}`);
  console.log(`3. Outdated: 2025-26 cycle flag: ${hasOutdatedSignal ? "PASS [FOUND]" : "FAIL"}`);
  console.log(`4. Missing: Appeal / grievance process: ${hasAppealMissing ? "PASS [FOUND]" : "FAIL"}`);

  if (hasDeadlineConflict && hasIncomeProofConflict && hasOutdatedSignal && hasAppealMissing) {
    console.log("\n>>> ALL 4 DEMO GATE ISSUES DETECTED SUCCESSFULLY! BACKEND GATE PASSED. <<<");
  } else {
    console.log("\n>>> Some planted issues were not matched. Review prompt sensitivity. <<<");
  }
}

runSmoke().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});

