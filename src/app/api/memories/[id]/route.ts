import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memRef = adminDb
      .collection("users")
      .doc(authUser.id)
      .collection("memories")
      .doc(params.id);

    const doc = await memRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }

    await memRef.delete();

    return NextResponse.json({ ok: true, message: "Memory deleted" });
  } catch (error) {
    console.error("Delete memory error:", error);
    return NextResponse.json({ error: "Failed to delete memory" }, { status: 500 });
  }
}
