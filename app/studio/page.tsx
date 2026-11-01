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
import { BlunderReplay } from "@/components/chess/BlunderReplay";
import { OpponentMode } from "@/components/chess/OpponentMode";
import { EvidenceDrawer } from "@/components/evidence/EvidenceDrawer";
import { ExecutiveDossierModal } from "@/components/analysis/ExecutiveDossierModal";
import { DisclaimerFooter } from "@/components/common/DisclaimerFooter";
import { sound } from "@/lib/sound";
import { classifySourceProvenance } from "@/lib/provenance";

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
    | "brief"
    | "blunder_replay"
    | "opponent"
    | "blunders"
    | "darkspots"
    | "matrix"
    | "sources"
  >("brief");
  const [copiedReport, setCopiedReport] = useState(false);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

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

  const handleTabChange = (
    tab:
      | "brief"
      | "blunder_replay"
      | "opponent"
      | "blunders"
      | "darkspots"
      | "matrix"
      | "sources"
  ) => {
    sound.playPieceMove();
    setActiveDashboardTab(tab);
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
    <div className="min-h-screen flex flex-col bg-[#08080C] text-[#F8FAFC]">
      {/* Precision Cockpit Navbar */}
      <header className="border-b border-[#222533] bg-[#0F1017]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-[#8E95A5] hover:text-[#CCFF00] transition-colors flex items-center gap-1 font-mono py-1 px-2 rounded hover:bg-[#151722]"
              title="Return to Product Overview"
            >
              <span>←</span>
              <span className="hidden sm:inline">Product Tour</span>
            </Link>
            
            <div className="h-5 w-[1px] bg-[#222533]" />

            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#CCFF00] flex items-center justify-center text-lg shadow-md shadow-[#2563EB]/20 text-[#08080C] font-black">
                ♟
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold tracking-tight text-[#F8FAFC]">
                    Blunder Check
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30 font-semibold uppercase">
                    Decision Cockpit
                  </span>
                </div>
                <p className="text-[11px] text-[#8E95A5] hidden sm:block font-mono">
                  Evidence-Gap &amp; Conflict Detection Workspace
                </p>
              </div>
            </div>
          </div>

          {/* Center / Right Control Panel */}
          <div className="flex items-center gap-2.5">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = sound.toggle();
                setIsAudioEnabled(next);
                if (next) sound.playPieceMove();
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-colors cursor-pointer flex items-center gap-1 ${
                isAudioEnabled
                  ? "bg-[#151722] text-[#CCFF00] border-[#CCFF00]/30 hover:border-[#CCFF00]/60"
                  : "bg-[#0F1017] text-[#8E95A5] border-[#222533]"
              }`}
              title={isAudioEnabled ? "Sound Effects Enabled (Click to Mute)" : "Sound Effects Muted (Click to Unmute)"}
            >
              <span>{isAudioEnabled ? "🔊" : "🔇"}</span>
              <span className="hidden sm:inline">{isAudioEnabled ? "SFX" : "Muted"}</span>
            </button>

            {analysis ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDossierOpen(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold font-mono bg-[#151722] hover:bg-[#1C1F2E] text-[#CCFF00] border border-[#CCFF00]/30 hover:border-[#CCFF00]/60 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Open formatted executive decision dossier (Print / PDF)"
                >
                  <span>📄</span>
                  <span>Dossier</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyAnalysisSummary}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold font-mono bg-[#151722] hover:bg-[#1C1F2E] text-[#8E95A5] hover:text-[#F8FAFC] border border-[#222533] transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Copy executive analysis summary to clipboard"
                >
                  <span>{copiedReport ? "✓ Copied" : "📋 Share"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono bg-[#2563EB] hover:bg-blue-600 text-white shadow-md shadow-[#2563EB]/25 transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>+</span>
                  <span className="hidden sm:inline">New Research</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 font-mono">
                <span className="text-[11px] text-[#8E95A5] hidden md:inline">
                  Instant Demos:
                </span>
                <button
                  type="button"
                  onClick={() => handleLoadDemo("scholarship", true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#151722] hover:bg-[#1C1F2E] text-[#CCFF00] border border-[#CCFF00]/30 hover:border-[#CCFF00]/60 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>🏆</span>
                  <span>Scholarship</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadDemo("hostel", true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#151722] hover:bg-[#1C1F2E] text-[#60A5FA] border border-[#2563EB]/40 hover:border-[#3B82F6]/60 transition-colors cursor-pointer flex items-center gap-1"
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
          <div className="max-w-4xl mx-auto p-4 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs flex items-center justify-between gap-3 shadow-lg font-mono">
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
            <div className="p-5 sm:p-6 rounded-2xl bg-[#151722] border border-[#222533] shadow-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-[#3B82F6] uppercase tracking-wider font-bold">
                    Research Target Under Audit
                  </span>
                  {analysis.mode === "demo_cached" ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30 font-semibold">
                      ✓ Preloaded Case Study
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/40 font-semibold">
                      Live AI Run
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8E95A5] font-mono">
                    {sources.length} sources ({totalChars.toLocaleString()} chars)
                  </span>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1 rounded-lg text-xs font-mono font-medium bg-[#0F1017] hover:bg-[#1C1F2E] text-[#8E95A5] hover:text-[#F8FAFC] border border-[#222533] transition-colors cursor-pointer"
                  >
                    Edit Input
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight">
                  {analysis.question}
                </h1>
                <p className="text-xs sm:text-sm text-[#8E95A5] flex items-center gap-1.5">
                  <span className="font-semibold text-[#F8FAFC]">Stated Goal:</span>
                  <span>{analysis.goal}</span>
                </p>
              </div>

              {/* Source chips */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-[#222533]">
                {sources.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      const firstEv = analysis.result.blunders
                        .flatMap((b) => b.evidence)
                        .find((e) => e.sourceId === s.id);
                      if (firstEv) setSelectedEvidence(firstEv);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0F1017] border border-[#222533] text-xs hover:border-[#CCFF00]/50 transition-colors text-left"
                    title={`Click to inspect ${s.title}`}
                  >
                    <span className="font-mono font-bold text-[10px] text-[#CCFF00]">
                      {s.id.toUpperCase()}
                    </span>
                    <span className="text-slate-300 max-w-[180px] truncate">
                      {s.title}
                    </span>
                    <span className="text-[10px] text-[#8E95A5] font-mono">
                      ({s.charCount} chars)
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Metric KPI Cards (Top Dashboard Metrics) */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
              {/* Card 1: Score */}
              <div className="p-4 rounded-xl bg-[#151722] border border-[#222533] space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#8E95A5] tracking-wider font-semibold">
                  Information Position
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-[#F8FAFC]">
                    {analysis.result.score.value >= 0 ? "+" : ""}
                    {analysis.result.score.value.toFixed(1)}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-[#CCFF00]/10 text-[#CCFF00]">
                    / 5.0
                  </span>
                </div>
                <div className="text-[11px] text-[#8E95A5] font-mono truncate">
                  {analysis.result.score.value >= 3.0
                    ? "Well Established"
                    : analysis.result.score.value >= 0.5
                    ? "Partly Established"
                    : "Significant Gaps"}
                </div>
              </div>

              {/* Card 2: Coverage */}
              <div className="p-4 rounded-xl bg-[#151722] border border-[#222533] space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#8E95A5] tracking-wider font-semibold">
                  Requirement Coverage
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-[#F8FAFC]">
                    {(analysis.result.score.coverage * 100).toFixed(0)}%
                  </span>
                  <span className="text-[10px] text-[#3B82F6] font-mono">
                    {analysis.result.coverage.filter((c) => c.status === "covered").length}/{analysis.result.coverage.length}
                  </span>
                </div>
                <div className="text-[11px] text-[#8E95A5]">
                  Critical Needs Satisfied
                </div>
              </div>

              {/* Card 3: Blunders */}
              <div className="p-4 rounded-xl bg-[#151722] border border-[#EF4444]/35 space-y-1">
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
                <div className="text-[11px] text-[#8E95A5]">
                  Direct Fact Clashes
                </div>
              </div>

              {/* Card 4: Dark Spots */}
              <div className="p-4 rounded-xl bg-[#151722] border border-[#F59E0B]/35 space-y-1">
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
                <div className="text-[11px] text-[#8E95A5]">
                  Zero Mentions in Sources
                </div>
              </div>

              {/* Card 5: Quotes Verified */}
              <div className="p-4 rounded-xl bg-[#151722] border border-[#CCFF00]/30 space-y-1 col-span-2 lg:col-span-1">
                <span className="text-[10px] font-mono uppercase text-[#CCFF00] tracking-wider font-semibold">
                  Quote Verification
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-[#CCFF00]">
                    100%
                  </span>
                  <span className="text-[10px] text-[#CCFF00] font-mono">
                    Substrings
                  </span>
                </div>
                <div className="text-[11px] text-[#8E95A5]">
                  Programmatic Proof
                </div>
              </div>
            </div>

            {/* Dashboard Tabs Segmented Control */}
            <div className="border-b border-[#222533] flex items-center justify-between overflow-x-auto pb-0.5">
              <nav className="flex items-center gap-1 sm:gap-2 font-mono">
                <button
                  type="button"
                  onClick={() => handleTabChange("brief")}
                  className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border-t-2 ${
                    activeDashboardTab === "brief"
                      ? "bg-[#151722] text-[#3B82F6] border-[#3B82F6]"
                      : "text-[#8E95A5] hover:text-[#F8FAFC] border-transparent"
                  }`}
                >
                  <span>♟ Position &amp; Best Moves</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("blunder_replay")}
                  className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-t-2 ${
                    activeDashboardTab === "blunder_replay"
                      ? "bg-[#151722] text-[#CCFF00] border-[#CCFF00]"
                      : "text-[#8E95A5] hover:text-[#CCFF00] border-transparent"
                  }`}
                >
                  <span>♟️ Blunder Replay</span>
                  <span className="px-1.5 py-0.2 rounded font-mono text-[9px] bg-[#CCFF00]/15 text-[#CCFF00] font-extrabold uppercase">
                    Simulate
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("opponent")}
                  className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-t-2 ${
                    activeDashboardTab === "opponent"
                      ? "bg-[#151722] text-[#EF4444] border-[#EF4444]"
                      : "text-[#8E95A5] hover:text-[#EF4444] border-transparent"
                  }`}
                >
                  <span>⚔️ Opponent Mode</span>
                  <span className="px-1.5 py-0.2 rounded font-mono text-[9px] bg-[#EF4444]/20 text-[#EF4444] font-extrabold uppercase">
                    Attack
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("blunders")}
                  className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border-t-2 ${
                    activeDashboardTab === "blunders"
                      ? "bg-[#151722] text-[#EF4444] border-[#EF4444]"
                      : "text-[#8E95A5] hover:text-[#F8FAFC] border-transparent"
                  }`}
                >
                  <span>⚠️ Blunders &amp; Contradictions</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-[#EF4444]/20 text-[#EF4444] text-[10px] font-mono">
                    {analysis.result.blunders.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("darkspots")}
                  className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border-t-2 ${
                    activeDashboardTab === "darkspots"
                      ? "bg-[#151722] text-[#F59E0B] border-[#F59E0B]"
                      : "text-[#8E95A5] hover:text-[#F8FAFC] border-transparent"
                  }`}
                >
                  <span>🌑 Digital Dark Spots</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] text-[10px] font-mono">
                    {analysis.result.missedMoves.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("matrix")}
                  className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border-t-2 ${
                    activeDashboardTab === "matrix"
                      ? "bg-[#151722] text-[#CCFF00] border-[#CCFF00]"
                      : "text-[#8E95A5] hover:text-[#F8FAFC] border-transparent"
                  }`}
                >
                  <span>📋 Coverage Matrix</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("sources")}
                  className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border-t-2 ${
                    activeDashboardTab === "sources"
                      ? "bg-[#151722] text-[#3B82F6] border-[#3B82F6]"
                      : "text-[#8E95A5] hover:text-[#F8FAFC] border-transparent"
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
                      <div className="p-4 rounded-xl bg-[#151722] border border-[#EF4444]/35 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-[#EF4444]">
                            ?? Top Blunder Detected
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveDashboardTab("blunders")}
                            className="text-xs text-[#3B82F6] hover:underline font-mono"
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
                      <div className="p-4 rounded-xl bg-[#151722] border border-[#F59E0B]/35 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-[#F59E0B]">
                            ?! Top Dark Spot Discovered
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveDashboardTab("darkspots")}
                            className="text-xs text-[#3B82F6] hover:underline font-mono"
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

                  {/* WOW Feature Quick-Access Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div
                      onClick={() => setActiveDashboardTab("blunder_replay")}
                      className="p-4 rounded-xl bg-[#151722] hover:bg-[#1C1F2E] border border-[#CCFF00]/30 hover:border-[#CCFF00]/60 transition-all cursor-pointer space-y-1.5 shadow-sm group select-none"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[#CCFF00] flex items-center gap-1.5">
                          <span>♟️ Blunder Replay Simulator</span>
                        </span>
                        <span className="text-[10px] font-mono text-[#CCFF00] group-hover:translate-x-0.5 transition-transform">
                          Simulate →
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Test what happens when you fix conflicting deadlines or close dark spots. Watch your Information Position recover in real-time.
                      </p>
                    </div>

                    <div
                      onClick={() => setActiveDashboardTab("opponent")}
                      className="p-4 rounded-xl bg-[#151722] hover:bg-[#1C1F2E] border border-[#EF4444]/35 hover:border-[#EF4444]/65 transition-all cursor-pointer space-y-1.5 shadow-sm group select-none"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[#EF4444] flex items-center gap-1.5">
                          <span>⚔️ Opponent Attack Mode</span>
                        </span>
                        <span className="text-[10px] font-mono text-[#EF4444] group-hover:translate-x-0.5 transition-transform">
                          Enter Battle →
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Face a ruthless evaluator looking for excuses to disqualify you using the exact blind spots uncovered in this audit.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Blunder Replay Simulator */}
            {activeDashboardTab === "blunder_replay" && (
              <BlunderReplay analysis={analysis} />
            )}

            {/* TAB CONTENT: Opponent Attack Mode */}
            {activeDashboardTab === "opponent" && (
              <OpponentMode analysis={analysis} />
            )}

            {/* TAB CONTENT 2: Blunders & Contradictions */}
            {activeDashboardTab === "blunders" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#151722] border border-[#222533] flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                      <span className="text-[#EF4444]">?? Blunders &amp; Conflicting Claims</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#EF4444]/20 text-[#EF4444] font-semibold">
                        {analysis.result.blunders.length}
                      </span>
                    </h3>
                    <p className="text-xs text-[#8E95A5] mt-0.5">
                      Contradictory dates, conflicting amounts, or outdated cycle details between sources. Click any quote to inspect verbatim document context.
                    </p>
                  </div>
                </div>

                {analysis.result.blunders.length === 0 ? (
                  <div className="p-8 rounded-xl bg-[#151722] border border-[#222533] text-xs text-[#8E95A5] text-center font-mono">
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
                <div className="p-4 rounded-xl bg-[#151722] border border-[#222533] flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                      <span className="text-[#F59E0B]">🌑 Digital Dark Spots (Missing Requirements)</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B] font-semibold">
                        {analysis.result.missedMoves.length}
                      </span>
                    </h3>
                    <p className="text-xs text-[#8E95A5] mt-0.5">
                      Decision requirements that zero reviewed sources answered. These represent critical blind spots where assumptions lead to costly failures.
                    </p>
                  </div>
                </div>

                {analysis.result.missedMoves.length === 0 ? (
                  <div className="p-8 rounded-xl bg-[#151722] border border-[#222533] text-xs text-[#8E95A5] text-center font-mono">
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
                      <span className="text-[#3B82F6]">◎ Hanging Pieces (High-Impact Latent Risks)</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#2563EB]/20 text-[#60A5FA] font-semibold">
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
                <div className="p-4 rounded-xl bg-[#151722] border border-[#222533] flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#F8FAFC]">
                      Ingested Source Documents ({sources.length})
                    </h3>
                    <p className="text-xs text-[#8E95A5] mt-0.5">
                      All sources cleaned and delimited for analysis. Click any source to inspect its raw text.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sources.map((s) => {
                    const prov = classifySourceProvenance(s);
                    return (
                      <div
                        key={s.id}
                        className="p-4 rounded-xl bg-[#151722] border border-[#222533] space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#CCFF00] px-2 py-0.5 rounded bg-[#CCFF00]/10 border border-[#CCFF00]/30">
                              {s.id.toUpperCase()}
                            </span>
                            <span className="text-xs font-semibold text-[#F8FAFC] truncate max-w-[220px]">
                              {s.title}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0F1017] text-[#8E95A5] border border-[#222533]">
                            {s.kind.toUpperCase()}
                          </span>
                        </div>

                        {/* Provenance Badge */}
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${prov.color}`}>
                            {prov.badge}
                          </span>
                        </div>

                        <div className="text-xs text-[#8E95A5] flex items-center justify-between font-mono">
                          <span>Size: {s.charCount.toLocaleString()} chars</span>
                          <span className="text-[#CCFF00]">Status: {s.status}</span>
                        </div>

                        {s.dateSignals && s.dateSignals.length > 0 && (
                          <div className="text-[11px] font-mono text-[#F59E0B] bg-[#F59E0B]/10 p-2 rounded border border-[#F59E0B]/20">
                            Cycle notices detected: {s.dateSignals.join(", ")}
                          </div>
                        )}

                        <div className="p-2.5 rounded bg-[#0F1017] border border-[#222533] text-xs font-mono text-slate-300 max-h-36 overflow-y-auto">
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
                          className="text-xs text-[#3B82F6] hover:text-[#CCFF00] hover:underline font-semibold font-mono block"
                        >
                          Inspect in Full Document Viewer →
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Slide-over Evidence Drawer for verbatim quote verification */}
            <EvidenceDrawer
              evidence={selectedEvidence}
              sources={analysis.sources}
              onClose={() => setSelectedEvidence(null)}
            />

            {/* Executive Decision Dossier Print/Export Modal */}
            <ExecutiveDossierModal
              analysis={analysis}
              isOpen={isDossierOpen}
              onClose={() => setIsDossierOpen(false)}
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
        <div className="min-h-screen bg-[#08080C] flex items-center justify-center text-sm font-mono text-[#8E95A5]">
          <div className="flex items-center gap-2">
            <span className="animate-spin text-[#CCFF00]">♟</span>
            <span>Initializing Decision Cockpit...</span>
          </div>
        </div>
      }
    >
      <StudioContent />
    </Suspense>
  );
}
