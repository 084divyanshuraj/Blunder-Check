import { describe, it, expect } from "vitest";
import { classifySourceProvenance, detectAuthorityMismatch } from "../provenance";
import type { SourceRecord } from "@/schemas";

describe("Source Provenance Classification", () => {
  it("classifies .edu or official circular as Tier 1", () => {
    const s1: SourceRecord = {
      id: "s1",
      kind: "url",
      title: "Official Guidelines Portal",
      url: "https://auroratrust.org/scholarship",
      charCount: 1000,
      status: "ok",
      dateSignals: [],
      text: "Official scholarship guidelines.",
    };
    const res = classifySourceProvenance(s1);
    expect(res.tier).toBe(1);
    expect(res.label).toBe("Official Authority");
  });

  it("classifies student forum as Tier 3", () => {
    const s2: SourceRecord = {
      id: "s2",
      kind: "paste",
      title: "Campus Student Forum FAQ",
      charCount: 1000,
      status: "ok",
      dateSignals: [],
      text: "Unofficial discussion on fees.",
    };
    const res = classifySourceProvenance(s2);
    expect(res.tier).toBe(3);
    expect(res.label).toBe("Community / Unofficial");
  });

  it("detects authority asymmetry when Tier 1 contradicts Tier 3", () => {
    const t1 = classifySourceProvenance({
      id: "s1",
      kind: "url",
      title: "Official Foundation Memo",
      charCount: 1000,
      status: "ok",
      dateSignals: [],
      text: "Memo.",
    });
    const t3 = classifySourceProvenance({
      id: "s2",
      kind: "paste",
      title: "Student Forum Post",
      charCount: 1000,
      status: "ok",
      dateSignals: [],
      text: "Forum.",
    });

    const mismatch = detectAuthorityMismatch([t1, t3]);
    expect(mismatch.hasMismatch).toBe(true);
    expect(mismatch.detail).toContain("High Authority Asymmetry");
  });
});
