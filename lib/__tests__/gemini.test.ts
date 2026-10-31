import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { GeminiError, generateJson, sanitizeJsonSchema } from "../gemini";
import type { GoogleGenAI } from "@google/genai";

describe("lib/gemini.ts", () => {
  const testSchema = z.object({
    status: z.enum(["ok", "failed"]),
    count: z.number(),
  });

  it("sanitizes forbidden keywords from json schema", () => {
    const raw = {
      $schema: "http://example.com",
      type: "object",
      additionalProperties: false,
      properties: {
        text: { type: "string", format: "date", pattern: "^[a-z]+$" },
      },
    };
    const cleaned = sanitizeJsonSchema(raw) as any;
    expect(cleaned.$schema).toBeUndefined();
    expect(cleaned.additionalProperties).toBeUndefined();
    expect(cleaned.properties.text.format).toBeUndefined();
    expect(cleaned.properties.text.pattern).toBeUndefined();
    expect(cleaned.properties.text.type).toBe("string");
  });

  it("returns parsed data on successful generation", async () => {
    const fakeClient = {
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: JSON.stringify({ status: "ok", count: 42 }),
        }),
      },
    } as unknown as GoogleGenAI;

    const res = await generateJson({
      user: "give me data",
      schema: testSchema,
      client: fakeClient,
    });

    expect(res).toEqual({ status: "ok", count: 42 });
    expect(fakeClient.models.generateContent).toHaveBeenCalledTimes(1);
  });

  it("retries once when schema validation fails and succeeds on retry", async () => {
    const mockFn = vi
      .fn()
      // First attempt: invalid (missing count)
      .mockResolvedValueOnce({
        text: JSON.stringify({ status: "ok" }),
      })
      // Second attempt: valid
      .mockResolvedValueOnce({
        text: JSON.stringify({ status: "ok", count: 10 }),
      });

    const fakeClient = {
      models: {
        generateContent: mockFn,
      },
    } as unknown as GoogleGenAI;

    const res = await generateJson({
      user: "give me data",
      schema: testSchema,
      client: fakeClient,
      maxRetries: 1,
    });

    expect(res).toEqual({ status: "ok", count: 10 });
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it("throws ai_invalid_output if schema validation fails after retries", async () => {
    const mockFn = vi.fn().mockResolvedValue({
      text: JSON.stringify({ status: "invalid_status", count: "not-a-number" }),
    });

    const fakeClient = {
      models: {
        generateContent: mockFn,
      },
    } as unknown as GoogleGenAI;

    await expect(
      generateJson({
        user: "give me data",
        schema: testSchema,
        client: fakeClient,
        maxRetries: 1,
      })
    ).rejects.toThrow(GeminiError);

    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it("retries on 503 transient error with backoff and succeeds", async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce({ status: 503, message: "High demand" })
      .mockResolvedValueOnce({
        text: JSON.stringify({ status: "ok", count: 99 }),
      });

    const fakeClient = {
      models: {
        generateContent: mockFn,
      },
    } as unknown as GoogleGenAI;

    const res = await generateJson({
      user: "give me data",
      schema: testSchema,
      client: fakeClient,
    });

    expect(res).toEqual({ status: "ok", count: 99 });
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it("throws ai_unavailable when transient 5xx error persists", async () => {
    const mockFn = vi.fn().mockRejectedValue({ status: 500, message: "Internal error" });

    const fakeClient = {
      models: {
        generateContent: mockFn,
      },
    } as unknown as GoogleGenAI;

    await expect(
      generateJson({
        user: "give me data",
        schema: testSchema,
        client: fakeClient,
      })
    ).rejects.toMatchObject({
      code: "ai_unavailable",
      status: 502,
    });

    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});

