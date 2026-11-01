import React from "react";
import type { ChecklistCoverage, SourceRecord, VerifiedClaim } from "@/schemas";
import { EvidenceStatus } from "../common/EvidenceStatus";

interface CoverageOverviewProps {
  coverage: ChecklistCoverage[];
  sources: SourceRecord[];
  claims: VerifiedClaim[];
  scopeNote: string;
  warnings: string[];
}

export function CoverageOverview({
  coverage,
  sources,
  claims,
  scopeNote,
  warnings,
}: CoverageOverviewProps) {
  // Map checklistId -> Set of sourceIds with claims
  const sourcesByItem = new Map<string, Set<string>>();
  for (const c of claims) {
    if (c.checklistId && c.verification.status !== "unverified") {
      if (!sourcesByItem.has(c.checklistId)) {
        sourcesByItem.set(c.checklistId, new Set());
      }
      sourcesByItem.get(c.checklistId)!.add(c.sourceId);
    }
  }

  const unverifiedQuoteCount = claims.filter(
    (c) => c.verification.status === "unverified"
  ).length;

  return (
    <div className="bg-surface rounded-xl p-6 border border-border shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-text">
            Coverage Analysis &amp; Information Dark Spots
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Checklist of decision requirements evaluated across all reviewed sources.
          </p>
        </div>
        <EvidenceStatus label="sourced" />
      </div>

      {/* Dark Spot Matrix Table */}
      <div className="overflow-x-auto rounded-lg border border-border/70">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-2 text-muted uppercase font-mono text-[10px] tracking-wider border-b border-border/70">
            <tr>
              <th className="py-2.5 px-3">Information Need</th>
              <th className="py-2.5 px-2 text-center">Priority</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Sources Present</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {coverage.map((row) => {
              const presentSources = sourcesByItem.get(row.id) || new Set();
              const isDarkSpot = row.status === "missing";

              let statusBadge = (
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                  Covered
                </span>
              );

              if (row.status === "conflicted") {
                statusBadge = (
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-bad/20 text-bad border border-bad/30">
                    Conflicted
                  </span>
                );
              } else if (row.status === "unanswered") {
                statusBadge = (
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-warn/20 text-warn border border-warn/30">
                    Unanswered
                  </span>
                );
              } else if (row.status === "missing") {
                statusBadge = (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-600 animate-pulse">
                    Dark Spot (Missing)
                  </span>
                );
              }

              return (
                <tr
                  key={row.id}
                  className={`hover:bg-surface-2/40 transition-colors ${
                    isDarkSpot ? "bg-red-950/10" : ""
                  }`}
                >
                  <td className="py-3 px-3 font-medium text-slate-200">
                    <span className="font-mono text-muted mr-2 text-[11px]">{row.id}</span>
                    {row.item}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                        row.importance === "high"
                          ? "bg-bad/20 text-bad"
                          : row.importance === "medium"
                          ? "bg-warn/20 text-warn"
                          : "bg-slate-800 text-muted"
                      }`}
                    >
                      {row.importance}
                    </span>
                  </td>
                  <td className="py-3 px-3">{statusBadge}</td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {sources.map((s) => {
                        const hasClaim = presentSources.has(s.id);
                        return (
                          <span
                            key={s.id}
                            title={`${s.title}: ${hasClaim ? "Claim present" : "No coverage"}`}
                            className={`inline-block h-2.5 w-2.5 rounded-full ${
                              hasClaim ? "bg-good" : "bg-slate-700/60"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Scope note, rejected quotes, and warnings */}
      <div className="p-3.5 rounded-lg bg-surface-2/50 border border-border/50 text-xs space-y-2">
        <div className="text-slate-300 font-mono text-[11px]">
          🔍 <span className="font-semibold text-muted">Scope:</span> {scopeNote}
        </div>

        {unverifiedQuoteCount > 0 && (
          <div className="text-amber-300 text-[11px] flex items-center gap-1.5">
            <span>🛡️</span>
            <span>
              {unverifiedQuoteCount} extracted quote(s) did not match verbatim source text and were programmatically excluded from scoring.
            </span>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="space-y-1 pt-1 border-t border-border/40">
            <span className="text-[10px] uppercase font-mono text-muted tracking-wider">
              Verification Notes &amp; Warnings:
            </span>
            {warnings.map((w, i) => (
              <p key={i} className="text-muted text-[11px]">
                • {w}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

