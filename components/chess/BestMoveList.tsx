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
    <div className="bg-surface rounded-xl p-6 border border-good/40 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-good/20 text-good border border-good/40">
              ! Best Move
            </span>
            <h3 className="text-base font-bold text-text">
              Prioritized &ldquo;Verify Next&rdquo; Checklist
            </h3>
          </div>
          <p className="text-xs text-muted mt-1">
            Action items ordered by impact to eliminate your decision blind spots.
          </p>
        </div>

        <button
          type="button"
          onClick={copyToClipboard}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-2 hover:bg-border text-slate-200 border border-border transition-colors flex items-center gap-1.5 cursor-pointer"
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
              className={`p-3.5 rounded-lg border transition-all flex items-start gap-3.5 ${
                isDone
                  ? "bg-surface-2/40 border-border/40 opacity-60"
                  : "bg-surface-2 border-border hover:border-good/50"
              }`}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={isDone}
                onChange={() => toggleCheck(item.id)}
                aria-label={`Mark action ${item.rank} as completed`}
                className="mt-1 h-4 w-4 rounded border-border text-good focus:ring-good cursor-pointer"
              />

              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-good px-1.5 py-0.5 rounded bg-good/10">
                      #{item.rank}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded uppercase font-bold ${
                        item.priority === "high"
                          ? "bg-bad/20 text-bad"
                          : "bg-warn/20 text-warn"
                      }`}
                    >
                      {item.priority} priority
                    </span>
                  </div>
                  <EvidenceStatus label={item.label} />
                </div>

                <h4
                  className={`text-sm font-semibold text-text ${
                    isDone ? "line-through text-muted" : ""
                  }`}
                >
                  {item.action}
                </h4>

                <div className="text-xs text-slate-300 space-y-1">
                  <div>
                    <span className="text-muted font-medium">Why it matters:</span>{" "}
                    {item.reason}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-mono">
                    <span className="text-muted">Where to verify:</span>{" "}
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

