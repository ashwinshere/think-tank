import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionRef = adminDb
      .collection("users")
      .doc(authUser.id)
      .collection("code_sessions")
      .doc(params.id);

    const doc = await sessionRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Code session not found" }, { status: 404 });
    }

    return NextResponse.json({
      session: {
        id: doc.id,
        ...doc.data(),
      },
    });
  } catch (error) {
    console.error("Fetch code session error:", error);
    return NextResponse.json({ error: "Failed to fetch code session" }, { status: 500 });
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

    const sessionRef = adminDb
      .collection("users")
      .doc(authUser.id)
      .collection("code_sessions")
      .doc(params.id);

    const doc = await sessionRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Code session not found" }, { status: 404 });
    }

    await sessionRef.delete();

    return NextResponse.json({ ok: true, message: "Code session deleted" });
  } catch (error) {
    console.error("Delete code session error:", error);
    return NextResponse.json({ error: "Failed to delete code session" }, { status: 500 });
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

    const sessionRef = adminDb
      .collection("users")
      .doc(authUser.id)
      .collection("code_sessions")
      .doc(params.id);

    const doc = await sessionRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Code session not found" }, { status: 404 });
    }

    const body = await req.json();
    const updatedData = {
      ...body,
      updatedAt: new Date().toISOString(),
    };

    delete updatedData.id;

    await sessionRef.set(updatedData, { merge: true });

    return NextResponse.json({
      session: {
        id: sessionRef.id,
        ...doc.data(),
        ...updatedData,
      },
    });
  } catch (error) {
    console.error("Update code session error:", error);
    return NextResponse.json({ error: "Failed to update code session" }, { status: 500 });
  }
}
