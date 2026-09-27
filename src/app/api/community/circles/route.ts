import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import {
  getStudyCircles,
  createStudyCircle,
  joinStudyCircle,
  getStudyCircleById,
} from "@/lib/community-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const circle = await getStudyCircleById(id);
      if (!circle) return NextResponse.json({ error: "Circle not found" }, { status: 404 });
      return NextResponse.json({ circle });
    }

    const circles = await getStudyCircles();
    return NextResponse.json({ circles });
  } catch (error) {
    console.error("Fetch circles error:", error);
    return NextResponse.json({ error: "Failed to fetch study circles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, circleId, name, description, category } = body;

    if (action === "join") {
      if (!circleId) return NextResponse.json({ error: "circleId required" }, { status: 400 });
      const circle = await joinStudyCircle(circleId, authUser.id);
      return NextResponse.json({ circle });
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Circle name is required" }, { status: 400 });
    }

    const newCircle = await createStudyCircle({
      name,
      description: description || "Collaborative study circle for deep learning.",
      category: category || "DSA",
      creatorId: authUser.id,
    });

    return NextResponse.json({ circle: newCircle }, { status: 201 });
  } catch (error) {
    console.error("Study circle action error:", error);
    return NextResponse.json({ error: "Failed to process study circle" }, { status: 500 });
  }
}
