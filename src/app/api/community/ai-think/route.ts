import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { evaluateStudentReasoning } from "@/lib/community-ai";
import { recordThinkingAttempt } from "@/lib/community-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { error: "Please sign in to test your reasoning with Think With Me" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { postId, postTitle, postContent, userReasoning, apiKey } = body;

    if (!userReasoning || typeof userReasoning !== "string" || !userReasoning.trim()) {
      return NextResponse.json({ error: "Reasoning cannot be empty" }, { status: 400 });
    }

    // Evaluate reasoning using Tanglish-aware Socratic partner
    const feedback = await evaluateStudentReasoning(
      postTitle || "Conceptual doubt",
      postContent || "",
      userReasoning,
      apiKey
    );

    // Record attempt and award points
    const attempt = await recordThinkingAttempt({
      postId,
      userId: authUser.id,
      userName: authUser.name,
      userReasoning,
      aiFeedback: feedback,
    });

    return NextResponse.json({
      attempt,
      feedback,
      pointsAwarded: attempt.pointsAwarded,
    });
  } catch (error) {
    console.error("Think With Me error:", error);
    return NextResponse.json({ error: "Failed to evaluate reasoning" }, { status: 500 });
  }
}
