import { NextRequest, NextResponse } from "next/server";
import { generateJSON, isGeminiConfigured } from "@/lib/gemini";
import { ORCHESTRATOR_NOTE } from "@/lib/prompts";
import {
  CodeExplanationResult,
  CodeSolutionFeedback,
  NextChallengeItem,
} from "@/lib/types";
import {
  mockCodeExplanation,
  mockCodeEvaluation,
  getDifficultyProgression,
} from "@/lib/mockCodeExplainer";

export const runtime = "nodejs";

const CODE_TUTOR_SYSTEM_PROMPT = `${ORCHESTRATOR_NOTE}
You are an expert programming tutor for beginner engineering students.

Your goal is not simply to solve programming problems. Your goal is to help the student understand how and why the code works.

When a student provides code:
1. Identify the programming language.
2. Identify the main programming concepts.
3. Explain the concepts in simple student-friendly language.
4. Explain what the complete program does.
5. Explain meaningful lines of code one by one.
6. Explain why each important line is required.
7. Explain the execution flow in simple numbered steps.
8. Identify relevant beginner mistakes.
9. Create a simple practice task using the same concept (slightly different from submitted code).
10. Give hints instead of immediately giving the solution.
11. Encourage the student to attempt the task independently.
12. When the student submits their solution, analyze their code and provide constructive feedback.
13. Do not unnecessarily rewrite the student's code.
14. Do not overwhelm beginners with advanced terminology.
15. Use small examples whenever they make a concept easier to understand.

Always prioritize understanding over simply producing an answer.
If the submitted code contains an error, clearly identify the error and explain why it occurs.
If the code is correct, do not invent problems.
Return valid JSON matching the exact schema requested.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action = "explain",
      code = "",
      language = "Auto Detect",
      student_code = "",
      task_description = "",
      original_concept = "",
      apiKey,
    } = body;

    // Action: Explain code
    if (action === "explain") {
      if (!code.trim()) {
        return NextResponse.json({ error: "Code is required" }, { status: 400 });
      }

      if (!isGeminiConfigured(apiKey)) {
        const mockRes = mockCodeExplanation(code, language);
        return NextResponse.json(mockRes);
      }

      try {
        const prompt = `Selected Language by User: "${language}"\nCode Snippet:\n\`\`\`\n${code}\n\`\`\`\n\nExplain this code thoroughly for a beginner student. Return a JSON object with this exact shape:
{
  "language": "Detected programming language (e.g. Python, JavaScript, C, C++, Java, HTML, CSS, SQL)",
  "language_mismatch_warning": "Warning if selected language does not match detected code, else null",
  "concept": {
    "title": "Title of the core concept demonstrated (e.g. For Loop, Recursion, Pointer Basics, Linear Regression)",
    "explanation": "Clear, friendly explanation of the main concept in simple language without jargon."
  },
  "program_summary": "1-2 sentence concise summary of what the overall program does.",
  "program_output": "The exact formatted terminal output / console output produced when executing this code.",
  "line_by_line": [
    {
      "line": 1,
      "code": "line code",
      "explanation": "What this line does in simple terms",
      "why": "Why this line is needed / what happens when it runs",
      "important_concept": "Key keyword/syntax or concept note if applicable"
    }
  ],
  "execution_flow": [
    "1. Step one of execution...",
    "2. Step two of execution..."
  ],
  "concepts_used": [
    {
      "name": "Concept name (e.g. Variables, Lists, For loop)",
      "explanation": "One-line clear explanation"
    }
  ],
  "common_mistakes": [
    {
      "mistake": "Mistake title or pattern (e.g. Forgetting the colon)",
      "explanation": "Why this mistake happens and how to avoid/fix it",
      "example_bad": "Optional bad code snippet",
      "example_good": "Optional corrected code snippet"
    }
  ],
  "practice_task": {
    "title": "Practice Task Title",
    "description": "A very simple practice task based on the same concept, slightly different from the submitted code.",
    "difficulty": "Beginner",
    "concepts": ["Concept 1", "Concept 2"],
    "hints": ["Hint 1: ...", "Hint 2: ..."],
    "expected_output": "The exact expected stdout output produced by the reference solution (e.g. 2\\n4\\n6\\n8\\n10)",
    "reference_solution": "Complete correct code solution for the practice task",
    "solution_explanation": [
      {
        "line": 1,
        "code": "line code",
        "explanation": "Why this line is written this way"
      }
    ]
  }
}`;

        const data = await generateJSON<CodeExplanationResult>(
          CODE_TUTOR_SYSTEM_PROMPT,
          prompt,
          apiKey
        );

        return NextResponse.json({ ...data, usedMock: false });
      } catch (err) {
        console.error("Gemini explain failed, falling back to mock:", err);
        const mockRes = mockCodeExplanation(code, language);
        return NextResponse.json(mockRes);
      }
    }

    // Action: Evaluate Student Solution
    if (action === "evaluate") {
      if (!student_code.trim()) {
        return NextResponse.json({ error: "Student code is required" }, { status: 400 });
      }

      if (!isGeminiConfigured(apiKey)) {
        const mockRes = mockCodeEvaluation(student_code, task_description, language);
        return NextResponse.json(mockRes);
      }

      try {
        const prompt = `Language: "${language}"
Original Concept: "${original_concept}"
Task Assigned to Student: "${task_description}"
Student's Submitted Solution:
\`\`\`
${student_code}
\`\`\`

Evaluate whether the student's solution accurately fulfills the task requirement and produces the correct output without syntax/runtime errors.
Return a JSON object with this exact shape:
{
  "what_you_did_well": "Mention the correct parts, good variable naming, or solid approach.",
  "what_needs_improvement": "Explain errors or missing edge cases clearly without being harsh.",
  "hint": "Give a nudge or clue toward fixing the issue.",
  "understanding": "Concept Understood" | "Partially Understood" | "Needs More Practice",
  "is_correct": boolean,
  "expected_output": "The expected console output for the task (e.g. 2\\n4\\n6\\n8\\n10)",
  "actual_output": "The simulated output or compiler/syntax error that the student's code would produce"
}`;

        const data = await generateJSON<CodeSolutionFeedback>(
          CODE_TUTOR_SYSTEM_PROMPT,
          prompt,
          apiKey
        );

        return NextResponse.json({ ...data, usedMock: false });
      } catch (err) {
        console.error("Gemini evaluate failed, falling back to mock:", err);
        const mockRes = mockCodeEvaluation(student_code, task_description, language);
        return NextResponse.json(mockRes);
      }
    }

    // Action: Next Challenges / Difficulty Progression
    if (action === "next_challenges") {
      const challenges = getDifficultyProgression(original_concept, language);
      return NextResponse.json({ challenges });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Code explain route error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
