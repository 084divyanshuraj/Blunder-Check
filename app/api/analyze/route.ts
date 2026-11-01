import { NextResponse } from "next/server";
import {
  AnalyzeRequestSchema,
  ProposedAnalysisSchema,
  type ProposedAnalysis,
} from "@/schemas";
import { buildAnalyzePrompt } from "@/lib/prompts";
import { generateJson } from "@/lib/gemini";
import { finalizeAnalysis } from "@/lib/reconcile";
import { handleApiError } from "@/lib/api-response";
import { checkApiRateLimit } from "@/lib/ratelimit";

export const maxDuration = 60;

export async function POST(req: Request) {
  const rateLimited = checkApiRateLimit(req);
  if (rateLimited) return rateLimited;

  try {
    const json = await req.json();
    const { question, goal, checklist, sources, claims } =
      AnalyzeRequestSchema.parse(json);

    // Only send verified claims to Gemini
    const verifiedClaims = claims.filter(
      (c) => c.verification.status !== "unverified"
    );

    const { system, user } = buildAnalyzePrompt({
      question,
      goal,
      checklist,
      sources,
      claims: verifiedClaims,
    });

    const proposed = await generateJson<ProposedAnalysis>({
      system,
      user,
      schema: ProposedAnalysisSchema,
      temperature: 0.2,
    });

    // Reconcile and calculate deterministic score in TypeScript
    const finalized = finalizeAnalysis({
      proposed,
      checklist,
      claims,
      sources,
    });

    return NextResponse.json(finalized, { status: 200 });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

