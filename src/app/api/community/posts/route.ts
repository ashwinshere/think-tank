import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getCommunityPosts, createCommunityPost } from "@/lib/community-db";
import { PostType, SubjectType } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    const circleId = searchParams.get("circleId") || undefined;
    const limit = parseInt(searchParams.get("limit") || "40", 10);

    const posts = await getCommunityPosts({ category, search, limit, circleId });
    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Fetch community posts error:", error);
    return NextResponse.json({ error: "Failed to fetch community posts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Authentication required to post" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { title, content, type = "doubt", subject = "Other", circleId, isAnonymous, mistakeDetails } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const validTypes: PostType[] = ["doubt", "challenge", "explain", "project", "mistake"];
    const postType: PostType = validTypes.includes(type) ? type : "doubt";

    const newPost = await createCommunityPost({
      title,
      content,
      type: postType,
      subject: (subject as SubjectType) || "Other",
      authorId: authUser.id,
      authorName: authUser.name,
      authorEmail: authUser.email,
      circleId,
      isAnonymous: Boolean(isAnonymous),
      mistakeDetails,
    });

    return NextResponse.json({ post: newPost }, { status: 201 });
  } catch (error) {
    console.error("Create community post error:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
