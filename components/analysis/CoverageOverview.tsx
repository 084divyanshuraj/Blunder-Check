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
    <div className="bg-[#151722] rounded-xl p-6 border border-[#222533] shadow-lg space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-[#F8FAFC]">
            Coverage Analysis &amp; Information Dark Spots
          </h3>
          <p className="text-xs text-[#8E95A5] mt-0.5">
            Checklist of decision requirements evaluated across all reviewed sources.
          </p>
        </div>
        <EvidenceStatus label="sourced" />
      </div>

      {/* Dark Spot Matrix Table */}
      <div className="overflow-x-auto rounded-lg border border-[#222533]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0F1017] text-[#8E95A5] uppercase font-mono text-[10px] tracking-wider border-b border-[#222533]">
            <tr>
              <th className="py-3 px-3.5">Information Need</th>
              <th className="py-3 px-2 text-center">Priority</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-right">Sources Present</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222533]/80">
            {coverage.map((row) => {
              const presentSources = sourcesByItem.get(row.id) || new Set();
              const isDarkSpot = row.status === "missing";

              let statusBadge = (
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30 shadow-xs">
                  Covered
                </span>
              );

              if (row.status === "conflicted") {
                statusBadge = (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                    Conflicted
                  </span>
                );
              } else if (row.status === "unanswered") {
                statusBadge = (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                    Unanswered
                  </span>
                );
              } else if (row.status === "missing") {
                statusBadge = (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/50 animate-pulse">
                    Dark Spot (Missing)
                  </span>
                );
              }

              return (
                <tr
                  key={row.id}
                  className={`hover:bg-[#1C1F2E]/60 transition-colors ${
                    isDarkSpot ? "bg-[#EF4444]/5" : ""
                  }`}
                >
                  <td className="py-3 px-3.5 font-medium text-slate-200">
                    <span className="font-mono text-[#8E95A5] mr-2 text-[11px] font-bold">
                      {row.id}
                    </span>
                    {row.item}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded ${
                        row.importance === "high"
                          ? "bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30"
                          : row.importance === "medium"
                          ? "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30"
                          : "bg-[#0F1017] text-[#8E95A5] border border-[#222533]"
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
                            title={`${s.title}: ${hasClaim ? "Claim verified" : "No coverage"}`}
                            className={`inline-block h-2.5 w-2.5 rounded-full ${
                              hasClaim ? "bg-[#CCFF00] shadow-[0_0_6px_rgba(204,255,0,0.5)]" : "bg-[#222533]"
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

      {/* Scope Note and Warnings */}
      <div className="p-4 rounded-lg bg-[#0F1017] border border-[#222533] text-xs space-y-2">
        <div className="text-slate-300 font-mono text-[11px]">
          🔍 <span className="font-semibold text-[#8E95A5]">Scope:</span> {scopeNote}
        </div>

        {unverifiedQuoteCount > 0 && (
          <div className="text-[#F59E0B] text-[11px] font-mono flex items-center gap-1.5">
            <span>🛡️</span>
            <span>
              {unverifiedQuoteCount} extracted quote(s) did not match verbatim source text and were programmatically excluded from scoring.
            </span>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="space-y-1 pt-1.5 border-t border-[#222533]">
            <span className="text-[10px] uppercase font-mono text-[#8E95A5] tracking-wider font-bold">
              Verification Notes:
            </span>
            {warnings.map((w, i) => (
              <p key={i} className="text-[#8E95A5] text-[11px] font-mono">
                • {w}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
