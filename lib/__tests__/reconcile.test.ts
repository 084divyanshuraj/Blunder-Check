import { describe, expect, it } from "vitest";
import type { ChecklistItem, ProposedAnalysis, SourceMeta, VerifiedClaim } from "../../schemas";
import { finalizeAnalysis } from "../reconcile";

const checklist: ChecklistItem[] = [
  { id: "c1", item: "Eligibility criteria", importance: "high" },
  { id: "c2", item: "Required documents", importance: "high" },
  { id: "c3", item: "Current deadline", importance: "high" },
  { id: "c4", item: "How to apply", importance: "medium" },
  { id: "c5", item: "Appeal process", importance: "low" },
];

const src = (id: string, withDate: boolean): SourceMeta => ({
  id: id as SourceMeta["id"],
  kind: "paste",
  title: `Source ${id}`,
  charCount: 500,
  status: "ok",
  dateSignals: withDate
    ? [{ kind: "updated", value: "1 Jan 2025", quote: "Updated: 1 Jan 2025", verification: { status: "exact", start: 0, end: 19 } }]
    : [],
});

const claim = (id: string, cid: string | null, ok = true): VerifiedClaim => ({
  id,
  sourceId: id.split("-")[0] as VerifiedClaim["sourceId"],
  checklistId: cid,
  claim: `claim ${id}`,
  quote: `quote text for ${id}`,
  visibleDate: null,
  verification: ok ? { status: "exact", start: 0, end: 10 } : { status: "unverified", start: null, end: null },
});

const base: ProposedAnalysis = {
  evalReasoning: "Sources agree on some points but disagree on the deadline.",
  blunders: [],
  missedMoves: [],
  hangingPieces: [],
  verifyNext: [
    { priority: "low", action: "Check the contact page for questions", reason: "Minor", whereToVerify: "official site", relatedChecklistId: null },
    { priority: "high", action: "Confirm the deadline on the official notice", reason: "Sources disagree", whereToVerify: "official notice", relatedChecklistId: "c3" },
    { priority: "medium", action: "Confirm how to apply on the portal", reason: "Only one source", whereToVerify: "portal", relatedChecklistId: "c4" },
  ],
};

const claims = [
  claim("s1-k1", "c1"),
  claim("s1-k2", "c3"),
  claim("s2-k1", "c3"),
  claim("s2-k2", "c2", false), // unverified -> must be ignored
];
const sources = [src("s1", true), src("s2", false)];

describe("finalizeAnalysis", () => {
  it("keeps a valid conflict, drops one with a single source, resolves quotes from claims", () => {
    const r = finalizeAnalysis({
      checklist,
      claims,
      sources,
      proposed: {
        ...base,
        blunders: [
          { type: "conflict", checklistId: "c3", severity: "high", description: "Deadlines differ between the two sources.", claimIds: ["s1-k2", "s2-k1"] },
          { type: "conflict", checklistId: "c1", severity: "high", description: "Fake conflict from one source only.", claimIds: ["s1-k1", "s1-k2"] },
          { type: "conflict", checklistId: "c2", severity: "high", description: "Conflict citing an unverified claim.", claimIds: ["s1-k1", "s2-k2"] },
        ],
      },
    });
    expect(r.blunders).toHaveLength(1);
    expect(r.blunders[0].evidence.map((e) => e.quote)).toEqual(["quote text for s1-k2", "quote text for s2-k1"]);
    expect(r.blunders[0].label).toBe("ai_inferred");
    expect(r.warnings.length).toBeGreaterThanOrEqual(2);
  });

  it("keeps 'outdated' only when a visible date/cycle exists in the cited evidence", () => {
    const withDate = finalizeAnalysis({
      checklist, claims, sources,
      proposed: { ...base, blunders: [{ type: "outdated", checklistId: "c1", severity: "medium", description: "Source s1 is dated 2025.", claimIds: ["s1-k1"] }] },
    });
    expect(withDate.blunders).toHaveLength(1);
    expect(withDate.score.factors.some((f) => f.key === "staleness")).toBe(true);

    const noDate = finalizeAnalysis({
      checklist, claims, sources,
      proposed: { ...base, blunders: [{ type: "outdated", checklistId: "c3", severity: "medium", description: "Looks old, no date shown.", claimIds: ["s2-k1"] }] },
    });
    expect(noDate.blunders).toHaveLength(0);
  });

  it("forces 'missing' for checklist items with no verified claim, even if the model omitted them", () => {
    const r = finalizeAnalysis({ checklist, claims, sources, proposed: base });
    const missing = r.missedMoves.filter((m) => m.kind === "missing").map((m) => m.checklistId);
    expect(missing.sort()).toEqual(["c2", "c4", "c5"]); // c2's only claim was unverified
    expect(r.missedMoves.every((m) => m.scope.includes("reviewed source"))).toBe(true);
    expect(r.coverage.find((c) => c.id === "c2")?.status).toBe("missing");
    // high-importance missing item gets an automatic hanging piece and caps the score
    expect(r.hangingPieces.some((h) => h.checklistId === "c2" && h.label === "unknown")).toBe(true);
    expect(r.score.value).toBeLessThanOrEqual(2);
  });

  it("downgrades a model 'missing' to 'unanswered' when claims exist for that item", () => {
    const r = finalizeAnalysis({
      checklist, claims, sources,
      proposed: { ...base, missedMoves: [{ checklistId: "c1", kind: "missing", description: "Eligibility mentioned without detail.", whyItMatters: "Applicants may be ineligible." }] },
    });
    const m = r.missedMoves.find((x) => x.checklistId === "c1");
    expect(m?.kind).toBe("unanswered");
    expect(r.coverage.find((c) => c.id === "c1")?.status).toBe("unanswered");
  });

  it("ranks verify-next by priority, then item importance, and links triggers", () => {
    const r = finalizeAnalysis({
      checklist, claims, sources,
      proposed: {
        ...base,
        blunders: [{ type: "conflict", checklistId: "c3", severity: "high", description: "Deadlines differ between the two sources.", claimIds: ["s1-k2", "s2-k1"] }],
      },
    });
    expect(r.verifyNext[0].relatedChecklistId).toBe("c3");
    expect(r.verifyNext[0].rank).toBe(1);
    expect(r.verifyNext[0].triggers).toContain("b1");
    // auto-added action for high-importance missing item c2 sits above the low-priority contact action
    const idxC2 = r.verifyNext.findIndex((v) => v.relatedChecklistId === "c2");
    const idxLow = r.verifyNext.findIndex((v) => v.priority === "low");
    expect(idxC2).toBeGreaterThan(-1);
    expect(idxC2).toBeLessThan(idxLow);
  });

  it("always includes the disclaimer and a scoped note", () => {
    const r = finalizeAnalysis({ checklist, claims, sources, proposed: base });
    expect(r.disclaimer).toMatch(/reviewed sources only/i);
    expect(r.scopeNote).toContain("Reviewed 2 sources");
  });
});
