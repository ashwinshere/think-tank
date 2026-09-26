"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Lightbulb, SendHorizonal, Sparkles, RotateCcw, BookOpen, KeyRound, Plus } from "lucide-react";
import { Card, SectionHeader } from "./ui/Card";
import { PeerBadge } from "./PeerBadge";
import { ChatMessage, Mistake, PeerId, UsageStats } from "@/lib/types";
import { callAI, getStoredApiKey } from "@/lib/api";
import { loadUsage, saveUsage, saveMistake, nudgeScore } from "@/lib/storage";
import { PEER_STYLES } from "@/lib/peerStyles";
import { ApiKeyModal } from "./ApiKeyModal";
import { useAuth } from "@/lib/AuthContext";
import { useConversations } from "@/lib/ConversationContext";

const STARTER_PROMPTS = [
  "I don't understand recursion.",
  "Why does a stack use LIFO?",
  "I'm confused about time complexity.",
  "Arrays vs linked lists — I don't get the trade-off.",
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

interface MistakeAnalysis {
  understood: string;
  wentWrong: string;
  misconception: string;
  smallerQuestion: string;
}

export function LearningSession() {
  const { user, getIdToken } = useAuth();
  const {
    activeConversationId,
    setActiveConversationId,
    createConversation,
    loadConversations,
  } = useConversations();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [topic, setTopic] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [trail, setTrail] = useState<PeerId[]>([]);
  const [usage, setUsage] = useState<UsageStats>(loadUsage());
  const [analysis, setAnalysis] = useState<MistakeAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [savedMistake, setSavedMistake] = useState(false);
  const [reflecting, setReflecting] = useState(false);
  const [reflectionAnswer, setReflectionAnswer] = useState("");
  const [reflectionDone, setReflectionDone] = useState(false);
  const [usedMockOnce, setUsedMockOnce] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load active conversation messages from database
  const loadActiveConversation = useCallback(async (convId: string) => {
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/conversations/${convId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const conv = data.conversation;
        setTopic(conv.topic || conv.title);

        const loadedMessages: ChatMessage[] = conv.messages.map((m: any) => ({
          id: m.id,
          role: m.role as "student" | "peer" | "system",
          persona: m.persona as PeerId | undefined,
          text: m.content,
          timestamp: new Date(m.createdAt).getTime(),
        }));

        setMessages(loadedMessages);

        // Reconstruct reasoning trail from peer messages
        const peerTrail = loadedMessages
          .filter((m) => m.role === "peer" && m.persona)
          .map((m) => m.persona as PeerId);
        setTrail(peerTrail);
      }
    } catch (err) {
      console.error("Failed to load conversation messages:", err);
    }
  }, [getIdToken]);

  useEffect(() => {
    if (activeConversationId) {
      loadActiveConversation(activeConversationId);
    } else {
      // Reset if no active conversation
      setMessages([]);
      setTopic(null);
      setTrail([]);
      setAnalysis(null);
      setSavedMistake(false);
      setReflecting(false);
      setReflectionDone(false);
    }
  }, [activeConversationId, loadActiveConversation]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, analysis, reflecting]);

  function persistUsage(next: UsageStats) {
    setUsage(next);
    saveUsage(next);
  }

  async function sendMessage(
    text: string,
    opts?: { forcePeer?: PeerId; isHintRequest?: boolean; isDirectRequest?: boolean }
  ) {
    if (!text.trim() || loading) return;
    const isFirst = messages.length === 0;
    const activeTopic = isFirst ? text.trim() : topic;
    if (isFirst) setTopic(text.trim());

    const studentMsg: ChatMessage = {
      id: uid(),
      role: "student",
      text: text.trim(),
      timestamp: Date.now(),
    };
    const nextMessages = [...messages, studentMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setAnalysis(null);

    let nextUsage = usage;
    if (opts?.isHintRequest) {
      nextUsage = { ...usage, hintsRequested: usage.hintsRequested + 1 };
      persistUsage(nextUsage);
    } else if (opts?.isDirectRequest) {
      nextUsage = { ...usage, directAnswersRequested: usage.directAnswersRequested + 1 };
      persistUsage(nextUsage);
    }

    try {
      // If user is authenticated, use persisted conversation API
      if (user) {
        let convId = activeConversationId;
        if (!convId) {
          convId = await createConversation(activeTopic?.slice(0, 40) || "New Session", activeTopic || undefined);
        }

        if (convId) {
          const token = await getIdToken();
          const res = await fetch(`/api/conversations/${convId}/messages`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              studentMessage: studentMsg.text,
              turnIndex: trail.length,
              usage: nextUsage,
              priorMistakeTopics: [],
              mode: "learning",
              forcePeer: opts?.forcePeer,
              isDirectRequest: opts?.isDirectRequest,
              topic: activeTopic,
              apiKey: getStoredApiKey(),
            }),
          });

          if (!res.ok) throw new Error("Failed to send message");

          const data = await res.json();
          if (data.usedMock) setUsedMockOnce(true);

          const peerMsg: ChatMessage = {
            id: data.peerMessage?.id || uid(),
            role: "peer",
            persona: data.decision.peer,
            text: data.reply,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, peerMsg]);
          setTrail((prev) => [...prev, data.decision.peer]);
          loadConversations();
          return;
        }
      }

      // Guest / Fallback unauthenticated mode
      const history = nextMessages
        .slice(0, -1)
        .map((m) => ({ role: m.role === "student" ? "student" : "peer", text: m.text } as const));

      const res = await callAI<{ decision: { peer: PeerId }; reply: string; usedMock: boolean }>(
        "peer_message",
        {
          history,
          studentMessage: studentMsg.text,
          turnIndex: trail.length,
          usage: nextUsage,
          priorMistakeTopics: [],
          mode: "learning",
          forcePeer: opts?.forcePeer,
          isDirectRequest: opts?.isDirectRequest,
          topic: activeTopic,
        }
      );

      if (res.usedMock) setUsedMockOnce(true);

      const peerMsg: ChatMessage = {
        id: uid(),
        role: "peer",
        persona: res.decision.peer,
        text: res.reply,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, peerMsg]);
      setTrail((prev) => [...prev, res.decision.peer]);
    } catch (e) {
      console.error("Message send failed:", e);
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "system",
          text: "Something went wrong reaching the AI peer. Please try again.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function runMistakeAnalysis() {
    const lastStudentMsg = [...messages].reverse().find((m) => m.role === "student");
    if (!topic || !lastStudentMsg) return;
    setAnalysisLoading(true);
    try {
      const res = await callAI<MistakeAnalysis & { usedMock: boolean }>("mistake_analysis", {
        topic,
        studentReasoning: lastStudentMsg.text,
      });
      setAnalysis(res);
      setSavedMistake(false);
    } finally {
      setAnalysisLoading(false);
    }
  }

  function saveToMuseum() {
    if (!analysis || !topic) return;
    const mistake: Mistake = {
      id: uid(),
      topic,
      misconception: analysis.misconception,
      cause: analysis.wentWrong,
      date: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      status: "needs-practice",
    };
    saveMistake(mistake);
    setSavedMistake(true);
    nudgeScore({ selfCorrection: 2, analysis: 2 });
  }

  async function finishReflection() {
    if (!reflectionAnswer.trim()) return;
    setReflectionDone(true);
    nudgeScore({ reasoning: 3, independence: 2, questioning: 1 });
    persistUsage({ ...usage, independentlySolved: usage.independentlySolved + 1 });
  }

  function resetSession() {
    setActiveConversationId(null);
    setMessages([]);
    setTopic(null);
    setTrail([]);
    setAnalysis(null);
    setSavedMistake(false);
    setReflecting(false);
    setReflectionAnswer("");
    setReflectionDone(false);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <SectionHeader
          eyebrow="Learning Session"
          title={topic || "What are you trying to understand?"}
          description="Bring a question or a half-formed idea. Your AI peer team will explain the intuition and think it through with you."
        />
        <div className="flex items-center gap-2">
          {user && (
            <button
              onClick={resetSession}
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border border-line bg-paper hover:border-accent text-ink transition shrink-0"
              title="Start a new chat session"
            >
              <Plus size={13} className="text-accent-dark" />
              New Chat
            </button>
          )}
          <button
            onClick={() => setShowKeyModal(true)}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-line bg-paper hover:border-accent text-ink transition shrink-0"
          >
            <KeyRound size={13} className="text-accent-dark" />
            {getStoredApiKey() ? "⚡ Live AI" : "🧠 Smart Mock"}
          </button>
        </div>
      </div>

      {messages.length === 0 ? (
        <Card className="p-6 md:p-8">
          <StarterInput onSend={(t) => sendMessage(t)} />
          <div className="mt-5">
            <p className="text-xs font-medium text-subink mb-2">Or try one of these</p>
            <div className="flex flex-wrap gap-2">
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="text-sm px-3 py-1.5 rounded-full bg-paper border border-line hover:border-accent hover:text-accent-dark transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="flex flex-col h-[70vh] overflow-hidden">
          {trail.length > 0 && (
            <div className="px-5 py-3 border-b border-line bg-paper/60 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-subink shrink-0">
                  Reasoning trail
                </span>
                {trail.map((p, i) => (
                  <span key={i} className="flex items-center gap-2 shrink-0">
                    {i > 0 && <span className="text-subink/50 text-xs">→</span>}
                    <PeerBadge peer={p} size="sm" />
                  </span>
                ))}
              </div>
              <button
                onClick={resetSession}
                className="text-[11px] text-subink hover:text-accent-dark transition flex items-center gap-1 shrink-0 font-medium"
              >
                <RotateCcw size={11} /> Reset
              </button>
            </div>
          )}

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-subink text-sm pl-1">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-subink animate-pulseDot" style={{ animationDelay: "0s" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-subink animate-pulseDot" style={{ animationDelay: "0.15s" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-subink animate-pulseDot" style={{ animationDelay: "0.3s" }} />
                </span>
                thinking with you...
              </div>
            )}

            {analysisLoading && (
              <p className="text-sm text-subink pl-1">Looking closely at the reasoning...</p>
            )}

            {analysis && (
              <div className="animate-fadeUp bg-peer-criticBg border border-peer-critic/25 rounded-xl2 p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-peer-critic mb-1">
                  Mistake Analysis
                </p>
                <p className="text-sm text-ink"><span className="font-semibold">What you got right: </span>{analysis.understood}</p>
                <p className="text-sm text-ink"><span className="font-semibold">Where it slipped: </span>{analysis.wentWrong}</p>
                <p className="text-sm text-ink"><span className="font-semibold">Likely misconception: </span>{analysis.misconception}</p>
                <p className="text-sm text-ink"><span className="font-semibold">Try this smaller question: </span>{analysis.smallerQuestion}</p>
                <div className="pt-1">
                  {savedMistake ? (
                    <span className="text-xs font-medium text-accent-dark">Saved to Mistake Museum ✓</span>
                  ) : (
                    <button
                      onClick={saveToMuseum}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-peer-critic/30 text-peer-critic hover:bg-peer-criticBg transition-colors"
                    >
                      Save to Mistake Museum
                    </button>
                  )}
                </div>
              </div>
            )}

            {reflecting && !reflectionDone && (
              <div className="animate-fadeUp bg-accent-light border border-accent/25 rounded-xl2 p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">Quick reflection</p>
                <p className="text-sm text-ink">What helped you understand this?</p>
                <textarea
                  value={reflectionAnswer}
                  onChange={(e) => setReflectionAnswer(e.target.value)}
                  rows={2}
                  className="w-full text-sm rounded-lg border border-line px-3 py-2 bg-white focus:border-accent outline-none"
                  placeholder="e.g. Breaking it into the smallest possible case made it click."
                />
                <button
                  onClick={finishReflection}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-accent text-white hover:bg-accent-dark transition-colors"
                >
                  Save reflection
                </button>
              </div>
            )}

            {reflectionDone && (
              <div className="animate-fadeUp text-center py-4">
                <p className="font-display text-lg text-ink">
                  You didn&apos;t just get the answer.
                </p>
                <p className="font-display text-lg text-accent-dark">You learned how to think through it.</p>
                <button
                  onClick={resetSession}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-line hover:border-accent transition-colors"
                >
                  <RotateCcw size={12} /> Start a new topic
                </button>
              </div>
            )}
          </div>

          {!reflectionDone && (
            <div className="border-t border-line p-4 bg-surface shrink-0">
              <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                <button
                  disabled={loading || messages.length === 0}
                  onClick={() =>
                    sendMessage("Can you explain this concept clearly with an example?", {
                      forcePeer: "explorer",
                      isDirectRequest: true,
                    })
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-accent-light text-accent-dark border border-accent/25 disabled:opacity-40 hover:brightness-95 transition"
                >
                  <BookOpen size={13} /> Explain concept
                </button>
                <button
                  disabled={loading || messages.length === 0}
                  onClick={() =>
                    sendMessage("I don't know, can you give me a hint?", {
                      forcePeer: "mentor",
                      isHintRequest: true,
                    })
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-peer-mentorBg text-peer-mentor border border-peer-mentor/25 disabled:opacity-40 hover:brightness-95 transition"
                >
                  <Lightbulb size={13} /> I need a hint
                </button>
                <button
                  disabled={loading || messages.length === 0}
                  onClick={runMistakeAnalysis}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-peer-criticBg text-peer-critic border border-peer-critic/25 disabled:opacity-40 hover:brightness-95 transition"
                >
                  Analyze my reasoning
                </button>
                <button
                  disabled={loading || messages.length < 2}
                  onClick={() => setReflecting(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-paper text-ink border border-line disabled:opacity-40 hover:border-accent transition"
                >
                  <Sparkles size={13} /> Wrap up &amp; reflect
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(input);
                }}
                className="flex items-center gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your thinking or question here..."
                  className="flex-1 rounded-full border border-line px-4 py-2.5 text-sm bg-paper focus:border-accent focus:bg-white outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center disabled:opacity-40 hover:bg-accent-dark transition-colors shrink-0"
                  aria-label="Send"
                >
                  <SendHorizonal size={16} />
                </button>
              </form>
            </div>
          )}
        </Card>
      )}

      {usedMockOnce && !getStoredApiKey() && (
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-subink">
          <span>Running on ThinkTank Smart Knowledge Engine.</span>
          <button
            onClick={() => setShowKeyModal(true)}
            className="text-accent-dark font-medium underline hover:text-accent"
          >
            Add Gemini API key for live AI
          </button>
        </div>
      )}

      <ApiKeyModal isOpen={showKeyModal} onClose={() => setShowKeyModal(false)} />
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "system") {
    return (
      <div className="text-center text-xs text-subink py-2 italic animate-fadeUp">
        {message.text}
      </div>
    );
  }

  if (message.role === "student") {
    return (
      <div className="flex justify-end animate-fadeUp">
        <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-sm bg-accent text-white px-4 py-3 text-sm leading-relaxed shadow-sm">
          {message.text}
        </div>
      </div>
    );
  }

  const persona = message.persona || "explorer";
  const style = PEER_STYLES[persona];

  return (
    <div className="flex items-start gap-3 animate-fadeUp">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${style.bg} ${style.text}`}
      >
        {style.initial}
      </div>
      <div className="flex-1 max-w-[85%] sm:max-w-[80%]">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-xs text-ink capitalize">{persona.replace("_", " ")}</span>
          <PeerBadge peer={persona} size="sm" />
        </div>
        <div className="rounded-2xl rounded-tl-sm bg-paper border border-line px-4 py-3 text-sm text-ink leading-relaxed space-y-2 whitespace-pre-wrap shadow-sm">
          {message.text}
        </div>
      </div>
    </div>
  );
}

function StarterInput({ onSend }: { onSend: (text: string) => void }) {
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSend(value);
      }}
      className="relative"
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        placeholder="What concept, question, or problem do you want to explore?"
        className="w-full rounded-2xl border border-line p-4 text-sm md:text-base bg-paper focus:bg-white focus:border-accent outline-none transition-colors resize-none placeholder:text-subink/70"
      />
      <div className="flex justify-end mt-2">
        <button
          type="submit"
          disabled={!value.trim()}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent text-white font-medium text-sm hover:bg-accent-dark transition-colors disabled:opacity-40"
        >
          Start thinking <SendHorizonal size={14} />
        </button>
      </div>
    </form>
  );
}
