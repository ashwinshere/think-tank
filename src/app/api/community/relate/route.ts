import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { toggleRelateToMistake } from "@/lib/community-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({ error: "Post ID required" }, { status: 400 });
    }

    const result = await toggleRelateToMistake(postId, authUser.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Relate to mistake error:", error);
    return NextResponse.json({ error: "Failed to relate to mistake" }, { status: 500 });
  }
}
