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
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold font-mono bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30 shadow-xs ${className}`}
          title="Directly verified against source quotation"
        >
          <span className="text-[11px] font-bold">✓</span>
          <span>Sourced</span>
        </span>
      );

    case "ai_inferred":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold font-mono bg-[#2563EB]/15 text-[#60A5FA] border border-[#2563EB]/40 ${className}`}
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
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold font-mono bg-[#151722] text-[#8E95A5] border border-[#222533] ${className}`}
          title="Not established by the reviewed sources"
        >
          <span className="text-[11px] font-bold">?</span>
          <span>Unknown</span>
        </span>
      );
  }
}
