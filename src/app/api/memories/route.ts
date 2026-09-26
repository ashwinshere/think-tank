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

    const snapshot = await adminDb
      .collection("users")
      .doc(authUser.id)
      .collection("memories")
      .orderBy("createdAt", "desc")
      .get();

    const memories = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ memories });
  } catch (error) {
    console.error("Fetch memories error:", error);
    return NextResponse.json({ error: "Failed to fetch memories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { content, category = "general", importance = 0.6 } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Memory content is required" }, { status: 400 });
    }

    const memData = {
      content: String(content).trim(),
      category: String(category).trim(),
      importance: typeof importance === "number" ? Math.max(0.1, Math.min(1.0, importance)) : 0.6,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await adminDb
      .collection("users")
      .doc(authUser.id)
      .collection("memories")
      .add(memData);

    return NextResponse.json({ memory: { id: docRef.id, ...memData } });
  } catch (error) {
    console.error("Create memory error:", error);
    return NextResponse.json({ error: "Failed to create memory" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memoriesRef = adminDb
      .collection("users")
      .doc(authUser.id)
      .collection("memories");

    const snapshot = await memoriesRef.get();
    const batch = adminDb.batch();

    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    return NextResponse.json({ ok: true, message: "All memories cleared" });
  } catch (error) {
    console.error("Clear memories error:", error);
    return NextResponse.json({ error: "Failed to clear memories" }, { status: 500 });
  }
}
