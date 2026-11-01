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
    <div className="max-w-xl mx-auto my-12 p-8 rounded-2xl bg-[#151722] border border-[#222533] shadow-2xl space-y-6 text-center animate-in fade-in duration-300">
      <div className="space-y-2">
        <div className="inline-flex p-3 rounded-xl bg-[#0F1017] border border-[#222533] text-2xl text-[#CCFF00]">
          ♟️
        </div>
        <h3 className="text-lg font-bold text-[#F8FAFC]">
          Chess Engine Analyzing Position
        </h3>
        <p className="text-xs text-[#8E95A5]">
          Evaluating evidence completeness, cross-checking claims, and calculating Information Position...
        </p>
      </div>

      {/* PGN Move List Display */}
      <div className="bg-[#0F1017] rounded-xl p-5 border border-[#222533] font-mono text-xs text-left space-y-3">
        <div className="text-[10px] uppercase tracking-wider text-[#8E95A5] font-bold border-b border-[#222533] pb-2">
          PGN Engine Notation / Progress
        </div>

        {stages.map((s) => {
          const status = getStageStatus(s.id);
          const isCurrent = currentStage?.id === s.id;

          let icon = <span className="text-[#8E95A5]/40">○</span>;
          let textColor = "text-[#8E95A5]/60";

          if (status === "done") {
            icon = <span className="text-[#CCFF00] font-bold">✓</span>;
            textColor = "text-[#F8FAFC]";
          } else if (status === "running") {
            icon = <span className="text-[#3B82F6] animate-spin inline-block">⏳</span>;
            textColor = "text-[#3B82F6] font-semibold";
          } else if (status === "error") {
            icon = <span className="text-[#EF4444] font-bold">✗</span>;
            textColor = "text-[#EF4444]";
          }

          return (
            <div
              key={s.id}
              className={`flex items-center justify-between py-1.5 px-2 rounded transition-colors ${
                isCurrent ? "bg-[#1C1F2E]" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[#8E95A5] text-[11px] w-5">{s.num}</span>
                <span className={textColor}>{s.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono">{icon}</span>
                <span className="text-[10px] uppercase tracking-wider text-[#8E95A5]">
                  {status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[11px] text-[#8E95A5] font-mono">
        Deterministic validation guaranteed by substring match &amp; TypeScript scoring engine.
      </div>
    </div>
  );
}
