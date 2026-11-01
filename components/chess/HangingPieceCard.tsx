import React from "react";
import type { HangingPiece } from "@/schemas";
import { EvidenceStatus } from "../common/EvidenceStatus";

interface HangingPieceCardProps {
  piece: HangingPiece;
}

export function HangingPieceCard({ piece }: HangingPieceCardProps) {
  return (
    <div className="bg-surface rounded-xl p-4 border border-amber-600/30 hover:border-amber-600/60 transition-all flex items-start justify-between gap-3 shadow-sm">
      <div className="space-y-1.5 flex-1">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            ◎ Hanging Piece
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
              piece.impact === "high"
                ? "bg-bad/20 text-bad"
                : "bg-warn/20 text-warn"
            }`}
          >
            {piece.impact} risk
          </span>
        </div>
        <p className="text-sm font-medium text-slate-200 leading-snug">
          {piece.description}
        </p>
      </div>
      <EvidenceStatus label={piece.label} />
    </div>
  );
}

