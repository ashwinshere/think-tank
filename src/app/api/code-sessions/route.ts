import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { CodeSessionSummary, CodeSessionDetail } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(60, Math.max(1, parseInt(searchParams.get("limit") || "40", 10)));

    const userRef = adminDb.collection("users").doc(authUser.id);
    const sessionsRef = userRef.collection("code_sessions");

    const snapshot = await sessionsRef
      .orderBy("updatedAt", "desc")
      .limit(limit)
      .get();

    const codeSessions: CodeSessionSummary[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      const codeStr = typeof data.code === "string" ? data.code : "";
      const codeSnippet = codeStr.slice(0, 100).replace(/\n/g, " ");

      return {
        id: doc.id,
        title: data.title || (data.conceptTitle ? `${data.language || "Code"}: ${data.conceptTitle}` : "Untitled Code Session"),
        language: data.language || "Python",
        conceptTitle: data.conceptTitle || (data.explanation?.concept?.title ?? undefined),
        codeSnippet,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        isCorrect: typeof data.isCorrect === "boolean" ? data.isCorrect : data.feedback?.is_correct,
        hasSolution: Boolean(data.studentCode && data.studentCode.trim().length > 0),
      };
    });

    return NextResponse.json({
      codeSessions,
      total: codeSessions.length,
    });
  } catch (error) {
    console.error("Fetch code sessions error:", error);
    return NextResponse.json({ error: "Failed to fetch code sessions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: Partial<CodeSessionDetail> = await req.json().catch(() => ({}));
    const {
      id,
      title,
      language,
      code,
      conceptTitle,
      output,
      explanation,
      studentCode,
      studentOutput,
      feedback,
      isCorrect,
    } = body;

    const userRef = adminDb.collection("users").doc(authUser.id);
    const sessionsRef = userRef.collection("code_sessions");

    const sessionDocRef = id ? sessionsRef.doc(id) : sessionsRef.doc();
    const now = new Date().toISOString();

    const derivedTitle =
      title ||
      (conceptTitle
        ? `${language || "Code"}: ${conceptTitle}`
        : explanation?.concept?.title
        ? `${language || "Code"}: ${explanation.concept.title}`
        : `${language || "Code"} Session`);

    const sessionData = {
      title: derivedTitle.trim().slice(0, 120),
      language: language || "Python",
      code: code || "",
      conceptTitle: conceptTitle || explanation?.concept?.title || null,
      output: output || "",
      explanation: explanation || null,
      studentCode: studentCode || "",
      studentOutput: studentOutput || "",
      feedback: feedback || null,
      isCorrect: typeof isCorrect === "boolean" ? isCorrect : feedback?.is_correct ?? null,
      updatedAt: now,
      ...(id ? {} : { createdAt: now }),
    };

    await sessionDocRef.set(sessionData, { merge: true });

    return NextResponse.json({
      session: {
        id: sessionDocRef.id,
        ...sessionData,
        createdAt: sessionData.createdAt || now,
      },
    });
  } catch (error) {
    console.error("Create/Save code session error:", error);
    return NextResponse.json({ error: "Failed to save code session" }, { status: 500 });
  }
}
