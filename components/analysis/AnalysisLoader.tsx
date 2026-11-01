"use client";

import React from "react";
import type { PipelineStage } from "@/types";

interface AnalysisLoaderProps {
  currentStage: PipelineStage | null;
}

export function AnalysisLoader({ currentStage }: AnalysisLoaderProps) {
  const stages = [
    { id: "checklist", num: "1.", label: "Planning coverage checklist" },
    { id: "extract", num: "2.", label: "Extracting claims & verifying quotes" },
    { id: "analyze", num: "3.", label: "Analysing gaps, conflicts & risks" },
    { id: "finalize", num: "4.", label: "Computing Information Position" },
  ];

  const getStageStatus = (stageId: string) => {
    if (!currentStage) return "pending";
    const order = ["ingest", "checklist", "extract", "analyze", "finalize"];
    const currentIdx = order.indexOf(currentStage.id);
    const thisIdx = order.indexOf(stageId);

    if (currentIdx > thisIdx) return "done";
    if (currentIdx === thisIdx) {
      return currentStage.status;
    }
    return "pending";
  };

  return (
    <div className="max-w-xl mx-auto my-12 p-8 rounded-2xl bg-surface border border-border shadow-2xl space-y-6 text-center animate-in fade-in duration-300">
      <div className="space-y-2">
        <div className="inline-flex p-3 rounded-xl bg-surface-2 border border-border text-2xl">
          ♟️
        </div>
        <h3 className="text-lg font-bold text-text">
          Chess Engine Analyzing Position
        </h3>
        <p className="text-xs text-muted">
          Evaluating evidence completeness, cross-checking claims, and calculating Information Position...
        </p>
      </div>

      {/* PGN Move List Display */}
      <div className="bg-surface-2/70 rounded-xl p-5 border border-border font-mono text-xs text-left space-y-3">
        <div className="text-[10px] uppercase tracking-wider text-muted font-bold border-b border-border/50 pb-2">
          PGN Engine Notation / Progress
        </div>

        {stages.map((s) => {
          const status = getStageStatus(s.id);
          const isCurrent = currentStage?.id === s.id;

          let icon = <span className="text-muted/40">○</span>;
          let textColor = "text-muted/60";

          if (status === "done") {
            icon = <span className="text-good font-bold">✓</span>;
            textColor = "text-slate-200";
          } else if (status === "running") {
            icon = <span className="text-warn animate-spin inline-block">⏳</span>;
            textColor = "text-amber-300 font-semibold";
          } else if (status === "error") {
            icon = <span className="text-bad font-bold">✗</span>;
            textColor = "text-bad";
          }

          return (
            <div
              key={s.id}
              className={`flex items-center justify-between py-1.5 px-2 rounded transition-colors ${
                isCurrent ? "bg-surface-2" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-muted text-[11px] w-5">{s.num}</span>
                <span className={textColor}>{s.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {isCurrent && currentStage?.detail && (
                  <span className="text-[11px] text-muted">{currentStage.detail}</span>
                )}
                {icon}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[11px] text-muted animate-pulse">
        Comparing quotes programmatically against original text...
      </div>
    </div>
  );
}

