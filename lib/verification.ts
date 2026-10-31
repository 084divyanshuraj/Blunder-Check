import type {
  DateSignal,
  ExtractedClaim,
  QuoteVerification,
  VerifiedClaim,
  VerifiedDateSignal,
} from "../schemas";

/**
 * Quote verification. AI proposes quotes; THIS code decides whether they exist.
 * A match proves the text is present in the cited source. It does NOT prove the
 * quote supports the AI's interpretation of it.
 */

const UNVERIFIED: QuoteVerification = { status: "unverified", start: null, end: null };

type Normalized = { norm: string; map: number[] };

/**
 * Normalizes text for forgiving comparison and keeps a map from every
 * normalized UTF-16 index back to the index in the ORIGINAL text.
 * Rules: drop zero-width chars, collapse whitespace, NFKC, curly quotes and
 * dashes to ASCII, lowercase. Nothing else (no stemming, no fuzzy matching).
 */
export function normalizeWithMap(input: string): Normalized {
  let norm = "";
  const map: number[] = [];
  let lastWasSpace = true; // also trims leading whitespace

  for (let i = 0; i < input.length; i++) {
    const original = input[i];
    if (/[​-‍﻿­]/.test(original)) continue;

    if (/\s/.test(original)) {
      if (lastWasSpace) continue;
      norm += " ";
      map.push(i);
      lastWasSpace = true;
      continue;
    }

    const ch = original
      .normalize("NFKC")
      .replace(/[‘’‚‛′]/g, "'")
      .replace(/[“”„‟″]/g, '"')
      .replace(/[‐-―−]/g, "-")
      .toLowerCase();

    for (let k = 0; k < ch.length; k++) {
      norm += ch[k];
      map.push(i);
    }
    lastWasSpace = false;
  }

  if (norm.endsWith(" ")) {
    norm = norm.slice(0, -1);
    map.pop();
  }
  return { norm, map };
}

export function verifyQuote(sourceText: string, quote: string, minLength = 8): QuoteVerification {
  const q = quote.trim();
  if (q.length < minLength) return UNVERIFIED;

  const exact = sourceText.indexOf(q);
  if (exact !== -1) return { status: "exact", start: exact, end: exact + q.length };

  const qn = normalizeWithMap(q).norm;
  if (qn.length < minLength) return UNVERIFIED;

  const src = normalizeWithMap(sourceText);
  const idx = src.norm.indexOf(qn);
  if (idx === -1) return UNVERIFIED;

  return {
    status: "normalized",
    start: src.map[idx],
    end: src.map[idx + qn.length - 1] + 1,
  };
}

/** Verifies claims against THEIR OWN source only. Ids are assigned here, not by the model. */
export function buildVerifiedClaims(
  sourceId: string,
  sourceText: string,
  claims: ExtractedClaim[],
): VerifiedClaim[] {
  return claims.map((c, i) => ({
    ...c,
    id: `${sourceId}-k${i + 1}`,
    sourceId,
    verification: verifyQuote(sourceText, c.quote),
  })) as VerifiedClaim[];
}

/** Date signals whose quote cannot be found are dropped (never trust an unseen date). */
export function buildVerifiedDateSignals(
  sourceText: string,
  signals: DateSignal[],
): { verified: VerifiedDateSignal[]; dropped: number } {
  const verified: VerifiedDateSignal[] = [];
  for (const s of signals) {
    const verification = verifyQuote(sourceText, s.quote);
    if (verification.status !== "unverified") verified.push({ ...s, verification });
  }
  return { verified, dropped: signals.length - verified.length };
}
