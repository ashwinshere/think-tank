import { GoogleGenAI } from "@google/genai";

const PRIMARY_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

const CANDIDATE_MODELS = Array.from(
  new Set([
    PRIMARY_MODEL,
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-flash-latest",
  ])
);

export function isGeminiConfigured(customKey?: string): boolean {
  return Boolean(customKey || process.env.GEMINI_API_KEY);
}

function getClient(customKey?: string): GoogleGenAI {
  const key = customKey || process.env.GEMINI_API_KEY;
  if (!key) throw new Error("No Gemini API key available");
  return new GoogleGenAI({ apiKey: key });
}

export interface TurnInput {
  role: "student" | "peer";
  text: string;
}

/**
 * Executes a Gemini call with automatic fallback across candidate models if a 503 or 429 occurs.
 */
async function callWithModelCascade<T>(
  runner: (model: string) => Promise<T>
): Promise<T> {
  let lastError: any;

  for (const model of CANDIDATE_MODELS) {
    try {
      return await runner(model);
    } catch (err: any) {
      lastError = err;
      const isRecoverable =
        err?.status === 503 ||
        err?.status === 429 ||
        err?.status === 404 ||
        err?.message?.includes("503") ||
        err?.message?.includes("429") ||
        err?.message?.includes("not found") ||
        err?.message?.includes("high demand") ||
        err?.message?.includes("UNAVAILABLE");

      if (isRecoverable) {
        console.warn(`Model ${model} unavailable (${err?.message || err?.status}), trying next candidate model...`);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

/**
 * Calls Gemini with a persona system instruction plus a lightweight
 * conversation history. Returns plain text.
 */
export async function generatePeerReply(
  systemInstruction: string,
  history: TurnInput[],
  latestStudentMessage: string,
  customApiKey?: string
): Promise<string> {
  const ai = getClient(customApiKey);

  const contents = [
    ...history.map((turn) => ({
      role: turn.role === "student" ? "user" : "model",
      parts: [{ text: turn.text }],
    })),
    { role: "user", parts: [{ text: latestStudentMessage }] },
  ];

  return callWithModelCascade(async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    return text.trim();
  });
}

/**
 * Calls Gemini asking for a strict JSON object back.
 */
export async function generateJSON<T>(
  systemInstruction: string,
  userPrompt: string,
  customApiKey?: string
): Promise<T> {
  const ai = getClient(customApiKey);

  return callWithModelCascade(async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: `${systemInstruction}\n\nRespond with ONLY a valid JSON object. No markdown fences, no preamble, no commentary.`,
        temperature: 0.4,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");

    const cleaned = text.trim().replace(/^```json\s*|^```\s*|```$/g, "");
    return JSON.parse(cleaned) as T;
  });
}

export async function testConnection(customApiKey?: string): Promise<{ ok: boolean; model: string; error?: string }> {
  const ai = getClient(customApiKey);
  return callWithModelCascade(async (model) => {
    await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: "Say 'ThinkTank Live'" }] }],
    });
    return { ok: true, model };
  });
}



