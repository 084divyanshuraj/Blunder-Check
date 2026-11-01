"use client";

import React from "react";
import type { Blunder, EvidenceRef, SourceRecord } from "@/schemas";
import { EvidenceStatus } from "../common/EvidenceStatus";

interface BlunderCardProps {
  blunder: Blunder;
  sources: SourceRecord[];
  onSelectEvidence: (evidence: EvidenceRef, sourceTitle: string) => void;
}

export function BlunderCard({
  blunder,
  sources,
  onSelectEvidence,
}: BlunderCardProps) {
  const isConflict = blunder.type === "conflict";
  const sourceMap = new Map(sources.map((s) => [s.id, s]));

  return (
    <div className="bg-[#18263B] rounded-xl p-5 border border-[#EF4444]/40 hover:border-[#EF4444]/70 transition-all shadow-md space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40">
            ?? Blunder
          </span>
          <span className="text-xs uppercase tracking-wider font-semibold text-[#94A3B8]">
            {isConflict ? "Conflicting Claims" : "Outdated Information"}
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
              blunder.severity === "high"
                ? "bg-[#EF4444]/20 text-[#EF4444]"
                : "bg-[#F59E0B]/20 text-[#F59E0B]"
            }`}
          >
            {blunder.severity} impact
          </span>
        </div>
        <EvidenceStatus label={blunder.label} />
      </div>

      {/* Description */}
      <p className="text-sm text-[#F8FAFC] leading-relaxed font-medium">
        {blunder.description}
      </p>

      {/* Evidence Side-by-Side Grid */}
      <div className="pt-2 border-t border-[#263449]">
        <div className="text-[11px] font-mono text-[#94A3B8] uppercase tracking-wider mb-2 font-bold">
          Source Evidence ({blunder.evidence.length} cited) — Click quote to view in document:
        </div>
        <div
          className={`grid gap-3 ${
            blunder.evidence.length >= 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
          }`}
        >
          {blunder.evidence.map((ev, idx) => {
            const source = sourceMap.get(ev.sourceId);
            const sourceTitle = source?.title || `Source ${ev.sourceId}`;
            const isVerified = ev.verification.status !== "unverified";

            return (
              <div
                key={idx}
                onClick={() => onSelectEvidence(ev, sourceTitle)}
                className="group p-3.5 rounded-lg bg-[#111C2E] hover:bg-[#1F304B] border border-[#263449] hover:border-[#14B8A6]/60 cursor-pointer transition-all space-y-2"
                title="Click to view highlighted quote in original document"
              >
                <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                  <span className="font-semibold text-slate-200 truncate max-w-[200px]">
                    {sourceTitle}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-semibold ${
                      isVerified
                        ? "text-[#14B8A6] bg-[#14B8A6]/15 border border-[#14B8A6]/30"
                        : "text-[#EF4444] bg-[#EF4444]/20 border border-[#EF4444]/40"
                    }`}
                  >
                    <span>{isVerified ? "✓" : "✗"}</span>
                    <span>{isVerified ? "Verified" : "Unverified"}</span>
                  </span>
                </div>

                <blockquote className="font-mono text-xs text-[#5eead4]/95 italic border-l-2 border-[#14B8A6] pl-2.5 line-clamp-3 group-hover:text-white transition-colors">
                  &ldquo;{ev.quote}&rdquo;
                </blockquote>

                <div className="text-[11px] text-[#94A3B8] flex items-center justify-between pt-1">
                  <span className="truncate max-w-[220px]">Claim: {ev.claim}</span>
                  <span className="text-[#38BDF8] group-hover:translate-x-0.5 transition-transform text-[10px] font-semibold">
                    Inspect text →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
