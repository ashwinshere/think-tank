"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useCommunity } from "@/lib/CommunityContext";
import { CommunityPost, ThinkingAttempt } from "@/lib/types";
import { getStoredApiKey } from "@/lib/api";
import { X, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Flame } from "lucide-react";
import { AuthModal } from "@/components/AuthModal";

export function ThinkWithMeModal({
  post,
  isOpen,
  onClose,
}: {
  post: CommunityPost;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { refreshPosts } = useCommunity();

  const [userReasoning, setUserReasoning] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<ThinkingAttempt["aiFeedback"] | null>(null);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [improvedAttempt, setImprovedAttempt] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!userReasoning.trim()) return;

    setSubmitting(true);
    try {
      const apiKey = getStoredApiKey() || undefined;
      const res = await fetch("/api/community/ai-think", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          postTitle: post.title,
          postContent: post.content,
          userReasoning,
          apiKey,
        }),
      });

      const data = await res.json();
      if (res.ok && data.feedback) {
        setFeedback(data.feedback);
        setPointsEarned(data.pointsAwarded || 10);
        refreshPosts();
      }
    } catch (err) {
      console.error("Think With Me error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleImproveReasoning = () => {
    setImprovedAttempt(true);
    setFeedback(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-sm animate-fadeUp">
        <div className="bg-surface border border-line w-full max-w-xl rounded-2xl shadow-card overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="px-6 py-5 border-b border-line flex items-center justify-between bg-paper/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-accent-light text-accent-dark flex items-center justify-center font-bold">
                <Sparkles size={16} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-accent">
                  Think With Me
                </p>
                <h3 className="font-display font-semibold text-base text-ink">
                  Evaluate Your Intuition
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-subink hover:text-ink hover:bg-paper transition"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-5">
            {/* Post Context Recap */}
            <div className="p-4 rounded-xl border border-line bg-paper/50 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-subink">
                The Doubt Under Discussion
              </span>
              <p className="font-display font-semibold text-ink text-sm leading-snug">
                &ldquo;{post.title}&rdquo;
              </p>
              <p className="text-xs text-subink line-clamp-2 leading-relaxed">
                {post.content}
              </p>
            </div>

            {/* If Feedback received */}
            {feedback ? (
              <div className="space-y-4 animate-fadeUp">
                {/* Points banner */}
                {pointsEarned && (
                  <div className="p-3 rounded-xl bg-accent-light/80 border border-accent/20 flex items-center justify-between text-xs text-accent-dark font-medium">
                    <span className="flex items-center gap-1.5">
                      <Flame size={14} className="text-accent" />
                      Reasoning recorded in study history!
                    </span>
                    <strong className="font-bold text-accent-dark">+{pointsEarned} TP</strong>
                  </div>
                )}

                {/* Score Dial */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-line bg-surface">
                  <div>
                    <p className="text-xs font-semibold text-subink">Thinking Quality</p>
                    <p className="text-[11px] text-subink/80 mt-0.5">
                      Depth, logical conditions &amp; intuition
                    </p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display font-bold text-2xl text-accent-dark">
                      {feedback.qualityScore}%
                    </span>
                  </div>
                </div>

                {/* Intuition evaluation */}
                <div className="p-4 rounded-xl border border-emerald-200/70 bg-emerald-50/50 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <CheckCircle2 size={14} className="text-emerald-700" />
                    <span>Your Intuition</span>
                  </div>
                  <p className="text-xs text-emerald-950 leading-relaxed pl-5">
                    {feedback.intuition}
                  </p>
                </div>

                {/* Condition / Nuance */}
                <div className="p-4 rounded-xl border border-amber-200/70 bg-amber-50/50 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                    <AlertTriangle size={14} className="text-amber-700" />
                    <span>One Important Condition / Nuance</span>
                  </div>
                  <p className="text-xs text-amber-950 leading-relaxed pl-5">
                    {feedback.conditionOrNuance}
                  </p>
                </div>

                {/* Improved reasoning hint */}
                <div className="p-4 rounded-xl border border-line bg-paper/60 space-y-2">
                  <p className="text-xs font-semibold text-ink">
                    Nudge to strengthen your argument:
                  </p>
                  <p className="text-xs text-subink italic leading-relaxed">
                    &ldquo;{feedback.improvedReasoningHint}&rdquo;
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleImproveReasoning}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-light text-accent-dark font-semibold text-xs hover:bg-accent/15 transition border border-accent/20"
                  >
                    <RefreshCw size={12} />
                    Improve My Reasoning
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent-dark transition"
                  >
                    Done Thinking
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-ink">
                      What do YOU think?
                    </label>
                    <span className="text-[10px] text-subink">
                      Tanglish &amp; informal reasoning allowed
                    </span>
                  </div>
                  <textarea
                    rows={5}
                    value={userReasoning}
                    onChange={(e) => setUserReasoning(e.target.value)}
                    placeholder={
                      improvedAttempt
                        ? "Revise your thought incorporating the nuance... (e.g. In unweighted graphs, BFS explores equidistant layers, so the first time a node is touched must be the minimum edge count...)"
                        : "I think... (e.g. I think BFS gives shortest path because nearby nodes are visited first, but does this hold if edges have weights?)"
                    }
                    className="w-full px-4 py-3 rounded-xl border border-line bg-paper/30 focus:bg-white focus:outline-none focus:border-accent text-sm text-ink placeholder:text-subink/60 resize-none transition leading-relaxed"
                    autoFocus
                  />
                </div>

                <div className="p-3 rounded-xl bg-paper/80 border border-line/80 flex items-start gap-2.5 text-xs text-subink">
                  <Sparkles size={14} className="text-accent shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    ThinkTank won&apos;t just spit out the answer. It will evaluate your logical
                    direction and nudge you to find the boundary condition yourself.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-subink hover:bg-paper transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !userReasoning.trim()}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                  >
                    {submitting ? (
                      "Evaluating your thought..."
                    ) : (
                      <>
                        <span>Submit Reasoning</span>
                        <ArrowRight size={13} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
