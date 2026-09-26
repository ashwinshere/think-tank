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
      .collection("preferences")
      .orderBy("createdAt", "asc")
      .get();

    const preferences = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Fetch preferences error:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Key and value are required" }, { status: 400 });
    }

    const prefRef = adminDb
      .collection("users")
      .doc(authUser.id)
      .collection("preferences")
      .doc(String(key).trim());

    const prefData = {
      key: String(key).trim(),
      value: String(value).trim(),
      updatedAt: new Date().toISOString(),
    };

    const doc = await prefRef.get();
    if (!doc.exists) {
      (prefData as any).createdAt = new Date().toISOString();
    }

    await prefRef.set(prefData, { merge: true });

    return NextResponse.json({ preference: { id: prefRef.id, ...prefData } });
  } catch (error) {
    console.error("Save preference error:", error);
    return NextResponse.json({ error: "Failed to save preference" }, { status: 500 });
  }
}
