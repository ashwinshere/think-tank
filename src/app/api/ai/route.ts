import { NextRequest, NextResponse } from "next/server";
import { generateJSON, generatePeerReply, isGeminiConfigured, testConnection } from "@/lib/gemini";
import { ORCHESTRATOR_NOTE, PEER_SYSTEM_PROMPTS } from "@/lib/prompts";
import { decide, OrchestratorInput } from "@/lib/orchestrator";
import { PeerId } from "@/lib/types";
import {
  mockDebate,
  mockDebateEvaluation,
  mockExplain,
  mockInsight,
  mockMistakeAnalysis,
  mockNoAiEvaluation,
  mockPeerReply,
  mockTeachEvaluation,
  mockTeachFollowup,
} from "@/lib/mock";

export const runtime = "nodejs";

async function safe<T>(
  fn: () => Promise<T>,
  fallback: () => T,
  customApiKey?: string
): Promise<{ data: T; usedMock: boolean }> {
  if (!isGeminiConfigured(customApiKey)) return { data: fallback(), usedMock: true };
  try {
    return { data: await fn(), usedMock: false };
  } catch (err) {
    console.error("Gemini call failed, using fallback:", err);
    return { data: fallback(), usedMock: true };
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, payload, apiKey } = body;

  switch (action) {
    case "test_connection": {
      const result = await testConnection(apiKey);
      return NextResponse.json(result);
    }

    case "peer_message": {
      const {
        history = [],
        studentMessage = "",
        turnIndex = 0,
        usage,
        priorMistakeTopics = [],
        mode = "learning",
        forcePeer,
        isDirectRequest,
        topic,
      } = payload as {
        history: { role: "student" | "peer"; text: string }[];
        studentMessage: string;
        turnIndex: number;
        usage: any;
        priorMistakeTopics: string[];
        mode: "learning" | "debate" | "teach" | "noai";
        forcePeer?: PeerId;
        isDirectRequest?: boolean;
        topic?: string;
      };

      const decision = forcePeer
        ? {
            peer: forcePeer,
            hintLevel: (isDirectRequest ? 3 : 1) as 1 | 2 | 3,
            shouldFlagMisconception: false,
            shouldSuggestNoAiRound: false,
            reason: isDirectRequest ? "Direct explanation requested" : "Requested directly",
          }
        : decide({
            turnIndex,
            studentMessage,
            usage,
            priorMistakeTopics,
            mode,
          } as OrchestratorInput);

      const systemInstruction = `${ORCHESTRATOR_NOTE}\n${PEER_SYSTEM_PROMPTS[decision.peer]}${
        decision.peer === "mentor"
          ? `\nCurrent hint level: ${decision.hintLevel} of 3 (1 = conceptual nudge/analogy, 2 = step-by-step mechanism, 3 = worked explanation).`
          : ""
      }${
        isDirectRequest
          ? "\nIMPORTANT: The student has requested a direct, comprehensive explanation. Give a crystal-clear, structured breakdown with intuition, definition, and example."
          : ""
      }`;

      const { data: reply, usedMock } = await safe(
        () => generatePeerReply(systemInstruction, history, studentMessage, apiKey),
        () => mockPeerReply(decision.peer, studentMessage, history, topic, decision.hintLevel, isDirectRequest),
        apiKey
      );

      return NextResponse.json({ decision, reply, usedMock });
    }

    case "mistake_analysis": {
      const { topic, studentReasoning } = payload as {
        topic: string;
        studentReasoning: string;
      };

      const { data, usedMock } = await safe(
        () =>
          generateJSON<{
            understood: string;
            wentWrong: string;
            misconception: string;
            smallerQuestion: string;
          }>(
            `${ORCHESTRATOR_NOTE}\nYou analyze a student's reasoning kindly and precisely, for a feature called Mistake Analysis. Never use words like "wrong" or "failed".`,
            `Topic: ${topic}\nStudent's reasoning: "${studentReasoning}"\n\nReturn JSON with keys: understood (what they got right, 1 sentence), wentWrong (where the reasoning slipped, 1 sentence, gentle), misconception (the likely underlying misconception, 1 sentence), smallerQuestion (a smaller, easier question that helps fix it, 1 sentence).`,
            apiKey
          ),
        () => mockMistakeAnalysis(topic),
        apiKey
      );

      return NextResponse.json({ ...data, usedMock });
    }

    case "debate_generate": {
      const { topic } = payload as { topic: string };

      const { data, usedMock } = await safe(
        () =>
          generateJSON<{
            viewpointA: { persona: "explorer"; argument: string };
            viewpointB: { persona: "challenger"; argument: string };
          }>(
            `${ORCHESTRATOR_NOTE}\nYou generate two reasonable, opposing viewpoints for a student debate exercise.`,
            `Debate topic (a claim the student made): "${topic}"\n\nReturn JSON: { "viewpointA": { "persona": "explorer", "argument": "..." }, "viewpointB": { "persona": "challenger", "argument": "..." } }. viewpointA supports the claim, viewpointB reasonably challenges it. Each argument 1-2 sentences, concrete, no hedging filler.`,
            apiKey
          ),
        () => mockDebate(topic),
        apiKey
      );

      return NextResponse.json({ ...data, usedMock });
    }

    case "debate_evaluate": {
      const { topic, chosenViewpoint, studentReasoning } = payload as {
        topic: string;
        chosenViewpoint: string;
        studentReasoning: string;
      };

      const { data, usedMock } = await safe(
        () =>
          generateJSON<{
            verdict: string;
            strengthScore: number;
            feedback: string;
          }>(
            `${ORCHESTRATOR_NOTE}\nYou evaluate a student's explanation for why they picked a side in a debate. IMPORTANT: do not reward them just for picking the "correct" side — evaluate the quality of their reasoning, evidence, and specificity.`,
            `Topic: "${topic}"\nStudent chose: "${chosenViewpoint}"\nStudent's explanation for why: "${studentReasoning}"\n\nReturn JSON: { "verdict": one of "weak"|"reasonable"|"strong", "strengthScore": 0-100, "feedback": "1-2 sentences of specific, encouraging feedback on the REASONING quality" }.`,
            apiKey
          ),
        () => mockDebateEvaluation(),
        apiKey
      );

      return NextResponse.json({ ...data, usedMock });
    }

    case "teach_followup": {
      const { topic, conversation } = payload as {
        topic: string;
        conversation: { role: "student" | "peer"; text: string }[];
      };

      const { data, usedMock } = await safe(
        () =>
          generateJSON<{ reply: string; done: boolean }>(
            `${ORCHESTRATOR_NOTE}\nYou are a curious peer being TAUGHT by the student about "${topic}". Ask short, genuine follow-up questions that probe for depth (mechanism, edge cases, examples) — like a smart classmate who wants to really get it. After 3-4 exchanges, or once the explanation covers the mechanism, an edge case, and an example, set done=true.`,
            `Conversation so far:\n${conversation
              .map((c) => `${c.role === "student" ? "Student" : "You"}: ${c.text}`)
              .join("\n")}\n\nReturn JSON: { "reply": "your next short follow-up question or closing acknowledgement", "done": boolean }.`,
            apiKey
          ),
        () => mockTeachFollowup(),
        apiKey
      );

      return NextResponse.json({ ...data, usedMock });
    }

    case "teach_evaluate": {
      const { topic, conversation } = payload as {
        topic: string;
        conversation: { role: "student" | "peer"; text: string }[];
      };

      const { data, usedMock } = await safe(
        () =>
          generateJSON<{
            conceptAccuracy: number;
            clarity: number;
            missingDetails: string;
            exampleGiven: boolean;
            summary: string;
          }>(
            `${ORCHESTRATOR_NOTE}\nYou evaluate how well a student taught the concept "${topic}" to a peer.`,
            `Full teaching conversation:\n${conversation
              .map((c) => `${c.role === "student" ? "Student" : "Peer"}: ${c.text}`)
              .join("\n")}\n\nReturn JSON: { "conceptAccuracy": 0-100, "clarity": 0-100, "missingDetails": "1 short sentence on what's missing, or 'Nothing major' if complete", "exampleGiven": boolean, "summary": "1-2 sentences starting with 'Your explanation is strong because...' or similarly warm framing" }.`,
            apiKey
          ),
        () => mockTeachEvaluation(),
        apiKey
      );

      return NextResponse.json({ ...data, usedMock });
    }

    case "noai_generate_problem": {
      const { memories = [], profile } = payload as {
        memories: Array<{ content: string; category?: string }>;
        profile?: any;
      };

      const memoryContext = memories.length > 0
        ? memories.map((m) => `- ${m.content} (${m.category || "general"})`).join("\n")
        : "General computer science and conceptual reasoning fundamentals.";

      const { data, usedMock } = await safe(
        () =>
          generateJSON<{
            problem: string;
            topic: string;
            hint: string;
          }>(
            `${ORCHESTRATOR_NOTE}\nYou generate a personalized, conceptual challenge problem for a student to solve without AI help. The problem should specifically test the student's independent reasoning on topics/skills they have been learning.`,
            `Student's background and learned topics:\n${memoryContext}\n\nTask: Generate ONE thought-provoking, intuitive challenge question (2-3 sentences max) that tests their deep conceptual reasoning (e.g. asking them to evaluate a trade-off, edge case, or mechanism). Avoid pure trivia; focus on reasoning.\n\nReturn JSON: { "problem": "...", "topic": "short topic name (e.g. Recursion & Stack Limits, Cache Trade-offs)", "hint": "..." }`,
            apiKey
          ),
        () => {
          const fallbackProblems = [
            {
              problem: "You have a sorted list of 1,000 numbers and need to find one value. Would you scan it one by one, or is there a faster way? Explain your reasoning.",
              topic: "Binary Search & Time Complexity",
              hint: "Think about halving the search space.",
            },
            {
              problem: "A friend says 'more RAM always makes a program run faster.' Is that true? Explain your reasoning.",
              topic: "Hardware & Memory Bottlenecks",
              hint: "Consider CPU caches and algorithmic complexity.",
            },
            {
              problem: "Why might a recursive function that works perfectly for small inputs suddenly crash for large ones?",
              topic: "Recursion & Call Stack",
              hint: "Think about stack memory limits.",
            },
          ];
          return fallbackProblems[Math.floor(Math.random() * fallbackProblems.length)];
        },
        apiKey
      );

      return NextResponse.json({ ...data, usedMock });
    }

    case "noai_evaluate": {
      const { problem, studentSolution } = payload as {
        problem: string;
        studentSolution: string;
      };

      const { data, usedMock } = await safe(
        () =>
          generateJSON<{
            independentReasoning: number;
            conceptUnderstanding: number;
            selfCorrection: number;
            feedback: string;
          }>(
            `${ORCHESTRATOR_NOTE}\nYou are an expert computer science teacher evaluating a student's independent reasoning attempt. Analyze their ACTUAL submitted reasoning accurately, critically, and constructively based on the problem requirements.\n\nScoring rubric (0-100):\n- 0 to 40: Solution is off-topic, nonsense, or completely misses the fundamental concept.\n- 41 to 75: Solution has correct intuition or keywords but lacks the core mechanism or has flawed reasoning steps.\n- 76 to 100: Solution is accurate, explains the underlying mechanics clearly, and demonstrates solid conceptual understanding.\n\nNever blindly award high scores for poor, brief, or off-topic responses. Feedback MUST be 2-3 specific sentences evaluating what they got right, what was missing, or what misconception occurred.`,
            `Problem: ${JSON.stringify(problem)}\nStudent's submitted solution: ${JSON.stringify(studentSolution)}\n\nReturn JSON: { "independentReasoning": number, "conceptUnderstanding": number, "selfCorrection": number, "feedback": "string" }`,
            apiKey
          ),
        () => mockNoAiEvaluation(problem, studentSolution),
        apiKey
      );

      return NextResponse.json({ ...data, usedMock });
    }

    case "explain_my_way": {
      const { doubt, style } = payload as { doubt: string; style: string };

      const styleGuides: Record<string, string> = {
        simple: "Explain it as simply as possible using one everyday analogy.",
        example: "Explain it through one concrete worked example, step by step.",
        meme: "Explain it in a light, funny, meme-adjacent, student-friendly voice. Keep it good-natured.",
        story: "Explain it as a very short 3-4 sentence story with characters.",
        cinema: "Explain it as a short dramatic movie-scene description, cinematic but still accurate.",
        tanglish: "Explain it in casual Tanglish (Tamil + English mix, written in Latin script), the way a friend would explain it in Chennai.",
      };

      const { data, usedMock } = await safe(
        async () => {
          const text = await generatePeerReply(
            `${ORCHESTRATOR_NOTE}\nYou explain a concept in a specific requested style, for a feature called "Explain it my way". ${styleGuides[style] || styleGuides.simple} Keep it under 5 sentences. Stay factually accurate even while being playful.`,
            [],
            `Explain: ${doubt}`,
            apiKey
          );
          return { explanation: text };
        },
        () => ({ explanation: mockExplain(style, doubt) }),
        apiKey
      );

      return NextResponse.json({ ...data, usedMock });
    }

    case "insight": {
      const { summary } = payload as { summary: string };

      const { data, usedMock } = await safe(
        async () => {
          const text = await generatePeerReply(
            `${ORCHESTRATOR_NOTE}\nYou give ONE short, specific, encouraging insight (max 2 sentences) about a student's learning habits based on a summary of their recent session. This is about reasoning habits, never an IQ or intelligence judgement.`,
            [],
            `Session summary: ${summary}\n\nGive one short insight, in the voice of a supportive mentor.`,
            apiKey
          );
          return { insight: text };
        },
        () => ({ insight: mockInsight() }),
        apiKey
      );

      return NextResponse.json({ ...data, usedMock });
    }

    case "code_explain": {
      const { code, language = "Auto Detect" } = payload as {
        code: string;
        language?: string;
      };

      const prompt = `Selected Language by User: "${language}"\nCode Snippet:\n\`\`\`\n${code}\n\`\`\`\n\nExplain this code thoroughly for a beginner student. Return a JSON object with: language, language_mismatch_warning, concept { title, explanation }, program_summary, line_by_line [{ line, code, explanation, why, important_concept }], execution_flow (string array), concepts_used [{ name, explanation }], common_mistakes [{ mistake, explanation, example_bad, example_good }], practice_task { title, description, difficulty, concepts, hints, reference_solution, solution_explanation [{ line, code, explanation }] }`;

      const { data, usedMock } = await safe(
        () =>
          generateJSON<any>(
            `${ORCHESTRATOR_NOTE}\nYou are an expert programming tutor for beginner engineering students. Return strict JSON.`,
            prompt,
            apiKey
          ),
        () => {
          const { mockCodeExplanation } = require("@/lib/mockCodeExplainer");
          return mockCodeExplanation(code, language);
        },
        apiKey
      );

      return NextResponse.json({ ...data, usedMock });
    }

    case "code_evaluate": {
      const { student_code, task_description, original_concept, language = "Python" } = payload as {
        student_code: string;
        task_description: string;
        original_concept: string;
        language?: string;
      };

      const prompt = `Language: "${language}"\nOriginal Concept: "${original_concept}"\nTask Assigned: "${task_description}"\nStudent's Submitted Solution:\n\`\`\`\n${student_code}\n\`\`\`\n\nEvaluate constructively. Return JSON: { what_you_did_well, what_needs_improvement, hint, understanding ("Concept Understood"|"Partially Understood"|"Needs More Practice"), is_correct (boolean) }`;

      const { data, usedMock } = await safe(
        () =>
          generateJSON<any>(
            `${ORCHESTRATOR_NOTE}\nYou are a warm, constructive programming tutor evaluating student code. Return strict JSON.`,
            prompt,
            apiKey
          ),
        () => {
          const { mockCodeEvaluation } = require("@/lib/mockCodeExplainer");
          return mockCodeEvaluation(student_code, task_description, language);
        },
        apiKey
      );

      return NextResponse.json({ ...data, usedMock });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}

