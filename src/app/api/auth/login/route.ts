import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const userRecord = await adminAuth.getUserByEmail(cleanEmail);

    const userDoc = await adminDb.collection("users").doc(userRecord.uid).get();
    const profile = userDoc.data()?.profile || {
      displayName: userRecord.displayName || cleanEmail.split("@")[0],
      personalizationEnabled: true,
    };

    const customToken = await adminAuth.createCustomToken(userRecord.uid);

    return NextResponse.json({
      user: {
        id: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName || cleanEmail.split("@")[0],
      },
      profile,
      customToken,
    });
  } catch (error: any) {
    console.error("Firebase login error:", error);
    return NextResponse.json(
      { error: "User not found or invalid credentials." },
      { status: 401 }
    );
  }
}
