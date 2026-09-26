import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // Create Firebase User via Admin SDK
    const userRecord = await adminAuth.createUser({
      email: cleanEmail,
      password: password,
      displayName: cleanName,
    });

    // Initialize user profile in Firestore
    const userDocRef = adminDb.collection("users").doc(userRecord.uid);
    const profile = {
      displayName: cleanName,
      personalizationEnabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await userDocRef.set({
      name: cleanName,
      email: cleanEmail,
      profile,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const customToken = await adminAuth.createCustomToken(userRecord.uid);

    return NextResponse.json({
      user: {
        id: userRecord.uid,
        email: userRecord.email,
        name: cleanName,
      },
      profile,
      customToken,
    });
  } catch (error: any) {
    console.error("Firebase registration error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to register user." },
      { status: 400 }
    );
  }
}
