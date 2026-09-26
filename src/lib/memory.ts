import { adminDb } from "./firebase-admin";
import { generateJSON, isGeminiConfigured } from "./gemini";

export interface MemoryItem {
  id: string;
  userId: string;
  content: string;
  category: string;
  importance: number;
  sourceConversationId?: string | null;
  createdAt: string;
  updatedAt: string;
}

const STOP_WORDS = new Set([
  "a", "an", "the", "in", "on", "at", "to", "for", "of", "with", "by", "from",
  "and", "or", "but", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "can", "could", "should", "would",
  "i", "you", "he", "she", "it", "we", "they", "me", "my", "your", "this", "that",
  "what", "how", "why", "when", "where", "who", "which", "please", "help"
]);

/**
 * Extract meaningful keywords from a piece of text.
 */
function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Retrieve top relevant memories for a user from Firestore given a message and optional topic.
 */
export async function retrieveRelevantMemories(
  userId: string,
  currentMessage: string,
  topic?: string | null,
  limit: number = 4
): Promise<MemoryItem[]> {
  try {
    const snapshot = await adminDb
      .collection("users")
      .doc(userId)
      .collection("memories")
      .orderBy("importance", "desc")
      .limit(50)
      .get();

    if (snapshot.empty) return [];

    const allMemories: MemoryItem[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId,
        content: data.content,
        category: data.category || "general",
        importance: data.importance ?? 0.5,
        sourceConversationId: data.sourceConversationId || null,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    });

    const queryText = `${topic || ""} ${currentMessage}`;
    const queryKeywords = new Set(extractKeywords(queryText));

    // Score each memory
    const scored = allMemories.map((mem) => {
      const memKeywords = extractKeywords(`${mem.content} ${mem.category}`);
      let matchCount = 0;
      for (const kw of memKeywords) {
        if (queryKeywords.has(kw)) {
          matchCount++;
        }
      }

      // Relevance = keyword matches weight + general importance
      const relevanceScore = matchCount * 2.0 + mem.importance;

      return {
        memory: mem,
        score: relevanceScore,
        hasMatch: matchCount > 0,
      };
    });

    // If we have direct keyword matches, prioritize them
    const matching = scored
      .filter((s) => s.hasMatch || s.memory.importance >= 0.8)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.memory);

    return matching;
  } catch (err) {
    console.error("Error retrieving user memories from Firestore:", err);
    return [];
  }
}

/**
 * Formats user profile, preferences, and relevant memories into a compact prompt context.
 */
export function buildPersonalizedContext(
  profile: {
    displayName?: string | null;
    bio?: string | null;
    learningGoals?: string | null;
    education?: string | null;
    occupation?: string | null;
    experienceLevel?: string | null;
    personalizationEnabled?: boolean;
  } | null,
  preferences: { key: string; value: string }[],
  memories: MemoryItem[]
): string {
  if (profile && profile.personalizationEnabled === false) {
    return ""; // User disabled personalization
  }

  const sections: string[] = [];

  // 1. Profile information
  const profileDetails: string[] = [];
  if (profile?.displayName) profileDetails.push(`- Display Name: ${profile.displayName}`);
  if (profile?.education) profileDetails.push(`- Education / Major: ${profile.education}`);
  if (profile?.occupation) profileDetails.push(`- Occupation / Focus: ${profile.occupation}`);
  if (profile?.experienceLevel) profileDetails.push(`- Experience Level: ${profile.experienceLevel}`);
  if (profile?.learningGoals) profileDetails.push(`- Learning Goals / Background: ${profile.learningGoals}`);
  if (profile?.bio) profileDetails.push(`- Bio: ${profile.bio}`);

  if (profileDetails.length > 0) {
    sections.push(`USER PROFILE:\n${profileDetails.join("\n")}`);
  }

  // 2. Preferences
  if (preferences && preferences.length > 0) {
    const prefList = preferences.map((p) => `- ${p.key}: ${p.value}`).join("\n");
    sections.push(`USER PREFERENCES:\n${prefList}`);
  }

  // 3. Relevant Memories
  if (memories && memories.length > 0) {
    const memoryList = memories
      .map((m) => `- ${m.content} (Category: ${m.category})`)
      .join("\n");
    sections.push(`RELEVANT MEMORIES (Useful context from previous conversations):\n${memoryList}`);
  }

  if (sections.length === 0) return "";

  return `
========================================
PERSONALIZATION & MEMORY CONTEXT
========================================
${sections.join("\n\n")}

Instructions for using Personalization:
- Use this context naturally and subtly to tailor your explanations, analogies, and examples to the student's background.
- DO NOT explicitly say "Based on my memory database" or "I see in your memories".
- If the student's goal or project is relevant (e.g. preparing for GATE, building a React app, learning C++), incorporate fitting examples organically.
========================================
`;
}

/**
 * Asynchronously extract useful persistent memories from a conversation exchange and save to Firestore.
 */
export async function extractAndSaveMemories(
  userId: string,
  conversationId: string,
  recentMessages: { role: string; content: string }[],
  customApiKey?: string
): Promise<void> {
  if (!isGeminiConfigured(customApiKey)) return;
  if (!recentMessages || recentMessages.length < 2) return;

  try {
    // Only analyze if the last student message is meaningful (> 10 chars, not just 'ok' or 'yes')
    const lastStudent = [...recentMessages].reverse().find((m) => m.role === "student" || m.role === "user");
    if (!lastStudent || lastStudent.content.trim().length < 8) return;

    // Filter out trivial questions
    const trivialRegex = /^(what is \d+|how much is \d+|\d+\s*[\+\-\*\/]\s*\d+|hi|hello|hey|test|yes|no|ok|cool|thanks|thank you)[\?\.\!]?$/i;
    if (trivialRegex.test(lastStudent.content.trim())) return;

    const conversationSnippet = recentMessages
      .slice(-6)
      .map((m) => `${m.role === "student" || m.role === "user" ? "Student" : "Assistant"}: ${m.content}`)
      .join("\n");

    const extractionInstruction = `You are an intelligent memory extraction engine for an educational AI assistant called ThinkTank.
Your task is to identify whether the student revealed any persistent, valuable information about themselves that would be helpful for personalizing future learning sessions.

Valuable information includes:
- User's name or identity ("My name is Ashwin")
- Field of study, major, or grade level ("I am studying Computer Science", "3rd year engineering")
- Current projects or tech stack ("I'm building a website with Next.js", "working on a React compiler")
- Learning goals or exams ("I'm preparing for GATE 2027", "aiming to master Dynamic Programming")
- Strong tool or language preferences ("I prefer C++ over Java", "I like visual diagrams")

DO NOT extract:
- Trivial questions or homework problems ("What is 10 + 10?", "Explain Dijkstra algorithm")
- Transient confusion ("I don't get step 2")
- Generic opinions or small talk ("This is fun", "Good morning")
- Highly sensitive private information (passwords, addresses, credit cards)

If no valuable persistent memories are present, set shouldRemember: false.`;

    const userPrompt = `Conversation exchange:
${conversationSnippet}

Return JSON format:
{
  "shouldRemember": boolean,
  "memories": [
    {
      "content": "concise, 3rd-person factual summary (e.g. User is studying Computer Science)",
      "category": "education" | "preference" | "project" | "goal" | "knowledge" | "general",
      "importance": 0.1 to 1.0 (float)
    }
  ]
}`;

    const result = await generateJSON<{
      shouldRemember: boolean;
      memories?: Array<{ content: string; category: string; importance: number }>;
    }>(extractionInstruction, userPrompt, customApiKey);

    if (!result?.shouldRemember || !Array.isArray(result.memories) || result.memories.length === 0) {
      return;
    }

    const memoriesCollection = adminDb.collection("users").doc(userId).collection("memories");

    // Process and save validated memories to Firestore
    for (const item of result.memories) {
      if (!item.content || typeof item.content !== "string") continue;
      const cleanContent = item.content.trim();
      if (cleanContent.length < 5 || cleanContent.length > 300) continue;

      const validCategories = ["education", "preference", "project", "goal", "knowledge", "general"];
      const category = validCategories.includes(item.category) ? item.category : "general";
      const importance = typeof item.importance === "number" ? Math.max(0.1, Math.min(1.0, item.importance)) : 0.6;

      // Check if duplicate memory exists
      const existingQuery = await memoriesCollection.where("content", "==", cleanContent).limit(1).get();

      if (existingQuery.empty) {
        await memoriesCollection.add({
          content: cleanContent,
          category,
          importance,
          sourceConversationId: conversationId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.error("Background Firestore memory extraction error (non-fatal):", err);
  }
}
