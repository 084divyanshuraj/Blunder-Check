/**
 * Builds public/demo/scholarship/analysis.mock.json WITHOUT calling any AI.
 * Hand-written claims + a hand-written "proposed" analysis are pushed through the
 * real verification + reconcile + scoring code. Use it as:
 *   1. mock data so UI work can start before the backend exists
 *   2. an offline end-to-end check of lib/verification, lib/reconcile, lib/scoring
 *
 * Run:  npx tsx scripts/build-mock.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  AnalysisSchema,
  type ChecklistItem,
  type ExtractedClaim,
  type ProposedAnalysis,
  type SourceRecord,
  type DateSignal,
} from "../schemas";
import { buildVerifiedClaims, buildVerifiedDateSignals } from "../lib/verification";
import { finalizeAnalysis } from "../lib/reconcile";

const dir = join(process.cwd(), "public/demo/scholarship");
const meta = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8"));

const checklist: ChecklistItem[] = [
  { id: "c1", item: "Eligibility criteria (academic marks, income limit, age)", importance: "high" },
  { id: "c2", item: "Official list of required documents and accepted income proof", importance: "high" },
  { id: "c3", item: "Current application deadline", importance: "high" },
  { id: "c4", item: "How and where to submit the application", importance: "medium" },
  { id: "c5", item: "Award amount and payment method", importance: "medium" },
  { id: "c6", item: "Renewal conditions for later years", importance: "high" },
  { id: "c7", item: "Selection process, criteria and notification timeline", importance: "medium" },
  { id: "c8", item: "Appeal or grievance process after a decision", importance: "low" },
  { id: "c9", item: "Official contact for queries", importance: "low" },
];

type SrcDef = { claims: ExtractedClaim[]; dateSignals: DateSignal[] };
const k = (checklistId: string | null, claim: string, quote: string): ExtractedClaim => ({
  checklistId,
  claim,
  quote,
  visibleDate: null,
});

const defs: Record<string, SrcDef> = {
  s1: {
    claims: [
      k("c1", "Minimum 85% in Class XII.", "Applicants must have scored at least 85% in Class XII."),
      k("c1", "Family income must be below Rs. 6,00,000 per year.", "The annual family income must be below Rs. 6,00,000."),
      k("c2", "Income certificate from the Tehsildar, marksheet, passbook and photo are required.", "income certificate issued by the Tehsildar, Class XII marksheet, a copy of the bank passbook, and one passport-size photograph"),
      k("c3", "Last date is 15 November 2026.", "The last date to submit applications is 15 November 2026."),
      k("c4", "Applications only through the online portal.", "Applications are accepted only through the online portal linked on this page."),
      k("c5", "Award is Rs. 50,000 per academic year, paid to the bank account.", "The award is Rs. 50,000 per academic year, paid directly to the student's bank account."),
      k("c7", "Shortlisted candidates are notified by email.", "Shortlisted candidates will be notified by email."),
      k("c9", "Queries go to a scholarships email address.", "For queries, write to scholarships@aurorafoundation.example."),
    ],
    dateSignals: [
      { kind: "updated", value: "12 August 2026", quote: "Last updated: 12 August 2026" },
      { kind: "cycle", value: "2026-27", quote: "Aurora Merit Scholarship 2026-27" },
    ],
  },
  s2: {
    claims: [
      k("c2", "Blog lists an income certificate OR an ITR acknowledgement as income proof.", "income certificate or ITR acknowledgement"),
      k("c3", "Blog says applications close on 30 November 2026.", "applications close on 30 November 2026"),
      k("c5", "Blog says the award is Rs. 50,000 per year.", "The award is Rs. 50,000 per year."),
      k("c6", "Renewal is possible but the conditions are not given.", "The scholarship may be renewed in later years, but students should check with the foundation for the renewal conditions."),
    ],
    dateSignals: [{ kind: "published", value: "3 September 2026", quote: "Posted: 3 September 2026" }],
  },
  s3: {
    claims: [
      k("c1", "Listing gives an income limit of Rs. 5,00,000 (2025-26 cycle).", "Income limit: family income below Rs. 5,00,000 per year."),
      k("c1", "Listing gives 80% minimum marks (2025-26 cycle).", "Minimum marks: 80% in Class XII."),
      k("c3", "Listing gives 20 December 2025 as the last date.", "Last date: 20 December 2025."),
      k("c5", "Listing gives an award of Rs. 40,000 per year (2025-26 cycle).", "Award: Rs. 40,000 per year."),
    ],
    dateSignals: [
      { kind: "updated", value: "4 January 2026", quote: "Updated: 4 January 2026" },
      { kind: "cycle", value: "2025-26", quote: "Aurora Merit Scholarship 2025-26" },
    ],
  },
  s4: {
    claims: [
      k("c2", "Notice says ITR acknowledgements are not accepted as income proof.", "ITR acknowledgements are not accepted as proof of income."),
      k("c2", "Income certificate must be issued within the last six months.", "The income certificate must have been issued within the last six months before the date of application."),
      k("c3", "Notice extends the last date to 22 November 2026.", "The last date to submit applications has been extended to 22 November 2026."),
    ],
    dateSignals: [{ kind: "published", value: "10 October 2026", quote: "Date: 10 October 2026" }],
  },
};

const sources: SourceRecord[] = [];
const claims = [];
for (const s of meta.sources as { id: string; kind: SourceRecord["kind"]; title: string; file: string }[]) {
  const text = readFileSync(join(dir, s.file), "utf8");
  const def = defs[s.id];
  const vClaims = buildVerifiedClaims(s.id, text, def.claims);
  const bad = vClaims.filter((c) => c.verification.status === "unverified");
  if (bad.length) throw new Error(`Unverified quotes in ${s.id}: ${bad.map((b) => b.quote).join(" | ")}`);
  const { verified, dropped } = buildVerifiedDateSignals(text, def.dateSignals);
  if (dropped) throw new Error(`Date signal(s) not found in ${s.id}`);
  claims.push(...vClaims);
  sources.push({
    id: s.id as SourceRecord["id"],
    kind: s.kind,
    title: s.title,
    charCount: text.length,
    status: "ok",
    dateSignals: verified,
    text,
  });
}

const proposed: ProposedAnalysis = {
  evalReasoning:
    "The reviewed sources agree on eligibility, the award amount and the application route, but they disagree on the deadline and on which income proof is accepted, and none establishes the renewal conditions or an appeal process. These are potential gaps based only on the four sources reviewed.",
  blunders: [
    { type: "conflict", checklistId: "c3", severity: "high", description: "Three reviewed sources give three different application deadlines: 15, 22 and 30 November 2026.", claimIds: ["s1-k4", "s4-k3", "s2-k2"] },
    { type: "conflict", checklistId: "c2", severity: "high", description: "The university blog accepts an ITR acknowledgement as income proof, but the foundation's notice says ITR acknowledgements are not accepted.", claimIds: ["s2-k1", "s4-k1"] },
    { type: "outdated", checklistId: "c1", severity: "medium", description: "The ScholarHub listing refers to the 2025-26 cycle (lower income limit, earlier deadline) and may not apply to 2026-27.", claimIds: ["s3-k1", "s3-k3"] },
  ],
  missedMoves: [
    { checklistId: "c6", kind: "unanswered", description: "Renewal is mentioned, but no reviewed source states the renewal conditions.", whyItMatters: "Funding in later years may depend on conditions the applicant does not know yet." },
    { checklistId: "c7", kind: "unanswered", description: "Sources say shortlisted candidates are notified but give no selection criteria or timeline.", whyItMatters: "The applicant cannot judge their chances or plan around the results date." },
    { checklistId: "c8", kind: "missing", description: "No reviewed source describes an appeal or grievance process.", whyItMatters: "If an application is rejected in error, the applicant would not know how to challenge it." },
  ],
  hangingPieces: [
    { checklistId: "c3", impact: "high", description: "The deadline is disputed across three sources; acting on the wrong date could mean missing the window." },
    { checklistId: "c6", impact: "high", description: "Renewal conditions are unknown, which affects the multi-year value of the award." },
  ],
  verifyNext: [
    { priority: "high", action: "Confirm the current last date on the Aurora Foundation's latest official notice.", reason: "Three reviewed sources give three different dates.", whereToVerify: "The foundation's official notice board or application portal", relatedChecklistId: "c3" },
    { priority: "high", action: "Confirm which income proof is accepted and how recent it must be.", reason: "The blog and the foundation notice contradict each other on ITR acknowledgements.", whereToVerify: "The foundation's latest notice or the portal's document checklist", relatedChecklistId: "c2" },
    { priority: "high", action: "Find the official renewal conditions (marks threshold, documents, duration).", reason: "No reviewed source states them.", whereToVerify: "The foundation's scholarship guidelines or the scholarship cell", relatedChecklistId: "c6" },
    { priority: "medium", action: "Disregard the 2025-26 ScholarHub listing and use the 2026-27 official page and notice instead.", reason: "The listing is for an earlier cycle with different figures.", whereToVerify: "The foundation's official 2026-27 page", relatedChecklistId: "c1" },
    { priority: "low", action: "Ask the scholarship cell how to raise a grievance or appeal a decision.", reason: "No appeal process was found in the reviewed sources.", whereToVerify: "The scholarship cell's contact email", relatedChecklistId: "c8" },
  ],
};

const result = finalizeAnalysis({ proposed, checklist, claims, sources });

const analysis = AnalysisSchema.parse({
  id: "demo-scholarship",
  createdAt: "2026-10-31T00:00:00.000Z",
  mode: "demo_cached",
  question: meta.question,
  goal: meta.goal,
  checklist,
  sources,
  claims,
  result,
});

writeFileSync(join(dir, "analysis.mock.json"), JSON.stringify(analysis, null, 2));
console.log("Wrote public/demo/scholarship/analysis.mock.json");
console.log("score:", result.score.value, "| coverage:", result.score.coverage, "| cap:", result.score.capApplied?.cap ?? "none");
console.log("blunders:", result.blunders.map((b) => `${b.id}:${b.type}`).join(", "));
console.log("missed:", result.missedMoves.map((m) => `${m.checklistId}:${m.kind}`).join(", "));
console.log("verify-next order:", result.verifyNext.map((v) => `${v.rank}:${v.relatedChecklistId}`).join(", "));
console.log("warnings:", result.warnings);
