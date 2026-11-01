import { NextResponse } from "next/server";
import { CoverageChecklistSchema, CoverageRequestSchema } from "@/schemas";
import { buildChecklistPrompt } from "@/lib/prompts";
import { generateJson } from "@/lib/gemini";
import { handleApiError } from "@/lib/api-response";
import { checkApiRateLimit } from "@/lib/ratelimit";

export const maxDuration = 60;

export async function POST(req: Request) {
  const rateLimited = checkApiRateLimit(req);
  if (rateLimited) return rateLimited;

  try {
    const json = await req.json();
    const validated = CoverageRequestSchema.parse(json);

    const { system, user } = buildChecklistPrompt({
      question: validated.question,
      goal: validated.goal,
    });

    const checklist = await generateJson({
      system,
      user,
      schema: CoverageChecklistSchema,
      temperature: 0.2,
    });

    return NextResponse.json(checklist, { status: 200 });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

