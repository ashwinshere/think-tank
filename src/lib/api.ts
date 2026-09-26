export function getStoredApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("thinktank_gemini_api_key") || null;
}

export function setStoredApiKey(key: string) {
  if (typeof window === "undefined") return;
  if (!key.trim()) {
    localStorage.removeItem("thinktank_gemini_api_key");
  } else {
    localStorage.setItem("thinktank_gemini_api_key", key.trim());
  }
}

export async function callAI<T = any>(action: string, payload: any): Promise<T> {
  const apiKey = getStoredApiKey();
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload, apiKey }),
  });
  if (!res.ok) {
    throw new Error(`AI call failed: ${res.status}`);
  }
  return res.json();
}

