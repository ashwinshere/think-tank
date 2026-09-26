import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));

    const userRef = adminDb.collection("users").doc(authUser.id);
    const chatsRef = userRef.collection("chats");

    let snapshot = await chatsRef
      .orderBy("updatedAt", "desc")
      .limit(limit)
      .get();

    // If no chats found, check legacy conversations subcollection
    if (snapshot.empty) {
      const legacySnap = await userRef
        .collection("conversations")
        .orderBy("updatedAt", "desc")
        .limit(limit)
        .get();
      if (!legacySnap.empty) {
        snapshot = legacySnap;
      }
    }

    const conversations = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();

        // Get last message and message count
        const [lastMsgSnap, countSnap] = await Promise.all([
          doc.ref.collection("messages").orderBy("createdAt", "desc").limit(1).get().catch(() => ({ docs: [] })),
          doc.ref.collection("messages").count().get().catch(() => ({ data: () => ({ count: 0 }) })),
        ]);

        const lastMessage = lastMsgSnap.docs.length > 0 ? lastMsgSnap.docs[0].data() : null;
        const messageCount = countSnap.data().count;

        return {
          id: doc.id,
          title: data.title || "New Session",
          topic: data.topic || null,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          messageCount,
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                role: lastMessage.role,
                persona: lastMessage.persona || null,
                createdAt: lastMessage.createdAt,
              }
            : null,
        };
      })
    );

    return NextResponse.json({
      conversations,
      pagination: {
        page: 1,
        limit,
        total: conversations.length,
      },
    });
  } catch (error) {
    console.error("Fetch conversations error:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { title, topic } = body;

    const chatRef = adminDb
      .collection("users")
      .doc(authUser.id)
      .collection("chats")
      .doc();

    const conversationData = {
      title: title ? String(title).trim().slice(0, 100) : "New Session",
      topic: topic ? String(topic).trim().slice(0, 100) : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await chatRef.set(conversationData);

    return NextResponse.json({
      conversation: {
        id: chatRef.id,
        ...conversationData,
      },
    });
  } catch (error) {
    console.error("Create conversation error:", error);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}

