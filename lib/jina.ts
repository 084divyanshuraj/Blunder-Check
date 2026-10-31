import { LIMITS } from "../schemas/limits";
import { cleanText, titleFromText } from "./text";

/**
 * SSRF and safe URL checks (CONTRACTS.md §3).
 * Rejects localhost, .local, internal private IPs, and non-http schemes.
 */
export function assertSafeUrl(urlString: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new Error("Invalid URL format");
  }

  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== "http:" && protocol !== "https:") {
    throw new Error("Only http and https URLs are supported");
  }

  const hostname = parsed.hostname.toLowerCase();

  // Reject localhost and local domain names
  if (hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new Error("Local and internal hostnames are not permitted");
  }

  // Check IPv4 private and loopback ranges
  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, aStr, bStr] = ipv4Match;
    const a = parseInt(aStr, 10);
    const b = parseInt(bStr, 10);

    if (
      a === 0 || // 0.0.0.0/8
      a === 127 || // Loopback 127.0.0.0/8
      a === 10 || // Private 10.0.0.0/8
      (a === 172 && b >= 16 && b <= 31) || // Private 172.16.0.0/12
      (a === 192 && b === 168) || // Private 192.168.0.0/16
      (a === 169 && b === 254) // Link-local 169.254.0.0/16
    ) {
      throw new Error("Private and loopback IP addresses are not permitted");
    }
  }

  // Check IPv6 loopback / private
  if (
    hostname === "::1" ||
    hostname === "[::1]" ||
    hostname.startsWith("fe80:") ||
    hostname.startsWith("[fe80:") ||
    hostname.startsWith("fc00:") ||
    hostname.startsWith("[fc00:") ||
    hostname.startsWith("fd")
  ) {
    throw new Error("Private and loopback IPv6 addresses are not permitted");
  }

  return parsed;
}

export type JinaFetchResult = {
  url: string;
  title: string;
  text: string;
  rawText: string;
};

/**
 * Fetches page content via Jina Reader (https://r.jina.ai/<url>) with timeout and cleaning.
 */
export async function fetchViaJina(
  targetUrl: string,
  apiKeyOverride?: string
): Promise<JinaFetchResult> {
  const parsed = assertSafeUrl(targetUrl);
  const jinaEndpoint = `https://r.jina.ai/${parsed.toString()}`;

  const headers: Record<string, string> = {
    Accept: "text/plain",
    "X-No-Cache": "true",
  };

  const jinaKey = apiKeyOverride || process.env.JINA_API_KEY;
  if (jinaKey) {
    headers.Authorization = `Bearer ${jinaKey}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(jinaEndpoint, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch source: HTTP ${response.status} ${response.statusText}`);
    }

    const rawText = await response.text();
    const title = titleFromText(rawText, parsed.hostname);
    const text = cleanText(rawText);

    if (text.length < LIMITS.MIN_SOURCE_CHARS) {
      throw new Error(
        `Source returned too little readable content (${text.length} chars). Login walls or JS-only sites may require pasting the text directly.`
      );
    }

    return {
      url: parsed.toString(),
      title,
      text,
      rawText,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("abort") || controller.signal.aborted) {
      throw new Error("Fetching URL timed out after 15 seconds. Please paste the text directly.");
    }
    throw new Error(`Failed to reach source URL: ${msg}`);
  } finally {
    clearTimeout(timer);
  }
}

