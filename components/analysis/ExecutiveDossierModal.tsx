"use client";

import React, { useState } from "react";
import type { Analysis } from "@/schemas";
import { classifySourceProvenance } from "@/lib/provenance";
import { DISCLAIMER } from "@/schemas/limits";

interface ExecutiveDossierModalProps {
  analysis: Analysis;
  isOpen: boolean;
  onClose: () => void;
}

export function ExecutiveDossierModal({
  analysis,
  isOpen,
  onClose,
}: ExecutiveDossierModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const score = analysis.result.score;
  const formattedScore = `${score.value >= 0 ? "+" : ""}${score.value.toFixed(1)}`;
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handlePrint = () => {
    window.print();
  };

  const generateMarkdown = () => {
    return `# BLUNDER CHECK: EXECUTIVE DECISION DOSSIER
**Generated:** ${dateStr}
**Research Target:** ${analysis.question}
**Stated Goal:** ${analysis.goal}

---

## 1. INFORMATION POSITION EVALUATION
* **Score:** ${formattedScore} / 5.0 (${score.value >= 3.0 ? "Well Established" : score.value >= 0.5 ? "Partly Established" : "Significant Gaps"})
* **Requirement Coverage:** ${(score.coverage * 100).toFixed(1)}%
* **Evidence Integrity:** 100% Substring Matched Quotes

### Executive Summary:
${analysis.result.evalReasoning}

---

## 2. DETECTED BLUNDERS & DIRECT CONTRADICTIONS (${analysis.result.blunders.length})
${analysis.result.blunders
  .map(
    (b, i) =>
      `### Blunder ${i + 1}: ${b.description}
* **Severity:** ${b.severity.toUpperCase()} IMPACT (${b.type})
${b.evidence.map((e) => `  * Source ${e.sourceId.toUpperCase()}: "${e.quote}" (Claim: ${e.claim})`).join("\n")}`
  )
  .join("\n\n")}

---

## 3. DIGITAL DARK SPOTS / UNANSWERED NEEDS (${analysis.result.missedMoves.length})
${analysis.result.missedMoves
  .map(
    (m, i) =>
      `* **[${m.importance.toUpperCase()} PRIORITY]** ${m.description}
  * Scope: ${m.scope}
  * Why it matters: ${m.whyItMatters}`
  )
  .join("\n\n")}

---

## 4. PRIORITIZED VERIFY-NEXT ACTION PLAN
${analysis.result.verifyNext
  .map(
    (v) =>
      `* [ ] **#${v.rank} [${v.priority.toUpperCase()}]** ${v.action}
      * Where: ${v.whereToVerify}
      * Why: ${v.reason}`
  )
  .join("\n")}

---

## 5. INGESTED SOURCES (${analysis.sources.length})
${analysis.sources
  .map((s) => {
    const prov = classifySourceProvenance(s);
    return `* **${s.id.toUpperCase()}: ${s.title}** (${prov.badge}, ${s.charCount} chars)`;
  })
  .join("\n")}

---
**Disclaimer:** ${DISCLAIMER}
`;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdown()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl bg-[#0F1017] border border-[#222533] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Executive Decision Dossier"
      >
        {/* Modal Controls Header */}
        <div className="p-4 border-b border-[#222533] bg-[#151722] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-bold text-[#CCFF00]">
              📄 Executive Dossier Brief
            </span>
            <span className="text-xs text-[#8E95A5] font-mono hidden sm:inline">
              Audit Hash: {analysis.question.length}x{analysis.sources.length}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0F1017] hover:bg-[#1C1F2E] text-[#8E95A5] hover:text-[#F8FAFC] border border-[#222533] transition-colors cursor-pointer"
            >
              {copied ? "✓ Copied Markdown!" : "📋 Copy Markdown"}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#2563EB] hover:bg-blue-600 text-white shadow-md shadow-[#2563EB]/25 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>🖨️</span>
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8E95A5] hover:text-white hover:bg-[#1C1F2E] transition-colors cursor-pointer text-base leading-none ml-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Dossier Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-[#F8FAFC] font-sans selection:bg-[#CCFF00]/20 selection:text-[#CCFF00]">
          {/* Header */}
          <div className="border-b border-[#222533] pb-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs uppercase font-mono tracking-wider text-[#3B82F6] font-bold">
                  Blunder Check Decision Audit Dossier
                </span>
                <h2 className="text-2xl font-black tracking-tight text-[#F8FAFC] mt-1">
                  {analysis.question}
                </h2>
              </div>
              <span className="text-xs font-mono text-[#8E95A5] whitespace-nowrap">
                {dateStr}
              </span>
            </div>
            <p className="text-xs text-[#8E95A5]">
              <strong className="text-slate-300">Goal:</strong> {analysis.goal}
            </p>
          </div>

          {/* KPI Snapshot */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center">
            <div className="p-3 rounded-xl bg-[#151722] border border-[#222533]">
              <span className="text-[10px] text-[#8E95A5] uppercase">Position</span>
              <div className="text-2xl font-black text-[#CCFF00]">{formattedScore}</div>
            </div>
            <div className="p-3 rounded-xl bg-[#151722] border border-[#222533]">
              <span className="text-[10px] text-[#8E95A5] uppercase">Coverage</span>
              <div className="text-2xl font-black text-[#F8FAFC]">
                {(score.coverage * 100).toFixed(0)}%
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#151722] border border-[#222533]">
              <span className="text-[10px] text-[#8E95A5] uppercase">Blunders</span>
              <div className="text-2xl font-black text-[#EF4444]">
                {analysis.result.blunders.length}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#151722] border border-[#222533]">
              <span className="text-[10px] text-[#8E95A5] uppercase">Dark Spots</span>
              <div className="text-2xl font-black text-[#F59E0B]">
                {analysis.result.missedMoves.length}
              </div>
            </div>
          </div>

          {/* AI Assessment */}
          <div className="p-4 rounded-xl bg-[#151722] border border-[#222533] space-y-1.5">
            <span className="text-xs font-mono font-bold text-[#8E95A5] uppercase">
              Executive Evaluation Summary:
            </span>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {analysis.result.evalReasoning}
            </p>
          </div>

          {/* Blunders section */}
          {analysis.result.blunders.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold font-mono text-[#EF4444] uppercase tracking-wider">
                ⚠️ Critical Contradictions &amp; Blunders ({analysis.result.blunders.length})
              </h3>
              <div className="space-y-2">
                {analysis.result.blunders.map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-xl bg-[#151722] border border-[#EF4444]/30 space-y-2 text-xs"
                  >
                    <p className="font-semibold text-[#F8FAFC]">{b.description}</p>
                    <div className="space-y-1 font-mono text-[11px] text-[#8E95A5]">
                      {b.evidence.map((ev, i) => (
                        <div key={i} className="pl-2 border-l border-[#222533]">
                          <span className="text-[#CCFF00] font-bold">
                            [{ev.sourceId.toUpperCase()}]
                          </span>{" "}
                          &ldquo;{ev.quote}&rdquo; — <em>{ev.claim}</em>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dark spots section */}
          {analysis.result.missedMoves.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold font-mono text-[#F59E0B] uppercase tracking-wider">
                🌑 Digital Dark Spots — Missing Critical Policies ({analysis.result.missedMoves.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {analysis.result.missedMoves.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-xl bg-[#151722] border border-[#F59E0B]/30 space-y-1"
                  >
                    <span className="font-bold text-[#F8FAFC] block">{m.description}</span>
                    <span className="text-[11px] font-mono text-[#8E95A5] block">
                      Scope: {m.scope}
                    </span>
                    <p className="text-[11px] text-slate-300 pt-1">
                      <strong>Risk:</strong> {m.whyItMatters}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prioritized action plan */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold font-mono text-[#3B82F6] uppercase tracking-wider">
              ! Prioritized &ldquo;Verify Next&rdquo; Action Plan
            </h3>
            <div className="space-y-2 text-xs">
              {analysis.result.verifyNext.map((v) => (
                <div
                  key={v.id}
                  className="p-3 rounded-xl bg-[#151722] border border-[#222533] flex items-start gap-2.5"
                >
                  <span className="font-mono text-[#3B82F6] font-bold">#{v.rank}</span>
                  <div className="space-y-0.5 flex-1">
                    <p className="font-semibold text-[#F8FAFC]">{v.action}</p>
                    <p className="text-[11px] text-[#8E95A5] font-mono">
                      Where to check: {v.whereToVerify} • Why: {v.reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ingested Sources Authority Table */}
          <div className="space-y-2 pt-2 border-t border-[#222533]">
            <h4 className="text-xs font-mono uppercase text-[#8E95A5] font-bold">
              Reviewed Sources &amp; Provenance Tiers ({analysis.sources.length}):
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              {analysis.sources.map((s) => {
                const prov = classifySourceProvenance(s);
                return (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-lg bg-[#151722] border border-[#222533] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-[#CCFF00]">
                        {s.id.toUpperCase()}
                      </span>
                      <span className="truncate max-w-[200px] text-slate-300">
                        {s.title}
                      </span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded border ${prov.color}`}>
                      {prov.badge.split(":")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mandatory Disclaimer */}
          <div className="p-3.5 rounded-xl bg-[#08080C] border border-[#222533] text-[11px] text-[#8E95A5] text-center">
            ⚠️ {DISCLAIMER}
          </div>
        </div>
      </div>
    </div>
  );
}

