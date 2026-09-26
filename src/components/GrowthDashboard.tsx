"use client";

import { useEffect, useState } from "react";
import { Card, SectionHeader, ScoreBar } from "./ui/Card";
import { loadScore, loadUsage } from "@/lib/storage";
import { computeIndependence } from "@/lib/orchestrator";
import { ThinkingScore, UsageStats } from "@/lib/types";
import { callAI } from "@/lib/api";
import { Gauge, Lightbulb, RefreshCcw, Sparkles, Target } from "lucide-react";

const SCORE_LABELS: { key: keyof ThinkingScore; label: string; color: string }[] = [
  { key: "reasoning", label: "Reasoning", color: "bg-peer-explorer" },
  { key: "analysis", label: "Analysis", color: "bg-peer-critic" },
  { key: "questioning", label: "Questioning", color: "bg-peer-challenger" },
  { key: "creativity", label: "Creativity", color: "bg-peer-devil" },
  { key: "selfCorrection", label: "Self-correction", color: "bg-peer-mentor" },
  { key: "independence", label: "Independence", color: "bg-accent" },
];

export function GrowthDashboard({ onGoToNoAi }: { onGoToNoAi?: () => void }) {
  const [score, setScore] = useState<ThinkingScore | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    setScore(loadScore());
    setUsage(loadUsage());
  }, []);

  async function getInsight() {
    if (!score || !usage) return;
    setLoadingInsight(true);
    try {
      const independence = computeIndependence(usage);
      const summary = `Scores — reasoning ${score.reasoning}, analysis ${score.analysis}, questioning ${score.questioning}, creativity ${score.creativity}, self-correction ${score.selfCorrection}, independence ${score.independence}. Usage — ${independence.independent}% independent, ${independence.hints}% hint-assisted, ${independence.direct}% direct-answer.`;
      const res = await callAI<{ insight: string }>("insight", { summary });
      setInsight(res.insight);
    } finally {
      setLoadingInsight(false);
    }
  }

  if (!score || !usage) return null;

  const independence = computeIndependence(usage);
  const totalActivity =
    usage.hintsRequested + usage.directAnswersRequested + usage.independentlySolved + usage.aiAssistedAttempts;
  const dependencyRising =
    totalActivity > 0 && usage.hintsRequested + usage.directAnswersRequested > usage.independentlySolved * 1.5;

  return (
    <div className="max-w-4xl mx-auto">
      <SectionHeader
        eyebrow="Your Progress"
        title="How you think"
        description="Not an IQ score — a picture of your reasoning habits, drawn from how you've worked through problems here. It moves as you practice."
      />

      <div className="grid md:grid-cols-5 gap-4 mb-4">
        <Card className="md:col-span-3 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Gauge size={16} className="text-accent-dark" />
            <p className="font-display font-semibold text-ink">Critical Thinking Score</p>
          </div>
          <div className="space-y-4">
            {SCORE_LABELS.map(({ key, label, color }) => (
              <ScoreBar key={key} label={label} value={score[key]} colorClass={color} />
            ))}
          </div>
        </Card>

        <Card className="md:col-span-2 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-5">
            <Target size={16} className="text-accent-dark" />
            <p className="font-display font-semibold text-ink">AI Independence</p>
          </div>
          {totalActivity === 0 ? (
            <p className="text-sm text-subink leading-relaxed">
              Once you work through a few problems, you&apos;ll see how much of the thinking was yours.
            </p>
          ) : (
            <>
              <div className="space-y-4">
                <ScoreBar label="Independent solving" value={independence.independent} colorClass="bg-peer-mentor" />
                <ScoreBar label="Hints used" value={independence.hints} colorClass="bg-peer-explorer" />
                <ScoreBar label="Direct answers" value={independence.direct} colorClass="bg-peer-challenger" />
              </div>
              <div
                className={`mt-5 rounded-xl2 p-3.5 text-sm leading-relaxed ${
                  dependencyRising
                    ? "bg-peer-challengerBg border border-peer-challenger/25 text-ink"
                    : "bg-accent-light border border-accent/25 text-ink"
                }`}
              >
                {dependencyRising ? (
                  <>
                    <p className="mb-2">
                      You&apos;ve been leaning on hints and direct answers a bit more lately. That&apos;s normal —
                      let&apos;s balance it out.
                    </p>
                    <button
                      onClick={onGoToNoAi}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-peer-challenger/30 text-peer-challenger hover:bg-white/60 transition-colors"
                    >
                      <RefreshCcw size={12} /> Try a Think on Your Own round
                    </button>
                  </>
                ) : (
                  "You're solving most problems with your own reasoning. AI is gradually becoming less necessary — that's the goal."
                )}
              </div>
            </>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-accent-dark" />
            <p className="font-display font-semibold text-ink">One insight for you</p>
          </div>
          <button
            onClick={getInsight}
            disabled={loadingInsight}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-accent text-white hover:bg-accent-dark transition-colors disabled:opacity-50"
          >
            <Lightbulb size={13} /> {loadingInsight ? "Thinking..." : insight ? "Refresh insight" : "Get an insight"}
          </button>
        </div>
        {insight && <p className="text-sm text-ink leading-relaxed mt-4">{insight}</p>}
      </Card>
    </div>
  );
}
