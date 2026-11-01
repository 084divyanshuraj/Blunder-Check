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
  let bandColor = "text-[#EF4444] border-[#EF4444]/40 bg-[#EF4444]/15";
  if (val >= 3.0) {
    band = "Well established";
    bandColor = "text-[#14B8A6] border-[#14B8A6]/40 bg-[#14B8A6]/15";
  } else if (val >= 0.5) {
    band = "Partly established";
    bandColor = "text-[#38BDF8] border-[#38BDF8]/40 bg-[#2563EB]/15";
  } else if (val >= -1.9) {
    band = "Significant gaps";
    bandColor = "text-[#F59E0B] border-[#F59E0B]/40 bg-[#F59E0B]/15";
  }

  return (
    <div className="bg-[#18263B] rounded-xl p-6 border border-[#263449] space-y-4 shadow-md">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs uppercase tracking-wider font-mono text-[#94A3B8] font-bold">
              Information Position
            </h2>
            <span className="text-[11px] text-[#94A3B8]">({score.version})</span>
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-4xl font-extrabold font-mono tracking-tight text-[#F8FAFC]">
              {formattedScore}
            </span>
            <span
              className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${bandColor}`}
            >
              {band}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-[#94A3B8]">Weighted Coverage</div>
          <div className="text-xl font-bold font-mono text-[#F8FAFC]">
            {(score.coverage * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {score.capApplied && (
        <div className="px-3.5 py-2.5 rounded-lg bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#F59E0B] text-xs flex items-start gap-2">
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
      <div className="bg-[#111C2E] rounded-lg p-3.5 text-sm text-[#F8FAFC]/90 leading-relaxed border border-[#263449] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#94A3B8]">AI Summary Assessment</span>
          <EvidenceStatus label="ai_inferred" />
        </div>
        <p className="text-sm text-slate-200">{evalReasoning}</p>
      </div>

      {/* Factors Breakdown */}
      <div>
        <button
          type="button"
          onClick={() => setShowFactors(!showFactors)}
          className="text-xs font-medium text-[#38BDF8] hover:text-[#14B8A6] transition-colors flex items-center gap-1 cursor-pointer focus:outline-none"
        >
          <span>{showFactors ? "▼ Hide mathematical factors" : "▶ Why this score?"}</span>
        </button>

        {showFactors && (
          <div className="mt-3 p-3.5 rounded-lg bg-[#111C2E] border border-[#263449] text-xs space-y-2">
            <div className="font-mono text-[#94A3B8] uppercase text-[10px] tracking-wider mb-1 font-bold">
              Deterministic Scoring Breakdown
            </div>
            {score.factors.map((f, i) => (
              <div
                key={i}
                className="flex items-start justify-between py-1.5 border-b border-[#263449]/60 last:border-0"
              >
                <div className="space-y-0.5 pr-2">
                  <div className="font-medium text-[#F8FAFC]">{f.label}</div>
                  <div className="text-[#94A3B8] text-[11px]">{f.detail}</div>
                </div>
                <span
                  className={`font-mono font-bold whitespace-nowrap ${
                    f.delta > 0
                      ? "text-[#14B8A6]"
                      : f.delta < 0
                      ? "text-[#EF4444]"
                      : "text-[#94A3B8]"
                  }`}
                >
                  {f.delta > 0 ? `+${f.delta.toFixed(1)}` : f.delta.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
