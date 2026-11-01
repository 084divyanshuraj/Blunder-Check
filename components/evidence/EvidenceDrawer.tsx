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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-[#0F1017] border-l border-[#222533] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Evidence Inspector"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#222533] flex items-start justify-between gap-3 bg-[#151722]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#CCFF00] px-2 py-0.5 rounded bg-[#CCFF00]/10 border border-[#CCFF00]/30">
                {source.id.toUpperCase()}
              </span>
              <span className="text-xs uppercase font-mono text-[#8E95A5] tracking-wider">
                {source.kind.toUpperCase()} SOURCE
              </span>
              {source.url && (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#3B82F6] hover:text-[#CCFF00] hover:underline flex items-center gap-0.5 ml-2 font-mono"
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
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#08080C] border border-[#222533] text-[#F59E0B]"
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
            className="p-1.5 rounded-lg text-[#8E95A5] hover:text-white hover:bg-[#1C1F2E] transition-colors cursor-pointer text-lg leading-none"
            aria-label="Close evidence drawer"
          >
            ✕
          </button>
        </div>

        {/* Verification Status Pill & Claim Banner */}
        <div className="p-3.5 bg-[#151722]/60 border-b border-[#222533] text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`font-semibold font-mono px-2.5 py-0.5 rounded text-xs inline-flex items-center gap-1 ${
                  isExact
                    ? "bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30 shadow-xs"
                    : isNormalized
                    ? "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30"
                    : "bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30"
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
                className="text-[11px] text-[#8E95A5] cursor-help"
                title="Verified = this exact string exists in the cited source. It proves text presence, not that the AI's interpretation is legally sound."
              >
                ⓘ
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#8E95A5]">
              offsets: [{start ?? "?"} : {end ?? "?"}]
            </span>
          </div>

          <div className="text-slate-200 pt-0.5">
            <span className="font-semibold text-[#8E95A5] font-mono">Cited Claim:</span> &ldquo;{evidence.claim}&rdquo;
          </div>
        </div>

        {/* Document Content View */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#08080C]">
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#8E95A5] mb-2 font-bold">
            Original Source Content (Highlight below):
          </div>
          <pre className="font-mono text-xs leading-relaxed text-slate-300 whitespace-pre-wrap select-text break-words">
            {renderHighlightedContent()}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#222533] bg-[#151722]/80 text-[11px] font-mono text-[#8E95A5] text-center">
          Verified in code using deterministic index mapping against source text.
        </div>
      </div>
    </div>
  );
}
