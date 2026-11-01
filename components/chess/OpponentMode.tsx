"use client";

import React, { useState } from "react";
import type { Analysis, VerifyNext } from "@/schemas";

interface OpponentModeProps {
  analysis: Analysis;
}

export function OpponentMode({ analysis }: OpponentModeProps) {
  const [activeVector, setActiveVector] = useState<number | null>(null);

  // Derive Adversarial Persona from question/goal
  const isHostel =
    analysis.question.toLowerCase().includes("hostel") ||
    analysis.goal.toLowerCase().includes("hostel");
  const isScholarship =
    analysis.question.toLowerCase().includes("scholarship") ||
    analysis.goal.toLowerCase().includes("scholarship");

  const opponent = isHostel
    ? {
        name: "Col. R. K. Nair (Retd.)",
        title: "Chief Warden & Estate Allotment Committee",
        avatar: "⚔️",
        personaNote:
          "Known for strict administrative compliance, zero tolerance for outdated medical formats, and instantaneous forfeiture of incomplete applications.",
      }
    : isScholarship
    ? {
        name: "Dr. Eleanor Vance",
        title: "Chairperson, Aurora Trust Evaluation Board",
        avatar: "⚔️",
        personaNote:
          "Reviews over 12,000 applications annually. Filters out any candidate with mismatched deadline submissions or missing renewal documentation without human interview.",
      }
    : {
        name: "Chief Compliance Examiner",
        title: "Institutional Decision Audit Board",
        avatar: "⚔️",
        personaNote:
          "Tasked with finding legal ambiguities, conflicting documentation, and unsubstantiated claims to reject non-compliant dossiers.",
      };

  // Calculate Opponent Threat Level
  const scoreVal = analysis.result.score.value;
  const threatLevel =
    scoreVal < 0
      ? { label: "CRITICAL COMPLIANCE FAILURE", color: "text-[#EF4444]", pct: 94 }
      : scoreVal < 2.0
      ? { label: "HIGH ADVERSARIAL RISK", color: "text-[#F59E0B]", pct: 72 }
      : { label: "LOW RISK (DEFENSIBLE)", color: "text-[#CCFF00]", pct: 28 };

  // Tactical Attack Vectors synthesized from real analysis findings
  const attacks = [
    {
      id: 1,
      title: "Attack Vector 1: The Disqualification Trap (Blunder Exploit)",
      severity: "Fatal",
      severityColor: "text-[#EF4444] bg-[#EF4444]/15 border-[#EF4444]/30",
      speech:
        analysis.result.blunders[0]?.description ||
        "You rely on conflicting third-party submission notices that clash with our central registry dates.",
      threat:
        "The automated portal strictly adheres to the official deadline. If you submit on the aggregator's date, your dossier is permanently discarded with zero human appeal.",
      counterMove: analysis.result.verifyNext[0] || {
        action: "Confirm cutoff with primary circular office directly.",
        whereToVerify: "Registrar desk / Official portal only.",
        reason: "Eliminates reliance on conflicting secondary sources.",
      },
    },
    {
      id: 2,
      title: "Attack Vector 2: The Clause Ambush (Dark Spot Exploit)",
      severity: "High",
      severityColor: "text-[#F59E0B] bg-[#F59E0B]/15 border-[#F59E0B]/30",
      speech:
        analysis.result.missedMoves[0]?.description ||
        "None of your reviewed documents establish the subsequent renewal benchmarks or fee forfeiture terms.",
      threat:
        "We terminate benefits immediately after term 1 if the unadvertised GPA or attendance threshold is not met. Without documented appeal procedures, you will have no recourse.",
      counterMove: analysis.result.verifyNext[1] || {
        action: "Request official written renewal and grievance guidelines.",
        whereToVerify: "Academic secretariat / Dean of students.",
        reason: "Closes the critical information dark spot before accepting.",
      },
    },
    {
      id: 3,
      title: "Attack Vector 3: The Hanging Piece (Vulnerability Strike)",
      severity: "Medium",
      severityColor: "text-[#3B82F6] bg-[#2563EB]/15 border-[#2563EB]/30",
      speech:
        analysis.result.hangingPieces[0]?.description ||
        "Your dossier assumes past cycle procedures apply directly to this session.",
      threat:
        "Submitting outdated certificate formats or bank guarantees results in immediate administrative freeze.",
      counterMove: analysis.result.verifyNext[2] || {
        action: "Cross-check document checklist against current year gazette.",
        whereToVerify: "Official notification downloads section.",
        reason: "Prevents submission of superseded forms.",
      },
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Opponent Banner */}
      <div className="p-6 rounded-2xl bg-[#151722] border border-[#EF4444]/40 shadow-2xl relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#EF4444]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#222533] pb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-[#0F1017] border border-[#EF4444]/40 flex items-center justify-center text-2xl shadow-lg shadow-[#EF4444]/20">
              {opponent.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-[#F8FAFC]">
                  {opponent.name}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 font-bold uppercase">
                  Adversarial Gatekeeper
                </span>
              </div>
              <p className="text-xs text-[#8E95A5] font-mono">
                {opponent.title}
              </p>
            </div>
          </div>

          {/* Threat Metric */}
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase text-[#8E95A5] font-bold">
              Opponent Rejection Threat
            </div>
            <div className="flex items-baseline justify-end gap-2">
              <span className={`text-2xl font-black font-mono ${threatLevel.color}`}>
                {threatLevel.pct}%
              </span>
              <span className={`text-[10px] font-mono font-bold uppercase ${threatLevel.color}`}>
                {threatLevel.label}
              </span>
            </div>
          </div>
        </div>

        {/* Persona Speech */}
        <div className="p-4 rounded-xl bg-[#0F1017] border border-[#222533] space-y-2">
          <span className="text-[10px] font-mono uppercase text-[#EF4444] tracking-wider font-bold">
            ⚔️ Adversarial Evaluation Statement:
          </span>
          <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
            &ldquo;I have reviewed thousands of candidates. Your research dossier is riddled with
            unverified assumptions and contradictory timelines. Here is exactly how my committee
            will exploit your dark spots to disqualify your submission:&rdquo;
          </p>
          <p className="text-[11px] text-[#8E95A5] font-mono pt-1">
            Persona Profile: {opponent.personaNote}
          </p>
        </div>
      </div>

      {/* Attack Vectors */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold font-mono text-[#F8FAFC] flex items-center gap-2">
            <span>🎯 3 Tactical Vulnerabilities Exposed by the Engine:</span>
          </h4>
          <span className="text-xs text-[#8E95A5] font-mono">
            Click any vector to deploy the counter-move defense
          </span>
        </div>

        <div className="space-y-3">
          {attacks.map((atk, idx) => {
            const isOpen = activeVector === idx;
            return (
              <div
                key={atk.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isOpen
                    ? "bg-[#151722] border-[#CCFF00]/50 shadow-xl"
                    : "bg-[#151722] border-[#222533] hover:border-[#EF4444]/40"
                }`}
              >
                <div
                  onClick={() => setActiveVector(isOpen ? null : idx)}
                  className="flex items-start justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#F8FAFC]">
                        {atk.title}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${atk.severityColor}`}
                      >
                        {atk.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <strong className="text-[#EF4444]">Vulnerability:</strong> {atk.speech}
                    </p>
                  </div>

                  <span className="text-xs text-[#8E95A5] font-mono py-1 px-2 rounded bg-[#0F1017] border border-[#222533]">
                    {isOpen ? "Hide Defense ▲" : "Counter-Move ▼"}
                  </span>
                </div>

                {/* Threat description */}
                <div className="mt-3 p-3 rounded-lg bg-[#0F1017] border border-[#222533] text-xs font-mono space-y-1">
                  <span className="text-[10px] uppercase text-[#8E95A5] font-bold block">
                    Opponent Exploitation:
                  </span>
                  <p className="text-slate-300 leading-relaxed font-sans">{atk.threat}</p>
                </div>

                {/* Counter-move defense (Best Move) */}
                {isOpen && (
                  <div className="mt-4 p-4 rounded-xl bg-[#08080C] border border-[#CCFF00]/40 space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#CCFF00] flex items-center gap-1.5">
                        <span>🛡️ Defensive Counter-Move:</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#CCFF00]/10 text-[#CCFF00] font-bold">
                        Neutralizes Attack
                      </span>
                    </div>
                    <p className="text-xs text-[#F8FAFC] font-semibold">
                      {atk.counterMove.action}
                    </p>
                    <div className="text-[11px] text-[#8E95A5] font-mono flex items-center justify-between pt-1">
                      <span>Where: {atk.counterMove.whereToVerify}</span>
                      <span className="text-[#3B82F6]">Why: {atk.counterMove.reason}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
