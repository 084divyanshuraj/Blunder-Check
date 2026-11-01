"use client";

import React, { useEffect, useRef } from "react";
import type { EvidenceRef, SourceRecord } from "@/schemas";

interface EvidenceDrawerProps {
  evidence: EvidenceRef | null;
  sources: SourceRecord[];
  onClose: () => void;
}

export function EvidenceDrawer({
  evidence,
  sources,
  onClose,
}: EvidenceDrawerProps) {
  const markRef = useRef<HTMLElement | null>(null);

  const source = evidence ? sources.find((s) => s.id === evidence.sourceId) : null;

  // Auto-scroll the highlighted quote into view
  useEffect(() => {
    if (evidence && markRef.current) {
      setTimeout(() => {
        markRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [evidence]);

  if (!evidence || !source) return null;

  const { verification, quote } = evidence;
  const { start, end, status } = verification;
  const fullText = source.text || "";

  // Render text with highlight without dangerouslySetInnerHTML
  const renderHighlightedContent = () => {
    if (start === null || end === null || start < 0 || end > fullText.length || start >= end) {
      // Fallback: search for quote string directly
      const idx = fullText.indexOf(quote);
      if (idx !== -1) {
        const before = fullText.slice(0, idx);
        const match = fullText.slice(idx, idx + quote.length);
        const after = fullText.slice(idx + quote.length);
        return (
          <>
            {before}
            <mark ref={markRef} className="quote-match">
              {match}
            </mark>
            {after}
          </>
        );
      }
      return fullText;
    }

    const before = fullText.slice(0, start);
    const match = fullText.slice(start, end);
    const after = fullText.slice(end);

    return (
      <>
        {before}
        <mark ref={markRef} className="quote-match">
          {match}
        </mark>
        {after}
      </>
    );
  };

  const isExact = status === "exact";
  const isNormalized = status === "normalized";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-surface border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Evidence Inspector"
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-start justify-between gap-3 bg-surface-2/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-good px-2 py-0.5 rounded bg-good/20">
                {source.id.toUpperCase()}
              </span>
              <span className="text-xs uppercase font-mono text-muted tracking-wider">
                {source.kind.toUpperCase()} SOURCE
              </span>
              {source.url && (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-0.5 ml-2"
                >
                  <span>Open URL</span>
                  <span className="text-[10px]">↗</span>
                </a>
              )}
            </div>
            <h3 className="text-base font-bold text-text truncate max-w-md">
              {source.title}
            </h3>

            {/* Date Signals */}
            {source.dateSignals && source.dateSignals.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {source.dateSignals.map((d, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-amber-300"
                  >
                    📅 {d.kind}: {d.value}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-surface-2 transition-colors cursor-pointer text-lg leading-none"
            aria-label="Close evidence drawer"
          >
            ✕
          </button>
        </div>

        {/* Verification Status Pill & Claim Banner */}
        <div className="p-3 bg-surface-2/30 border-b border-border text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span
                className={`font-semibold px-2 py-0.5 rounded text-xs inline-flex items-center gap-1 ${
                  isExact
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                    : isNormalized
                    ? "bg-amber-950 text-amber-300 border border-amber-700"
                    : "bg-bad/20 text-bad border border-bad/40"
                }`}
              >
                <span>{status !== "unverified" ? "✓" : "✗"}</span>
                <span>
                  {isExact
                    ? "Verified: Exact match"
                    : isNormalized
                    ? "Verified: Matched after normalization"
                    : "Unverified quote"}
                </span>
              </span>
              <span
                className="text-[11px] text-muted cursor-help"
                title="Verified = this exact text string exists in the cited source. It proves text presence, not that the AI's interpretation of it is right."
              >
                ⓘ
              </span>
            </div>
            <span className="text-[11px] font-mono text-muted">
              offsets: [{start ?? "?"} : {end ?? "?"}]
            </span>
          </div>

          <div className="text-slate-300 pt-0.5">
            <span className="font-semibold text-muted">Cited Claim:</span> &ldquo;{evidence.claim}&rdquo;
          </div>
        </div>

        {/* Document Content View */}
        <div className="flex-1 overflow-y-auto p-4 bg-bg">
          <div className="text-[10px] uppercase font-mono tracking-wider text-muted mb-2">
            Original Source Content (Highlight below):
          </div>
          <pre className="font-mono text-xs leading-relaxed text-slate-300 whitespace-pre-wrap select-text break-words">
            {renderHighlightedContent()}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-surface-2/40 text-[11px] text-muted text-center">
          Verified in code using deterministic index mapping against source text.
        </div>
      </div>
    </div>
  );
}

