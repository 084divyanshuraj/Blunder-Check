import { LIMITS } from "../schemas/limits";

/**
 * Text normalization and cleaning for ingested sources (CONTRACTS.md §7).
 * Rules:
 * - Strip Jina boilerplate headers if present.
 * - Remove images (![alt](url)).
 * - Turn [label](url) into label.
 * - Drop javascript: junk.
 * - Collapse 3+ newlines to 2.
 * - Trim.
 * - Do NOT otherwise rewrite text, so quotes match against what the model sees.
 */
export function cleanText(raw: string): string {
  if (!raw) return "";

  let cleaned = raw;

  // Strip Jina Reader header block if present at the top
  // Typically: "Title: ...\nURL Source: ...\nMarkdown Content:\n"
  cleaned = cleaned.replace(
    /^(?:Title:[^\n]*\n)?(?:URL Source:[^\n]*\n)?(?:Markdown Content:\n)?/i,
    ""
  );

  // Remove markdown images: ![alt](url)
  cleaned = cleaned.replace(/!\[[^\]]*\]\([^)]*\)/g, "");

  // Turn markdown links [label](url) into label
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove javascript: pseudoprotocol lines / junk
  cleaned = cleaned.replace(/javascript:[^\s]+/gi, "");

  // Collapse 3 or more consecutive newlines to 2
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
}

/**
 * Truncates text to configured maximum characters while returning truncation status.
 */
export function truncateToLimit(
  text: string,
  maxChars = LIMITS.MAX_SOURCE_CHARS
): { text: string; truncated: boolean } {
  if (text.length > maxChars) {
    return {
      text: text.slice(0, maxChars),
      truncated: true,
    };
  }
  return {
    text,
    truncated: false,
  };
}

/**
 * Derives a human-readable title from extracted text or markdown.
 */
export function titleFromText(text: string, fallback = "Untitled Source"): string {
  if (!text) return fallback;

  // Check for Jina "Title: ..." header line
  const jinaMatch = text.match(/^Title:\s*([^\n]+)/i);
  if (jinaMatch && jinaMatch[1].trim()) {
    return jinaMatch[1].trim();
  }

  // Check for first markdown "# Heading"
  const headingMatch = text.match(/^#\s+([^\n]+)/m);
  if (headingMatch && headingMatch[1].trim()) {
    return headingMatch[1].trim();
  }

  // Fallback to first non-empty line if short enough
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length > 0 && lines[0].length <= 100 && !lines[0].startsWith("http")) {
    return lines[0];
  }

  return fallback;
}

