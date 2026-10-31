import {
  DISCLAIMER,
  type AnalyzeResult,
  type Blunder,
  type ChecklistCoverage,
  type ChecklistItem,
  type CoverageStatus,
  type EvidenceRef,
  type HangingPiece,
  type Importance,
  type MissedMove,
  type ProposedAnalysis,
  type SourceMeta,
  type VerifiedClaim,
  type VerifyNext,
} from "../schemas";
import { IMPORTANCE_WEIGHT, computeScore, deriveCoverageStatuses } from "./scoring";

/**
 * Turns Gemini's PROPOSED analysis into a trustworthy result.
 * Rules (docs/CONTRACTS.md §6):
 *  - evidence is resolved from claim ids; unknown / unverified ids are dropped
 *  - a conflict needs verified claims from >= 2 different sources
 *  - an "outdated" warning needs a visible date or cycle in the cited evidence
 *  - items with no verified claim are ALWAYS "missing", whatever the model said
 *  - final ordering and the score are computed here
 */

type Args = {
  proposed: ProposedAnalysis;
  checklist: ChecklistItem[];
  /** All claims, including unverified ones (they are filtered here). */
  claims: VerifiedClaim[];
  sources: SourceMeta[];
};

const PRIORITY_WEIGHT: Record<Importance, number> = { high: 3, medium: 2, low: 1 };

export function reconcileAnalysis({ proposed, checklist, claims, sources }: Args) {
  const warnings: string[] = [];
  const usable = claims.filter((c) => c.verification.status !== "unverified");
  const claimById = new Map(usable.map((c) => [c.id, c]));
  const sourceById = new Map(sources.map((s) => [s.id, s]));
  const itemById = new Map(checklist.map((i) => [i.id, i]));
  const validChecklistId = (id: string | null) => (id && itemById.has(id) ? id : null);
  const okSourceCount = sources.filter((s) => s.status !== "failed").length;

  const toEvidence = (claimIds: string[]): EvidenceRef[] => {
    const seen = new Set<string>();
    const out: EvidenceRef[] = [];
    for (const id of claimIds) {
      const c = claimById.get(id);
      if (!c || seen.has(id)) continue;
      seen.add(id);
      out.push({
        claimId: c.id,
        sourceId: c.sourceId,
        claim: c.claim,
        quote: c.quote,
        verification: c.verification,
      });
    }
    return out;
  };

  /* ---- blunders ---- */
  const blunders: Blunder[] = [];
  for (const b of proposed.blunders) {
    const evidence = toEvidence(b.claimIds);
    if (b.type === "conflict") {
      const distinctSources = new Set(evidence.map((e) => e.sourceId)).size;
      if (distinctSources < 2) {
        warnings.push("A proposed conflict was dropped: it did not cite verified claims from two different sources.");
        continue;
      }
    } else {
      const hasVisibleDate = evidence.some((e) => {
        const claim = claimById.get(e.claimId)!;
        const src = sourceById.get(e.sourceId);
        return (
          !!claim.visibleDate ||
          !!src?.dateSignals.some((d) => d.kind === "published" || d.kind === "updated" || d.kind === "cycle")
        );
      });
      if (evidence.length === 0 || !hasVisibleDate) {
        warnings.push("A proposed outdated-information warning was dropped: no visible date or cycle in the cited evidence.");
        continue;
      }
    }
    blunders.push({
      id: `b${blunders.length + 1}`,
      type: b.type,
      checklistId: validChecklistId(b.checklistId),
      severity: b.severity,
      description: b.description,
      evidence,
      label: "ai_inferred",
    });
  }

  /* ---- coverage + missed moves ---- */
  const claimedIds = new Set(usable.map((c) => c.checklistId).filter((x): x is string => !!x && itemById.has(x)));
  const conflictedIds = new Set(
    blunders.filter((b) => b.type === "conflict" && b.checklistId).map((b) => b.checklistId as string),
  );
  const proposedMissed = new Map(proposed.missedMoves.map((m) => [m.checklistId, m]));
  const n = okSourceCount;
  const plural = n === 1 ? "" : "s";

  const missedMoves: MissedMove[] = [];
  for (const item of checklist) {
    const p = proposedMissed.get(item.id);
    if (!claimedIds.has(item.id)) {
      missedMoves.push({
        id: `m${missedMoves.length + 1}`,
        checklistId: item.id,
        kind: "missing",
        importance: item.importance,
        description: p?.description ?? `No reviewed source established: ${item.item}.`,
        whyItMatters:
          p?.whyItMatters ?? "A complete answer needs this item, but the reviewed sources do not establish it.",
        scope: `Not found in the ${n} reviewed source${plural}.`,
        label: "unknown",
      });
    } else if (p) {
      missedMoves.push({
        id: `m${missedMoves.length + 1}`,
        checklistId: item.id,
        kind: "unanswered",
        importance: item.importance,
        description: p.description,
        whyItMatters: p.whyItMatters,
        scope: `Mentioned, but not fully established in the ${n} reviewed source${plural}.`,
        label: "unknown",
      });
    }
  }
  const unansweredIds = new Set(missedMoves.filter((m) => m.kind === "unanswered").map((m) => m.checklistId));

  const statuses = deriveCoverageStatuses({ checklist, claimedIds, conflictedIds, unansweredIds });
  const coverage: ChecklistCoverage[] = checklist.map((item) => ({
    ...item,
    status: statuses[item.id],
    supportingClaimIds: usable.filter((c) => c.checklistId === item.id).map((c) => c.id),
  }));

  /* ---- hanging pieces ---- */
  const hangingPieces: HangingPiece[] = [];
  for (const h of proposed.hangingPieces) {
    const cid = validChecklistId(h.checklistId);
    hangingPieces.push({
      id: `h${hangingPieces.length + 1}`,
      checklistId: cid,
      impact: h.impact,
      description: h.description,
      label: cid && statuses[cid] === "missing" ? "unknown" : "ai_inferred",
    });
  }
  for (const item of checklist) {
    if (item.importance === "high" && statuses[item.id] === "missing" && !hangingPieces.some((h) => h.checklistId === item.id)) {
      hangingPieces.push({
        id: `h${hangingPieces.length + 1}`,
        checklistId: item.id,
        impact: "high",
        description: `High-impact item not established in the reviewed sources: ${item.item}.`,
        label: "unknown",
      });
    }
  }

  /* ---- verify next ---- */
  type Draft = Omit<VerifyNext, "id" | "rank" | "triggers">;
  const drafts: Draft[] = proposed.verifyNext.map((v) => ({
    priority: v.priority,
    action: v.action,
    reason: v.reason,
    whereToVerify: v.whereToVerify,
    relatedChecklistId: validChecklistId(v.relatedChecklistId),
    label: "ai_inferred",
  }));
  for (const item of checklist) {
    const st = statuses[item.id];
    if (item.importance === "high" && st !== "covered" && !drafts.some((d) => d.relatedChecklistId === item.id)) {
      drafts.push({
        priority: "high",
        action: `Confirm from the official source: ${item.item}.`,
        reason:
          st === "conflicted"
            ? "Reviewed sources disagree on this item."
            : st === "missing"
              ? "Not found in the reviewed sources."
              : "Mentioned, but not fully established in the reviewed sources.",
        whereToVerify: "The official notice or website of the issuing organisation, not a third-party page.",
        relatedChecklistId: item.id,
        label: "ai_inferred",
      });
    }
  }

  const outdatedIds = new Set(blunders.filter((b) => b.type === "outdated" && b.checklistId).map((b) => b.checklistId as string));
  const boostFor = (cid: string | null) => {
    if (!cid) return 0;
    const st = statuses[cid];
    const base = st === "conflicted" ? 3 : st === "missing" ? 2 : st === "unanswered" ? 1 : 0;
    return Math.max(base, outdatedIds.has(cid) ? 1 : 0);
  };
  const importanceFor = (cid: string | null) => (cid ? IMPORTANCE_WEIGHT[itemById.get(cid)!.importance] : 0);

  const ranked = drafts
    .map((d, index) => ({ d, index }))
    .sort(
      (a, b) =>
        PRIORITY_WEIGHT[b.d.priority] - PRIORITY_WEIGHT[a.d.priority] ||
        importanceFor(b.d.relatedChecklistId) - importanceFor(a.d.relatedChecklistId) ||
        boostFor(b.d.relatedChecklistId) - boostFor(a.d.relatedChecklistId) ||
        a.index - b.index,
    );

  const verifyNext: VerifyNext[] = ranked.map(({ d }, i) => {
    const cid = d.relatedChecklistId;
    const triggers = cid
      ? [
          ...blunders.filter((b) => b.checklistId === cid).map((b) => b.id),
          ...missedMoves.filter((m) => m.checklistId === cid).map((m) => m.id),
          ...hangingPieces.filter((h) => h.checklistId === cid).map((h) => h.id),
        ]
      : [];
    return { ...d, id: `v${i + 1}`, rank: i + 1, triggers };
  });

  return {
    coverage,
    statuses: statuses as Record<string, CoverageStatus>,
    blunders,
    missedMoves,
    hangingPieces,
    verifyNext,
    outdatedCount: blunders.filter((b) => b.type === "outdated").length,
    verifiedClaimCount: usable.length,
    warnings,
  };
}

/** Reconcile + score + scope note. This is what POST /api/analyze returns. */
export function finalizeAnalysis(args: Args): AnalyzeResult {
  const r = reconcileAnalysis(args);
  const score = computeScore({
    checklist: args.checklist,
    statuses: r.statuses,
    outdatedCount: r.outdatedCount,
    verifiedClaimCount: r.verifiedClaimCount,
  });

  const warnings = [...r.warnings];
  const failed = args.sources.filter((s) => s.status === "failed").length;
  if (failed) warnings.push(`${failed} source(s) could not be read and were excluded.`);
  const truncated = args.sources.filter((s) => s.status === "truncated").length;
  if (truncated) warnings.push(`${truncated} source(s) were truncated; later text was not reviewed.`);
  const unverified = args.claims.length - r.verifiedClaimCount;
  if (unverified > 0) {
    warnings.push(`${unverified} extracted claim(s) were excluded because their quotation was not found in the cited source.`);
  }

  const used = args.sources.filter((s) => s.status !== "failed");
  const scopeNote = `Reviewed ${used.length} source${used.length === 1 ? "" : "s"}: ${used.map((s) => s.title || s.id).join("; ")}.`;

  return {
    evalReasoning: args.proposed.evalReasoning,
    coverage: r.coverage,
    blunders: r.blunders,
    missedMoves: r.missedMoves,
    hangingPieces: r.hangingPieces,
    verifyNext: r.verifyNext,
    score,
    warnings,
    scopeNote,
    disclaimer: DISCLAIMER,
  };
}
