import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ref: convRef, doc } = await getChatDocRef(authUser.id, params.id);
    if (!doc.exists) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const messagesSnap = await convRef
      .collection("messages")
      .orderBy("createdAt", "asc")
      .get();

    const messages = messagesSnap.docs.map((m) => ({
      id: m.id,
      ...m.data(),
    }));

    return NextResponse.json({
      conversation: {
        id: doc.id,
        ...doc.data(),
        messages,
      },
    });
  } catch (error) {
    console.error("Fetch conversation error:", error);
    return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ref: convRef, doc } = await getChatDocRef(authUser.id, params.id);
    if (!doc.exists) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Delete messages subcollection
    const messagesSnap = await convRef.collection("messages").get();
    const batch = adminDb.batch();
    messagesSnap.docs.forEach((m) => batch.delete(m.ref));
    batch.delete(convRef);

    await batch.commit();

    return NextResponse.json({ ok: true, message: "Conversation deleted" });
  } catch (error) {
    console.error("Delete conversation error:", error);
    return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const { ref: convRef, doc } = await getChatDocRef(authUser.id, params.id);
    if (!doc.exists) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const updatedData = {
      title: title.trim().slice(0, 100),
      updatedAt: new Date().toISOString(),
    };

    await convRef.update(updatedData);

    return NextResponse.json({
      conversation: {
        id: convRef.id,
        ...doc.data(),
        ...updatedData,
      },
    });
  } catch (error) {
    console.error("Update conversation error:", error);
    return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 });
  }
}

