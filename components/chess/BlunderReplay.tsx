"use client";

import React, { useState, useMemo } from "react";
import type { Analysis, CoverageStatus, ScoreResult } from "@/schemas";
import { computeScore } from "@/lib/scoring";
import { EvaluationBar } from "./EvaluationBar";
import { sound } from "@/lib/sound";

interface BlunderReplayProps {
  analysis: Analysis;
}

export function BlunderReplay({ analysis }: BlunderReplayProps) {
  // Sets of checklist item IDs or blunder IDs that the user has "simulated resolved"
  const [resolvedBlunderIds, setResolvedBlunderIds] = useState<Set<string>>(new Set());
  const [resolvedDarkSpotIds, setResolvedDarkSpotIds] = useState<Set<string>>(new Set());
  const [resolvedOutdated, setResolvedOutdated] = useState(false);

  // Extract checklist items from coverage
  const checklist = useMemo(() => {
    return analysis.result.coverage.map((c) => ({
      id: c.id,
      item: c.item,
      importance: c.importance,
    }));
  }, [analysis]);

  // Compute baseline statuses
  const baselineStatuses = useMemo(() => {
    const map: Record<string, CoverageStatus> = {};
    for (const c of analysis.result.coverage) {
      map[c.id] = c.status;
    }
    return map;
  }, [analysis]);

  // Baseline outdated count
  const baselineOutdatedCount = useMemo(() => {
    return analysis.result.blunders.filter((b) => b.type === "outdated").length;
  }, [analysis]);

  // Simulated score computation
  const simulatedScore: ScoreResult = useMemo(() => {
    const statuses: Record<string, CoverageStatus> = { ...baselineStatuses };

    // When dark spots are resolved, promote from missing/unanswered to "covered"
    for (const id of resolvedDarkSpotIds) {
      statuses[id] = "covered";
    }

    // When a blunder is resolved, if it affected a checklist item, make it covered
    for (const b of analysis.result.blunders) {
      if (resolvedBlunderIds.has(b.id)) {
        // Find if this blunder is related to any coverage item
        for (const item of checklist) {
          if (b.description.toLowerCase().includes(item.item.toLowerCase().slice(0, 15))) {
            statuses[item.id] = "covered";
          }
        }
      }
    }

    const outdatedCount = resolvedOutdated
      ? 0
      : Math.max(
          0,
          baselineOutdatedCount -
            analysis.result.blunders.filter(
              (b) => b.type === "outdated" && resolvedBlunderIds.has(b.id)
            ).length
        );

    return computeScore({
      checklist,
      statuses,
      outdatedCount,
      verifiedClaimCount: analysis.claims.length + resolvedDarkSpotIds.size,
    });
  }, [
    baselineStatuses,
    baselineOutdatedCount,
    checklist,
    resolvedBlunderIds,
    resolvedDarkSpotIds,
    resolvedOutdated,
    analysis,
  ]);

  const originalScoreVal = analysis.result.score.value;
  const simScoreVal = simulatedScore.value;
  const delta = Math.round((simScoreVal - originalScoreVal) * 10) / 10;
  const hasChanges =
    resolvedBlunderIds.size > 0 || resolvedDarkSpotIds.size > 0 || resolvedOutdated;

  const toggleBlunder = (id: string) => {
    sound.playEvalRise();
    setResolvedBlunderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleDarkSpot = (id: string) => {
    sound.playEvalRise();
    setResolvedDarkSpotIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resetAll = () => {
    setResolvedBlunderIds(new Set());
    setResolvedDarkSpotIds(new Set());
    setResolvedOutdated(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Intro Header */}
      <div className="p-5 rounded-2xl bg-[#151722] border border-[#2563EB]/40 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30 shadow-xs">
              ♟ Blunder Replay Simulator
            </span>
            <span className="text-xs text-[#8E95A5] font-mono">
              Interactive Position Repair
            </span>
          </div>
          <h3 className="text-lg font-bold text-[#F8FAFC]">
            Simulate Fixing Blunders &amp; Closing Information Gaps
          </h3>
          <p className="text-xs text-[#8E95A5] max-w-2xl leading-relaxed">
            In chess analysis, you don&apos;t just observe a blunder—you test what happens when you fix it.
            Simulate resolving conflicting claims or verifying dark spots to see how your Information Position recovers in real time.
          </p>
        </div>

        {hasChanges && (
          <button
            type="button"
            onClick={resetAll}
            className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold bg-[#0F1017] hover:bg-[#1C1F2E] text-[#8E95A5] hover:text-[#F8FAFC] border border-[#222533] transition-colors cursor-pointer"
          >
            ↺ Reset Simulation
          </button>
        )}
      </div>

      {/* Dynamic Comparison Scoreboard */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Left: Interactive Score Delta Cockpit */}
        <div className="md:col-span-8 p-6 rounded-2xl bg-[#151722] border border-[#222533] shadow-lg flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-[#222533] pb-3">
            <span className="text-xs uppercase font-mono tracking-wider text-[#8E95A5] font-bold">
              Position Recovery Engine
            </span>
            <span className="text-xs font-mono text-[#3B82F6]">
              {resolvedBlunderIds.size + resolvedDarkSpotIds.size + (resolvedOutdated ? 1 : 0)}{" "}
              Simulated Actions Active
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center items-center py-2">
            {/* Baseline */}
            <div className="p-3 rounded-xl bg-[#0F1017] border border-[#222533] space-y-1">
              <span className="text-[10px] font-mono text-[#8E95A5] uppercase">
                Original Audit
              </span>
              <div className="text-2xl font-black font-mono text-[#F8FAFC]">
                {originalScoreVal >= 0 ? "+" : ""}
                {originalScoreVal.toFixed(1)}
              </div>
              <span className="text-[10px] text-[#8E95A5] font-mono">
                {(analysis.result.score.coverage * 100).toFixed(0)}% Coverage
              </span>
            </div>

            {/* Shift Arrow / Delta */}
            <div className="space-y-1">
              <span className="text-xl font-bold text-[#3B82F6]">→</span>
              <div
                className={`text-sm font-mono font-extrabold px-2 py-0.5 rounded-full inline-block ${
                  delta > 0
                    ? "bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30 shadow-xs"
                    : "bg-[#0F1017] text-[#8E95A5] border border-[#222533]"
                }`}
              >
                {delta > 0 ? `▲ +${delta.toFixed(1)} Gain` : "0.0 Delta"}
              </div>
              <div className="text-[10px] text-[#8E95A5] font-mono">
                {delta > 0 ? "Position Improved" : "Baseline State"}
              </div>
            </div>

            {/* Simulated Score */}
            <div className="p-3 rounded-xl bg-[#0F1017] border border-[#CCFF00]/30 space-y-1 shadow-sm">
              <span className="text-[10px] font-mono text-[#CCFF00] uppercase font-bold">
                Simulated Position
              </span>
              <div className="text-3xl font-black font-mono text-[#CCFF00]">
                {simScoreVal >= 0 ? "+" : ""}
                {simScoreVal.toFixed(1)}
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#CCFF00]/10 text-[#CCFF00] font-semibold inline-block">
                {simScoreVal >= 3.0
                  ? "Well Established"
                  : simScoreVal >= 0.5
                  ? "Partly Established"
                  : "Significant Gaps"}
              </span>
            </div>
          </div>

          {/* Real-time Math Feedback */}
          <div className="p-3.5 rounded-xl bg-[#0F1017] border border-[#222533] text-xs font-mono space-y-1.5">
            <div className="text-slate-300">
              <span className="text-[#3B82F6] font-bold">Mathematical Recompute:</span>{" "}
              {simulatedScore.capApplied ? (
                <span className="text-[#F59E0B]">
                  🛡️ Cap applied ({simulatedScore.capApplied.cap > 0 ? `+${simulatedScore.capApplied.cap}` : simulatedScore.capApplied.cap}): {simulatedScore.capApplied.reason}
                </span>
              ) : (
                <span className="text-[#CCFF00]">
                  ✓ All caps lifted. Score is unconstrained by missing high-priority items.
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#8E95A5]">
              Simulated Coverage: {(simulatedScore.coverage * 100).toFixed(1)}% (was{" "}
              {(analysis.result.score.coverage * 100).toFixed(1)}%)
            </div>
          </div>
        </div>

        {/* Right: Live Simulated Eval Bar */}
        <div className="md:col-span-4 p-6 rounded-2xl bg-[#151722] border border-[#222533] shadow-lg flex flex-col items-center justify-center space-y-3">
          <span className="text-xs font-mono uppercase tracking-wider text-[#8E95A5] font-bold">
            Simulated Eval Bar
          </span>
          <EvaluationBar score={simScoreVal} />
          <span className="text-[11px] font-mono text-[#CCFF00] text-center font-bold">
            {simScoreVal >= 3.0
              ? "Position Ready to Act"
              : simScoreVal >= 0.5
              ? "Defensible Position"
              : "High Blunder Risk"}
          </span>
        </div>
      </div>

      {/* Interactive Repair Controls */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold font-mono text-[#F8FAFC] flex items-center gap-2">
          <span>🛠️ Interactive Repair Actions (Click to toggle simulated resolution):</span>
        </h4>

        {/* Section 1: Blunders */}
        {analysis.result.blunders.length > 0 && (
          <div className="space-y-3">
            <span className="text-xs font-mono text-[#EF4444] uppercase tracking-wider font-bold">
              Blunders &amp; Contradictions ({analysis.result.blunders.length})
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysis.result.blunders.map((b) => {
                const isResolved = resolvedBlunderIds.has(b.id);
                return (
                  <div
                    key={b.id}
                    onClick={() => toggleBlunder(b.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 select-none ${
                      isResolved
                        ? "bg-[#CCFF00]/5 border-[#CCFF00]/40 shadow-sm"
                        : "bg-[#151722] border-[#EF4444]/35 hover:border-[#EF4444]/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#EF4444]">
                        ?? {b.type === "conflict" ? "Claim Conflict" : "Outdated Notice"}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          isResolved
                            ? "bg-[#CCFF00]/20 text-[#CCFF00] border border-[#CCFF00]/40"
                            : "bg-[#0F1017] text-[#8E95A5] border border-[#222533]"
                        }`}
                      >
                        {isResolved ? "✓ Resolved in Sim" : "Click to Fix"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 line-clamp-2">
                      {b.description}
                    </p>

                    <div className="text-[11px] text-[#3B82F6] font-mono pt-1">
                      {isResolved
                        ? "Action: Primary official authority confirmed & discrepancies dismissed"
                        : "Action: Choose primary source to eliminate contradiction →"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 2: Dark Spots (Missed Moves) */}
        {analysis.result.missedMoves.length > 0 && (
          <div className="space-y-3 pt-2">
            <span className="text-xs font-mono text-[#F59E0B] uppercase tracking-wider font-bold">
              Information Dark Spots ({analysis.result.missedMoves.length})
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysis.result.missedMoves.map((m) => {
                const isResolved = resolvedDarkSpotIds.has(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => toggleDarkSpot(m.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 select-none ${
                      isResolved
                        ? "bg-[#CCFF00]/5 border-[#CCFF00]/40 shadow-sm"
                        : "bg-[#151722] border-[#F59E0B]/35 hover:border-[#F59E0B]/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#F59E0B]">
                        ?! Dark Spot ({m.importance} priority)
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          isResolved
                            ? "bg-[#CCFF00]/20 text-[#CCFF00] border border-[#CCFF00]/40"
                            : "bg-[#0F1017] text-[#8E95A5] border border-[#222533]"
                        }`}
                      >
                        {isResolved ? "✓ Verified in Sim" : "Click to Verify"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 line-clamp-2">
                      {m.description}
                    </p>

                    <div className="text-[11px] text-[#3B82F6] font-mono pt-1">
                      {isResolved
                        ? "Action: Acquired official documentation for missing terms"
                        : "Action: Mark requirement verified from external office →"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

