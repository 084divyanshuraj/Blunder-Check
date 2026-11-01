"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Analysis, EvidenceRef, SourceRecord } from "@/schemas";
import type { PipelineStage } from "@/types";
import { runAnalysisPipeline } from "@/lib/pipeline";
import { ResearchSetup } from "@/components/research/ResearchSetup";
import { AnalysisLoader } from "@/components/analysis/AnalysisLoader";
import { EvaluationBar } from "@/components/chess/EvaluationBar";
import { EvaluationScore } from "@/components/chess/EvaluationScore";
import { BestMoveList } from "@/components/chess/BestMoveList";
import { BlunderCard } from "@/components/chess/BlunderCard";
import { MissedMoveCard } from "@/components/chess/MissedMoveCard";
import { HangingPieceCard } from "@/components/chess/HangingPieceCard";
import { CoverageOverview } from "@/components/analysis/CoverageOverview";
import { EvidenceDrawer } from "@/components/evidence/EvidenceDrawer";
import { DisclaimerFooter } from "@/components/common/DisclaimerFooter";

import mockScholarshipAnalysis from "@/public/demo/scholarship/analysis.mock.json";

function StudioContent() {
  const searchParams = useSearchParams();
  const demoParam = searchParams.get("demo");

  const [question, setQuestion] = useState(
    "What should I verify before applying for the Aurora Merit Scholarship 2026-27?"
  );
  const [goal, setGoal] = useState(
    "Apply successfully for the scholarship without missing a deadline or a required document."
  );
  const [sources, setSources] = useState<SourceRecord[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStage, setCurrentStage] = useState<PipelineStage | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceRef | null>(null);
  const [activeDashboardTab, setActiveDashboardTab] = useState<
    "brief" | "blunders" | "darkspots" | "matrix" | "sources"
  >("brief");
  const [copiedReport, setCopiedReport] = useState(false);

  // Check URL query param for instant demo loading
  useEffect(() => {
    if (demoParam === "scholarship") {
      handleLoadDemo("scholarship", true);
    } else if (demoParam === "hostel") {
      handleLoadDemo("hostel", true);
    }
  }, [demoParam]);

  const handleLoadDemo = async (
    demoKey: "scholarship" | "hostel",
    instantMock = true
  ) => {
    setErrorMsg(null);

    if (instantMock) {
      try {
        const cachedRes = await fetch(`/demo/${demoKey}/analysis.cached.json`);
        if (!cachedRes.ok) throw new Error("Could not load cached snapshot");
        const cachedAnalysis = await cachedRes.json();
        setAnalysis(cachedAnalysis);
        setSources(cachedAnalysis.sources);
        setQuestion(cachedAnalysis.question);
        setGoal(cachedAnalysis.goal);
        setActiveDashboardTab("brief");
        return;
      } catch {
        setAnalysis(mockScholarshipAnalysis as unknown as Analysis);
        setSources(mockScholarshipAnalysis.sources as unknown as SourceRecord[]);
        setQuestion(mockScholarshipAnalysis.question);
        setGoal(mockScholarshipAnalysis.goal);
        setActiveDashboardTab("brief");
        return;
      }
    }

    try {
      const metaRes = await fetch(`/demo/${demoKey}/meta.json`);
      const meta = await metaRes.json();

      setQuestion(meta.question);
      setGoal(meta.goal);

      const loadedSources: SourceRecord[] = await Promise.all(
        meta.sources.map(async (s: { id: string; kind: string; title: string; file: string }) => {
          const txtRes = await fetch(`/demo/${demoKey}/${s.file}`);
          const text = await txtRes.text();
          return {
            id: s.id,
            kind: s.kind === "pdf" ? "pdf" : "paste",
            title: s.title,
            charCount: text.length,
            status: "ok",
            dateSignals: [],
            text,
          };
        })
      );

      setSources(loadedSources);
      setAnalysis(null);
    } catch (err: unknown) {
      setErrorMsg(`Failed to load demo sources: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    setCurrentStage({ id: "checklist", label: "Starting engine...", status: "running" });

    try {
      const result = await runAnalysisPipeline({
        question,
        goal,
        sources,
        onStageUpdate: (stage) => setCurrentStage(stage),
      });

      setAnalysis(result);
      setActiveDashboardTab("brief");
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during analysis. Try using the preloaded cached demo case."
      );
    } finally {
      setIsAnalyzing(false);
      setCurrentStage(null);
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setSelectedEvidence(null);
    setErrorMsg(null);
  };

  const handleCopyAnalysisSummary = () => {
    if (!analysis) return;
    const summary = `BLUNDER CHECK ANALYSIS REPORT
Topic: ${analysis.question}
Goal: ${analysis.goal}
Information Position: ${analysis.result.score.value >= 0 ? "+" : ""}${analysis.result.score.value.toFixed(1)} / 5.0
Weighted Coverage: ${(analysis.result.score.coverage * 100).toFixed(1)}%
Blunders Detected: ${analysis.result.blunders.length}
Dark Spots Found: ${analysis.result.missedMoves.length}

TOP ACTIONS (BEST MOVE):
${analysis.result.verifyNext.map((v, i) => `${i + 1}. [${v.priority.toUpperCase()}] ${v.action} (${v.whereToVerify})`).join("\n")}
`;
    navigator.clipboard.writeText(summary).then(() => {
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    });
  };

  const totalChars = sources.reduce((acc, s) => acc + s.charCount, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#0B1220] text-[#F8FAFC]">
      {/* Enterprise SaaS Navbar */}
      <header className="border-b border-[#263449] bg-[#111C2E]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-[#94A3B8] hover:text-[#38BDF8] transition-colors flex items-center gap-1 font-mono py-1 px-2 rounded hover:bg-[#18263B]"
              title="Return to Product Overview"
            >
              <span>←</span>
              <span className="hidden sm:inline">Product Tour</span>
            </Link>
            
            <div className="h-5 w-[1px] bg-[#263449]" />

            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center text-lg shadow-md shadow-[#2563EB]/20">
                ♟️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold tracking-tight text-[#F8FAFC]">
                    Blunder Check
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#14B8A6]/15 text-[#14B8A6] border border-[#14B8A6]/30 font-semibold uppercase">
                    Decision Studio
                  </span>
                </div>
                <p className="text-[11px] text-[#94A3B8] hidden sm:block">
                  Evidence-Gap &amp; Conflict Detection Workspace
                </p>
              </div>
            </div>
          </div>

          {/* Center / Right Control Panel */}
          <div className="flex items-center gap-2.5">
            {analysis ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAnalysisSummary}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#18263B] hover:bg-[#1F304B] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#263449] transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Copy executive analysis summary to clipboard"
                >
                  <span>{copiedReport ? "✓ Copied" : "📋 Share"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#2563EB] hover:bg-blue-600 text-white shadow-md shadow-[#2563EB]/25 transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>+</span>
                  <span className="hidden sm:inline">New Research</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#94A3B8] font-mono hidden md:inline">
                  Instant Demos:
                </span>
                <button
                  type="button"
                  onClick={() => handleLoadDemo("scholarship", true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#18263B] hover:bg-[#1F304B] text-[#14B8A6] border border-[#14B8A6]/30 hover:border-[#14B8A6]/60 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>🏆</span>
                  <span>Scholarship</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadDemo("hostel", true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#18263B] hover:bg-[#1F304B] text-[#38BDF8] border border-[#2563EB]/40 hover:border-[#38BDF8]/60 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>🏠</span>
                  <span>Hostel</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Error notification */}
        {errorMsg && (
          <div className="max-w-4xl mx-auto p-4 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#EF4444] text-xs flex items-center justify-between gap-3 shadow-lg">
            <div>
              <span className="font-bold">Notice:</span> {errorMsg}
            </div>
            <button
              type="button"
              onClick={() => handleLoadDemo("scholarship", true)}
              className="px-3 py-1 rounded bg-[#EF4444]/25 hover:bg-[#EF4444]/40 text-white font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              Load Verified Snapshot
            </button>
          </div>
        )}

        {/* Live Loading State */}
        {isAnalyzing && <AnalysisLoader currentStage={currentStage} />}

        {/* State A: Research Setup (Empty Workspace) */}
        {!isAnalyzing && !analysis && (
          <ResearchSetup
            question={question}
            setQuestion={setQuestion}
            goal={goal}
            setGoal={setGoal}
            sources={sources}
            setSources={setSources}
            onStartAnalysis={handleStartAnalysis}
            onLoadDemo={handleLoadDemo}
            isAnalyzing={isAnalyzing}
          />
        )}

        {/* State B: Enterprise Analysis Dashboard */}
        {!isAnalyzing && analysis && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header: Topic & Goal Banner */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#18263B] border border-[#263449] shadow-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-[#38BDF8] uppercase tracking-wider font-bold">
                    Research Target Under Audit
                  </span>
                  {analysis.mode === "demo_cached" ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#14B8A6]/20 text-[#14B8A6] border border-[#14B8A6]/40 font-semibold">
                      ✓ Preloaded Case Study
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#2563EB]/20 text-[#38BDF8] border border-[#2563EB]/40 font-semibold">
                      Live AI Run
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#94A3B8] font-mono">
                    {sources.length} sources ({totalChars.toLocaleString()} chars)
                  </span>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-[#111C2E] hover:bg-[#1F304B] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#263449] transition-colors cursor-pointer"
                  >
                    Edit Input
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight">
                  {analysis.question}
                </h1>
                <p className="text-xs sm:text-sm text-[#94A3B8] flex items-center gap-1.5">
                  <span className="font-semibold text-[#F8FAFC]">Stated Goal:</span>
                  <span>{analysis.goal}</span>
                </p>
              </div>

              {/* Source chips */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-[#263449]/70">
                {sources.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      // find first evidence from this source if any
                      const firstEv = analysis.result.blunders
                        .flatMap((b) => b.evidence)
                        .find((e) => e.sourceId === s.id);
                      if (firstEv) setSelectedEvidence(firstEv);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111C2E] border border-[#263449] text-xs hover:border-[#14B8A6]/50 transition-colors text-left"
                    title={`Click to inspect ${s.title}`}
                  >
                    <span className="font-mono font-bold text-[10px] text-[#14B8A6]">
                      {s.id.toUpperCase()}
                    </span>
                    <span className="text-slate-300 max-w-[180px] truncate">
                      {s.title}
                    </span>
                    <span className="text-[10px] text-[#94A3B8] font-mono">
                      ({s.charCount} chars)
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Metric KPI Cards (Top Dashboard Metrics) */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
              {/* Card 1: Score */}
              <div className="p-4 rounded-xl bg-[#18263B] border border-[#263449] space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#94A3B8] tracking-wider font-semibold">
                  Information Position
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-[#F8FAFC]">
                    {analysis.result.score.value >= 0 ? "+" : ""}
                    {analysis.result.score.value.toFixed(1)}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-[#14B8A6]/20 text-[#14B8A6]">
                    / 5.0
                  </span>
                </div>
                <div className="text-[11px] text-[#94A3B8] truncate">
                  {analysis.result.score.value >= 3.0
                    ? "Well Established"
                    : analysis.result.score.value >= 0.5
                    ? "Partly Established"
                    : "Significant Gaps"}
                </div>
              </div>

              {/* Card 2: Coverage */}
              <div className="p-4 rounded-xl bg-[#18263B] border border-[#263449] space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#94A3B8] tracking-wider font-semibold">
                  Requirement Coverage
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-[#F8FAFC]">
                    {(analysis.result.score.coverage * 100).toFixed(0)}%
                  </span>
                  <span className="text-[10px] text-[#38BDF8] font-mono">
                    {analysis.result.coverage.filter((c) => c.status === "covered").length}/{analysis.result.coverage.length}
                  </span>
                </div>
                <div className="text-[11px] text-[#94A3B8]">
                  Critical Needs Satisfied
                </div>
              </div>

              {/* Card 3: Blunders */}
              <div className="p-4 rounded-xl bg-[#18263B] border border-[#EF4444]/30 space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#EF4444] tracking-wider font-semibold">
                  ?? Blunders &amp; Conflicts
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-[#EF4444]">
                    {analysis.result.blunders.length}
                  </span>
                  <span className="text-[10px] text-[#EF4444] font-mono">
                    Discrepancies
                  </span>
                </div>
                <div className="text-[11px] text-[#94A3B8]">
                  Direct Fact Clashes
                </div>
              </div>

              {/* Card 4: Dark Spots */}
              <div className="p-4 rounded-xl bg-[#18263B] border border-[#F59E0B]/30 space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#F59E0B] tracking-wider font-semibold">
                  ?! Dark Spots
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-[#F59E0B]">
                    {analysis.result.missedMoves.length}
                  </span>
                  <span className="text-[10px] text-[#F59E0B] font-mono">
                    Gaps
                  </span>
                </div>
                <div className="text-[11px] text-[#94A3B8]">
                  Zero Mentions in Sources
                </div>
              </div>

              {/* Card 5: Quotes Verified */}
              <div className="p-4 rounded-xl bg-[#18263B] border border-[#14B8A6]/30 space-y-1 col-span-2 lg:col-span-1">
                <span className="text-[10px] font-mono uppercase text-[#14B8A6] tracking-wider font-semibold">
                  Quote Verification
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-[#14B8A6]">
                    100%
                  </span>
                  <span className="text-[10px] text-[#14B8A6] font-mono">
                    Substrings
                  </span>
                </div>
                <div className="text-[11px] text-[#94A3B8]">
                  Programmatic Proof
                </div>
              </div>
            </div>

            {/* Dashboard Tabs Segmented Control */}
            <div className="border-b border-[#263449] flex items-center justify-between overflow-x-auto pb-0.5">
              <nav className="flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setActiveDashboardTab("brief")}
                  className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border-t-2 ${
                    activeDashboardTab === "brief"
                      ? "bg-[#18263B] text-[#38BDF8] border-[#38BDF8]"
                      : "text-[#94A3B8] hover:text-[#F8FAFC] border-transparent"
                  }`}
                >
                  <span>♟️ Executive Position &amp; Best Moves</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDashboardTab("blunders")}
                  className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border-t-2 ${
                    activeDashboardTab === "blunders"
                      ? "bg-[#18263B] text-[#EF4444] border-[#EF4444]"
                      : "text-[#94A3B8] hover:text-[#F8FAFC] border-transparent"
                  }`}
                >
                  <span>⚠️ Blunders &amp; Contradictions</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-[#EF4444]/20 text-[#EF4444] text-[10px] font-mono">
                    {analysis.result.blunders.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDashboardTab("darkspots")}
                  className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border-t-2 ${
                    activeDashboardTab === "darkspots"
                      ? "bg-[#18263B] text-[#F59E0B] border-[#F59E0B]"
                      : "text-[#94A3B8] hover:text-[#F8FAFC] border-transparent"
                  }`}
                >
                  <span>🌑 Digital Dark Spots</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] text-[10px] font-mono">
                    {analysis.result.missedMoves.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDashboardTab("matrix")}
                  className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border-t-2 ${
                    activeDashboardTab === "matrix"
                      ? "bg-[#18263B] text-[#14B8A6] border-[#14B8A6]"
                      : "text-[#94A3B8] hover:text-[#F8FAFC] border-transparent"
                  }`}
                >
                  <span>📋 Coverage Matrix</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDashboardTab("sources")}
                  className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border-t-2 ${
                    activeDashboardTab === "sources"
                      ? "bg-[#18263B] text-[#38BDF8] border-[#38BDF8]"
                      : "text-[#94A3B8] hover:text-[#F8FAFC] border-transparent"
                  }`}
                >
                  <span>📂 Evidence Sources ({sources.length})</span>
                </button>
              </nav>
            </div>

            {/* TAB CONTENT 1: Executive Position & Best Moves */}
            {activeDashboardTab === "brief" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Left Column: Vertical Eval Bar */}
                <div className="md:col-span-2 lg:col-span-1 flex justify-center sticky top-24">
                  <EvaluationBar score={analysis.result.score.value} />
                </div>

                {/* Center Column: Evaluation Score, Narrative AI Reasoning & Best Move Checklist */}
                <div className="md:col-span-10 lg:col-span-11 space-y-6">
                  <EvaluationScore
                    score={analysis.result.score}
                    evalReasoning={analysis.result.evalReasoning}
                  />

                  {analysis.result.verifyNext.length > 0 && (
                    <BestMoveList items={analysis.result.verifyNext} />
                  )}

                  {/* Highlights overview: top blunder and top dark spot summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.result.blunders[0] && (
                      <div className="p-4 rounded-xl bg-[#18263B] border border-[#EF4444]/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-[#EF4444]">
                            ?? Top Blunder Detected
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveDashboardTab("blunders")}
                            className="text-xs text-[#38BDF8] hover:underline font-mono"
                          >
                            View all →
                          </button>
                        </div>
                        <p className="text-xs text-[#F8FAFC] font-medium leading-relaxed">
                          {analysis.result.blunders[0].description}
                        </p>
                      </div>
                    )}

                    {analysis.result.missedMoves[0] && (
                      <div className="p-4 rounded-xl bg-[#18263B] border border-[#F59E0B]/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-[#F59E0B]">
                            ?! Top Dark Spot Discovered
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveDashboardTab("darkspots")}
                            className="text-xs text-[#38BDF8] hover:underline font-mono"
                          >
                            View all →
                          </button>
                        </div>
                        <p className="text-xs text-[#F8FAFC] font-medium leading-relaxed">
                          {analysis.result.missedMoves[0].description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: Blunders & Contradictions */}
            {activeDashboardTab === "blunders" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#18263B] border border-[#263449] flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                      <span className="text-[#EF4444]">?? Blunders &amp; Conflicting Claims</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#EF4444]/20 text-[#EF4444] font-semibold">
                        {analysis.result.blunders.length}
                      </span>
                    </h3>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      Contradictory dates, conflicting amounts, or outdated cycle details between sources. Click any quote to inspect verbatim document context.
                    </p>
                  </div>
                </div>

                {analysis.result.blunders.length === 0 ? (
                  <div className="p-8 rounded-xl bg-[#18263B] border border-[#263449] text-xs text-[#94A3B8] text-center">
                    ✓ No blunders or direct contradictions detected across the reviewed sources.
                  </div>
                ) : (
                  analysis.result.blunders.map((blunder) => (
                    <BlunderCard
                      key={blunder.id}
                      blunder={blunder}
                      sources={analysis.sources}
                      onSelectEvidence={(ev) => setSelectedEvidence(ev)}
                    />
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT 3: Digital Dark Spots */}
            {activeDashboardTab === "darkspots" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#18263B] border border-[#263449] flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                      <span className="text-[#F59E0B]">🌑 Digital Dark Spots (Missing Requirements)</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B] font-semibold">
                        {analysis.result.missedMoves.length}
                      </span>
                    </h3>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      Decision requirements that zero reviewed sources answered. These represent critical blind spots where assumptions lead to costly failures.
                    </p>
                  </div>
                </div>

                {analysis.result.missedMoves.length === 0 ? (
                  <div className="p-8 rounded-xl bg-[#18263B] border border-[#263449] text-xs text-[#94A3B8] text-center">
                    ✓ All expected checklist items were adequately covered by the reviewed sources.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.result.missedMoves.map((m) => (
                      <MissedMoveCard key={m.id} missedMove={m} />
                    ))}
                  </div>
                )}

                {/* Hanging Pieces Section */}
                {analysis.result.hangingPieces.length > 0 && (
                  <div className="space-y-3 pt-4">
                    <h4 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                      <span className="text-[#38BDF8]">◎ Hanging Pieces (High-Impact Latent Risks)</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#2563EB]/20 text-[#38BDF8] font-semibold">
                        {analysis.result.hangingPieces.length}
                      </span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {analysis.result.hangingPieces.map((p) => (
                        <HangingPieceCard key={p.id} piece={p} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 4: Requirements Coverage Matrix */}
            {activeDashboardTab === "matrix" && (
              <div className="space-y-4">
                <CoverageOverview
                  coverage={analysis.result.coverage}
                  sources={analysis.sources}
                  claims={analysis.claims}
                  scopeNote={analysis.result.scopeNote}
                  warnings={analysis.result.warnings}
                />
              </div>
            )}

            {/* TAB CONTENT 5: Evidence Sources */}
            {activeDashboardTab === "sources" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#18263B] border border-[#263449] flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#F8FAFC]">
                      Ingested Source Documents ({sources.length})
                    </h3>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      All sources cleaned and delimited for analysis. Click any source to inspect its raw text.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sources.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 rounded-xl bg-[#18263B] border border-[#263449] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#14B8A6] px-2 py-0.5 rounded bg-[#14B8A6]/15 border border-[#14B8A6]/30">
                            {s.id.toUpperCase()}
                          </span>
                          <span className="text-xs font-semibold text-[#F8FAFC] truncate max-w-[220px]">
                            {s.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#111C2E] text-[#94A3B8] border border-[#263449]">
                          {s.kind.toUpperCase()}
                        </span>
                      </div>

                      <div className="text-xs text-[#94A3B8] flex items-center justify-between font-mono">
                        <span>Size: {s.charCount.toLocaleString()} chars</span>
                        <span className="text-[#14B8A6]">Status: {s.status}</span>
                      </div>

                      {s.dateSignals && s.dateSignals.length > 0 && (
                        <div className="text-[11px] font-mono text-[#F59E0B] bg-[#F59E0B]/10 p-2 rounded border border-[#F59E0B]/20">
                          Cycle notices detected: {s.dateSignals.join(", ")}
                        </div>
                      )}

                      <div className="p-2.5 rounded bg-[#111C2E] border border-[#263449] text-xs font-mono text-slate-300 max-h-36 overflow-y-auto">
                        <pre className="whitespace-pre-wrap font-sans text-xs line-clamp-6">
                          {s.text}
                        </pre>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEvidence({
                            claimId: `${s.id}-overview`,
                            sourceId: s.id,
                            claim: "Source Overview",
                            quote: s.text.slice(0, 100),
                            verification: {
                              status: "exact",
                              start: 0,
                              end: Math.min(100, s.text.length),
                            },
                          });
                        }}
                        className="text-xs text-[#38BDF8] hover:underline font-semibold block"
                      >
                        Inspect in Full Document Viewer →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Slide-over Evidence Drawer for verbatim quote verification */}
            <EvidenceDrawer
              evidence={selectedEvidence}
              sources={analysis.sources}
              onClose={() => setSelectedEvidence(null)}
            />
          </div>
        )}
      </main>

      {/* Persistent Disclaimer */}
      <DisclaimerFooter />
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B1220] flex items-center justify-center text-sm font-mono text-[#94A3B8]">
          <div className="flex items-center gap-2">
            <span className="animate-spin">♟️</span>
            <span>Initializing Decision Studio...</span>
          </div>
        </div>
      }
    >
      <StudioContent />
    </Suspense>
  );
}
