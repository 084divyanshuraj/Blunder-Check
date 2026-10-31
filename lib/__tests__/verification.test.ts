import { describe, expect, it } from "vitest";
import { buildVerifiedClaims, buildVerifiedDateSignals, normalizeWithMap, verifyQuote } from "../verification";

const SRC = `The award is Rs. 50,000 per academic year, paid directly to the
student’s bank account.\n\nApplicants must   have scored at least 85% in Class XII.`;

describe("verifyQuote", () => {
  it("finds an exact quote and returns correct offsets", () => {
    const q = "Applicants must   have scored at least 85% in Class XII.";
    const r = verifyQuote(SRC, q);
    expect(r.status).toBe("exact");
    expect(SRC.slice(r.start!, r.end!)).toBe(q);
  });

  it("matches across newlines, curly quotes and odd whitespace (normalized)", () => {
    const r = verifyQuote(SRC, "paid directly to the student's bank account.");
    expect(r.status).toBe("normalized");
    expect(SRC.slice(r.start!, r.end!)).toContain("student’s bank account.");
  });

  it("is case-insensitive in normalized mode and maps offsets back to the original", () => {
    const r = verifyQuote(SRC, "APPLICANTS MUST HAVE SCORED AT LEAST 85% IN CLASS XII.");
    expect(r.status).toBe("normalized");
    expect(SRC.slice(r.start!, r.end!)).toBe("Applicants must   have scored at least 85% in Class XII.");
  });

  it("rejects paraphrases, ellipses and invented text", () => {
    expect(verifyQuote(SRC, "Students need at least 85 percent in Class 12.").status).toBe("unverified");
    expect(verifyQuote(SRC, "The award is Rs. 50,000 ... paid directly").status).toBe("unverified");
    expect(verifyQuote(SRC, "The award is Rs. 90,000 per academic year").status).toBe("unverified");
  });

  it("rejects quotes that are too short", () => {
    expect(verifyQuote(SRC, "Class X").status).toBe("unverified"); // 7 chars, below the 8-char minimum
  });

  it("normalizeWithMap keeps map length equal to normalized length", () => {
    const { norm, map } = normalizeWithMap("  Hello  World ​ ");
    expect(norm).toBe("hello world");
    expect(map).toHaveLength(norm.length);
  });
});

describe("buildVerifiedClaims", () => {
  it("verifies a claim only against its own source text and assigns server ids", () => {
    const sourceA = "The last date to submit applications is 15 November 2026.";
    const sourceB = "Completely different text about hostels and mess fees.";
    const claim = {
      checklistId: "c3",
      claim: "Deadline is 15 Nov 2026",
      quote: "The last date to submit applications is 15 November 2026.",
      visibleDate: null,
    };
    expect(buildVerifiedClaims("s1", sourceA, [claim])[0].verification.status).toBe("exact");
    const wrong = buildVerifiedClaims("s2", sourceB, [claim])[0];
    expect(wrong.verification.status).toBe("unverified");
    expect(wrong.id).toBe("s2-k1");
    expect(wrong.sourceId).toBe("s2");
  });
});

describe("buildVerifiedDateSignals", () => {
  it("drops date signals whose quote is not in the source", () => {
    const text = "Last updated: 12 August 2026\nBody text.";
    const { verified, dropped } = buildVerifiedDateSignals(text, [
      { kind: "updated", value: "12 August 2026", quote: "Last updated: 12 August 2026" },
      { kind: "published", value: "1 January 2020", quote: "Published on 1 January 2020" },
    ]);
    expect(verified).toHaveLength(1);
    expect(dropped).toBe(1);
  });
});
