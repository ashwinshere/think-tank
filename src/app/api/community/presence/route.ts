import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import {
  updateOnlinePresence,
  getOnlineThinkersCount,
  getActiveThinkersList,
} from "@/lib/community-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [onlineCount, activeThinkers] = await Promise.all([
      getOnlineThinkersCount(),
      getActiveThinkersList(),
    ]);

    return NextResponse.json({
      onlineCount,
      activeThinkers,
    });
  } catch (error) {
    console.error("Fetch presence error:", error);
    return NextResponse.json({ onlineCount: 1, activeThinkers: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ ok: false, error: "Anonymous" });
    }

    const body = await req.json().catch(() => ({}));
    const { currentPostId, isThinking } = body;

    await updateOnlinePresence(authUser.id, authUser.name, currentPostId, isThinking);
    const onlineCount = await getOnlineThinkersCount();

    return NextResponse.json({ ok: true, onlineCount });
  } catch (error) {
    console.error("Update presence error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
