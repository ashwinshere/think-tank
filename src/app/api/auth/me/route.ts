import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const userDocRef = adminDb.collection("users").doc(authUser.id);
    const userDoc = await userDocRef.get();

    let profile = null;
    let preferences: any[] = [];
    let conversationCount = 0;
    let memoryCount = 0;

    if (userDoc.exists) {
      const data = userDoc.data();
      profile = data?.profile || {
        displayName: authUser.name,
        personalizationEnabled: true,
      };
    } else {
      // Initialize new user doc in Firestore
      profile = {
        displayName: authUser.name,
        personalizationEnabled: true,
      };
      await userDocRef.set({
        name: authUser.name,
        email: authUser.email,
        profile,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Get counts
    const [chatsSnap, convSnap, memSnap, prefSnap] = await Promise.all([
      userDocRef.collection("chats").count().get().catch(() => ({ data: () => ({ count: 0 }) })),
      userDocRef.collection("conversations").count().get().catch(() => ({ data: () => ({ count: 0 }) })),
      userDocRef.collection("memories").count().get().catch(() => ({ data: () => ({ count: 0 }) })),
      userDocRef.collection("preferences").get().catch(() => ({ docs: [] })),
    ]);

    conversationCount = (chatsSnap.data().count || 0) + (convSnap.data().count || 0);
    memoryCount = memSnap.data().count || 0;
    preferences = prefSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({
      user: {
        id: authUser.id,
        email: authUser.email,
        name: authUser.name,
      },
      profile,
      preferences,
      counts: {
        conversations: conversationCount,
        memories: memoryCount,
      },
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
