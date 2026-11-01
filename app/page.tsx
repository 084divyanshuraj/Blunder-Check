import React from "react";
import Link from "next/link";
import { DISCLAIMER } from "@/schemas/limits";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B1220] text-[#F8FAFC] flex flex-col enterprise-grid selection:bg-[#2563EB]/30 selection:text-[#38BDF8]">
      {/* Top Enterprise Navigation */}
      <nav className="border-b border-[#263449] bg-[#0B1220]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center text-lg shadow-lg shadow-[#2563EB]/20">
              ♟️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-[#F8FAFC]">
                  Blunder Check
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#14B8A6]/15 text-[#14B8A6] border border-[#14B8A6]/30 font-semibold uppercase">
                  Enterprise v1.0
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                Evidence-Gap &amp; Conflict Detection Engine
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs text-[#94A3B8] font-medium">
            <a href="#problem" className="hover:text-[#F8FAFC] transition-colors">
              The Dark Spot
            </a>
            <a href="#metaphor" className="hover:text-[#F8FAFC] transition-colors">
              Chess Metaphor
            </a>
            <a href="#pipeline" className="hover:text-[#F8FAFC] transition-colors">
              Verification Engine
            </a>
            <a href="#cases" className="hover:text-[#F8FAFC] transition-colors">
              Demo Scenarios
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/studio?demo=scholarship"
              className="hidden sm:inline-flex px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#18263B] hover:bg-[#1F304B] text-[#38BDF8] border border-[#263449] transition-colors"
            >
              🏆 Instant Demo
            </Link>
            <Link
              href="/studio"
              className="px-4 py-2 rounded-lg text-xs font-bold bg-[#2563EB] hover:bg-blue-600 text-white shadow-lg shadow-[#2563EB]/25 transition-all flex items-center gap-1.5"
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
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18263B] border border-[#263449] text-xs text-[#94A3B8] shadow-inner">
          <span className="h-2 w-2 rounded-full bg-[#14B8A6] animate-pulse" />
          <span className="text-[#F8FAFC] font-semibold">Shinchan Hackathon 2026</span>
          <span className="text-[#263449]">•</span>
          <span className="text-[#38BDF8]">Digital Dark Spot Detection</span>
        </div>

        {/* Main Title */}
        <div className="max-w-4xl mx-auto space-y-4">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[#F8FAFC] leading-[1.1]">
            Find what the sources <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] via-[#2563EB] to-[#14B8A6]">
              aren&apos;t telling you.
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-[#94A3B8] leading-relaxed">
            Blunder Check audits messy research like a chess engine: calculating your{" "}
            <strong className="text-[#F8FAFC]">Information Position</strong>, detecting{" "}
            <strong className="text-[#EF4444]">blunders</strong> across conflicting documents, and exposing the{" "}
            <strong className="text-[#38BDF8]">dark spots</strong> before you commit.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
          <Link
            href="/studio"
            className="px-7 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-[#2563EB] to-[#14B8A6] text-white shadow-xl shadow-[#2563EB]/25 hover:opacity-95 transition-all flex items-center gap-2"
          >
            <span>♟️</span>
            <span>Launch Analysis Studio</span>
            <span>→</span>
          </Link>
          <Link
            href="/studio?demo=scholarship"
            className="px-5 py-3 rounded-xl text-sm font-semibold bg-[#18263B] hover:bg-[#1F304B] text-[#14B8A6] border border-[#14B8A6]/40 transition-all flex items-center gap-2"
          >
            <span>🏆</span>
            <span>Case 1: Scholarship Demo</span>
          </Link>
          <Link
            href="/studio?demo=hostel"
            className="px-5 py-3 rounded-xl text-sm font-semibold bg-[#18263B] hover:bg-[#1F304B] text-[#38BDF8] border border-[#2563EB]/40 transition-all flex items-center gap-2"
          >
            <span>🏠</span>
            <span>Case 2: Hostel Demo</span>
          </Link>
        </div>

        {/* Live Engine Proof Badges */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-[#94A3B8] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-[#14B8A6]">✓</span>
            <span>49/49 Vitest Unit Tests Passing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#38BDF8]">✓</span>
            <span>100% Deterministic Score Engine</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#2563EB]">✓</span>
            <span>Programmatic Anti-Hallucination Quote Matching</span>
          </div>
        </div>

        {/* High-Fidelity UI Teaser Card */}
        <div className="pt-8 max-w-5xl mx-auto">
          <div className="rounded-2xl bg-[#111C2E] border border-[#263449] shadow-2xl overflow-hidden p-6 text-left space-y-6">
            <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#263449]">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-[#EF4444]/60" />
                  <div className="h-3 w-3 rounded-full bg-[#F59E0B]/60" />
                  <div className="h-3 w-3 rounded-full bg-[#22C55E]/60" />
                </div>
                <span className="text-xs font-mono text-[#94A3B8]">
                  engine://eval-board • aurora-scholarship-2026.analysis
                </span>
              </div>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-[#14B8A6]/15 text-[#14B8A6] border border-[#14B8A6]/40">
                Information Position: +1.0
              </span>
            </div>

            {/* Simulated Live Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Item 1: Eval Metric */}
              <div className="p-4 rounded-xl bg-[#18263B] border border-[#263449] space-y-2">
                <span className="text-[10px] font-mono text-[#94A3B8] uppercase">
                  Engine Evaluation
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono text-[#F8FAFC]">
                    +1.0
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 font-semibold">
                    Partly Established
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8]">
                  Weighted Coverage: 65.0% • 1 Visible Outdated Notice (-0.5)
                </p>
              </div>

              {/* Item 2: Blunder Card */}
              <div className="p-4 rounded-xl bg-[#18263B] border border-[#EF4444]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#EF4444]">
                    ?? Blunder Detected
                  </span>
                  <span className="text-[10px] text-[#EF4444] uppercase font-bold">
                    High Impact
                  </span>
                </div>
                <p className="text-xs text-[#F8FAFC] font-medium">
                  3 Conflicting Deadlines across 4 sources (15 Nov vs 22 Nov vs 30 Nov).
                </p>
                <div className="text-[11px] text-[#14B8A6] font-mono">
                  ✓ Verbatim Quotes Verified in Original Text
                </div>
              </div>

              {/* Item 3: Dark Spot Card */}
              <div className="p-4 rounded-xl bg-[#18263B] border border-[#38BDF8]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#38BDF8]">
                    ?! Missed Move
                  </span>
                  <span className="text-[10px] text-[#38BDF8] uppercase font-bold">
                    Dark Spot
                  </span>
                </div>
                <p className="text-xs text-[#F8FAFC] font-medium">
                  Renewal criteria and grievance appeal procedures missing from ALL sources.
                </p>
                <div className="text-[11px] text-[#94A3B8] font-mono">
                  Scope: Not found in 4 reviewed sources
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center text-xs">
              <span className="text-[#94A3B8] font-mono">
                Click below to launch full interactive audit with clickable evidence drawer:
              </span>
              <Link
                href="/studio?demo=scholarship"
                className="text-[#38BDF8] hover:text-[#F8FAFC] font-semibold flex items-center gap-1 font-mono"
              >
                <span>Open in Decision Studio</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section: The Digital Dark Spot Problem */}
      <section id="problem" className="py-16 md:py-24 bg-[#111C2E]/60 border-y border-[#263449]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-xs uppercase font-mono tracking-widest text-[#38BDF8] font-bold">
              The Digital Dark Spot
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC]">
              Why Search &amp; Chatbots Fail High-Stakes Decisions
            </h3>
            <p className="text-sm text-[#94A3B8]">
              Standard tools assume the information you have is complete and consistent. In reality, it rarely is.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#18263B] border border-[#263449] space-y-3">
              <div className="text-2xl">🔍</div>
              <h4 className="text-base font-bold text-[#F8FAFC]">1. Search Engines</h4>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Google finds relevant URLs, but never tells you that Source A and Source B disagree on critical submission criteria or deadlines.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#18263B] border border-[#263449] space-y-3">
              <div className="text-2xl">🤖</div>
              <h4 className="text-base font-bold text-[#F8FAFC]">2. Generic AI Summarizers</h4>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Chatbots condense articles without verification, smoothing over discrepancies and hallucinating plausible-sounding answers for unmentioned rules.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#18263B] border border-[#14B8A6]/50 shadow-lg shadow-[#14B8A6]/5 space-y-3">
              <div className="text-2xl">♟️</div>
              <h4 className="text-base font-bold text-[#14B8A6]">3. Blunder Check Engine</h4>
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
          <h2 className="text-xs uppercase font-mono tracking-widest text-[#14B8A6] font-bold">
            The Presentation Metaphor
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC]">
            Treating Your Decision Like a Chess Position
          </h3>
          <p className="text-sm text-[#94A3B8]">
            An intuitive, transparent vocabulary designed for rapid human comprehension.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-[#18263B] border border-[#263449] space-y-3">
            <span className="text-xs font-mono font-bold text-[#14B8A6] px-2 py-0.5 rounded bg-[#14B8A6]/15">
              Eval Bar
            </span>
            <h4 className="text-base font-bold text-[#F8FAFC]">Information Position</h4>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Scale of -5.0 to +5.0 calculated purely in TypeScript. Shows how safe it is to act on your reviewed information.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#18263B] border border-[#EF4444]/40 space-y-3">
            <span className="text-xs font-mono font-bold text-[#EF4444] px-2 py-0.5 rounded bg-[#EF4444]/15">
              ?? Blunder
            </span>
            <h4 className="text-base font-bold text-[#F8FAFC]">Conflicts &amp; Outdated Info</h4>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Exposes contradictory facts or superseded notices side-by-side with exact verbatim citations.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#18263B] border border-[#38BDF8]/40 space-y-3">
            <span className="text-xs font-mono font-bold text-[#38BDF8] px-2 py-0.5 rounded bg-[#38BDF8]/15">
              ?! Missed Move
            </span>
            <h4 className="text-base font-bold text-[#F8FAFC]">Information Dark Spots</h4>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Items a complete answer requires that zero reviewed sources mentioned (e.g. refund terms or appeal routes).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#18263B] border border-[#14B8A6]/40 space-y-3">
            <span className="text-xs font-mono font-bold text-[#14B8A6] px-2 py-0.5 rounded bg-[#14B8A6]/15">
              ! Best Move
            </span>
            <h4 className="text-base font-bold text-[#F8FAFC]">Verify-Next Checklist</h4>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              A prioritized, checkable action list detailing exactly what to verify and where before you act.
            </p>
          </div>
        </div>
      </section>

      {/* Section: Architecture & Verification Pipeline */}
      <section id="pipeline" className="py-16 md:py-24 bg-[#111C2E]/60 border-t border-[#263449]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-xs uppercase font-mono tracking-widest text-[#2563EB] font-bold">
              Engineering Rigour
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC]">
              AI Proposes, TypeScript Verifies
            </h3>
            <p className="text-sm text-[#94A3B8]">
              We never trust raw LLM output. Gemini acts strictly as an extraction worker; deterministic TypeScript gatekeepers validate every quote and score.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-[#18263B] border border-[#263449] space-y-2">
              <span className="text-[#38BDF8] font-bold">STAGE 01</span>
              <h5 className="font-bold text-[#F8FAFC] text-sm">Source Ingestion</h5>
              <p className="text-[#94A3B8] font-sans">
                Scrapes URLs via Jina Reader, extracts PDF text with unpdf, and normalizes character streams.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#18263B] border border-[#263449] space-y-2">
              <span className="text-[#38BDF8] font-bold">STAGE 02</span>
              <h5 className="font-bold text-[#F8FAFC] text-sm">Coverage Checklist</h5>
              <p className="text-[#94A3B8] font-sans">
                Gemini Call 1 plans 7–10 critical requirements for this decision type (eligibility, proof, deadlines).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#18263B] border border-[#14B8A6]/50 space-y-2">
              <span className="text-[#14B8A6] font-bold">STAGE 03</span>
              <h5 className="font-bold text-[#F8FAFC] text-sm">Quote Verification</h5>
              <p className="text-[#94A3B8] font-sans">
                Code matches quotes string-by-string with UTF-16 index mapping. Unverified quotes are rejected.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#18263B] border border-[#263449] space-y-2">
              <span className="text-[#38BDF8] font-bold">STAGE 04</span>
              <h5 className="font-bold text-[#F8FAFC] text-sm">Deterministic Scoring</h5>
              <p className="text-[#94A3B8] font-sans">
                Computes Information Position mathematically with high-importance caps and staleness penalties.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Live Demo Test Cases */}
      <section id="cases" className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2 className="text-xs uppercase font-mono tracking-widest text-[#14B8A6] font-bold">
            Live Showcase
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC]">
            Experience Real-World Failure Modes
          </h3>
          <p className="text-sm text-[#94A3B8]">
            Explore pre-configured test cases with planted real-world contradictions, outdated cycles, and dark spots.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Case 1 */}
          <div className="p-6 rounded-2xl bg-[#18263B] border border-[#263449] hover:border-[#14B8A6]/50 transition-all space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#14B8A6] px-2 py-0.5 rounded bg-[#14B8A6]/15">
                Case 01 • Scholarship Application
              </span>
              <span className="text-xs font-mono text-[#94A3B8]">4 Sources</span>
            </div>
            <h4 className="text-lg font-bold text-[#F8FAFC]">
              Aurora Merit Scholarship 2026-27
            </h4>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Official page, student blog, scholarship aggregator, and foundation circular. Features 3 conflicting deadlines, outdated 2025-26 cycle information, and zero coverage on renewal rules.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <Link
                href="/studio?demo=scholarship"
                className="px-4 py-2 rounded-lg text-xs font-bold bg-[#14B8A6] hover:bg-teal-500 text-black transition-colors"
              >
                Launch Case 1 (Instant) →
              </Link>
            </div>
          </div>

          {/* Case 2 */}
          <div className="p-6 rounded-2xl bg-[#18263B] border border-[#263449] hover:border-[#2563EB]/50 transition-all space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#38BDF8] px-2 py-0.5 rounded bg-[#2563EB]/20">
                Case 02 • College Hostel Allotment
              </span>
              <span className="text-xs font-mono text-[#94A3B8]">3 Sources</span>
            </div>
            <h4 className="text-lg font-bold text-[#F8FAFC]">
              Northfield Institute Hostel Allotment
            </h4>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Official allotment memo, student forum FAQ, and 2025-26 student handbook. Features contradictory fee amounts (₹68k vs ₹72k), document discrepancies, and missing refund terms.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <Link
                href="/studio?demo=hostel"
                className="px-4 py-2 rounded-lg text-xs font-bold bg-[#2563EB] hover:bg-blue-600 text-white transition-colors"
              >
                Launch Case 2 (Instant) →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 bg-gradient-to-b from-[#111C2E] to-[#0B1220] border-t border-[#263449] text-center px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <h3 className="text-3xl font-extrabold text-[#F8FAFC]">
            Ready to eliminate decision blind spots?
          </h3>
          <p className="text-sm text-[#94A3B8]">
            Add URLs, PDFs, or pasted text to audit your research in under 60 seconds.
          </p>
          <div className="pt-2">
            <Link
              href="/studio"
              className="px-8 py-3.5 rounded-xl text-sm font-bold bg-[#2563EB] hover:bg-blue-600 text-white shadow-xl shadow-[#2563EB]/30 transition-all inline-flex items-center gap-2"
            >
              <span>♟️</span>
              <span>Open Decision Studio</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Mandatory Disclaimer Footer */}
      <footer className="mt-auto py-8 border-t border-[#263449] text-xs text-[#94A3B8] text-center px-4 bg-[#0B1220]">
        <div className="max-w-4xl mx-auto space-y-2">
          <p className="font-semibold text-[#F8FAFC]">
            ⚠️ {DISCLAIMER}
          </p>
          <p className="text-[11px] text-[#94A3B8]">
            Blunder Check is an evidence-gap evaluation assistant built for the Shinchan Online Hackathon 2026.
            Findings are potential signals from reviewed documents, not legal or authoritative advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
