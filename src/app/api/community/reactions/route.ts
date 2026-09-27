import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { togglePostReaction } from "@/lib/community-db";
import { ReactionType } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Authentication required to react" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { postId, reaction } = body;

    const validReactions: ReactionType[] = ["helpful", "good_reasoning", "needs_evidence", "same_doubt"];
    if (!postId || !validReactions.includes(reaction)) {
      return NextResponse.json({ error: "Invalid reaction request" }, { status: 400 });
    }

    const result = await togglePostReaction(postId, authUser.id, authUser.name, reaction);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Toggle reaction error:", error);
    return NextResponse.json({ error: "Failed to toggle reaction" }, { status: 500 });
  }
}
