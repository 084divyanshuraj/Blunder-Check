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
    <div className="bg-surface rounded-xl p-5 border border-bad/30 hover:border-bad/60 transition-all shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-bad/20 text-bad border border-bad/40">
            ?? Blunder
          </span>
          <span className="text-xs uppercase tracking-wider font-semibold text-muted">
            {isConflict ? "Conflicting Claims" : "Outdated Information"}
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
              blunder.severity === "high"
                ? "bg-bad/20 text-bad"
                : "bg-warn/20 text-warn"
            }`}
          >
            {blunder.severity} impact
          </span>
        </div>
        <EvidenceStatus label={blunder.label} />
      </div>

      {/* Description */}
      <p className="text-sm text-text leading-relaxed font-medium">
        {blunder.description}
      </p>

      {/* Evidence Side-by-Side Grid */}
      <div className="pt-2 border-t border-border/40">
        <div className="text-[11px] font-mono text-muted uppercase tracking-wider mb-2">
          Source Evidence ({blunder.evidence.length} cited) — Click quote to view in context:
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
                className="group p-3 rounded-lg bg-surface-2/70 hover:bg-surface-2 border border-border hover:border-amber-500/50 cursor-pointer transition-all space-y-2"
                title="Click to view highlighted quote in original document"
              >
                <div className="flex items-center justify-between text-xs text-muted">
                  <span className="font-semibold text-slate-300 truncate max-w-[200px]">
                    {sourceTitle}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.2 rounded font-medium ${
                      isVerified
                        ? "text-emerald-400 bg-emerald-950/40"
                        : "text-bad bg-bad/20"
                    }`}
                  >
                    <span>{isVerified ? "✓" : "✗"}</span>
                    <span>{isVerified ? "Verified" : "Unverified"}</span>
                  </span>
                </div>

                <blockquote className="font-mono text-xs text-amber-200/90 italic border-l-2 border-amber-500/60 pl-2.5 line-clamp-3 group-hover:text-amber-100 transition-colors">
                  &ldquo;{ev.quote}&rdquo;
                </blockquote>

                <div className="text-[11px] text-muted flex items-center justify-between pt-1">
                  <span>Claim: {ev.claim}</span>
                  <span className="text-good group-hover:translate-x-0.5 transition-transform text-[10px]">
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

