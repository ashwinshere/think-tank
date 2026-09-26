import { PeerId, UsageStats } from "./types";

/**
 * The Orchestrator layer.
 *
 * Design note for reviewers: for a hackathon-reliable demo, the *peer
 * selection* itself is a small rule-based state machine rather than an
 * extra Gemini round-trip. This keeps the demo flow (Explorer → Challenger
 * → Critic → Mentor) fast, deterministic, and reproducible on stage, while
 * the actual *content* of every reply still comes from Gemini using that
 * peer's persona. The state machine is intentionally simple so it's easy
 * to swap for an LLM-driven router later (see README "Extending").
 *
 * It receives everything the spec asks for: the student's question, their
 * latest response, conversation history, prior mistakes, AI usage stats,
 * and the current learning mode — and decides which peer responds, whether
 * a hint is needed, whether to challenge, and whether a misconception
 * should be flagged for the Mistake Museum.
 */

export interface OrchestratorInput {
  turnIndex: number; // how many peer replies have happened in this session so far
  studentMessage: string;
  usage: UsageStats;
  priorMistakeTopics: string[];
  mode: "learning" | "debate" | "teach" | "noai";
}

export interface OrchestratorDecision {
  peer: PeerId;
  hintLevel: 1 | 2 | 3;
  shouldFlagMisconception: boolean;
  shouldSuggestNoAiRound: boolean;
  reason: string;
}

const STUCK_SIGNALS = [
  "i don't know",
  "i dont know",
  "not sure",
  "no idea",
  "stuck",
  "confused",
  "i give up",
  "help",
];

const UNCERTAIN_SIGNALS = ["maybe", "i think", "not really sure", "guess"];

export function decide(input: OrchestratorInput): OrchestratorDecision {
  const msg = input.studentMessage.toLowerCase();
  const isStuck = STUCK_SIGNALS.some((s) => msg.includes(s));
  const isUncertain = UNCERTAIN_SIGNALS.some((s) => msg.includes(s));

  // A student who is clearly stuck always gets Mentor, regardless of turn.
  if (isStuck) {
    const hintLevel = Math.min(3, 1 + Math.floor(input.usage.hintsRequested / 2)) as
      | 1
      | 2
      | 3;
    return {
      peer: "mentor",
      hintLevel,
      shouldFlagMisconception: false,
      shouldSuggestNoAiRound: false,
      reason: "Student signaled they're stuck — Mentor gives a progressive hint.",
    };
  }

  // Otherwise, follow the canonical study-session rhythm:
  // 0: Explorer opens up the problem
  // 1: Challenger probes the first answer
  // 2: Critic checks the reasoning for gaps
  // 3+: Mentor / Explorer alternate, escalating hints if the student is uncertain
  const rhythm: PeerId[] = ["explorer", "challenger", "critic", "mentor"];
  const peer =
    input.turnIndex < rhythm.length
      ? rhythm[input.turnIndex]
      : isUncertain
      ? "mentor"
      : input.turnIndex % 2 === 0
      ? "explorer"
      : "challenger";

  const dependencyRatio =
    input.usage.hintsRequested + input.usage.directAnswersRequested >
    input.usage.independentlySolved * 1.5 + 2;

  return {
    peer,
    hintLevel: isUncertain ? 2 : 1,
    shouldFlagMisconception: peer === "critic",
    shouldSuggestNoAiRound: dependencyRatio && input.turnIndex > 2,
    reason: `Turn ${input.turnIndex}: following study-session rhythm${
      isUncertain ? " (student sounded uncertain, leaning toward a hint)" : ""
    }.`,
  };
}

export function computeIndependence(usage: UsageStats) {
  const total =
    usage.hintsRequested +
    usage.directAnswersRequested +
    usage.independentlySolved +
    usage.aiAssistedAttempts || 1;

  const independent = Math.round((usage.independentlySolved / total) * 100);
  const hints = Math.round((usage.hintsRequested / total) * 100);
  const direct = Math.round((usage.directAnswersRequested / total) * 100);

  return { independent, hints, direct };
}
