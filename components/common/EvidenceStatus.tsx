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
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-[#14B8A6]/15 text-[#14B8A6] border border-[#14B8A6]/40 ${className}`}
          title="Directly verified against source quotation"
        >
          <span className="text-[11px] font-bold">✓</span>
          <span>Sourced</span>
        </span>
      );

    case "ai_inferred":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/40 ${className}`}
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
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-[#1F304B] text-[#94A3B8] border border-[#263449] ${className}`}
          title="Not established by the reviewed sources"
        >
          <span className="text-[11px] font-bold">?</span>
          <span>Unknown</span>
        </span>
      );
  }
}
