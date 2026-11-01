import React from "react";
import type { EvidenceLabel } from "@/schemas";

interface EvidenceStatusProps {
  label: EvidenceLabel;
  className?: string;
}

export function EvidenceStatus({ label, className = "" }: EvidenceStatusProps) {
  switch (label) {
    case "sourced":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-700/50 ${className}`}
          title="Directly verified against source quotation"
        >
          <span className="text-[11px] font-bold">✓</span>
          <span>Sourced</span>
        </span>
      );

    case "ai_inferred":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-950/60 text-amber-300 border border-amber-700/50 ${className}`}
          title="Potential signal inferred by AI from reviewed material"
        >
          <span className="text-[11px]">✦</span>
          <span>AI-inferred</span>
        </span>
      );

    case "unknown":
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-600/50 ${className}`}
          title="Not established by the reviewed sources"
        >
          <span className="text-[11px] font-bold">?</span>
          <span>Unknown</span>
        </span>
      );
  }
}

