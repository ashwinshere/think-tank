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

    const userDoc = await adminDb.collection("users").doc(authUser.id).get();
    const profile = userDoc.data()?.profile || null;

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Fetch profile error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { displayName, bio, learningGoals, education, occupation, experienceLevel, personalizationEnabled } = body;

    const userRef = adminDb.collection("users").doc(authUser.id);
    const userDoc = await userRef.get();
    const currentProfile = userDoc.data()?.profile || {};

    const updatedProfile = {
      ...currentProfile,
      ...(displayName !== undefined && { displayName: String(displayName).trim() }),
      ...(bio !== undefined && { bio: String(bio).trim() }),
      ...(learningGoals !== undefined && { learningGoals: String(learningGoals).trim() }),
      ...(education !== undefined && { education: String(education).trim() }),
      ...(occupation !== undefined && { occupation: String(occupation).trim() }),
      ...(experienceLevel !== undefined && { experienceLevel: String(experienceLevel).trim() }),
      ...(personalizationEnabled !== undefined && { personalizationEnabled: Boolean(personalizationEnabled) }),
      updatedAt: new Date().toISOString(),
    };

    await userRef.set(
      {
        profile: updatedProfile,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
