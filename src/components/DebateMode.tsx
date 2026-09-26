"use client";

import { useState } from "react";
import { Card, SectionHeader } from "./ui/Card";
import { PeerBadge } from "./PeerBadge";
import { callAI } from "@/lib/api";
import { nudgeScore } from "@/lib/storage";
import { RotateCcw } from "lucide-react";

interface Viewpoint {
  persona: "explorer" | "challenger";
  argument: string;
}

const EXAMPLES = [
  "Arrays are better than linked lists.",
  "Recursion is always better than loops.",
  "You should always normalize a database fully.",
];

export function DebateMode() {
  const [topic, setTopic] = useState("");
  const [loadingDebate, setLoadingDebate] = useState(false);
  const [viewpoints, setViewpoints] = useState<{ a: Viewpoint; b: Viewpoint } | null>(null);
  const [chosen, setChosen] = useState<"a" | "b" | null>(null);
  const [reasoning, setReasoning] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<{ verdict: string; strengthScore: number; feedback: string } | null>(null);

  async function startDebate(t: string) {
    if (!t.trim()) return;
    setTopic(t.trim());
    setLoadingDebate(true);
    setViewpoints(null);
    setChosen(null);
    setEvaluation(null);
    setReasoning("");
    try {
      const res = await callAI<{ viewpointA: Viewpoint; viewpointB: Viewpoint }>("debate_generate", {
        topic: t.trim(),
      });
      setViewpoints({ a: res.viewpointA, b: res.viewpointB });
    } finally {
      setLoadingDebate(false);
    }
  }

  async function submitReasoning() {
    if (!chosen || !reasoning.trim() || !viewpoints) return;
    setEvaluating(true);
    try {
      const res = await callAI<{ verdict: string; strengthScore: number; feedback: string }>(
        "debate_evaluate",
        {
          topic,
          chosenViewpoint: viewpoints[chosen].argument,
          studentReasoning: reasoning.trim(),
        }
      );
      setEvaluation(res);
      nudgeScore({ reasoning: 3, questioning: 2, analysis: 2 });
    } finally {
      setEvaluating(false);
    }
  }

  function reset() {
    setTopic("");
    setViewpoints(null);
    setChosen(null);
    setEvaluation(null);
    setReasoning("");
  }

  return (
    <div className="max-w-3xl mx-auto">
      <SectionHeader
        eyebrow="AI Debate"
        title="Put your position to the test"
        description="State something you believe. Explorer and Challenger will each make a case — you decide which is stronger, and why. You're graded on your reasoning, not on picking the 'right' side."
      />

      {!viewpoints ? (
        <Card className="p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              startDebate(topic);
            }}
            className="flex gap-2"
          >
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Arrays are better than linked lists."
              className="flex-1 rounded-full border border-line px-4 py-2.5 text-sm bg-paper focus:border-accent focus:bg-white outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={loadingDebate || !topic.trim()}
              className="px-5 py-2.5 rounded-full bg-accent text-white text-sm font-semibold disabled:opacity-40 hover:bg-accent-dark transition-colors"
            >
              {loadingDebate ? "Thinking..." : "Debate it"}
            </button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => startDebate(ex)}
                className="text-xs px-3 py-1.5 rounded-full bg-paper border border-line hover:border-accent transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-subink mb-1">Your claim</p>
            <p className="font-display text-lg text-ink">&quot;{topic}&quot;</p>
          </Card>

          <div className="grid sm:grid-cols-2 gap-4">
            {(["a", "b"] as const).map((key) => {
              const vp = viewpoints[key];
              const isChosen = chosen === key;
              return (
                <button
                  key={key}
                  onClick={() => !evaluation && setChosen(key)}
                  disabled={!!evaluation}
                  className={`text-left p-5 rounded-xl2 border transition-all ${
                    isChosen
                      ? "border-accent bg-accent-light shadow-soft"
                      : "border-line bg-surface hover:border-accent/40"
                  }`}
                >
                  <PeerBadge peer={vp.persona} size="sm" />
                  <p className="text-sm text-ink mt-2.5 leading-relaxed">{vp.argument}</p>
                </button>
              );
            })}
          </div>

          {chosen && !evaluation && (
            <Card className="p-5 animate-fadeUp">
              <p className="text-sm font-medium text-ink mb-2">Why do you think that side is stronger?</p>
              <textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                rows={3}
                placeholder="Explain your reasoning, not just your pick..."
                className="w-full text-sm rounded-lg border border-line px-3 py-2.5 bg-paper focus:border-accent focus:bg-white outline-none transition-colors"
              />
              <button
                onClick={submitReasoning}
                disabled={evaluating || !reasoning.trim()}
                className="mt-3 px-4 py-2 rounded-full bg-accent text-white text-sm font-semibold disabled:opacity-40 hover:bg-accent-dark transition-colors"
              >
                {evaluating ? "Evaluating..." : "Submit reasoning"}
              </button>
            </Card>
          )}

          {evaluation && (
            <Card className="p-5 animate-fadeUp bg-accent-light border-accent/25">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark mb-1.5">
                Reasoning strength: {evaluation.strengthScore}/100 · {evaluation.verdict}
              </p>
              <p className="text-sm text-ink leading-relaxed">{evaluation.feedback}</p>
              <button
                onClick={reset}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-line hover:border-accent transition-colors"
              >
                <RotateCcw size={12} /> Debate another claim
              </button>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
