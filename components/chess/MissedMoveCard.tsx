import React from "react";
import type { MissedMove } from "@/schemas";
import { EvidenceStatus } from "../common/EvidenceStatus";

interface MissedMoveCardProps {
  missedMove: MissedMove;
}

export function MissedMoveCard({ missedMove }: MissedMoveCardProps) {
  const isMissing = missedMove.kind === "missing";

  return (
    <div className="bg-[#18263B] rounded-xl p-5 border border-[#263449] hover:border-[#38BDF8]/40 transition-all shadow-md space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40">
            ?! Missed Move
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded font-semibold ${
              isMissing
                ? "bg-[#111C2E] text-[#38BDF8] border border-[#263449]"
                : "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30"
            }`}
          >
            {isMissing ? "Not Found (Dark Spot)" : "Mentioned Only"}
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
              missedMove.importance === "high"
                ? "bg-[#EF4444]/20 text-[#EF4444]"
                : "bg-[#F59E0B]/20 text-[#F59E0B]"
            }`}
          >
            {missedMove.importance} priority
          </span>
        </div>
        <EvidenceStatus label={missedMove.label} />
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-[#F8FAFC]">
          {missedMove.description}
        </h4>
        <p className="text-xs text-[#94A3B8] font-mono">
          Scope: {missedMove.scope}
        </p>
      </div>

      <div className="p-3 rounded bg-[#111C2E] text-xs text-slate-300 border border-[#263449]">
        <span className="font-semibold text-[#94A3B8] text-[11px] block uppercase tracking-wider mb-0.5">
          Why it matters:
        </span>
        {missedMove.whyItMatters}
      </div>
    </div>
  );
}
