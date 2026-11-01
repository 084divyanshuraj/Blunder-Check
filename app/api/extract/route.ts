import { NextResponse } from "next/server";
import {
  ExtractClaimsResponseSchema,
  ExtractRequestSchema,
  type ExtractClaimsResponse,
  type ExtractResult,
} from "@/schemas";
import { buildExtractPrompt } from "@/lib/prompts";
import { generateJson } from "@/lib/gemini";
import { buildVerifiedClaims, buildVerifiedDateSignals } from "@/lib/verification";
import { handleApiError } from "@/lib/api-response";
import { checkApiRateLimit } from "@/lib/ratelimit";

export const maxDuration = 60;

export async function POST(req: Request) {
  const rateLimited = checkApiRateLimit(req);
  if (rateLimited) return rateLimited;

  try {
    const json = await req.json();
    const { sourceId, title, text, checklist } = ExtractRequestSchema.parse(json);

    const { system, user } = buildExtractPrompt({
      sourceId,
      title,
      text,
      checklist,
    });

    const aiOutput = await generateJson<ExtractClaimsResponse>({
      system,
      user,
      schema: ExtractClaimsResponseSchema,
      temperature: 0.2,
    });

    // Sanitize checklist IDs against the actual input checklist
    const validChecklistIds = new Set(checklist.map((c) => c.id));
    const sanitizedClaims = aiOutput.claims.map((c) => ({
      ...c,
      checklistId: c.checklistId && validChecklistIds.has(c.checklistId) ? c.checklistId : null,
    }));

    // Verify quotes programmatically in code
    const verifiedClaims = buildVerifiedClaims(sourceId, text, sanitizedClaims);
    const { verified: verifiedDateSignals, dropped: droppedDateCount } =
      buildVerifiedDateSignals(text, aiOutput.dateSignals || []);

    const droppedClaimCount = verifiedClaims.filter(
      (c) => c.verification.status === "unverified"
    ).length;

    const warnings: string[] = [];
    if (droppedClaimCount > 0) {
      warnings.push(
        `${droppedClaimCount} quote(s) could not be verified in "${title}" and were excluded.`
      );
    }
    if (droppedDateCount > 0) {
      warnings.push(
        `${droppedDateCount} date signal(s) in "${title}" could not be verified in the source text.`
      );
    }

    const result: ExtractResult = {
      sourceId,
      claims: verifiedClaims,
      dateSignals: verifiedDateSignals,
      droppedClaimCount,
      warnings,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

