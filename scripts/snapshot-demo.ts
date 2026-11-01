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

async function dispatchLocalRoute(pathname: string, body: unknown) {
  const req = new Request(`http://localhost:3000${pathname}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (pathname === "/api/checklist") return checklistRoute(req);
  if (pathname === "/api/extract") return extractRoute(req);
  if (pathname === "/api/analyze") return analyzeRoute(req);
  throw new Error(`Unknown route: ${pathname}`);
}

async function snapshotCase(caseId: string) {
  const caseDir = path.join(process.cwd(), "public", "demo", caseId);
  if (!fs.existsSync(caseDir)) {
    console.error(`Case directory does not exist: ${caseDir}`);
    process.exit(1);
  }

  const metaRaw = fs.readFileSync(path.join(caseDir, "meta.json"), "utf8");
  const meta = JSON.parse(metaRaw);

  const sources: SourceRecord[] = meta.sources.map((s: any) => {
    const text = fs.readFileSync(path.join(caseDir, s.file), "utf8");
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

  console.log(`Snapshotting case "${caseId}" (${sources.length} sources)...`);

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
    mode: "demo_cached",
    onStageUpdate: (stage) => {
      console.log(` - [${stage.id}] ${stage.label} (${stage.status})`);
    },
  });

  const outPath = path.join(caseDir, "analysis.cached.json");
  fs.writeFileSync(outPath, JSON.stringify(analysis, null, 2), "utf8");
  console.log(`Saved snapshot to: ${outPath}`);
  console.log(`Score: ${analysis.result.score.value >= 0 ? "+" : ""}${analysis.result.score.value} | Blunders: ${analysis.result.blunders.length} | Missed: ${analysis.result.missedMoves.length}\n`);
}

async function run() {
  const targetCase = process.argv[2] || "hostel";
  await snapshotCase(targetCase);
}

run().catch((err) => {
  console.error("Snapshot error:", err);
  process.exit(1);
});

