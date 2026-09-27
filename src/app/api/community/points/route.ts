import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getUserThinkingPoints, awardThinkingPoints } from "@/lib/community-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ points: 0 });
    }

    const points = await getUserThinkingPoints(authUser.id);
    return NextResponse.json({ points });
  } catch (error) {
    console.error("Fetch points error:", error);
    return NextResponse.json({ points: 0 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { amount, reason } = body;

    const points = await awardThinkingPoints(
      authUser.id,
      Math.min(50, Math.max(1, Number(amount) || 5)),
      reason || "Community engagement"
    );

    return NextResponse.json({ points });
  } catch (error) {
    console.error("Award points error:", error);
    return NextResponse.json({ error: "Failed to award points" }, { status: 500 });
  }
}
