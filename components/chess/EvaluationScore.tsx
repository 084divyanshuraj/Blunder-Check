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
  let bandColor = "text-bad border-bad/30 bg-bad/10";
  if (val >= 3.0) {
    band = "Well established";
    bandColor = "text-good border-good/30 bg-good/10";
  } else if (val >= 0.5) {
    band = "Partly established";
    bandColor = "text-warn border-warn/30 bg-warn/10";
  } else if (val >= -1.9) {
    band = "Significant gaps";
    bandColor = "text-amber-500 border-amber-500/30 bg-amber-500/10";
  }

  return (
    <div className="bg-surface rounded-xl p-6 border border-border space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm uppercase tracking-wider font-mono text-muted">
              Information Position
            </h2>
            <span className="text-[11px] text-muted">({score.version})</span>
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-4xl font-extrabold font-mono tracking-tight text-text">
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
          <div className="text-xs text-muted">Weighted Coverage</div>
          <div className="text-xl font-bold font-mono text-text">
            {(score.coverage * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Cap notification if applicable */}
      {score.capApplied && (
        <div className="px-3 py-2 rounded-lg bg-amber-950/40 border border-amber-700/40 text-amber-300 text-xs flex items-start gap-2">
          <span className="text-base leading-none">🛡️</span>
          <div>
            <span className="font-semibold">Score Cap Applied ({score.capApplied.cap > 0 ? `+${score.capApplied.cap}` : score.capApplied.cap}):</span>{" "}
            {score.capApplied.reason}
          </div>
        </div>
      )}

      {/* Narrative AI reasoning */}
      <div className="bg-surface-2/60 rounded-lg p-3 text-sm text-text/90 leading-relaxed border border-border/50 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted">AI Summary</span>
          <EvidenceStatus label="ai_inferred" />
        </div>
        <p className="text-sm text-slate-200">{evalReasoning}</p>
      </div>

      {/* Expandable factors breakdown */}
      <div>
        <button
          type="button"
          onClick={() => setShowFactors(!showFactors)}
          className="text-xs font-medium text-good hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer focus:outline-none"
        >
          <span>{showFactors ? "▼ Hide calculation details" : "▶ Why this score?"}</span>
        </button>

        {showFactors && (
          <div className="mt-3 p-3 rounded-lg bg-surface-2 border border-border/60 text-xs space-y-2">
            <div className="font-mono text-muted uppercase text-[10px] tracking-wider mb-1">
              Deterministic Scoring Factors
            </div>
            {score.factors.map((f, i) => (
              <div
                key={i}
                className="flex items-start justify-between py-1 border-b border-border/30 last:border-0"
              >
                <div className="space-y-0.5 pr-2">
                  <div className="font-medium text-text">{f.label}</div>
                  <div className="text-muted text-[11px]">{f.detail}</div>
                </div>
                <span
                  className={`font-mono font-bold whitespace-nowrap ${
                    f.delta > 0
                      ? "text-good"
                      : f.delta < 0
                      ? "text-bad"
                      : "text-muted"
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

