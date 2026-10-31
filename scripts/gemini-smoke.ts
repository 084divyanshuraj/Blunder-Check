import { GoogleGenAI } from "@google/genai";

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

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

if (!apiKey) {
  console.error("Missing GEMINI_API_KEY in .env");
  process.exit(1);
}

async function smokeTest() {
  console.log(`Testing Gemini API with model: ${model}...`);
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: "Return a valid JSON object with a single key 'status' set to 'ok' and 'message' set to 'Gemini API is working'.",
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    console.log("Response text:", text);
    const parsed = JSON.parse(text ?? "{}");
    console.log("Parsed JSON:", JSON.stringify(parsed, null, 2));
    if (parsed.status === "ok") {
      console.log("SUCCESS: Gemini smoke test passed!");
    } else {
      console.warn("Unexpected output:", parsed);
    }
  } catch (err: unknown) {
    console.error("Gemini smoke test failed:", err);
    process.exit(1);
  }
}

smokeTest();
