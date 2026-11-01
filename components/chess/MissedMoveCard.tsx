import React from "react";
import type { MissedMove } from "@/schemas";
import { EvidenceStatus } from "../common/EvidenceStatus";

interface MissedMoveCardProps {
  missedMove: MissedMove;
}

export function MissedMoveCard({ missedMove }: MissedMoveCardProps) {
  const isMissing = missedMove.kind === "missing";

  return (
    <div className="bg-surface rounded-xl p-5 border border-border hover:border-border/80 transition-all shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            ?! Missed Move
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded font-semibold ${
              isMissing
                ? "bg-slate-800 text-slate-300 border border-slate-700"
                : "bg-amber-950/60 text-amber-400 border border-amber-700/50"
            }`}
          >
            {isMissing ? "Not Found (Dark Spot)" : "Mentioned Only"}
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
              missedMove.importance === "high"
                ? "bg-bad/20 text-bad"
                : "bg-warn/20 text-warn"
            }`}
          >
            {missedMove.importance} priority
          </span>
        </div>
        <EvidenceStatus label={missedMove.label} />
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-text">
          {missedMove.description}
        </h4>
        <p className="text-xs text-muted/80 font-mono">
          Scope: {missedMove.scope}
        </p>
      </div>

      <div className="p-2.5 rounded bg-surface-2 text-xs text-slate-300 border border-border/40">
        <span className="font-semibold text-muted text-[11px] block uppercase tracking-wider mb-0.5">
          Why it matters:
        </span>
        {missedMove.whyItMatters}
      </div>
    </div>
  );
}

