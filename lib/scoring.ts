import type {
  ChecklistItem,
  CoverageStatus,
  Importance,
  ScoreFactor,
  ScoreResult,
} from "../schemas";

/**
 * "Information Position" score. Deterministic. Gemini NEVER picks this number.
 * Spec: docs/SCORING_SPEC.md. Bump SCORING_VERSION if any constant/rule changes.
 */
export const SCORING_VERSION = "v1";

export const IMPORTANCE_WEIGHT: Record<Importance, number> = { high: 3, medium: 2, low: 1 };

export const STATUS_CREDIT: Record<CoverageStatus, number> = {
  covered: 1,
  conflicted: 0.5,
  unanswered: 0.4,
  missing: 0,
};

const STALE_PENALTY_EACH = 0.5;
const STALE_PENALTY_CAP = 1.5;
/** A high-importance item that is missing: the position can never look better than this. */
const CAP_HIGH_MISSING = 2.0;
/** A high-importance item that is only conflicted/unanswered. */
const CAP_HIGH_PARTIAL = 3.0;

const round1 = (n: number) => Math.round(n * 10) / 10;
const round3 = (n: number) => Math.round(n * 1000) / 1000;

export function deriveCoverageStatuses(args: {
  checklist: ChecklistItem[];
  /** checklist ids that have at least one VERIFIED claim */
  claimedIds: Set<string>;
  conflictedIds: Set<string>;
  unansweredIds: Set<string>;
}): Record<string, CoverageStatus> {
  const out: Record<string, CoverageStatus> = {};
  for (const item of args.checklist) {
    if (!args.claimedIds.has(item.id)) {
      out[item.id] = "missing";
      continue;
    }
    const candidates: CoverageStatus[] = ["covered"];
    if (args.conflictedIds.has(item.id)) candidates.push("conflicted");
    if (args.unansweredIds.has(item.id)) candidates.push("unanswered");
    // lowest credit wins
    out[item.id] = candidates.sort((a, b) => STATUS_CREDIT[a] - STATUS_CREDIT[b])[0];
  }
  return out;
}

export function computeScore(args: {
  checklist: ChecklistItem[];
  statuses: Record<string, CoverageStatus>;
  /** number of reconciled "outdated" blunders (each needs a visible date/cycle) */
  outdatedCount: number;
  verifiedClaimCount: number;
}): ScoreResult {
  const { checklist, statuses, outdatedCount, verifiedClaimCount } = args;

  if (verifiedClaimCount === 0 || checklist.length === 0) {
    return {
      value: -5,
      coverage: 0,
      version: SCORING_VERSION,
      factors: [
        {
          key: "no_evidence",
          label: "No verified evidence",
          delta: -5,
          detail: "No claim with a verified quotation was found in the reviewed sources.",
        },
      ],
      capApplied: null,
    };
  }

  let totalWeight = 0;
  let earned = 0;
  for (const item of checklist) {
    const w = IMPORTANCE_WEIGHT[item.importance];
    totalWeight += w;
    earned += w * STATUS_CREDIT[statuses[item.id] ?? "missing"];
  }
  const coverage = earned / totalWeight;
  const base = -5 + 10 * coverage;

  const factors: ScoreFactor[] = [
    {
      key: "coverage",
      label: "Importance-weighted coverage",
      delta: round1(base),
      detail: `${Math.round(coverage * 100)}% of weighted checklist items are established by verified quotations (conflicted items count half, unanswered items 40%).`,
    },
  ];

  let value = base;

  const stalePenalty = Math.min(STALE_PENALTY_CAP, STALE_PENALTY_EACH * outdatedCount);
  if (stalePenalty > 0) {
    value -= stalePenalty;
    factors.push({
      key: "staleness",
      label: "Possibly outdated information",
      delta: -stalePenalty,
      detail: `${outdatedCount} outdated-information warning(s), each backed by a visible date or cycle.`,
    });
  }

  let capApplied: ScoreResult["capApplied"] = null;
  const highs = checklist.filter((i) => i.importance === "high");
  const highMissing = highs.some((i) => statuses[i.id] === "missing");
  const highPartial = highs.some((i) => statuses[i.id] === "conflicted" || statuses[i.id] === "unanswered");

  if (highMissing && value > CAP_HIGH_MISSING) {
    capApplied = {
      cap: CAP_HIGH_MISSING,
      reason: "A high-importance checklist item is not found in the reviewed sources.",
    };
    value = CAP_HIGH_MISSING;
  } else if (!highMissing && highPartial && value > CAP_HIGH_PARTIAL) {
    capApplied = {
      cap: CAP_HIGH_PARTIAL,
      reason: "A high-importance checklist item is conflicted or not fully established.",
    };
    value = CAP_HIGH_PARTIAL;
  }
  if (capApplied) {
    factors.push({
      key: "cap",
      label: "High-importance gap cap",
      delta: round1(capApplied.cap - (base - stalePenalty)),
      detail: capApplied.reason,
    });
  }

  value = Math.max(-5, Math.min(5, value));
  return {
    value: round1(value),
    coverage: round3(coverage),
    version: SCORING_VERSION,
    factors,
    capApplied,
  };
}
