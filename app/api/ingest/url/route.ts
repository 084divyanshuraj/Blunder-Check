import { NextResponse } from "next/server";
import { z } from "zod";
import { SourceIdSchema, type SourceRecord } from "@/schemas";
import { fetchViaJina } from "@/lib/jina";
import { truncateToLimit } from "@/lib/text";
import { handleApiError } from "@/lib/api-response";
import { checkApiRateLimit } from "@/lib/ratelimit";

export const maxDuration = 60;

const UrlIngestRequestSchema = z.object({
  sourceId: SourceIdSchema,
  url: z.string().url(),
});

export async function POST(req: Request) {
  const rateLimited = checkApiRateLimit(req);
  if (rateLimited) return rateLimited;

  try {
    const json = await req.json();
    const { sourceId, url } = UrlIngestRequestSchema.parse(json);

    const fetched = await fetchViaJina(url);
    const { text, truncated } = truncateToLimit(fetched.text);

    const source: SourceRecord = {
      id: sourceId,
      kind: "url",
      url: fetched.url,
      title: fetched.title,
      charCount: text.length,
      status: truncated ? "truncated" : "ok",
      dateSignals: [],
      text,
    };

    return NextResponse.json({ source }, { status: 200 });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

