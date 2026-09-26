import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { generatePeerReply, isGeminiConfigured } from "@/lib/gemini";
import { ORCHESTRATOR_NOTE, PEER_SYSTEM_PROMPTS } from "@/lib/prompts";
import { decide, OrchestratorInput } from "@/lib/orchestrator";
import { PeerId } from "@/lib/types";
import { mockPeerReply } from "@/lib/mock";
import { buildPersonalizedContext, extractAndSaveMemories, retrieveRelevantMemories } from "@/lib/memory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getChatDocRef(userId: string, id: string) {
  const userRef = adminDb.collection("users").doc(userId);
  const chatRef = userRef.collection("chats").doc(id);
  const chatDoc = await chatRef.get();
  if (chatDoc.exists) return { ref: chatRef, doc: chatDoc };

  const legacyRef = userRef.collection("conversations").doc(id);
  const legacyDoc = await legacyRef.get();
  if (legacyDoc.exists) return { ref: legacyRef, doc: legacyDoc };

  return { ref: chatRef, doc: chatDoc };
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ref: convRef, doc: convDoc } = await getChatDocRef(authUser.id, params.id);
    if (!convDoc.exists) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const convData = convDoc.data() || {};
    const messagesRef = convRef.collection("messages");

    const body = await req.json();
    const {
      studentMessage = "",
      turnIndex = 0,
      usage,
      priorMistakeTopics = [],
      mode = "learning",
      forcePeer,
      isDirectRequest,
      topic,
      apiKey,
    } = body;

    if (!studentMessage || !studentMessage.trim()) {
      return NextResponse.json({ error: "studentMessage is required" }, { status: 400 });
    }

    const cleanStudentText = studentMessage.trim();

    // 1. Save student message in Firestore
    const studentMsgDoc = await messagesRef.add({
      role: "student",
      content: cleanStudentText,
      createdAt: new Date().toISOString(),
    });

    // 2. Auto-title conversation if default
    if (convData.title === "New Session" || !convData.title) {
      const generatedTitle = (topic || cleanStudentText).slice(0, 45).replace(/\n/g, " ");
      await convRef.update({
        title: generatedTitle,
        topic: topic || generatedTitle,
        updatedAt: new Date().toISOString(),
      });
    }

    // 3. Load historical messages for context
    const recentMessagesSnap = await messagesRef.orderBy("createdAt", "asc").get();
    const history = recentMessagesSnap.docs
      .slice(0, -1) // Exclude newly added student message
      .map((doc) => {
        const d = doc.data();
        return {
          role: d.role === "student" ? ("student" as const) : ("peer" as const),
          text: d.content as string,
        };
      });

    // 4. Multi-peer orchestrator decision
    const decision = forcePeer
      ? {
          peer: forcePeer as PeerId,
          hintLevel: (isDirectRequest ? 3 : 1) as 1 | 2 | 3,
          shouldFlagMisconception: false,
          shouldSuggestNoAiRound: false,
          reason: isDirectRequest ? "Direct explanation requested" : "Requested directly",
        }
      : decide({
          turnIndex: turnIndex || recentMessagesSnap.docs.length,
          studentMessage: cleanStudentText,
          usage,
          priorMistakeTopics,
          mode: mode || "learning",
        } as OrchestratorInput);

    // 5. Retrieve user profile, preferences, and relevant memories from Firestore
    const userDocRef = adminDb.collection("users").doc(authUser.id);
    const [userDoc, prefsSnap, relevantMemories] = await Promise.all([
      userDocRef.get(),
      userDocRef.collection("preferences").get(),
      retrieveRelevantMemories(authUser.id, cleanStudentText, topic || convData.topic),
    ]);

    const userProfile = userDoc.data()?.profile || null;
    const userPreferences = prefsSnap.docs.map((d) => ({ key: d.id, value: d.data().value }));

    const personalizedContext = buildPersonalizedContext(
      userProfile,
      userPreferences,
      relevantMemories
    );

    // 6. Build system prompt for Gemini
    const baseSystemPrompt = `${ORCHESTRATOR_NOTE}\n${PEER_SYSTEM_PROMPTS[decision.peer]}${
      decision.peer === "mentor"
        ? `\nCurrent hint level: ${decision.hintLevel} of 3 (1 = conceptual nudge/analogy, 2 = step-by-step mechanism, 3 = worked explanation).`
        : ""
    }${
      isDirectRequest
        ? "\nIMPORTANT: The student has requested a direct, comprehensive explanation. Give a crystal-clear, structured breakdown with intuition, definition, and example."
        : ""
    }`;

    const systemInstruction = `${baseSystemPrompt}\n${personalizedContext}`;

    // 7. Generate Gemini response with fallback
    let reply = "";
    let usedMock = false;

    if (isGeminiConfigured(apiKey)) {
      try {
        reply = await generatePeerReply(systemInstruction, history, cleanStudentText, apiKey);
      } catch (err) {
        console.error("Gemini API call failed, using mock fallback:", err);
        reply = mockPeerReply(
          decision.peer,
          cleanStudentText,
          history,
          topic || convData.topic || undefined,
          decision.hintLevel,
          isDirectRequest
        );
        usedMock = true;
      }
    } else {
      reply = mockPeerReply(
        decision.peer,
        cleanStudentText,
        history,
        topic || convData.topic || undefined,
        decision.hintLevel,
        isDirectRequest
      );
      usedMock = true;
    }

    // 8. Save assistant reply in Firestore
    const peerMsgDoc = await messagesRef.add({
      role: "peer",
      persona: decision.peer,
      content: reply,
      createdAt: new Date().toISOString(),
    });

    // Update conversation updatedAt
    await convRef.update({
      updatedAt: new Date().toISOString(),
    });

    // 9. Asynchronously extract persistent memories in background
    const updatedMessages = [
      ...history.map((h) => ({ role: h.role, content: h.text })),
      { role: "student", content: cleanStudentText },
      { role: "peer", content: reply },
    ];

    extractAndSaveMemories(authUser.id, params.id, updatedMessages, apiKey).catch((err) => {
      console.error("Background Firestore memory extraction error:", err);
    });

    return NextResponse.json({
      decision,
      reply,
      usedMock,
      studentMessage: {
        id: studentMsgDoc.id,
        role: "student",
        content: cleanStudentText,
        createdAt: new Date().toISOString(),
      },
      peerMessage: {
        id: peerMsgDoc.id,
        role: "peer",
        persona: decision.peer,
        content: reply,
        createdAt: new Date().toISOString(),
      },
      retrievedMemoriesCount: relevantMemories.length,
    });
  } catch (error) {
    console.error("Error sending message to conversation:", error);
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
  }
}
