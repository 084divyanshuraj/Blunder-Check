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

  const renderHighlightedContent = () => {
    if (start === null || end === null || start < 0 || end > fullText.length || start >= end) {
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-[#111C2E] border-l border-[#263449] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Evidence Inspector"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#263449] flex items-start justify-between gap-3 bg-[#18263B]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#14B8A6] px-2 py-0.5 rounded bg-[#14B8A6]/15 border border-[#14B8A6]/30">
                {source.id.toUpperCase()}
              </span>
              <span className="text-xs uppercase font-mono text-[#94A3B8] tracking-wider">
                {source.kind.toUpperCase()} SOURCE
              </span>
              {source.url && (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#38BDF8] hover:underline flex items-center gap-0.5 ml-2"
                >
                  <span>Open URL</span>
                  <span className="text-[10px]">↗</span>
                </a>
              )}
            </div>
            <h3 className="text-base font-bold text-[#F8FAFC] truncate max-w-md">
              {source.title}
            </h3>

            {source.dateSignals && source.dateSignals.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {source.dateSignals.map((d, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#111C2E] border border-[#263449] text-[#38BDF8]"
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
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1F304B] transition-colors cursor-pointer text-lg leading-none"
            aria-label="Close evidence drawer"
          >
            ✕
          </button>
        </div>

        {/* Verification Status Pill & Claim Banner */}
        <div className="p-3.5 bg-[#18263B]/50 border-b border-[#263449] text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`font-semibold px-2.5 py-0.5 rounded text-xs inline-flex items-center gap-1 ${
                  isExact
                    ? "bg-[#14B8A6]/15 text-[#14B8A6] border border-[#14B8A6]/40"
                    : isNormalized
                    ? "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/40"
                    : "bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40"
                }`}
              >
                <span>{status !== "unverified" ? "✓" : "✗"}</span>
                <span>
                  {isExact
                    ? "Verified: Exact match"
                    : isNormalized
                    ? "Verified: Normalized match"
                    : "Unverified quote"}
                </span>
              </span>
              <span
                className="text-[11px] text-[#94A3B8] cursor-help"
                title="Verified = this exact string exists in the cited source. It proves text presence, not that the AI's interpretation is legally sound."
              >
                ⓘ
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#94A3B8]">
              offsets: [{start ?? "?"} : {end ?? "?"}]
            </span>
          </div>

          <div className="text-slate-200 pt-0.5">
            <span className="font-semibold text-[#94A3B8]">Cited Claim:</span> &ldquo;{evidence.claim}&rdquo;
          </div>
        </div>

        {/* Document Content View */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#0B1220]">
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#94A3B8] mb-2 font-bold">
            Original Source Content (Highlight below):
          </div>
          <pre className="font-mono text-xs leading-relaxed text-slate-300 whitespace-pre-wrap select-text break-words">
            {renderHighlightedContent()}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#263449] bg-[#18263B]/60 text-[11px] text-[#94A3B8] text-center">
          Verified in code using deterministic index mapping against source text.
        </div>
      </div>
    </div>
  );
}
