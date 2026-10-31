import { describe, expect, it } from "vitest";
import type { ChecklistItem, CoverageStatus } from "../../schemas";
import { computeScore, deriveCoverageStatuses } from "../scoring";

// Same checklist as the worked examples in docs/SCORING_SPEC.md (total weight 17)
const checklist: ChecklistItem[] = [
  { id: "c1", item: "Eligibility criteria", importance: "high" },
  { id: "c2", item: "Required documents", importance: "high" },
  { id: "c3", item: "Current deadline", importance: "high" },
  { id: "c4", item: "How to apply", importance: "medium" },
  { id: "c5", item: "Award amount", importance: "medium" },
  { id: "c6", item: "Selection process", importance: "medium" },
  { id: "c7", item: "Contact details", importance: "low" },
  { id: "c8", item: "Appeal process", importance: "low" },
];

const all = (s: CoverageStatus): Record<string, CoverageStatus> =>
  Object.fromEntries(checklist.map((i) => [i.id, s]));

describe("computeScore", () => {
  it("Example A: everything covered, no penalties -> +5.0", () => {
    const r = computeScore({ checklist, statuses: all("covered"), outdatedCount: 0, verifiedClaimCount: 8 });
    expect(r.value).toBe(5);
    expect(r.coverage).toBe(1);
    expect(r.capApplied).toBeNull();
  });

  it("Example B: mixed statuses + 1 outdated warning -> 0.6", () => {
    const statuses: Record<string, CoverageStatus> = {
      c1: "covered",
      c2: "conflicted",
      c3: "missing",
      c4: "covered",
      c5: "covered",
      c6: "unanswered",
      c7: "covered",
      c8: "missing",
    };
    const r = computeScore({ checklist, statuses, outdatedCount: 1, verifiedClaimCount: 6 });
    // credit = 3 + 1.5 + 0 + 2 + 2 + 0.8 + 1 + 0 = 10.3 ; 10.3/17 = 0.606 ; base 1.059 ; -0.5 -> 0.559
    expect(r.coverage).toBe(0.606);
    expect(r.value).toBe(0.6);
    expect(r.capApplied).toBeNull(); // 0.6 is already below the 2.0 cap
  });

  it("Example C: one high item missing caps the score at 2.0", () => {
    const statuses = { ...all("covered"), c3: "missing" as CoverageStatus };
    const r = computeScore({ checklist, statuses, outdatedCount: 0, verifiedClaimCount: 7 });
    // coverage 14/17 = 0.824 ; base 3.235 -> capped to 2.0
    expect(r.value).toBe(2);
    expect(r.capApplied?.cap).toBe(2);
  });

  it("Example D: high item conflicted caps the score at 3.0", () => {
    const statuses = { ...all("covered"), c2: "conflicted" as CoverageStatus };
    const r = computeScore({ checklist, statuses, outdatedCount: 0, verifiedClaimCount: 8 });
    // coverage 15.5/17 = 0.912 ; base 4.118 -> capped to 3.0
    expect(r.value).toBe(3);
    expect(r.capApplied?.cap).toBe(3);
  });

  it("Example E: no verified claims -> -5.0", () => {
    const r = computeScore({ checklist, statuses: all("missing"), outdatedCount: 0, verifiedClaimCount: 0 });
    expect(r.value).toBe(-5);
  });

  it("staleness penalty is capped at 1.5", () => {
    const r = computeScore({ checklist, statuses: all("covered"), outdatedCount: 9, verifiedClaimCount: 8 });
    expect(r.value).toBe(3.5);
  });

  it("is deterministic and never leaves -5..+5", () => {
    for (const s of ["covered", "missing", "conflicted", "unanswered"] as CoverageStatus[]) {
      const r = computeScore({ checklist, statuses: all(s), outdatedCount: 5, verifiedClaimCount: 1 });
      expect(r.value).toBeGreaterThanOrEqual(-5);
      expect(r.value).toBeLessThanOrEqual(5);
    }
  });
});

describe("deriveCoverageStatuses", () => {
  it("missing when no verified claim; lowest credit wins when both flags are set", () => {
    const s = deriveCoverageStatuses({
      checklist: checklist.slice(0, 3),
      claimedIds: new Set(["c1", "c2"]),
      conflictedIds: new Set(["c2"]),
      unansweredIds: new Set(["c2"]),
    });
    expect(s).toEqual({ c1: "covered", c2: "unanswered", c3: "missing" });
  });
});
