import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getCommentsForPost, addCommentToPost } from "@/lib/community-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const comments = await getCommentsForPost(params.id);
    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Fetch comments error:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Authentication required to reply" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { content, parentId } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Comment content cannot be empty" }, { status: 400 });
    }

    const comment = await addCommentToPost({
      postId: params.id,
      parentId: parentId || null,
      authorId: authUser.id,
      authorName: authUser.name,
      content,
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Add comment error:", error);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
