export type PeerId =
  | "explorer"
  | "challenger"
  | "critic"
  | "mentor"
  | "devils_advocate";

export interface PeerInfo {
  id: PeerId;
  name: string;
  tagline: string;
  description: string;
}

export const PEERS: Record<PeerId, PeerInfo> = {
  explorer: {
    id: "explorer",
    name: "Explorer",
    tagline: "Finds different ways to approach the problem.",
    description:
      "Helps you discover possibilities instead of handing you the destination. Expect questions, not answers.",
  },
  challenger: {
    id: "challenger",
    name: "Challenger",
    tagline: "Questions your reasoning.",
    description:
      "Pokes at assumptions and asks for evidence — never to be difficult, always to sharpen your thinking.",
  },
  critic: {
    id: "critic",
    name: "Critic",
    tagline: "Looks for mistakes.",
    description:
      "Reads your reasoning closely for logical gaps and edge cases, and explains what it finds gently.",
  },
  mentor: {
    id: "mentor",
    name: "Mentor",
    tagline: "Helps when you're stuck.",
    description:
      "Gives progressively stronger hints — small nudges first, never the full solution right away.",
  },
  devils_advocate: {
    id: "devils_advocate",
    name: "Devil's Advocate",
    tagline: "Argues the other side.",
    description:
      "Builds the strongest reasonable opposing case so you learn to defend — or revise — your position.",
  },
};

export interface ChatMessage {
  id: string;
  role: "student" | "peer" | "system";
  persona?: PeerId;
  text: string;
  timestamp: number;
}

export interface Mistake {
  id: string;
  topic: string;
  misconception: string;
  cause: string;
  date: string;
  status: "needs-practice" | "corrected";
}

export interface UsageStats {
  hintsRequested: number;
  directAnswersRequested: number;
  independentlySolved: number;
  aiAssistedAttempts: number;
}

export interface ThinkingScore {
  reasoning: number;
  analysis: number;
  questioning: number;
  creativity: number;
  selfCorrection: number;
  independence: number;
}

export const DEFAULT_SCORE: ThinkingScore = {
  reasoning: 60,
  analysis: 60,
  questioning: 55,
  creativity: 58,
  selfCorrection: 55,
  independence: 60,
};

export const DEFAULT_USAGE: UsageStats = {
  hintsRequested: 0,
  directAnswersRequested: 0,
  independentlySolved: 0,
  aiAssistedAttempts: 0,
};

export type ExplainStyle =
  | "simple"
  | "example"
  | "meme"
  | "story"
  | "cinema"
  | "tanglish";

export type PostType = "doubt" | "challenge" | "explain" | "project" | "mistake";
export type SubjectType = "DSA" | "Web" | "AI" | "C" | "Python" | "Other";
export type ReactionType = "helpful" | "good_reasoning" | "needs_evidence" | "same_doubt";

export const POST_TYPE_META: Record<
  PostType,
  { label: string; icon: string; description: string; tagClass: string }
> = {
  doubt: {
    label: "Doubt",
    icon: "🧠",
    description: "I don't understand this.",
    tagClass: "bg-amber-50 text-amber-900 border-amber-200/60",
  },
  challenge: {
    label: "Challenge",
    icon: "⚔️",
    description: "Can you solve this?",
    tagClass: "bg-rose-50 text-rose-900 border-rose-200/60",
  },
  explain: {
    label: "Explain",
    icon: "💡",
    description: "I understood this. Let me explain.",
    tagClass: "bg-emerald-50 text-emerald-900 border-emerald-200/60",
  },
  project: {
    label: "Project",
    icon: "🚀",
    description: "I'm building this. Need suggestions.",
    tagClass: "bg-sky-50 text-sky-900 border-sky-200/60",
  },
  mistake: {
    label: "Mistake",
    icon: "🏛️",
    description: "I made this mistake. Here's what I learned.",
    tagClass: "bg-purple-50 text-purple-900 border-purple-200/60",
  },
};

export const REACTION_META: Record<ReactionType, { label: string; icon: string }> = {
  helpful: { label: "Helpful", icon: "💡" },
  good_reasoning: { label: "Good reasoning", icon: "🧠" },
  needs_evidence: { label: "Needs evidence", icon: "🔍" },
  same_doubt: { label: "Same doubt", icon: "❤️" },
};

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  type: PostType;
  subject?: SubjectType;
  authorId: string;
  authorName: string;
  authorEmail?: string;
  createdAt: string;
  updatedAt?: string;
  reactions: Record<ReactionType, number>;
  userReactions?: Record<string, ReactionType>;
  replyCount: number;
  thinkingCount: number;
  views: number;
  circleId?: string;
  isAnonymous?: boolean;
  mistakeDetails?: {
    whatWentWrong: string;
    whatILearned: string;
    relateCount: number;
    relatedUserIds?: string[];
  };
}

export interface CommunityComment {
  id: string;
  postId: string;
  parentId?: string | null;
  authorId: string;
  authorName: string;
  isAi?: boolean;
  aiPersona?: string;
  content: string;
  createdAt: string;
  reactions: Record<ReactionType, number>;
  userReactions?: Record<string, ReactionType>;
}

export interface StudyCircle {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  memberIds: string[];
  challenges: Array<{ id: string; title: string; difficulty: "Easy" | "Medium" | "Hard"; points: number }>;
  resources: Array<{ id: string; title: string; link: string; type: string }>;
  createdAt: string;
  creatorId: string;
}

export interface ThinkingAttempt {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userReasoning: string;
  aiFeedback: {
    intuition: string;
    conditionOrNuance: string;
    qualityScore: number;
    improvedReasoningHint: string;
    isCorrectIntuition: boolean;
  };
  createdAt: string;
  pointsAwarded: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  actorId: string;
  actorName: string;
  type: "reply" | "reaction" | "mention" | "challenge_response" | "points";
  postId: string;
  postTitle: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface OnlineThinker {
  userId: string;
  userName: string;
  lastActive: number;
  currentPostId?: string;
  isThinking?: boolean;
}

export type SupportedLanguage =
  | "Python"
  | "C"
  | "C++"
  | "Java"
  | "JavaScript"
  | "HTML"
  | "CSS"
  | "SQL";

export interface LineExplanation {
  line: number;
  code: string;
  explanation: string;
  why: string;
  important_concept?: string;
}

export interface ConceptUsed {
  name: string;
  explanation: string;
}

export interface CommonMistake {
  mistake: string;
  explanation: string;
  example_bad?: string;
  example_good?: string;
}

export interface PracticeTask {
  title: string;
  description: string;
  difficulty: "Beginner" | "Easy" | "Intermediate";
  concepts: string[];
  hints: string[];
  expected_output?: string;
  reference_solution?: string;
  solution_explanation?: Array<{
    line: number;
    code: string;
    explanation: string;
  }>;
}

export interface CodeExplanationResult {
  language: string;
  language_mismatch_warning?: string | null;
  concept: {
    title: string;
    explanation: string;
  };
  program_summary: string;
  program_output?: string;
  line_by_line: LineExplanation[];
  execution_flow: string[];
  concepts_used: ConceptUsed[];
  common_mistakes: CommonMistake[];
  practice_task: PracticeTask;
  usedMock?: boolean;
}

export interface CodeSolutionFeedback {
  what_you_did_well: string;
  what_needs_improvement: string;
  hint: string;
  understanding: "Concept Understood" | "Partially Understood" | "Needs More Practice";
  is_correct: boolean;
  expected_output?: string;
  actual_output?: string;
  usedMock?: boolean;
}

export interface NextChallengeItem {
  level: 1 | 2 | 3;
  level_name: "Level 1 — Beginner" | "Level 2 — Easy" | "Level 3 — Intermediate";
  title: string;
  description: string;
  hints: string[];
  expected_output?: string;
  reference_solution?: string;
}

export interface CodeSessionSummary {
  id: string;
  title: string;
  language: string;
  conceptTitle?: string;
  codeSnippet?: string;
  createdAt: string;
  updatedAt: string;
  isCorrect?: boolean;
  hasSolution?: boolean;
}

export interface CodeSessionDetail extends CodeSessionSummary {
  code: string;
  output?: string;
  explanation?: CodeExplanationResult | null;
  studentCode?: string;
  studentOutput?: string;
  feedback?: CodeSolutionFeedback | null;
}



