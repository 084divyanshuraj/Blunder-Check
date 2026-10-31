import { describe, expect, it, vi } from "vitest";
import { extractPdfText, PdfError } from "../pdf";
import * as unpdf from "unpdf";

vi.mock("unpdf", () => ({
  extractText: vi.fn(),
}));

describe("lib/pdf.ts", () => {
  it("throws invalid_request on empty buffer", async () => {
    await expect(extractPdfText(new Uint8Array([]))).rejects.toMatchObject({
      code: "invalid_request",
      status: 400,
    });
  });

  it("throws source_too_large when exceeding 5MB limit", async () => {
    const hugeBuffer = new Uint8Array(5 * 1024 * 1024 + 10);
    await expect(extractPdfText(hugeBuffer)).rejects.toMatchObject({
      code: "source_too_large",
      status: 413,
    });
  });

  it("throws pdf_unreadable when extracted text is less than 50 chars (scanned pdf)", async () => {
    vi.mocked(unpdf.extractText).mockResolvedValueOnce({
      text: "Scanned image only",
      totalPages: 1,
    });

    const dummy = new Uint8Array([37, 80, 68, 70]); // %PDF
    await expect(extractPdfText(dummy)).rejects.toMatchObject({
      code: "pdf_unreadable",
      status: 422,
    });
  });

  it("extracts and cleans text from readable PDF", async () => {
    const sampleText =
      "Aurora Merit Scholarship Foundation Guidelines.\nApplications must be submitted online before 22 November 2026. Required documents: 10th and 12th marksheets, residence certificate.";

    vi.mocked(unpdf.extractText).mockResolvedValueOnce({
      text: sampleText,
      totalPages: 2,
    });

    const dummy = new Uint8Array([37, 80, 68, 70]);
    const result = await extractPdfText(dummy);

    expect(result.totalPages).toBe(2);
    expect(result.text).toContain("Aurora Merit Scholarship Foundation Guidelines");
    expect(result.text.length).toBeGreaterThanOrEqual(50);
  });

  it("handles unpdf parsing failure gracefully as pdf_unreadable", async () => {
    vi.mocked(unpdf.extractText).mockRejectedValueOnce(new Error("Corrupt stream"));

    const dummy = new Uint8Array([37, 80, 68, 70]);
    await expect(extractPdfText(dummy)).rejects.toMatchObject({
      code: "pdf_unreadable",
      status: 422,
    });
  });
});

