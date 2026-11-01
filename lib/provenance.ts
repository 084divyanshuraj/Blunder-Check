import type { SourceRecord } from "@/schemas";

export type SourceTier = 1 | 2 | 3;

export interface SourceProvenance {
  tier: SourceTier;
  label: string;
  badge: string;
  color: string;
  rationale: string;
}

/**
 * Classifies a source into an authority tier based on institutional signals.
 * Tier 1: Primary Official Authority (.edu, .gov, .ac.in, circulars, official foundations)
 * Tier 2: Secondary Aggregator / Editorial (aggregators, guide portals, news)
 * Tier 3: Unofficial Community / Student Forum (blogs, forums, user posts)
 */
export function classifySourceProvenance(source: SourceRecord): SourceProvenance {
  const url = (source.url || "").toLowerCase();
  const title = (source.title || "").toLowerCase();
  const text = (source.text || "").toLowerCase().slice(0, 500);

  // Tier 1 checks
  if (
    url.includes(".gov") ||
    url.includes(".edu") ||
    url.includes(".ac.in") ||
    url.includes("auroratrust.org") ||
    url.includes("northfield.edu") ||
    title.includes("official") ||
    title.includes("circular") ||
    title.includes("memo") ||
    title.includes("foundation") ||
    title.includes("handbook") ||
    text.includes("official gazette") ||
    text.includes("office of the registrar") ||
    text.includes("trust circular")
  ) {
    return {
      tier: 1,
      label: "Official Authority",
      badge: "🏛️ Tier 1: Primary Authority",
      color: "text-[#CCFF00] bg-[#CCFF00]/10 border-[#CCFF00]/30",
      rationale: "Direct institutional source with statutory or organizational authority.",
    };
  }

  // Tier 3 checks
  if (
    url.includes("forum") ||
    url.includes("reddit") ||
    url.includes("quora") ||
    url.includes("blog") ||
    title.includes("blog") ||
    title.includes("forum") ||
    title.includes("student discussion") ||
    title.includes("faq") ||
    text.includes("student forum") ||
    text.includes("unofficial blog")
  ) {
    return {
      tier: 3,
      label: "Community / Unofficial",
      badge: "💬 Tier 3: Unofficial / Forum",
      color: "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30",
      rationale: "Community discussion or unofficial blog. Highly prone to unverified claims.",
    };
  }

  // Tier 2 default (Aggregator / Secondary)
  return {
    tier: 2,
    label: "Secondary Aggregator",
    badge: "📰 Tier 2: Aggregator / Media",
    color: "text-[#3B82F6] bg-[#2563EB]/15 border-[#2563EB]/30",
    rationale: "Secondary directory or aggregator. Often carries outdated cycle listings.",
  };
}

/**
 * Detects if a conflict represents an Authority Asymmetry
 * (e.g. an unofficial Tier 3 source contradicting a Tier 1 circular).
 */
export function detectAuthorityMismatch(
  sourceTiers: SourceProvenance[]
): { hasMismatch: boolean; detail?: string } {
  const hasTier1 = sourceTiers.some((s) => s.tier === 1);
  const hasTier3 = sourceTiers.some((s) => s.tier === 3);

  if (hasTier1 && hasTier3) {
    return {
      hasMismatch: true,
      detail:
        "High Authority Asymmetry: A Tier 3 Community post directly contradicts a Tier 1 Official circular. In institutional decisions, official circulars take absolute legal precedence.",
    };
  }

  return { hasMismatch: false };
}

