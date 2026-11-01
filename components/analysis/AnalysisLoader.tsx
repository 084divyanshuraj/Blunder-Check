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
    <div className="max-w-xl mx-auto my-12 p-8 rounded-2xl bg-[#18263B] border border-[#263449] shadow-2xl space-y-6 text-center animate-in fade-in duration-300">
      <div className="space-y-2">
        <div className="inline-flex p-3 rounded-xl bg-[#111C2E] border border-[#263449] text-2xl text-[#14B8A6]">
          ♟️
        </div>
        <h3 className="text-lg font-bold text-[#F8FAFC]">
          Chess Engine Analyzing Position
        </h3>
        <p className="text-xs text-[#94A3B8]">
          Evaluating evidence completeness, cross-checking claims, and calculating Information Position...
        </p>
      </div>

      {/* PGN Move List Display */}
      <div className="bg-[#111C2E] rounded-xl p-5 border border-[#263449] font-mono text-xs text-left space-y-3">
        <div className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-bold border-b border-[#263449] pb-2">
          PGN Engine Notation / Progress
        </div>

        {stages.map((s) => {
          const status = getStageStatus(s.id);
          const isCurrent = currentStage?.id === s.id;

          let icon = <span className="text-[#94A3B8]/40">○</span>;
          let textColor = "text-[#94A3B8]/60";

          if (status === "done") {
            icon = <span className="text-[#14B8A6] font-bold">✓</span>;
            textColor = "text-[#F8FAFC]";
          } else if (status === "running") {
            icon = <span className="text-[#38BDF8] animate-spin inline-block">⏳</span>;
            textColor = "text-[#38BDF8] font-semibold";
          } else if (status === "error") {
            icon = <span className="text-[#EF4444] font-bold">✗</span>;
            textColor = "text-[#EF4444]";
          }

          return (
            <div
              key={s.id}
              className={`flex items-center justify-between py-1.5 px-2 rounded transition-colors ${
                isCurrent ? "bg-[#1F304B]" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[#94A3B8] text-[11px] w-5">{s.num}</span>
                <span className={textColor}>{s.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {isCurrent && currentStage?.detail && (
                  <span className="text-[11px] text-[#94A3B8]">{currentStage.detail}</span>
                )}
                {icon}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[11px] text-[#94A3B8] animate-pulse">
        Comparing quotes programmatically against original text...
      </div>
    </div>
  );
}
