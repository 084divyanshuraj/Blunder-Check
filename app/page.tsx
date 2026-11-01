import React from "react";
import Link from "next/link";
import { DISCLAIMER } from "@/schemas/limits";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#08080C] text-[#F8FAFC] flex flex-col cockpit-grid selection:bg-[#2563EB]/30 selection:text-[#CCFF00]">
      {/* Top Cockpit Navigation */}
      <nav className="border-b border-[#222533] bg-[#08080C]/85 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#CCFF00] flex items-center justify-center text-lg shadow-lg shadow-[#2563EB]/20 text-[#08080C] font-black">
              ♟
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-[#F8FAFC]">
                  Blunder Check
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30 font-semibold uppercase">
                  Auditing Engine
                </span>
              </div>
              <p className="text-[11px] text-[#8E95A5]">
                Information Dark Spot &amp; Conflict Detector
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs text-[#8E95A5] font-mono font-medium">
            <a href="#problem" className="hover:text-[#F8FAFC] transition-colors">
              The Dark Spot
            </a>
            <a href="#metaphor" className="hover:text-[#F8FAFC] transition-colors">
              Chess Metaphor
            </a>
            <a href="#pipeline" className="hover:text-[#F8FAFC] transition-colors">
              Verification Pipeline
            </a>
            <a href="#cases" className="hover:text-[#F8FAFC] transition-colors">
              Demo Scenarios
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/studio?demo=scholarship"
              className="hidden sm:inline-flex px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono bg-[#151722] hover:bg-[#1C1F2E] text-[#CCFF00] border border-[#CCFF00]/30 hover:border-[#CCFF00]/60 transition-colors"
            >
              ⚡ Instant Demo
            </Link>
            <Link
              href="/studio"
              className="px-4 py-2 rounded-lg text-xs font-bold bg-[#2563EB] hover:bg-blue-600 text-white shadow-lg shadow-[#2563EB]/25 transition-all flex items-center gap-1.5 font-mono"
            >
              <span>Launch Studio</span>
              <span className="text-sm">→</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
        {/* Hackathon Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#151722] border border-[#222533] text-xs text-[#8E95A5] shadow-inner font-mono">
          <span className="h-2 w-2 rounded-full bg-[#CCFF00] animate-pulse shadow-[0_0_8px_#CCFF00]" />
          <span className="text-[#F8FAFC] font-semibold">Shinchan Hackathon 2026</span>
          <span className="text-[#222533]">•</span>
          <span className="text-[#3B82F6]">Digital Dark Spot Detection</span>
        </div>

        {/* Main Title */}
        <div className="max-w-4xl mx-auto space-y-4">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[#F8FAFC] leading-[1.1]">
            Find what the sources <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] via-[#60A5FA] to-[#CCFF00]">
              aren&apos;t telling you.
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-[#8E95A5] leading-relaxed">
            Blunder Check audits messy research like a chess engine: calculating your{" "}
            <strong className="text-[#CCFF00]">Information Position</strong>, detecting{" "}
            <strong className="text-[#EF4444]">blunders</strong> across conflicting documents, and exposing the{" "}
            <strong className="text-[#3B82F6]">dark spots</strong> before you commit.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
          <Link
            href="/studio"
            className="px-7 py-3 rounded-xl text-sm font-bold bg-[#2563EB] hover:bg-blue-600 text-white shadow-xl shadow-[#2563EB]/25 transition-all flex items-center gap-2 font-mono"
          >
            <span>♟</span>
            <span>Launch Decision Studio</span>
            <span>→</span>
          </Link>
          <Link
            href="/studio?demo=scholarship"
            className="px-5 py-3 rounded-xl text-sm font-semibold font-mono bg-[#151722] hover:bg-[#1C1F2E] text-[#CCFF00] border border-[#CCFF00]/30 hover:border-[#CCFF00]/60 transition-all flex items-center gap-2"
          >
            <span>🏆</span>
            <span>Case 1: Scholarship Demo</span>
          </Link>
          <Link
            href="/studio?demo=hostel"
            className="px-5 py-3 rounded-xl text-sm font-semibold font-mono bg-[#151722] hover:bg-[#1C1F2E] text-[#60A5FA] border border-[#2563EB]/40 hover:border-[#3B82F6]/60 transition-all flex items-center gap-2"
          >
            <span>🏠</span>
            <span>Case 2: Hostel Demo</span>
          </Link>
        </div>

        {/* Live Engine Proof Badges */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-[#8E95A5] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-[#CCFF00]">✓</span>
            <span>49/49 Vitest Unit Tests Passing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#3B82F6]">✓</span>
            <span>100% Deterministic Score Engine</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#CCFF00]">✓</span>
            <span>Verbatim Substring Offset Matching</span>
          </div>
        </div>

        {/* High-Fidelity UI Teaser Card */}
        <div className="pt-8 max-w-5xl mx-auto">
          <div className="rounded-2xl bg-[#0F1017] border border-[#222533] shadow-2xl overflow-hidden p-6 text-left space-y-6 glow-card">
            <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#222533]">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-[#EF4444]" />
                  <div className="h-3 w-3 rounded-full bg-[#F59E0B]" />
                  <div className="h-3 w-3 rounded-full bg-[#CCFF00]" />
                </div>
                <span className="text-xs font-mono text-[#8E95A5]">
                  engine://eval-board • aurora-scholarship-2026.analysis
                </span>
              </div>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30 font-bold">
                Information Position: +1.0
              </span>
            </div>

            {/* Simulated Live Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Item 1: Eval Metric */}
              <div className="p-4 rounded-xl bg-[#151722] border border-[#222533] space-y-2">
                <span className="text-[10px] font-mono text-[#8E95A5] uppercase">
                  Engine Evaluation
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono text-[#F8FAFC]">
                    +1.0
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded font-mono bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/40 font-semibold">
                    Partly Established
                  </span>
                </div>
                <p className="text-xs text-[#8E95A5]">
                  Weighted Coverage: 65.0% • 1 Visible Outdated Notice (-0.5)
                </p>
              </div>

              {/* Item 2: Blunder Card */}
              <div className="p-4 rounded-xl bg-[#151722] border border-[#EF4444]/35 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#EF4444]">
                    ?? Blunder Detected
                  </span>
                  <span className="text-[10px] text-[#EF4444] uppercase font-mono font-bold">
                    High Impact
                  </span>
                </div>
                <p className="text-xs text-[#F8FAFC] font-medium">
                  3 Conflicting Deadlines across 4 sources (15 Nov vs 22 Nov vs 30 Nov).
                </p>
                <div className="text-[11px] text-[#CCFF00] font-mono">
                  ✓ Verbatim Quotes Verified in Original Text
                </div>
              </div>

              {/* Item 3: Dark Spot Card */}
              <div className="p-4 rounded-xl bg-[#151722] border border-[#3B82F6]/35 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#3B82F6]">
                    ?! Missed Move
                  </span>
                  <span className="text-[10px] text-[#3B82F6] uppercase font-mono font-bold">
                    Dark Spot
                  </span>
                </div>
                <p className="text-xs text-[#F8FAFC] font-medium">
                  Renewal criteria and grievance appeal procedures missing from ALL sources.
                </p>
                <div className="text-[11px] text-[#8E95A5] font-mono">
                  Scope: Not found in 4 reviewed sources
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center text-xs">
              <span className="text-[#8E95A5] font-mono">
                Click below to launch full interactive audit with clickable evidence drawer:
              </span>
              <Link
                href="/studio?demo=scholarship"
                className="text-[#CCFF00] hover:underline font-semibold flex items-center gap-1 font-mono"
              >
                <span>Open in Decision Studio</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section: The Digital Dark Spot Problem */}
      <section id="problem" className="py-16 md:py-24 bg-[#0F1017]/80 border-y border-[#222533]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-xs uppercase font-mono tracking-widest text-[#3B82F6] font-bold">
              The Digital Dark Spot
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC]">
              Why Search &amp; Chatbots Fail High-Stakes Decisions
            </h3>
            <p className="text-sm text-[#8E95A5]">
              Standard tools assume the information you have is complete and consistent. In reality, it rarely is.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#151722] border border-[#222533] space-y-3">
              <div className="text-2xl">🔍</div>
              <h4 className="text-base font-bold text-[#F8FAFC]">1. Search Engines</h4>
              <p className="text-xs text-[#8E95A5] leading-relaxed">
                Google finds relevant URLs, but never tells you that Source A and Source B disagree on critical submission criteria or deadlines.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#151722] border border-[#222533] space-y-3">
              <div className="text-2xl">🤖</div>
              <h4 className="text-base font-bold text-[#F8FAFC]">2. Generic AI Summarizers</h4>
              <p className="text-xs text-[#8E95A5] leading-relaxed">
                Chatbots condense articles without verification, smoothing over discrepancies and hallucinating plausible-sounding answers for unmentioned rules.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#151722] border border-[#CCFF00]/40 shadow-lg shadow-[#CCFF00]/5 space-y-3">
              <div className="text-2xl">♟</div>
              <h4 className="text-base font-bold text-[#CCFF00]">3. Blunder Check Engine</h4>
              <p className="text-xs text-[#F8FAFC] leading-relaxed">
                Audits the evidence. Matches quotes string-by-string against source text, scores coverage deterministically, and tells you what to verify next.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section: The Chess Analysis Metaphor */}
      <section id="metaphor" className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2 className="text-xs uppercase font-mono tracking-widest text-[#CCFF00] font-bold">
            The Presentation Metaphor
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC]">
            Treating Your Decision Like a Chess Position
          </h3>
          <p className="text-sm text-[#8E95A5]">
            An intuitive, transparent vocabulary designed for rapid human comprehension.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-[#151722] border border-[#222533] space-y-3">
            <span className="text-xs font-mono font-bold text-[#CCFF00] px-2 py-0.5 rounded bg-[#CCFF00]/10 border border-[#CCFF00]/30">
              Eval Bar
            </span>
            <h4 className="text-base font-bold text-[#F8FAFC]">Information Position</h4>
            <p className="text-xs text-[#8E95A5] leading-relaxed">
              Scale of -5.0 to +5.0 calculated purely in TypeScript. Shows how safe it is to act on your reviewed information.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#151722] border border-[#EF4444]/35 space-y-3">
            <span className="text-xs font-mono font-bold text-[#EF4444] px-2 py-0.5 rounded bg-[#EF4444]/15 border border-[#EF4444]/30">
              ?? Blunder
            </span>
            <h4 className="text-base font-bold text-[#F8FAFC]">Conflicts &amp; Outdated Info</h4>
            <p className="text-xs text-[#8E95A5] leading-relaxed">
              Exposes contradictory facts or superseded notices side-by-side with exact verbatim citations.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#151722] border border-[#F59E0B]/35 space-y-3">
            <span className="text-xs font-mono font-bold text-[#F59E0B] px-2 py-0.5 rounded bg-[#F59E0B]/15 border border-[#F59E0B]/30">
              ?! Missed Move
            </span>
            <h4 className="text-base font-bold text-[#F8FAFC]">Information Dark Spots</h4>
            <p className="text-xs text-[#8E95A5] leading-relaxed">
              Items a complete answer requires that zero reviewed sources mentioned (e.g. refund terms or appeal routes).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#151722] border border-[#2563EB]/40 space-y-3">
            <span className="text-xs font-mono font-bold text-[#3B82F6] px-2 py-0.5 rounded bg-[#2563EB]/20 border border-[#2563EB]/40">
              ! Best Move
            </span>
            <h4 className="text-base font-bold text-[#F8FAFC]">Verify-Next Checklist</h4>
            <p className="text-xs text-[#8E95A5] leading-relaxed">
              A prioritized, checkable action list detailing exactly what to verify and where before you act.
            </p>
          </div>
        </div>
      </section>

      {/* Section: Architecture & Verification Pipeline */}
      <section id="pipeline" className="py-16 md:py-24 bg-[#0F1017]/80 border-t border-[#222533]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-xs uppercase font-mono tracking-widest text-[#2563EB] font-bold">
              Engineering Rigour
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC]">
              AI Proposes, TypeScript Verifies
            </h3>
            <p className="text-sm text-[#8E95A5]">
              We never trust raw LLM output. Gemini acts strictly as an extraction worker; deterministic TypeScript gatekeepers validate every quote and score.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-[#151722] border border-[#222533] space-y-2">
              <span className="text-[#3B82F6] font-bold">STAGE 01</span>
              <h5 className="font-bold text-[#F8FAFC] text-sm font-sans">Source Ingestion</h5>
              <p className="text-[#8E95A5] font-sans">
                Scrapes URLs via Jina Reader, extracts PDF text with unpdf, and normalizes character streams.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#151722] border border-[#222533] space-y-2">
              <span className="text-[#3B82F6] font-bold">STAGE 02</span>
              <h5 className="font-bold text-[#F8FAFC] text-sm font-sans">Coverage Checklist</h5>
              <p className="text-[#8E95A5] font-sans">
                Gemini Call 1 plans 7–10 critical requirements for this decision type (eligibility, proof, deadlines).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#151722] border border-[#CCFF00]/40 space-y-2">
              <span className="text-[#CCFF00] font-bold">STAGE 03</span>
              <h5 className="font-bold text-[#F8FAFC] text-sm font-sans">Quote Verification</h5>
              <p className="text-[#8E95A5] font-sans">
                Code matches quotes string-by-string with UTF-16 index mapping. Unverified quotes are rejected.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#151722] border border-[#222533] space-y-2">
              <span className="text-[#3B82F6] font-bold">STAGE 04</span>
              <h5 className="font-bold text-[#F8FAFC] text-sm font-sans">Deterministic Scoring</h5>
              <p className="text-[#8E95A5] font-sans">
                Computes Information Position mathematically with high-importance caps and staleness penalties.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Live Demo Test Cases */}
      <section id="cases" className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2 className="text-xs uppercase font-mono tracking-widest text-[#CCFF00] font-bold">
            Live Showcase
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC]">
            Experience Real-World Failure Modes
          </h3>
          <p className="text-sm text-[#8E95A5]">
            Explore pre-configured test cases with planted real-world contradictions, outdated cycles, and dark spots.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Case 1 */}
          <div className="p-6 rounded-2xl bg-[#151722] border border-[#222533] hover:border-[#CCFF00]/40 transition-all space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#CCFF00] px-2 py-0.5 rounded bg-[#CCFF00]/10 border border-[#CCFF00]/30">
                Case 01 • Scholarship Application
              </span>
              <span className="text-xs font-mono text-[#8E95A5]">4 Sources</span>
            </div>
            <h4 className="text-lg font-bold text-[#F8FAFC]">
              Aurora Merit Scholarship 2026-27
            </h4>
            <p className="text-xs text-[#8E95A5] leading-relaxed">
              Official page, student blog, scholarship aggregator, and foundation circular. Features 3 conflicting deadlines, outdated 2025-26 cycle information, and zero coverage on renewal rules.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <Link
                href="/studio?demo=scholarship"
                className="px-4 py-2 rounded-lg text-xs font-bold font-mono bg-[#CCFF00] hover:bg-lime-400 text-[#08080C] transition-colors"
              >
                Launch Case 1 (Instant) →
              </Link>
            </div>
          </div>

          {/* Case 2 */}
          <div className="p-6 rounded-2xl bg-[#151722] border border-[#222533] hover:border-[#2563EB]/50 transition-all space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#60A5FA] px-2 py-0.5 rounded bg-[#2563EB]/20 border border-[#2563EB]/40">
                Case 02 • College Hostel Allotment
              </span>
              <span className="text-xs font-mono text-[#8E95A5]">3 Sources</span>
            </div>
            <h4 className="text-lg font-bold text-[#F8FAFC]">
              Northfield Institute Hostel Allotment
            </h4>
            <p className="text-xs text-[#8E95A5] leading-relaxed">
              Official allotment memo, student forum FAQ, and 2025-26 student handbook. Features contradictory fee amounts (₹68k vs ₹72k), document discrepancies, and missing refund terms.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <Link
                href="/studio?demo=hostel"
                className="px-4 py-2 rounded-lg text-xs font-bold font-mono bg-[#2563EB] hover:bg-blue-600 text-white transition-colors"
              >
                Launch Case 2 (Instant) →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 bg-gradient-to-b from-[#0F1017] to-[#08080C] border-t border-[#222533] text-center px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <h3 className="text-3xl font-extrabold text-[#F8FAFC]">
            Ready to eliminate decision blind spots?
          </h3>
          <p className="text-sm text-[#8E95A5]">
            Add URLs, PDFs, or pasted text to audit your research in under 60 seconds.
          </p>
          <div className="pt-2">
            <Link
              href="/studio"
              className="px-8 py-3.5 rounded-xl text-sm font-bold bg-[#2563EB] hover:bg-blue-600 text-white shadow-xl shadow-[#2563EB]/30 transition-all inline-flex items-center gap-2 font-mono"
            >
              <span>♟</span>
              <span>Open Decision Studio</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Mandatory Disclaimer Footer */}
      <footer className="mt-auto py-8 border-t border-[#222533] text-xs text-[#8E95A5] text-center px-4 bg-[#08080C]">
        <div className="max-w-4xl mx-auto space-y-2">
          <p className="font-semibold text-[#F8FAFC]">
            ⚠️ {DISCLAIMER}
          </p>
          <p className="text-[11px] text-[#8E95A5]">
            Blunder Check is an evidence-gap evaluation assistant built for the Shinchan Online Hackathon 2026.
            Findings are potential signals from reviewed documents, not legal or authoritative advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
