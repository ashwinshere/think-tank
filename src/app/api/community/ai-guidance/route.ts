import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { generateCommunityAiNudge } from "@/lib/community-ai";
import {
  getCommunityPostById,
  getCommentsForPost,
  addCommentToPost,
} from "@/lib/community-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Authentication required to ask ThinkTank" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { postId, studentRequest, apiKey } = body;

    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    const post = await getCommunityPostById(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const recentComments = await getCommentsForPost(postId);

    const guidance = await generateCommunityAiNudge(
      post.title,
      post.content,
      recentComments.map((c) => ({ authorName: c.authorName, content: c.content })),
      studentRequest,
      apiKey
    );

    // Post as an AI Thinking Partner comment
    const aiComment = await addCommentToPost({
      postId,
      authorId: "thinktank_partner",
      authorName: "ThinkTank Thinking Partner",
      content: guidance,
      isAi: true,
      aiPersona: "ThinkTank",
    });

    return NextResponse.json({ comment: aiComment, guidance });
  } catch (error) {
    console.error("Ask ThinkTank guidance error:", error);
    return NextResponse.json({ error: "Failed to generate ThinkTank guidance" }, { status: 500 });
  }
}
