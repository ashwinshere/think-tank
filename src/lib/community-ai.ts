import { generateJSON, generatePeerReply, isGeminiConfigured } from "./gemini";

/**
 * Detects if a text contains common Tanglish / Tamil phonetics or keywords.
 */
export function isTanglishOrTamil(text: string): boolean {
  if (!text) return false;
  // Unicode Tamil range
  if (/[\u0B80-\u0BFF]/.test(text)) return true;

  const tanglishPatterns = [
    /\b(bro|machan|nanba|thala|sir)\b/i,
    /\b(purila|puriyala|puriyave\s+illa|purithu|puriyuthu)\b/i,
    /\b(epdi|eppadi|enna|ennada|edhuku|ethuku|inga|enga|iruku|irukku)\b/i,
    /\b(indha|intha|idhu|ithu|adhu|athu|andha|antha)\b/i,
    /\b(solli|sollu|sollunga|pannu|pannunga|panna|varudhu|varala|varadhu)\b/i,
    /\b(venum|vendam|koodathu|kuduthu|eduthu|paatha|paaru|paakalam)\b/i,
    /\b(konjam|romba|semma|seri|aaguthu|aagala|aana|aanaal)\b/i,
    /\b(la|le|oda|ku|kku|um|ah|dhaane|dhan)\b/i,
  ];

  return tanglishPatterns.some((pattern) => pattern.test(text));
}

export interface ThinkEvaluationResult {
  intuition: string;
  conditionOrNuance: string;
  qualityScore: number;
  improvedReasoningHint: string;
  isCorrectIntuition: boolean;
}

/**
 * Signature "Think With Me" reasoning evaluator.
 * Evaluates the student's thought process without dumping full solution code or spoonfeeding.
 */
export async function evaluateStudentReasoning(
  postTitle: string,
  postContent: string,
  studentReasoning: string,
  customApiKey?: string
): Promise<ThinkEvaluationResult> {
  const isTanglish = isTanglishOrTamil(postTitle + " " + postContent + " " + studentReasoning);

  const systemInstruction = `
You are the ThinkTank Thinking Partner — a warm, razor-sharp senior engineering peer.
The philosophy is: "Learn by thinking, not just by getting answers."
NEVER spoonfeed or dump the final solution.

The user is tackling a student doubt/concept:
Title: "${postTitle}"
Context: "${postContent}"

The student submitted their own reasoning:
"${studentReasoning}"

${
  isTanglish
    ? `IMPORTANT: The student used Tanglish/Tamil slang. Respond in warm, natural, friendly Tanglish (Tamil written in English script), like a knowledgeable senior peer speaking over a study table. (e.g., "Unga intuition super ah irukku!", "Aana indha chinna condition miss aagiduchu...", "Correct ah paatha..."). DO NOT sound like a robotic translator.`
    : `Respond in clear, minimal, intelligent academic English with a warm peer tone.`
}

Return a strict JSON object with:
{
  "isCorrectIntuition": boolean (true if their core gut intuition or direction is largely right),
  "intuition": "1-2 concise sentences acknowledging what they understood correctly in their reasoning",
  "conditionOrNuance": "1-2 concise sentences highlighting the missing boundary, edge condition, or nuance they overlooked (e.g., 'Add one important condition: This applies to unweighted graphs...')",
  "qualityScore": number (integer between 50 and 98 based on their logical effort and depth),
  "improvedReasoningHint": "1 single prompting question or nudge that allows them to improve their reasoning by themselves"
}
`;

  const fallbackResult: ThinkEvaluationResult = {
    isCorrectIntuition: true,
    intuition: isTanglish
      ? "Super intuition! Core logic ah correct ah catch pannirukinga."
      : "Strong intuition. Your initial mental model captures the primary mechanism.",
    conditionOrNuance: isTanglish
      ? "Aana oru mukkiyamaana condition: Edges equal cost/unweighted ah irundha dhaan idhu 100% guarantee."
      : "Add one important condition: This guarantees the shortest path specifically when all edge weights are equal or unweighted.",
    qualityScore: 84,
    improvedReasoningHint: isTanglish
      ? "Adhe graph la negative weight cycle irundha, queue behavior epdi maarum nu yosichu paarunga?"
      : "Consider what happens if one edge has a large positive weight. How would the level-by-level traversal handle that?",
  };

  if (!isGeminiConfigured(customApiKey)) {
    return fallbackResult;
  }

  try {
    const result = await generateJSON<ThinkEvaluationResult>(
      systemInstruction,
      `Evaluate this student reasoning: "${studentReasoning}" for problem "${postTitle}"`,
      customApiKey
    );
    return {
      isCorrectIntuition: Boolean(result.isCorrectIntuition),
      intuition: result.intuition || fallbackResult.intuition,
      conditionOrNuance: result.conditionOrNuance || fallbackResult.conditionOrNuance,
      qualityScore: Math.min(100, Math.max(40, Number(result.qualityScore) || 80)),
      improvedReasoningHint: result.improvedReasoningHint || fallbackResult.improvedReasoningHint,
    };
  } catch (err) {
    console.error("Failed to evaluate reasoning with Gemini:", err);
    return fallbackResult;
  }
}

/**
 * "Ask ThinkTank" for community discussions.
 * Acts as a senior thinking moderator, not a chatbot taking over.
 */
export async function generateCommunityAiNudge(
  postTitle: string,
  postContent: string,
  recentComments: { authorName: string; content: string }[],
  studentRequest?: string,
  customApiKey?: string
): Promise<string> {
  const allText =
    postTitle +
    " " +
    postContent +
    " " +
    recentComments.map((c) => c.content).join(" ") +
    " " +
    (studentRequest || "");
  const isTanglish = isTanglishOrTamil(allText);

  const commentsSummary = recentComments
    .slice(-4)
    .map((c) => `${c.authorName}: "${c.content}"`)
    .join("\n");

  const systemInstruction = `
You are the ThinkTank AI Thinking Partner in a live student community discussion.
Philosophy: "Students learn together. AI is a supportive thinking partner, NOT the answer dispenser."

Topic: "${postTitle}"
Context: "${postContent}"

Recent Student Comments:
${commentsSummary || "No comments yet."}

${
  isTanglish
    ? `The students are communicating in Tanglish/Tamil-English. Speak in natural, warm, peer-level Tanglish (e.g., "Arun sonna point correct, aana...", "Meena ketta doubt romba valid..."). Be concise (3-4 sentences max). Connect student ideas, clarify any misconception gently, and ask one intriguing question for the room to solve.`
    : `Speak in concise, modern, encouraging editorial English. Acknowledge the student discussion, point out one key distinction or bridge between their perspectives, and leave an open thought for them to explore. (3-4 sentences max).`
}
Do NOT output greetings like "Hello everyone" or "As an AI". Jump straight into the conceptual insight like an observant senior student sitting at their desk.
`;

  if (!isGeminiConfigured(customApiKey)) {
    if (isTanglish) {
      return "Discussion nalla poguthu! Arun sonna level-by-level traversal point correct. Aana Meena ketta maari weighted graph vandha, normal BFS fail aagum — anga Dijkstra venum. Indha distinction ah namma code la epdi reflect pannalam nu yaaravathu share panringala?";
    }
    return "Great thread here. The distinction Arun highlighted about level-by-level traversal is spot on for unweighted trees and graphs. Notice what Meena added: the moment weights vary, the first path found isn't necessarily the shortest path. How could we adapt the queue to respect varying edge costs?";
  }

  try {
    const prompt = studentRequest
      ? `A student asked for guidance: "${studentRequest}". Provide a sharp thinking nudge.`
      : "Provide a thinking nudge that synthesizes the student discussion so far.";
    return await generatePeerReply(systemInstruction, [], prompt, customApiKey);
  } catch (err) {
    console.error("Community AI nudge error:", err);
    return isTanglish
      ? "Nalla discussion! Oru mukkiyamaana distinction inga theriyuthu: unweighted graph na BFS perfect, aana weights irundha priority queue thevaipadum. Idhula unga logic enna?"
      : "Insightful discussion so far. One crucial boundary condition has appeared: BFS assumes uniform step cost. What data structure would you substitute if step weights differ?";
  }
}
