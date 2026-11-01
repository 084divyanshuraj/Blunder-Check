"use client";

import React, { useState } from "react";
import type { SourceRecord } from "@/schemas";
import { cleanText, truncateToLimit } from "@/lib/text";

interface ResearchSetupProps {
  question: string;
  setQuestion: (q: string) => void;
  goal: string;
  setGoal: (g: string) => void;
  sources: SourceRecord[];
  setSources: React.Dispatch<React.SetStateAction<SourceRecord[]>>;
  onStartAnalysis: () => void;
  onLoadDemo: (demoKey: "scholarship" | "hostel", instantMock?: boolean) => void;
  isAnalyzing: boolean;
}

export function ResearchSetup({
  question,
  setQuestion,
  goal,
  setGoal,
  sources,
  setSources,
  onStartAnalysis,
  onLoadDemo,
  isAnalyzing,
}: ResearchSetupProps) {
  const [activeTab, setActiveTab] = useState<"url" | "pdf" | "paste">("url");
  const [urlInput, setUrlInput] = useState("");
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteContent, setPasteContent] = useState("");
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestError, setIngestError] = useState<string | null>(null);

  const getNextSourceId = () => {
    const existingNums = sources
      .map((s) => parseInt(s.id.replace("s", ""), 10))
      .filter((n) => !isNaN(n));
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
    return `s${nextNum}`;
  };

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    if (sources.length >= 6) {
      setIngestError("Maximum 6 sources allowed.");
      return;
    }

    setIsIngesting(true);
    setIngestError(null);

    const sourceId = getNextSourceId();

    try {
      const res = await fetch("/api/ingest/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId, url: urlInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || `Failed to fetch URL (${res.status})`);
      }

      setSources((prev) => [...prev, data.source]);
      setUrlInput("");
    } catch (err: unknown) {
      setIngestError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsIngesting(false);
    }
  };

  const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (sources.length >= 6) {
      setIngestError("Maximum 6 sources allowed.");
      return;
    }

    setIsIngesting(true);
    setIngestError(null);

    const sourceId = getNextSourceId();
    const formData = new FormData();
    formData.append("sourceId", sourceId);
    formData.append("file", file);

    try {
      const res = await fetch("/api/ingest/pdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || `Failed to read PDF (${res.status})`);
      }

      setSources((prev) => [...prev, data.source]);
      e.target.value = "";
    } catch (err: unknown) {
      setIngestError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsIngesting(false);
    }
  };

  const handleAddPaste = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteContent.trim()) return;

    if (sources.length >= 6) {
      setIngestError("Maximum 6 sources allowed.");
      return;
    }

    const sourceId = getNextSourceId();
    const cleaned = cleanText(pasteContent);
    const { text, truncated } = truncateToLimit(cleaned);

    const newSource: SourceRecord = {
      id: sourceId,
      kind: "paste",
      title: pasteTitle.trim() || `Pasted text ${sourceId}`,
      charCount: text.length,
      status: truncated ? "truncated" : "ok",
      dateSignals: [],
      text,
    };

    setSources((prev) => [...prev, newSource]);
    setPasteTitle("");
    setPasteContent("");
    setIngestError(null);
  };

  const handleRemoveSource = (id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
  };

  const usableSourcesCount = sources.filter(
    (s) => s.status === "ok" || s.status === "truncated"
  ).length;

  const canAnalyze =
    question.trim().length >= 5 &&
    goal.trim().length >= 5 &&
    usableSourcesCount >= 2 &&
    !isAnalyzing;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Demo Banner */}
      <div className="p-4 rounded-xl bg-[#151722] border border-[#2563EB]/40 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div>
          <span className="text-xs uppercase font-mono tracking-wider font-bold text-[#CCFF00]">
            ⚡ Preloaded Verification Scenarios
          </span>
          <p className="text-xs text-[#8E95A5] mt-0.5">
            Test cases with planted contradictions, outdated cycles, and dark spots.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onLoadDemo("scholarship", true)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono bg-[#CCFF00]/10 hover:bg-[#CCFF00]/20 text-[#CCFF00] border border-[#CCFF00]/30 transition-colors cursor-pointer"
          >
            🏆 Case 1: Scholarship (Instant)
          </button>
          <button
            type="button"
            onClick={() => onLoadDemo("hostel", true)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono bg-[#2563EB]/20 hover:bg-[#2563EB]/30 text-[#60A5FA] border border-[#2563EB]/40 transition-colors cursor-pointer"
          >
            🏠 Case 2: Hostel (Instant)
          </button>
          <button
            type="button"
            onClick={() => onLoadDemo("scholarship", false)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium font-mono bg-[#0F1017] hover:bg-[#1C1F2E] text-[#8E95A5] hover:text-[#F8FAFC] border border-[#222533] transition-colors cursor-pointer"
          >
            ⚡ Populate Sources (Live Run)
          </button>
        </div>
      </div>

      {/* Card A: Research Goal */}
      <div className="p-6 rounded-2xl bg-[#151722] border border-[#222533] shadow-lg space-y-4">
        <div className="flex items-center gap-2 text-xs uppercase font-mono tracking-wider text-[#8E95A5] font-bold">
          <span className="text-[#3B82F6]">01.</span>
          <span>Define Your Research Topic &amp; Goal</span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Research Question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What should I verify before applying for the Aurora Merit Scholarship 2026-27?"
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F1017] border border-[#222533] text-sm text-[#F8FAFC] placeholder-[#8E95A5]/60 focus:outline-none focus:border-[#2563EB] transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Decision Goal (What outcome are you aiming for?)
            </label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Apply successfully without missing a deadline or required certificate."
              className="w-full px-3.5 py-2 rounded-xl bg-[#0F1017] border border-[#222533] text-sm text-[#F8FAFC] placeholder-[#8E95A5]/60 focus:outline-none focus:border-[#2563EB] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Card B: Sources Ingestion */}
      <div className="p-6 rounded-2xl bg-[#151722] border border-[#222533] shadow-lg space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs uppercase font-mono tracking-wider text-[#8E95A5] font-bold">
            <span className="text-[#3B82F6]">02.</span>
            <span>Add Sources (2 to 6 required)</span>
          </div>
          <span className="text-xs font-mono text-[#8E95A5]">
            {sources.length}/6 Sources
          </span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#222533] text-xs font-medium font-mono">
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`py-2 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === "url"
                ? "border-[#3B82F6] text-[#3B82F6] font-bold"
                : "border-transparent text-[#8E95A5] hover:text-[#F8FAFC]"
            }`}
          >
            🌐 Web URL (via Jina)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pdf")}
            className={`py-2 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === "pdf"
                ? "border-[#3B82F6] text-[#3B82F6] font-bold"
                : "border-transparent text-[#8E95A5] hover:text-[#F8FAFC]"
            }`}
          >
            📄 PDF Upload
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("paste")}
            className={`py-2 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === "paste"
                ? "border-[#3B82F6] text-[#3B82F6] font-bold"
                : "border-transparent text-[#8E95A5] hover:text-[#F8FAFC]"
            }`}
          >
            📋 Paste Text
          </button>
        </div>

        {/* Tab 1: URL */}
        {activeTab === "url" && (
          <form onSubmit={handleAddUrl} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/scholarship-guidelines"
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#0F1017] border border-[#222533] text-sm text-[#F8FAFC] placeholder-[#8E95A5]/60 focus:outline-none focus:border-[#2563EB] transition-colors"
              />
              <button
                type="submit"
                disabled={isIngesting || !urlInput.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-blue-600 disabled:opacity-40 text-white transition-colors cursor-pointer font-mono"
              >
                {isIngesting ? "Scraping..." : "+ Add URL"}
              </button>
            </div>
            <p className="text-[11px] text-[#8E95A5] font-mono">
              Scraped cleanly via Jina Reader. If protected by login walls or Cloudflare, paste text directly.
            </p>
          </form>
        )}

        {/* Tab 2: PDF */}
        {activeTab === "pdf" && (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-[#222533] hover:border-[#3B82F6]/60 rounded-xl p-6 text-center transition-colors bg-[#0F1017]/60">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleUploadPdf}
                disabled={isIngesting}
                className="hidden"
                id="pdf-input"
              />
              <label
                htmlFor="pdf-input"
                className="cursor-pointer text-xs font-medium text-slate-300 space-y-1 block"
              >
                <div className="text-2xl mb-1">📂</div>
                <span className="text-[#3B82F6] font-semibold underline">Click to select a PDF</span> (max 5 MB)
                <p className="text-[11px] text-[#8E95A5] font-mono">
                  Text extracted server-side with unpdf. Scanned image-only PDFs require pasting text.
                </p>
              </label>
            </div>
            {isIngesting && (
              <p className="text-xs text-[#3B82F6] font-mono text-center">
                Parsing PDF text...
              </p>
            )}
          </div>
        )}

        {/* Tab 3: Paste */}
        {activeTab === "paste" && (
          <form onSubmit={handleAddPaste} className="space-y-3">
            <input
              type="text"
              value={pasteTitle}
              onChange={(e) => setPasteTitle(e.target.value)}
              placeholder="Source Title (e.g. Official University Portal FAQ)"
              className="w-full px-3.5 py-2 rounded-xl bg-[#0F1017] border border-[#222533] text-xs text-[#F8FAFC] placeholder-[#8E95A5]/60 focus:outline-none focus:border-[#2563EB]"
            />
            <textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder="Paste raw article, circular, or announcement text here..."
              rows={4}
              className="w-full px-3.5 py-2 rounded-xl bg-[#0F1017] border border-[#222533] text-xs text-[#F8FAFC] placeholder-[#8E95A5]/60 focus:outline-none focus:border-[#2563EB] resize-none"
            />
            <button
              type="submit"
              disabled={!pasteContent.trim()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-blue-600 disabled:opacity-40 text-white transition-colors cursor-pointer font-mono"
            >
              + Add Pasted Text
            </button>
          </form>
        )}

        {/* Error message */}
        {ingestError && (
          <div className="p-3 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs font-mono">
            ⚠️ {ingestError}
          </div>
        )}

        {/* Source List */}
        <div className="space-y-2 pt-2">
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#8E95A5] font-bold">
            Configured Sources ({sources.length}):
          </div>

          {sources.length === 0 ? (
            <div className="text-center py-6 text-xs text-[#8E95A5] border border-[#222533] rounded-xl bg-[#0F1017]/40 font-mono">
              No sources added yet. Enter URLs, upload PDFs, or paste text above.
            </div>
          ) : (
            sources.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#0F1017] border border-[#222533] text-xs"
              >
                <div className="flex items-center gap-2.5 truncate max-w-md">
                  <span className="font-mono text-[11px] font-bold text-[#CCFF00] px-1.5 py-0.5 rounded bg-[#CCFF00]/10 border border-[#CCFF00]/30">
                    {s.id.toUpperCase()}
                  </span>
                  <span className="text-[10px] uppercase font-mono text-[#8E95A5]">
                    {s.kind}
                  </span>
                  <span className="font-medium text-slate-200 truncate">
                    {s.title}
                  </span>
                  <span className="text-[11px] text-[#8E95A5] font-mono">
                    ({s.charCount} chars)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                      s.status === "ok"
                        ? "bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30"
                        : s.status === "truncated"
                        ? "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30"
                        : "bg-[#EF4444]/15 text-[#EF4444]"
                    }`}
                  >
                    {s.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSource(s.id)}
                    className="text-[#8E95A5] hover:text-[#EF4444] text-sm px-1.5 transition-colors cursor-pointer"
                    title="Remove source"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Action Button */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-[#8E95A5] font-mono">
          {usableSourcesCount < 2
            ? `⚠️ Add at least ${2 - usableSourcesCount} more source to enable analysis.`
            : "✓ Minimum sources met. Ready to evaluate position."}
        </span>

        <button
          type="button"
          onClick={onStartAnalysis}
          disabled={!canAnalyze}
          className="px-8 py-3.5 rounded-xl text-sm font-bold bg-[#2563EB] hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed text-white shadow-xl shadow-[#2563EB]/25 transition-all cursor-pointer flex items-center gap-2"
        >
          <span>♟️</span>
          <span>Analyze Information Position</span>
        </button>
      </div>
    </div>
  );
}
