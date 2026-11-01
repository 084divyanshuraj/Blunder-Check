import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { GeminiError } from "./gemini";
import { PdfError } from "./pdf";

/**
 * Common API error handler adhering to CONTRACTS.md §2.
 * Returns { error: { code: string, message: string } } with appropriate HTTP status.
 */
export function handleApiError(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    const message = err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    return NextResponse.json(
      { error: { code: "invalid_request", message: `Validation error: ${message}` } },
      { status: 400 }
    );
  }

  if (err instanceof GeminiError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message } },
      { status: err.status }
    );
  }

  if (err instanceof PdfError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message } },
      { status: err.status }
    );
  }

  const message = err instanceof Error ? err.message : String(err);

  if (message.includes("too little readable content") || message.includes("timed out") || message.includes("Failed to reach")) {
    return NextResponse.json(
      { error: { code: "source_unreachable", message } },
      { status: 422 }
    );
  }

  return NextResponse.json(
    { error: { code: "internal", message: "An unexpected error occurred." } },
    { status: 500 }
  );
}

