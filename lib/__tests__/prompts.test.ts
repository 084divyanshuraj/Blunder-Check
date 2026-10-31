import { describe, expect, it } from "vitest";
import {
  SAFETY_BLOCK,
  buildAnalyzePrompt,
  buildChecklistPrompt,
  buildExtractPrompt,
} from "../prompts";
import type { ChecklistItem, SourceMeta, VerifiedClaim } from "../../schemas";

describe("lib/prompts.ts", () => {
  const sampleChecklist: ChecklistItem[] = [
    { id: "c1", item: "Eligibility criteria", importance: "high" },
    { id: "c2", item: "Application deadline", importance: "high" },
  ];

  it("buildChecklistPrompt includes question, goal, and safety block", () => {
    const { system, user } = buildChecklistPrompt({
      question: "What are the rules for Aurora scholarship?",
      goal: "Apply successfully before the deadline",
    });

    expect(system).toContain("You are a research-planning assistant");
    expect(system).toContain(SAFETY_BLOCK);
    expect(user).toContain("Question: What are the rules for Aurora scholarship?");
    expect(user).toContain("Goal: Apply successfully before the deadline");
  });

  it("buildExtractPrompt encloses raw text strictly inside <source> tags", () => {
    const rawText = "Applicants must be under 22 years of age.";
    const { system, user } = buildExtractPrompt({
      sourceId: "s1",
      title: "Aurora Official",
      text: rawText,
      checklist: sampleChecklist,
    });

    expect(system).toContain(SAFETY_BLOCK);
    expect(user).toContain('<source id="s1" title="Aurora Official">');
    expect(user).toContain(rawText);
    expect(user).toContain("</source>");

    // Ensure raw source text does NOT appear outside <source>...</source>
    const beforeTag = user.substring(0, user.indexOf("<source"));
    const afterTag = user.substring(user.indexOf("</source>") + "</source>".length);
    expect(beforeTag).not.toContain(rawText);
    expect(afterTag).not.toContain(rawText);
  });

  it("buildAnalyzePrompt formats claims, sources, and today's date", () => {
    const sampleSources: SourceMeta[] = [
      {
        id: "s1",
        kind: "url",
        title: "Official Page",
        charCount: 500,
        status: "ok",
        dateSignals: [
          {
            kind: "updated",
            value: "12 August 2026",
            quote: "updated on 12 August 2026",
            verification: { status: "exact", start: 0, end: 25 },
          },
        ],
      },
    ];

    const sampleClaims: VerifiedClaim[] = [
      {
        id: "s1-k1",
        sourceId: "s1",
        checklistId: "c1",
        claim: "Must have 85% marks",
        quote: "minimum 85% aggregate marks required",
        visibleDate: null,
        verification: { status: "exact", start: 10, end: 47 },
      },
    ];

    const { system, user } = buildAnalyzePrompt({
      question: "Aurora Scholarship verification",
      goal: "Verify deadline and criteria",
      checklist: sampleChecklist,
      sources: sampleSources,
      claims: sampleClaims,
      today: "2026-11-01",
    });

    expect(system).toContain("Today's date is 2026-11-01.");
    expect(system).toContain(SAFETY_BLOCK);
    expect(user).toContain("c1 [high] Eligibility criteria");
    expect(user).toContain("s1 | Official Page | dates: updated 12 August 2026");
    expect(user).toContain('s1-k1 | c1 | "Must have 85% marks" | quote: "minimum 85% aggregate marks required" | claimDate: none');
  });

  it("matches snapshot for standard prompt structures", () => {
    const checklistPrompt = buildChecklistPrompt({
      question: "Scholarship verification",
      goal: "Check deadlines",
    });
    expect(checklistPrompt).toMatchSnapshot();
  });
});

