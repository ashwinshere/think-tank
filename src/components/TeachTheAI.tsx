"use client";

import { useState } from "react";
import { Card, SectionHeader } from "./ui/Card";
import { callAI } from "@/lib/api";
import { nudgeScore } from "@/lib/storage";
import { GraduationCap, RotateCcw, SendHorizonal } from "lucide-react";

interface Turn {
  role: "student" | "peer";
  text: string;
}

interface Evaluation {
  conceptAccuracy: number;
  clarity: number;
  missingDetails: string;
  exampleGiven: boolean;
  summary: string;
}

export function TeachTheAI() {
  const [topic, setTopic] = useState("");
  const [started, setStarted] = useState(false);
  const [conversation, setConversation] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

  function start() {
    if (!topic.trim()) return;
    setStarted(true);
    setConversation([]);
    setEvaluation(null);
  }

  async function send() {
    if (!input.trim() || loading) return;
    const next: Turn[] = [...conversation, { role: "student", text: input.trim() }];
    setConversation(next);
    setInput("");
    setLoading(true);
    try {
      const res = await callAI<{ reply: string; done: boolean }>("teach_followup", {
        topic,
        conversation: next,
      });
      setConversation((prev) => [...prev, { role: "peer", text: res.reply }]);
      if (res.done || next.length >= 6) {
        await finish([...next, { role: "peer", text: res.reply }]);
      }
    } finally {
      setLoading(false);
    }
  }

  async function finish(finalConversation: Turn[]) {
    const res = await callAI<Evaluation>("teach_evaluate", { topic, conversation: finalConversation });
    setEvaluation(res);
    nudgeScore({ reasoning: 3, analysis: 2, creativity: 1 });
  }

  function reset() {
    setTopic("");
    setStarted(false);
    setConversation([]);
    setEvaluation(null);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <SectionHeader
        eyebrow="Role Reversal"
        title="Teach the AI"
        description="Explain a concept like your AI peer has never heard of it. They'll ask genuine follow-up questions — the same way explaining something to a curious friend reveals what you actually understand."
      />

      {!started ? (
        <Card className="p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              start();
            }}
            className="flex gap-2"
          >
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Recursion, binary search, normalization..."
              className="flex-1 rounded-full border border-line px-4 py-2.5 text-sm bg-paper focus:border-accent focus:bg-white outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!topic.trim()}
              className="px-5 py-2.5 rounded-full bg-accent text-white text-sm font-semibold disabled:opacity-40 hover:bg-accent-dark transition-colors"
            >
              Start teaching
            </button>
          </form>
        </Card>
      ) : (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl2 bg-accent-light flex items-center justify-center">
              <GraduationCap size={16} className="text-accent-dark" />
            </div>
            <div>
              <p className="font-display font-semibold text-ink text-sm">Teaching: {topic}</p>
              <p className="text-xs text-subink">Explain it like your peer knows nothing yet.</p>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            {conversation.map((t, i) => (
              <div key={i} className={`flex ${t.role === "student" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    t.role === "student"
                      ? "bg-accent text-white rounded-tr-sm"
                      : "bg-paper border border-line text-ink rounded-tl-sm"
                  }`}
                >
                  {t.text}
                </div>
              </div>
            ))}
            {loading && <p className="text-xs text-subink pl-1">thinking of a follow-up...</p>}
          </div>

          {!evaluation && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={conversation.length === 0 ? `${topic} is when...` : "Your answer..."}
                className="flex-1 rounded-full border border-line px-4 py-2.5 text-sm bg-paper focus:border-accent focus:bg-white outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center disabled:opacity-40 hover:bg-accent-dark transition-colors shrink-0"
              >
                <SendHorizonal size={16} />
              </button>
            </form>
          )}

          {evaluation && (
            <div className="animate-fadeUp mt-2 bg-accent-light border border-accent/25 rounded-xl2 p-4 space-y-2">
              <div className="flex gap-4">
                <Stat label="Concept accuracy" value={evaluation.conceptAccuracy} />
                <Stat label="Clarity" value={evaluation.clarity} />
              </div>
              <p className="text-sm text-ink">
                <span className="font-semibold">Missing: </span>
                {evaluation.missingDetails}
              </p>
              <p className="text-sm text-ink font-medium leading-relaxed">{evaluation.summary}</p>
              <button
                onClick={reset}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-line hover:border-accent transition-colors"
              >
                <RotateCcw size={12} /> Teach another concept
              </button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[11px] text-subink font-medium">{label}</p>
      <p className="text-xl font-display font-semibold text-accent-dark">{value}</p>
    </div>
  );
}
