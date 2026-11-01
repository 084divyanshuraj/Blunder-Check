"use client";

import React, { useState } from "react";
import type { ScoreResult } from "@/schemas";
import { EvidenceStatus } from "../common/EvidenceStatus";

interface EvaluationScoreProps {
  score: ScoreResult;
  evalReasoning: string;
}

export function EvaluationScore({ score, evalReasoning }: EvaluationScoreProps) {
  const [showFactors, setShowFactors] = useState(false);

  const val = score.value;
  const formattedScore = `${val >= 0 ? "+" : ""}${val.toFixed(1)}`;

  let band = "Largely unestablished";
  let bandColor = "text-[#EF4444] border-[#EF4444]/40 bg-[#EF4444]/10";
  if (val >= 3.0) {
    band = "Well established";
    bandColor = "text-[#CCFF00] border-[#CCFF00]/40 bg-[#CCFF00]/10 shadow-xs shadow-[#CCFF00]/10";
  } else if (val >= 0.5) {
    band = "Partly established";
    bandColor = "text-[#60A5FA] border-[#2563EB]/40 bg-[#2563EB]/15";
  } else if (val >= -1.9) {
    band = "Significant gaps";
    bandColor = "text-[#F59E0B] border-[#F59E0B]/40 bg-[#F59E0B]/10";
  }

  return (
    <div className="bg-[#151722] rounded-xl p-6 border border-[#222533] space-y-4 shadow-md">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs uppercase tracking-wider font-mono text-[#8E95A5] font-bold">
              Information Position
            </h2>
            <span className="text-[11px] text-[#646B7D] font-mono">({score.version})</span>
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-4xl font-extrabold font-mono tracking-tight text-[#F8FAFC]">
              {formattedScore}
            </span>
            <span
              className={`px-2.5 py-0.5 text-xs font-semibold font-mono rounded-full border ${bandColor}`}
            >
              {band}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-[#8E95A5] font-mono">Weighted Coverage</div>
          <div className="text-xl font-bold font-mono text-[#F8FAFC]">
            {(score.coverage * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {score.capApplied && (
        <div className="px-3.5 py-2.5 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] text-xs flex items-start gap-2">
          <span className="text-base leading-none">🛡️</span>
          <div>
            <span className="font-semibold">
              Score Cap Applied ({score.capApplied.cap > 0 ? `+${score.capApplied.cap}` : score.capApplied.cap}):
            </span>{" "}
            {score.capApplied.reason}
          </div>
        </div>
      )}

      {/* Narrative AI Reasoning */}
      <div className="bg-[#0F1017] rounded-lg p-3.5 text-sm text-[#F8FAFC]/90 leading-relaxed border border-[#222533] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium font-mono text-[#8E95A5]">AI Summary Assessment</span>
          <EvidenceStatus label="ai_inferred" />
        </div>
        <p className="text-sm text-slate-300">{evalReasoning}</p>
      </div>

      {/* Deterministic Factors Accordion Toggle */}
      <div className="pt-2 border-t border-[#222533]/80">
        <button
          type="button"
          onClick={() => setShowFactors(!showFactors)}
          className="text-xs font-mono text-[#8E95A5] hover:text-[#3B82F6] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>{showFactors ? "▼ Hide mathematical factors" : "▶ Show mathematical factors"}</span>
          <span className="text-[10px] text-[#646B7D]">({score.factors.length} signals)</span>
        </button>

        {showFactors && (
          <div className="mt-3 space-y-2 text-xs font-mono">
            {score.factors.map((f, i) => {
              const isPositive = f.delta > 0;
              const isNeutral = f.delta === 0;
              return (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded bg-[#0F1017] border border-[#222533]"
                >
                  <span className="text-slate-300">{f.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#8E95A5] text-[11px] max-w-[200px] truncate">
                      {f.detail}
                    </span>
                    <span
                      className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                        isPositive
                          ? "text-[#CCFF00] bg-[#CCFF00]/10"
                          : isNeutral
                          ? "text-[#8E95A5] bg-[#151722]"
                          : "text-[#EF4444] bg-[#EF4444]/10"
                      }`}
                    >
                      {isPositive ? `+${f.delta}` : f.delta}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
