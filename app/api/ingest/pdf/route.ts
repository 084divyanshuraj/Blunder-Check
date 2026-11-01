import { NextResponse } from "next/server";
import { LIMITS, SourceIdSchema, type SourceRecord } from "@/schemas";
import { extractPdfText, PdfError } from "@/lib/pdf";
import { truncateToLimit } from "@/lib/text";
import { handleApiError } from "@/lib/api-response";
import { checkApiRateLimit } from "@/lib/ratelimit";

export const maxDuration = 60;

export async function POST(req: Request) {
  const rateLimited = checkApiRateLimit(req);
  if (rateLimited) return rateLimited;

  try {
    const formData = await req.formData();
    const sourceIdRaw = formData.get("sourceId");
    const file = formData.get("file");

    const sourceId = SourceIdSchema.parse(sourceIdRaw);

    if (!file || typeof file === "string" || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: { code: "invalid_request", message: "PDF file is required in 'file' field." } },
        { status: 400 }
      );
    }

    if (file.size > LIMITS.MAX_PDF_BYTES) {
      throw new PdfError(
        "source_too_large",
        `File exceeds maximum limit of ${LIMITS.MAX_PDF_BYTES / (1024 * 1024)} MB.`,
        413
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const extracted = await extractPdfText(arrayBuffer);
    const { text, truncated } = truncateToLimit(extracted.text);

    // Derive title from filename without extension
    const fileName = (file as File).name || "Uploaded PDF";
    const title = fileName.replace(/\.[^/.]+$/, "").slice(0, 200) || "Uploaded Document";

    const source: SourceRecord = {
      id: sourceId,
      kind: "pdf",
      title,
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

