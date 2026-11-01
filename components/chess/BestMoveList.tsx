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
    <div className="bg-[#18263B] rounded-xl p-6 border border-[#2563EB]/40 shadow-lg space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#2563EB]/20 text-[#38BDF8] border border-[#2563EB]/40">
              ! Best Move
            </span>
            <h3 className="text-base font-bold text-[#F8FAFC]">
              Prioritized &ldquo;Verify Next&rdquo; Checklist
            </h3>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Action items ordered by impact to eliminate your decision blind spots.
          </p>
        </div>

        <button
          type="button"
          onClick={copyToClipboard}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#111C2E] hover:bg-[#1F304B] text-[#F8FAFC] border border-[#263449] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
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
                  ? "bg-[#111C2E]/50 border-[#263449]/40 opacity-60"
                  : "bg-[#111C2E] border-[#263449] hover:border-[#14B8A6]/50 shadow-sm"
              }`}
            >
              <input
                type="checkbox"
                checked={isDone}
                onChange={() => toggleCheck(item.id)}
                aria-label={`Mark action ${item.rank} as completed`}
                className="mt-1 h-4 w-4 rounded border-[#263449] text-[#14B8A6] focus:ring-[#14B8A6] cursor-pointer"
              />

              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#14B8A6] px-2 py-0.5 rounded bg-[#14B8A6]/15">
                      #{item.rank}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                        item.priority === "high"
                          ? "bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30"
                          : "bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30"
                      }`}
                    >
                      {item.priority} priority
                    </span>
                  </div>
                  <EvidenceStatus label={item.label} />
                </div>

                <h4
                  className={`text-sm font-semibold text-[#F8FAFC] ${
                    isDone ? "line-through text-[#94A3B8]" : ""
                  }`}
                >
                  {item.action}
                </h4>

                <div className="text-xs text-slate-300 space-y-1">
                  <div>
                    <span className="text-[#94A3B8] font-medium">Why it matters:</span>{" "}
                    {item.reason}
                  </div>
                  <div className="text-[11px] text-[#38BDF8] font-mono">
                    <span className="text-[#94A3B8]">Where to verify:</span>{" "}
                    {item.whereToVerify}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
