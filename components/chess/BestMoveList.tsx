"use client";

import React, { useState } from "react";
import type { VerifyNext } from "@/schemas";
import { EvidenceStatus } from "../common/EvidenceStatus";

interface BestMoveListProps {
  items: VerifyNext[];
}

export function BestMoveList({ items }: BestMoveListProps) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyToClipboard = () => {
    const text = items
      .map(
        (item) =>
          `[${item.rank}] [${item.priority.toUpperCase()}] ${item.action}\n  Why: ${item.reason}\n  Where: ${item.whereToVerify}`
      )
      .join("\n\n");

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-[#151722] rounded-xl p-6 border border-[#2563EB]/40 shadow-lg space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30 shadow-xs">
              ! Best Move
            </span>
            <h3 className="text-base font-bold text-[#F8FAFC]">
              Prioritized &ldquo;Verify Next&rdquo; Checklist
            </h3>
          </div>
          <p className="text-xs text-[#8E95A5] mt-1">
            Action items ordered by impact to eliminate your decision blind spots.
          </p>
        </div>

        <button
          type="button"
          onClick={copyToClipboard}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#0F1017] hover:bg-[#1C1F2E] text-[#F8FAFC] border border-[#222533] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm font-mono"
        >
          <span>{copied ? "✓ Copied to clipboard!" : "📋 Copy checklist"}</span>
        </button>
      </div>

      <div className="space-y-3 pt-1">
        {items.map((item) => {
          const isDone = checkedIds.has(item.id);
          return (
            <div
              key={item.id}
              className={`p-4 rounded-lg border transition-all flex items-start gap-3.5 ${
                isDone
                  ? "bg-[#0F1017]/50 border-[#222533]/40 opacity-60"
                  : "bg-[#0F1017] border-[#222533] hover:border-[#CCFF00]/40 shadow-sm"
              }`}
            >
              <input
                type="checkbox"
                checked={isDone}
                onChange={() => toggleCheck(item.id)}
                aria-label={`Mark action ${item.rank} as completed`}
                className="mt-1 h-4 w-4 rounded bg-[#151722] border-[#222533] accent-[#CCFF00] cursor-pointer"
              />

              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-[#2563EB]/20 text-[#3B82F6]">
                      #{item.rank}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase font-bold ${
                        item.priority === "high"
                          ? "bg-[#EF4444]/15 text-[#EF4444]"
                          : item.priority === "medium"
                          ? "bg-[#F59E0B]/15 text-[#F59E0B]"
                          : "bg-[#151722] text-[#8E95A5]"
                      }`}
                    >
                      {item.priority} impact
                    </span>
                  </div>
                  <EvidenceStatus label={item.label} />
                </div>

                <div className="space-y-1">
                  <p
                    className={`text-sm font-semibold ${
                      isDone ? "line-through text-[#8E95A5]" : "text-[#F8FAFC]"
                    }`}
                  >
                    {item.action}
                  </p>
                  <p className="text-xs text-[#8E95A5] leading-relaxed">
                    <span className="font-semibold text-slate-300">Why:</span> {item.reason}
                  </p>
                </div>

                <div className="text-xs font-mono text-[#3B82F6] flex items-center gap-1.5 pt-1">
                  <span className="text-[#8E95A5]">Where:</span>
                  <span className="underline decoration-[#222533] underline-offset-2">
                    {item.whereToVerify}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
