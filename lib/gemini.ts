import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

/**
 * Gemini client and structured JSON generation helper.
 * Follows CONTRACTS.md §4:
 * - SDK @google/genai, model from GEMINI_MODEL
 * - JSON output with responseSchema fallback
 * - Zod schema safeParse
 * - Retry once on schema validation error
 * - 429 / 5xx retry with 1.5s backoff, then 502 ai_unavailable
 * - Timeout support
 */

export class GeminiError extends Error {
  code: "ai_invalid_output" | "ai_unavailable" | "internal";
  status: number;

  constructor(code: "ai_invalid_output" | "ai_unavailable" | "internal", message: string, status = 500) {
    super(message);
    this.name = "GeminiError";
    this.code = code;
    this.status = status;
  }
}

export type GenerateJsonOptions<T> = {
  system?: string;
  user: string;
  schema: z.ZodType<T>;
  temperature?: number;
  maxRetries?: number;
  timeoutMs?: number;
  model?: string;
  client?: GoogleGenAI;
};

/**
 * Strips keywords from JSON Schema that Gemini rejects.
 */
export function sanitizeJsonSchema(node: unknown): unknown {
  if (!node || typeof node !== "object") return node;
  if (Array.isArray(node)) return node.map(sanitizeJsonSchema);

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    if (["$schema", "additionalProperties", "pattern", "format", "default"].includes(k)) {
      continue;
    }
    out[k] = sanitizeJsonSchema(v);
  }
  return out;
}

export function prepareJsonSchema(schema: z.ZodType<unknown>): unknown {
  try {
    const raw = z.toJSONSchema(schema);
    return sanitizeJsonSchema(raw);
  } catch {
    return undefined;
  }
}

function isTransientError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const status = (err as { status?: number; statusCode?: number }).status ?? (err as { statusCode?: number }).statusCode;
  if (status === 429 || (typeof status === "number" && status >= 500 && status < 600)) {
    return true;
  }
  const msg = String((err as Error).message ?? "").toLowerCase();
  return msg.includes("resource_exhausted") || msg.includes("unavailable") || msg.includes("overloaded") || msg.includes("high demand");
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function generateJson<T>({
  system,
  user,
  schema,
  temperature = 0.2,
  maxRetries = 1,
  timeoutMs = 45_000,
  model: modelOverride,
  client: injectedClient,
}: GenerateJsonOptions<T>): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey && !injectedClient) {
    throw new GeminiError("internal", "GEMINI_API_KEY is not set", 500);
  }

  const ai = injectedClient ?? new GoogleGenAI({ apiKey });
  const model = modelOverride || process.env.GEMINI_MODEL || "gemini-3.5-flash";
  const responseSchema = prepareJsonSchema(schema);

  let currentUserPrompt = user;
  let validationRetriesLeft = maxRetries;

  while (true) {
    const contents = system
      ? `System Instruction:\n${system}\n\nTask:\n${currentUserPrompt}`
      : currentUserPrompt;

    const callApi = async () => {
      const config: Record<string, unknown> = {
        temperature,
        responseMimeType: "application/json",
      };
      if (responseSchema) {
        config.responseSchema = responseSchema;
      }

      // Timeout wrapper
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await Promise.race([
          ai.models.generateContent({
            model,
            contents,
            config,
          }),
          new Promise<never>((_, reject) => {
            controller.signal.addEventListener("abort", () => {
              reject(new GeminiError("ai_unavailable", `Gemini request timed out after ${timeoutMs}ms`, 502));
            });
          }),
        ]);
        return response;
      } finally {
        clearTimeout(timer);
      }
    };

    // Execute with 429/5xx transient backoff retry
    let responseText: string | undefined;
    try {
      const response = await callApi();
      responseText = response.text;
    } catch (err: unknown) {
      if (err instanceof GeminiError) throw err;

      if (isTransientError(err)) {
        // Wait 1.5s and retry once
        await sleep(1500);
        try {
          const retriedResponse = await callApi();
          responseText = retriedResponse.text;
        } catch (retryErr: unknown) {
          throw new GeminiError(
            "ai_unavailable",
            `Gemini service unavailable after retry: ${retryErr instanceof Error ? retryErr.message : String(retryErr)}`,
            502
          );
        }
      } else {
        throw new GeminiError(
          "ai_unavailable",
          `Gemini API error: ${err instanceof Error ? err.message : String(err)}`,
          502
        );
      }
    }

    if (!responseText) {
      if (validationRetriesLeft > 0) {
        validationRetriesLeft--;
        currentUserPrompt += "\n\n[Previous response was empty. Return ONLY a valid JSON object matching the requested schema.]";
        continue;
      }
      throw new GeminiError("ai_invalid_output", "Gemini returned empty response", 422);
    }

    // Attempt parsing JSON
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(responseText.trim());
    } catch (jsonErr) {
      if (validationRetriesLeft > 0) {
        validationRetriesLeft--;
        currentUserPrompt += `\n\n[Previous response was not valid JSON: ${(jsonErr as Error).message}. Return ONLY raw valid JSON, no markdown fences.]`;
        continue;
      }
      throw new GeminiError("ai_invalid_output", `Invalid JSON returned by AI: ${(jsonErr as Error).message}`, 422);
    }

    // Validate with Zod
    const validated = schema.safeParse(parsedJson);
    if (validated.success) {
      return validated.data;
    }

    // Validation failed
    const errorDetails = JSON.stringify(validated.error.issues.map((i) => ({ path: i.path, message: i.message })));
    if (validationRetriesLeft > 0) {
      validationRetriesLeft--;
      currentUserPrompt += `\n\n[Previous response did not match the schema: ${errorDetails}. Please fix and return valid JSON.]`;
      continue;
    }

    throw new GeminiError(
      "ai_invalid_output",
      `AI response failed schema validation: ${errorDetails}`,
      422
    );
  }
}

