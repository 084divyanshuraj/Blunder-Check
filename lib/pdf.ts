import { extractText } from "unpdf";
import { LIMITS } from "../schemas/limits";
import { cleanText } from "./text";

export class PdfError extends Error {
  code: "pdf_unreadable" | "source_too_large" | "invalid_request";
  status: number;

  constructor(
    code: "pdf_unreadable" | "source_too_large" | "invalid_request",
    message: string,
    status = 422
  ) {
    super(message);
    this.name = "PdfError";
    this.code = code;
    this.status = status;
  }
}

export type ExtractedPdf = {
  text: string;
  totalPages: number;
};

/**
 * Extracts text from a PDF buffer using unpdf (CONTRACTS.md §3).
 * Rejects scanned/image-only PDFs with "pdf_unreadable".
 */
export async function extractPdfText(
  buffer: ArrayBuffer | Uint8Array | Buffer
): Promise<ExtractedPdf> {
  if (!buffer || buffer.byteLength === 0) {
    throw new PdfError("invalid_request", "Empty PDF file provided", 400);
  }

  if (buffer.byteLength > LIMITS.MAX_PDF_BYTES) {
    throw new PdfError(
      "source_too_large",
      `PDF exceeds the maximum allowed size of ${LIMITS.MAX_PDF_BYTES / (1024 * 1024)} MB`,
      413
    );
  }

  let rawResult: { text: string | string[]; totalPages: number };
  try {
    const uint8 = Buffer.isBuffer(buffer)
      ? new Uint8Array(buffer)
      : buffer instanceof Uint8Array
        ? buffer
        : new Uint8Array(buffer);
    rawResult = await extractText(uint8, { mergePages: true });
  } catch (err: unknown) {
    throw new PdfError(
      "pdf_unreadable",
      `Could not read PDF structure: ${err instanceof Error ? err.message : String(err)}`,
      422
    );
  }

  const rawText = Array.isArray(rawResult.text)
    ? rawResult.text.join("\n\n")
    : rawResult.text || "";

  const text = cleanText(rawText);

  if (text.length < LIMITS.MIN_SOURCE_CHARS) {
    throw new PdfError(
      "pdf_unreadable",
      "PDF appears to be scanned or contains no extractable text. Please paste the text instead.",
      422
    );
  }

  return {
    text,
    totalPages: rawResult.totalPages || 1,
  };
}
