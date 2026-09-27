"use client";

import React, { useState } from "react";
import { useCommunity } from "@/lib/CommunityContext";
import { useAuth } from "@/lib/AuthContext";
import { PostType, SubjectType, POST_TYPE_META } from "@/lib/types";
import { X, Sparkles, AlertCircle } from "lucide-react";
import { AuthModal } from "@/components/AuthModal";

export function CreatePostModal({
  isOpen,
  onClose,
  initialType = "doubt",
}: {
  isOpen: boolean;
  onClose: () => void;
  initialType?: PostType;
}) {
  const { user } = useAuth();
  const { createPost } = useCommunity();

  const [type, setType] = useState<PostType>(initialType);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState<SubjectType>("DSA");
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Mistake museum fields
  const [whatWentWrong, setWhatWentWrong] = useState("");
  const [whatILearned, setWhatILearned] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!title.trim()) {
      setError("Please write what you're thinking about or stuck on.");
      return;
    }

    if (!content.trim() && type !== "mistake") {
      setError("Please describe your context or problem.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await createPost({
        title,
        content: content || (type === "mistake" ? whatWentWrong : ""),
        type,
        subject,
        isAnonymous,
        mistakeDetails:
          type === "mistake"
            ? {
                whatWentWrong: whatWentWrong || content,
                whatILearned: whatILearned || "Reviewed logic carefully.",
                relateCount: 1,
              }
            : undefined,
      });

      if (result.ok) {
        setTitle("");
        setContent("");
        setWhatWentWrong("");
        setWhatILearned("");
        onClose();
      } else {
        setError(result.error || "Failed to post to community.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to post.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-sm animate-fadeUp">
        <div className="bg-surface border border-line w-full max-w-xl rounded-2xl shadow-card overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="px-6 py-5 border-b border-line flex items-center justify-between bg-paper/30">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                Community Study Room
              </p>
              <h2 className="font-display font-semibold text-lg text-ink">
                {type === "doubt"
                  ? "Hey, I'm stuck here..."
                  : type === "challenge"
                  ? "Challenge the Community"
                  : type === "explain"
                  ? "Share an Explanation"
                  : type === "mistake"
                  ? "Record a Learning Mistake"
                  : "Start a Thought"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-subink hover:text-ink hover:bg-paper transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-semibold text-subink uppercase tracking-wider mb-2">
                What kind of thought is this?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {(Object.keys(POST_TYPE_META) as PostType[]).map((t) => {
                  const meta = POST_TYPE_META[t];
                  const isSelected = type === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-medium border text-center transition ${
                        isSelected
                          ? "bg-accent-light border-accent text-accent-dark font-semibold shadow-xs"
                          : "border-line bg-surface text-subink hover:bg-paper hover:text-ink"
                      }`}
                    >
                      <div className="text-base mb-0.5">{meta.icon}</div>
                      <div>{meta.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title / Question */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                {type === "doubt"
                  ? "What are you stuck on?"
                  : type === "challenge"
                  ? "Challenge prompt or problem statement"
                  : type === "mistake"
                  ? "The mistake in one sentence"
                  : "Topic or core concept"}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  type === "doubt"
                    ? "e.g. Bro recursion base case la return value puriyala..."
                    : type === "challenge"
                    ? "e.g. Reverse a linked list with only 2 pointers in O(n)..."
                    : type === "mistake"
                    ? "e.g. I thought i <= n was safe in binary search..."
                    : "e.g. Why BFS guarantees shortest path in unweighted graphs..."
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-paper/40 focus:bg-white focus:outline-none focus:border-accent text-sm text-ink placeholder:text-subink/60 transition"
              />
            </div>

            {/* Mistake Specific Fields */}
            {type === "mistake" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    What went wrong?
                  </label>
                  <textarea
                    rows={2}
                    value={whatWentWrong}
                    onChange={(e) => setWhatWentWrong(e.target.value)}
                    placeholder="e.g. I used i <= n and got an array index out of bounds error."
                    className="w-full px-3.5 py-2 rounded-xl border border-line bg-paper/40 focus:bg-white focus:outline-none focus:border-accent text-sm text-ink placeholder:text-subink/60 resize-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    What did you learn?
                  </label>
                  <textarea
                    rows={2}
                    value={whatILearned}
                    onChange={(e) => setWhatILearned(e.target.value)}
                    placeholder="e.g. Always define search bounds explicitly: [0, n-1]."
                    className="w-full px-3.5 py-2 rounded-xl border border-line bg-paper/40 focus:bg-white focus:outline-none focus:border-accent text-sm text-ink placeholder:text-subink/60 resize-none transition"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Your reasoning &amp; context
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your thought process, what you tried, or what feels confusing. Tanglish is warmly welcomed! (e.g. naan ipdi try panna output wrong varudhu...)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-paper/40 focus:bg-white focus:outline-none focus:border-accent text-sm text-ink placeholder:text-subink/60 resize-none transition leading-relaxed"
                />
              </div>
            )}

            {/* Subject and Anonymous Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-subink font-medium">Subject:</span>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as SubjectType)}
                  className="px-2.5 py-1 rounded-lg border border-line bg-paper text-xs text-ink focus:outline-none focus:border-accent"
                >
                  <option value="DSA">DSA</option>
                  <option value="Web">Web</option>
                  <option value="AI">AI</option>
                  <option value="C">C / C++</option>
                  <option value="Python">Python</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-xs text-subink cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded border-line text-accent focus:ring-0"
                />
                <span>Post anonymously</span>
              </label>
            </div>

            {/* Submit Bar */}
            <div className="pt-3 border-t border-line flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-accent font-medium">
                <Sparkles size={12} />
                <span>Earn +{type === "doubt" ? 5 : 8} Thinking Points</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-subink hover:bg-paper transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-dark text-white text-xs font-semibold transition disabled:opacity-50"
                >
                  {submitting ? "Posting..." : "Post to Community"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
