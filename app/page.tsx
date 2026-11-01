"use client";

import React, { useState } from "react";
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

// Offline fallback mock data for instantaneous demo resilience
import mockScholarshipAnalysis from "@/public/demo/scholarship/analysis.mock.json";

export default function Home() {
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

  // Load demo case helper
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
        return;
      } catch {
        // Fallback to in-bundle scholarship mock
        setAnalysis(mockScholarshipAnalysis as unknown as Analysis);
        setSources(mockScholarshipAnalysis.sources as unknown as SourceRecord[]);
        setQuestion(mockScholarshipAnalysis.question);
        setGoal(mockScholarshipAnalysis.goal);
        return;
      }
    }

    // Populate sources for live run
    try {
      const metaRes = await fetch(`/demo/${demoKey}/meta.json`);
      const meta = await metaRes.json();

      setQuestion(meta.question);
      setGoal(meta.goal);

      const loadedSources: SourceRecord[] = await Promise.all(
        meta.sources.map(async (s: any) => {
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
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during analysis. Try using the cached demo case."
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

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      {/* Navigation Bar */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-1.5 rounded-lg bg-surface-2 border border-border">
              ♟️
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-text">
                  Blunder Check
                </h1>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-good/20 text-good border border-good/40 uppercase">
                  Engine v1.0
                </span>
              </div>
              <p className="text-[11px] text-muted">
                Chess Analysis for Decision Research &amp; Dark Spot Detection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {analysis && (
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-surface-2 hover:bg-border text-slate-200 border border-border transition-colors cursor-pointer"
              >
                + New Analysis
              </button>
            )}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted hover:text-white transition-colors px-2 py-1"
            >
              Shinchan Hackathon 2026
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {/* Error Notification */}
        {errorMsg && (
          <div className="max-w-4xl mx-auto mb-6 p-4 rounded-xl bg-bad/20 border border-bad/50 text-bad text-xs flex items-center justify-between gap-3">
            <div>
              <span className="font-bold">Analysis Warning:</span> {errorMsg}
            </div>
            <button
              type="button"
              onClick={() => handleLoadDemo("scholarship", true)}
              className="px-3 py-1 rounded bg-bad/30 hover:bg-bad/50 text-white font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              Use Cached Demo
            </button>
          </div>
        )}

        {/* State 1: Loading Move List */}
        {isAnalyzing && <AnalysisLoader currentStage={currentStage} />}

        {/* State 2: Setup Screen */}
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

        {/* State 3: Analysis Dashboard */}
        {!isAnalyzing && analysis && (
          <div className="space-y-6">
            {/* Dashboard Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-surface border border-border">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted uppercase tracking-wider font-bold">
                    Research Topic
                  </span>
                  {analysis.mode === "demo_cached" && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Offline Verified Demo
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-text mt-0.5">
                  {analysis.question}
                </h2>
                <p className="text-xs text-muted">
                  <span className="font-medium text-slate-300">Goal:</span> {analysis.goal}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-2 hover:bg-border text-slate-300 border border-border transition-colors cursor-pointer"
                >
                  Adjust Sources
                </button>
              </div>
            </div>

            {/* Chess Engine Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Left Column: Vertical Eval Bar */}
              <div className="md:col-span-2 lg:col-span-1 flex justify-center sticky top-24">
                <EvaluationBar score={analysis.result.score.value} />
              </div>

              {/* Center Column: Findings & Checklist */}
              <div className="md:col-span-10 lg:col-span-11 space-y-6">
                {/* 1. Score & Factors */}
                <EvaluationScore
                  score={analysis.result.score}
                  evalReasoning={analysis.result.evalReasoning}
                />

                {/* 2. Best Moves (Verify Next) */}
                {analysis.result.verifyNext.length > 0 && (
                  <BestMoveList items={analysis.result.verifyNext} />
                )}

                {/* 3. Blunders (Conflicts & Outdated) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-text flex items-center gap-2">
                      <span>⚠️ Blunders &amp; Inconsistencies</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-bad/20 text-bad font-semibold">
                        {analysis.result.blunders.length}
                      </span>
                    </h3>
                  </div>

                  {analysis.result.blunders.length === 0 ? (
                    <div className="p-4 rounded-xl bg-surface border border-border text-xs text-muted text-center">
                      No blunders or direct contradictions detected across the reviewed sources.
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

                {/* 4. Missed Moves (Dark Spots & Unanswered) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-text flex items-center gap-2">
                      <span>🌑 Missed Moves (Information Dark Spots)</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                        {analysis.result.missedMoves.length}
                      </span>
                    </h3>
                  </div>

                  {analysis.result.missedMoves.length === 0 ? (
                    <div className="p-4 rounded-xl bg-surface border border-border text-xs text-muted text-center">
                      All expected checklist items were adequately covered by the reviewed sources.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analysis.result.missedMoves.map((m) => (
                        <MissedMoveCard key={m.id} missedMove={m} />
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. Hanging Pieces (Unaddressed Risks) */}
                {analysis.result.hangingPieces.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-base font-bold text-text flex items-center gap-2">
                      <span>◎ Hanging Pieces (High-Impact Unknowns)</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-600/20 text-amber-400 font-semibold">
                        {analysis.result.hangingPieces.length}
                      </span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {analysis.result.hangingPieces.map((p) => (
                        <HangingPieceCard key={p.id} piece={p} />
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. Dark Spot Matrix & Coverage Overview */}
                <CoverageOverview
                  coverage={analysis.result.coverage}
                  sources={analysis.sources}
                  claims={analysis.claims}
                  scopeNote={analysis.result.scopeNote}
                  warnings={analysis.result.warnings}
                />
              </div>
            </div>

            {/* Evidence Drawer Modal */}
            <EvidenceDrawer
              evidence={selectedEvidence}
              sources={analysis.sources}
              onClose={() => setSelectedEvidence(null)}
            />
          </div>
        )}
      </main>

      {/* Permanent Mandatory Disclaimer */}
      <DisclaimerFooter />
    </div>
  );
}
