import { z } from "zod";
import { generateJson } from "../lib/gemini";

if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(".env");
  } catch {
    // ignore
  }
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // ignore
  }
}

const smokeSchema = z.object({
  status: z.enum(["ok", "failed"]),
  message: z.string(),
});

async function smokeTest() {
  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  console.log(`Testing generateJson via lib/gemini.ts with model: ${model}...`);

  try {
    const result = await generateJson({
      user: "Return a valid JSON object with status 'ok' and message 'Gemini API is working via lib/gemini'.",
      schema: smokeSchema,
    });

    console.log("Structured result:", result);
    if (result.status === "ok") {
      console.log("SUCCESS: generateJson smoke test passed!");
    } else {
      console.warn("Unexpected status:", result);
    }
  } catch (err: unknown) {
    console.error("Gemini smoke test failed:", err);
    process.exit(1);
  }
}

smokeTest();

