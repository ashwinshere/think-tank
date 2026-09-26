"use client";

import { useEffect, useState } from "react";
import { Card, SectionHeader, ScoreBar } from "./ui/Card";
import { callAI } from "@/lib/api";
import { loadUsage, saveUsage, nudgeScore } from "@/lib/storage";
import { useAuth } from "@/lib/AuthContext";
import { ShieldOff, RotateCcw, Sparkles, Brain, Loader2, BookOpen } from "lucide-react";

interface Result {
  independentReasoning: number;
  conceptUnderstanding: number;
  selfCorrection: number;
  feedback: string;
}

interface GeneratedProblem {
  problem: string;
  topic?: string;
  hint?: string;
}

export function NoAIRound() {
  const { user, profile, getIdToken } = useAuth();
  const [active, setActive] = useState(false);
  const [problem, setProblem] = useState("");
  const [topic, setTopic] = useState("");
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [memoryCount, setMemoryCount] = useState<number | null>(null);
  const [answer, setAnswer] = useState("");
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  // Check how many memories the user has on load
  useEffect(() => {
    async function checkMemories() {
      if (!user) {
        setMemoryCount(0);
        return;
      }
      try {
        const token = await getIdToken();
        const res = await fetch("/api/memories", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setMemoryCount(data.memories?.length || 0);
        }
      } catch (err) {
        console.error("Failed to check memories:", err);
      }
    }
    checkMemories();
  }, [user, getIdToken]);

  async function begin() {
    setGenerating(true);
    setActive(true);
    setResult(null);
    setAnswer("");

    try {
      let memories: Array<{ content: string; category?: string }> = [];
      if (user) {
        try {
          const token = await getIdToken();
          const res = await fetch("/api/memories", {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (res.ok) {
            const data = await res.json();
            memories = data.memories || [];
            setMemoryCount(memories.length);
          }
        } catch (memErr) {
          console.error("Failed to fetch memories for NoAI challenge:", memErr);
        }
      }

      // Generate a problem personalized to the student's learned concepts
      const response = await callAI<GeneratedProblem>("noai_generate_problem", {
        memories,
        profile,
      });

      if (response && response.problem) {
        setProblem(response.problem);
        setTopic(response.topic || "");
        setIsPersonalized(memories.length > 0);
      } else {
        setProblem("Why might a recursive function that works perfectly for small inputs suddenly crash for large ones?");
        setTopic("Recursion & Call Stack");
        setIsPersonalized(false);
      }
    } catch (err) {
      console.error("Failed to generate personalized problem:", err);
      setProblem("You have a sorted list of 1,000 numbers and need to find one value. Would you scan it one by one, or is there a faster way? Explain your reasoning.");
      setTopic("Search Algorithms");
      setIsPersonalized(false);
    } finally {
      setGenerating(false);
    }
  }

  async function submit() {
    if (!answer.trim()) return;
    setLoading(true);
    try {
      const res = await callAI<Result>("noai_evaluate", { problem, studentSolution: answer.trim() });
      setResult(res);
      const usage = loadUsage();
      saveUsage({ ...usage, independentlySolved: usage.independentlySolved + 1 });
      nudgeScore({
        independence: 4,
        reasoning: 2,
        selfCorrection: Math.round((res.selfCorrection - 60) / 10),
      });
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setActive(false);
    setProblem("");
    setTopic("");
    setAnswer("");
    setResult(null);
    setIsPersonalized(false);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <SectionHeader
        eyebrow="Confidence Builder"
        title="Think on Your Own"
        description="A short challenge with AI help paused. Not a test — a chance to notice how far your own reasoning already gets you."
      />

      {!active ? (
        <Card className="p-8 text-center">
          <ShieldOff className="mx-auto text-accent-dark mb-3" size={26} />
          <p className="font-display text-lg text-ink mb-1">Ready for a No-AI Round?</p>
          <p className="text-sm text-subink max-w-sm mx-auto mb-4">
            You'll get one problem. No hints, no peers — just your own reasoning. We'll reflect on
            it together afterward.
          </p>

          {/* Memory learning personalization status */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-paper border border-line text-xs text-subink mb-6">
            <Brain size={14} className="text-accent-dark" />
            {memoryCount === null ? (
              <span>Connecting to your learning memory...</span>
            ) : memoryCount > 0 ? (
              <span className="text-ink font-medium">
                🎯 Challenges tailored to your <strong className="text-accent-dark">{memoryCount} learned topics</strong>
              </span>
            ) : (
              <span>Challenges focus on core reasoning fundamentals</span>
            )}
          </div>

          <div>
            <button
              onClick={begin}
              disabled={generating}
              className="px-6 py-2.5 rounded-full bg-accent text-white text-sm font-semibold hover:bg-accent-dark transition-colors inline-flex items-center gap-2 shadow-sm"
            >
              {generating ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Preparing challenge...
                </>
              ) : (
                "Start challenge"
              )}
            </button>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          {generating ? (
            <div className="py-12 text-center space-y-3 animate-fadeUp">
              <Loader2 size={28} className="animate-spin text-accent-dark mx-auto" />
              <p className="font-display text-base text-ink font-medium">
                Crafting challenge based on what you've learned...
              </p>
              <p className="text-xs text-subink max-w-xs mx-auto">
                Analyzing your memory concepts to tailor a thoughtful reasoning problem.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-peer-challenger bg-peer-challengerBg border border-peer-challenger/25 rounded-full px-3 py-1.5 w-fit">
                  <ShieldOff size={13} /> AI help is paused for this challenge
                </div>

                {topic && (
                  <div className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-accent-light text-accent-dark border border-accent/20">
                    {isPersonalized ? <Sparkles size={12} /> : <BookOpen size={12} />}
                    <span className="font-medium">{topic}</span>
                    {isPersonalized && <span className="text-[10px] opacity-80">(From your memory)</span>}
                  </div>
                )}
              </div>

              <p className="font-display text-lg text-ink mb-4 leading-snug">{problem}</p>

              {!result ? (
                <>
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    rows={5}
                    placeholder="Work through it here..."
                    className="w-full text-sm rounded-lg border border-line px-3 py-2.5 bg-paper focus:border-accent focus:bg-white outline-none transition-colors"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <button
                      onClick={submit}
                      disabled={loading || !answer.trim()}
                      className="px-5 py-2.5 rounded-full bg-accent text-white text-sm font-semibold disabled:opacity-40 hover:bg-accent-dark transition-colors inline-flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={15} className="animate-spin" /> Reviewing...
                        </>
                      ) : (
                        "Submit my reasoning"
                      )}
                    </button>
                    <button
                      onClick={begin}
                      disabled={loading}
                      className="text-xs text-subink hover:text-ink transition-colors"
                    >
                      Try a different topic
                    </button>
                  </div>
                </>
              ) : (
                <div className="animate-fadeUp space-y-4">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <ScoreBar label="Independent reasoning" value={result.independentReasoning} colorClass="bg-peer-explorer" />
                    <ScoreBar label="Concept understanding" value={result.conceptUnderstanding} colorClass="bg-peer-mentor" />
                    <ScoreBar label="Self-correction" value={result.selfCorrection} colorClass="bg-peer-critic" />
                  </div>
                  <p className="text-sm text-ink leading-relaxed bg-accent-light border border-accent/25 rounded-xl2 p-4">
                    {result.feedback}
                  </p>
                  <button
                    onClick={reset}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-line hover:border-accent transition-colors"
                  >
                    <RotateCcw size={12} /> Try another round
                  </button>
                </div>
              )}
            </>
          )}
        </Card>
      )}
    </div>
  );
}

