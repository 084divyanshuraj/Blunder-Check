import React from "react";
import type { HangingPiece } from "@/schemas";
import { EvidenceStatus } from "../common/EvidenceStatus";

interface HangingPieceCardProps {
  piece: HangingPiece;
}

export function HangingPieceCard({ piece }: HangingPieceCardProps) {
  return (
    <div className="bg-[#18263B] rounded-xl p-4 border border-[#2563EB]/40 hover:border-[#38BDF8]/60 transition-all flex items-start justify-between gap-3 shadow-md">
      <div className="space-y-1.5 flex-1">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#2563EB]/20 text-[#38BDF8] border border-[#2563EB]/40">
            ◎ Hanging Piece
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
              piece.impact === "high"
                ? "bg-[#EF4444]/20 text-[#EF4444]"
                : "bg-[#F59E0B]/20 text-[#F59E0B]"
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
