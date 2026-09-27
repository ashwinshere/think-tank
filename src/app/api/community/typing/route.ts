import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { registerTyping, getActiveTypers } from "@/lib/community-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("threadId");
  if (!threadId) return NextResponse.json({ typers: [] });

  const typers = getActiveTypers(threadId);
  return NextResponse.json({ typers });
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ ok: false });
    }

    const body = await req.json().catch(() => ({}));
    const { threadId } = body;

    if (!threadId) {
      return NextResponse.json({ error: "threadId required" }, { status: 400 });
    }

    registerTyping(threadId, authUser.id, authUser.name);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Typing indicator error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
