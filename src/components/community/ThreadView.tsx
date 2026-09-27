"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useCommunity } from "@/lib/CommunityContext";
import {
  CommunityPost,
  CommunityComment,
  POST_TYPE_META,
  REACTION_META,
  ReactionType,
} from "@/lib/types";
import {
  ArrowLeft,
  Sparkles,
  Send,
  MessageSquare,
  Bot,
  Reply,
  Check,
  Share2,
  Trash2,
  HelpCircle,
} from "lucide-react";
import { ThinkWithMeModal } from "./ThinkWithMeModal";
import { AuthModal } from "@/components/AuthModal";
import { getStoredApiKey } from "@/lib/api";

export function ThreadView({ postId }: { postId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    activeTypers,
    broadcastTyping,
    toggleReaction,
    deletePost,
    isRealtimeConnected,
  } = useCommunity();

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [activeReplyToId, setActiveReplyToId] = useState<string | null>(null);
  const [requestingAi, setRequestingAi] = useState(false);
  const [showThinkModal, setShowThinkModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const commentsEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch initial post and comments
  const fetchThreadData = async () => {
    try {
      const [postRes, commRes] = await Promise.all([
        fetch(`/api/community/posts/${postId}`),
        fetch(`/api/community/posts/${postId}/comments`),
      ]);

      if (postRes.ok) {
        const postData = await postRes.json();
        setPost(postData.post);
      }
      if (commRes.ok) {
        const commData = await commRes.json();
        setComments(commData.comments || []);
      }
    } catch (err) {
      console.error("Failed to load thread:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreadData();
  }, [postId]);

  // Listen to SSE comment events
  useEffect(() => {
    const sse = new EventSource("/api/community/stream");

    sse.addEventListener("COMMENT_CREATED", (e: MessageEvent) => {
      try {
        const newComment: CommunityComment = JSON.parse(e.data);
        if (newComment.postId === postId) {
          setComments((prev) => {
            if (prev.some((c) => c.id === newComment.id)) return prev;
            return [...prev, newComment];
          });
        }
      } catch (err) {
        console.error("Error in thread SSE comment:", err);
      }
    });

    sse.addEventListener("REACTION_CHANGED", (e: MessageEvent) => {
      try {
        const { postId: rPostId, reactions } = JSON.parse(e.data);
        if (rPostId === postId) {
          setPost((prev) => (prev ? { ...prev, reactions } : null));
        }
      } catch (err) {
        console.error("Error in thread SSE reaction:", err);
      }
    });

    return () => sse.close();
  }, [postId]);

  // Handle typing input
  const handleReplyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReplyText(e.target.value);
    broadcastTyping(postId);
  };

  // Submit comment
  const handleSendComment = async (parentId?: string | null) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!replyText.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyText,
          parentId: parentId || null,
        }),
      });

      if (res.ok) {
        setReplyText("");
        setActiveReplyToId(null);
        fetchThreadData();
      }
    } catch (err) {
      console.error("Failed to send comment:", err);
    } finally {
      setSubmittingReply(false);
    }
  };

  // Request AI thinking guidance
  const handleAskThinkTank = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setRequestingAi(true);
    try {
      const apiKey = getStoredApiKey() || undefined;
      const res = await fetch("/api/community/ai-guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, apiKey }),
      });

      if (res.ok) {
        fetchThreadData();
      }
    } catch (err) {
      console.error("Failed to ask ThinkTank:", err);
    } finally {
      setRequestingAi(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-subink space-y-3">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs">Opening discussion thread...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="font-display font-semibold text-xl text-ink">Discussion not found</h2>
        <p className="text-xs text-subink">This thought may have been moved or removed.</p>
        <Link
          href="/community"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold"
        >
          <ArrowLeft size={14} /> Back to Community
        </Link>
      </div>
    );
  }

  const meta = POST_TYPE_META[post.type] || POST_TYPE_META.doubt;
  const typersInThisThread = activeTypers[postId] || [];

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/community"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-subink hover:text-ink transition group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Community</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1 text-xs text-subink hover:text-ink px-2.5 py-1 rounded-lg border border-line bg-surface transition"
            >
              <Share2 size={13} />
              <span>{copied ? "Link Copied!" : "Share"}</span>
            </button>
            {user?.id === post.authorId && (
              <button
                onClick={async () => {
                  if (confirm("Delete this thought?")) {
                    await deletePost(post.id);
                    router.push("/community");
                  }
                }}
                className="p-1.5 text-subink hover:text-peer-critic rounded-lg border border-line bg-surface transition"
                title="Delete post"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Main Post Header Card */}
        <div className="p-6 sm:p-8 rounded-2xl border border-line bg-surface shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${meta.tagClass}`}
            >
              <span>{meta.icon}</span>
              <span>{meta.label}</span>
            </span>

            {post.subject && (
              <span className="text-xs font-medium text-subink px-2.5 py-0.5 rounded-md bg-paper border border-line">
                {post.subject}
              </span>
            )}

            <span className="text-xs text-subink">
              Posted by <strong className="text-ink font-semibold">{post.authorName}</strong> ·{" "}
              {new Date(post.createdAt).toLocaleDateString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <h1 className="font-display font-bold text-xl sm:text-2xl text-ink leading-snug">
            {post.title}
          </h1>

          <div className="text-sm text-ink leading-relaxed whitespace-pre-wrap font-normal">
            {post.content}
          </div>

          {/* Real-time thinking banner & Think With Me Action */}
          <div className="pt-4 border-t border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-subink font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              <span>
                <strong className="text-ink font-semibold">
                  {Math.max(post.thinkingCount, 1)}
                </strong>{" "}
                {post.thinkingCount === 1 ? "student is" : "students are"} thinking about this
              </span>
            </div>

            <button
              onClick={() => setShowThinkModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-accent-light text-accent-dark font-bold text-xs hover:bg-accent/15 border border-accent/25 transition shadow-xs"
            >
              <Sparkles size={14} className="text-accent-dark" />
              <span>Think With Me</span>
            </button>
          </div>
        </div>

        {/* Discussion Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="font-display font-semibold text-lg text-ink flex items-center gap-2">
              <MessageSquare size={16} className="text-accent" />
              <span>Discussion ({comments.length})</span>
            </h2>

            {/* "Ask ThinkTank" guidance trigger */}
            <button
              onClick={handleAskThinkTank}
              disabled={requestingAi}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line bg-surface hover:bg-paper text-accent-dark text-xs font-semibold transition disabled:opacity-50"
              title="Get AI guidance as a supportive thinking partner"
            >
              <Bot size={14} />
              <span>{requestingAi ? "ThinkTank is synthesizing..." : "Ask ThinkTank"}</span>
            </button>
          </div>

          {/* Comments List */}
          <div className="border border-line rounded-2xl bg-surface divide-y divide-line overflow-hidden shadow-xs">
            {comments.length === 0 ? (
              <div className="p-10 text-center text-subink space-y-2">
                <p className="font-display font-medium text-ink text-sm">No replies yet</p>
                <p className="text-xs">
                  Be the first student to explain your reasoning or share how you tackled this.
                </p>
              </div>
            ) : (
              comments.map((comment) => {
                const isAi = comment.isAi;
                return (
                  <div
                    key={comment.id}
                    className={`p-5 space-y-2 transition ${
                      isAi ? "bg-accent-light/20 border-l-4 border-l-accent" : "hover:bg-paper/20"
                    } ${comment.parentId ? "pl-10 sm:pl-12 bg-paper/30" : ""}`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {isAi ? (
                          <div className="w-5 h-5 rounded-md bg-accent text-white flex items-center justify-center font-bold text-[10px]">
                            AI
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-paper border border-line text-ink font-bold text-[10px] flex items-center justify-center">
                            {comment.authorName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className={`font-semibold ${isAi ? "text-accent-dark" : "text-ink"}`}>
                          {comment.authorName}
                        </span>
                        {isAi && (
                          <span className="text-[10px] uppercase font-bold text-accent px-1.5 py-0.2 rounded-full bg-accent-light">
                            Thinking Partner
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-subink">
                        {new Date(comment.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="text-xs sm:text-sm text-ink leading-relaxed whitespace-pre-wrap pl-7">
                      {comment.content}
                    </div>

                    {/* Comment action footer */}
                    <div className="flex items-center justify-between pt-1 pl-7 text-[11px] text-subink">
                      <button
                        onClick={() => {
                          setActiveReplyToId(comment.id);
                        }}
                        className="inline-flex items-center gap-1 hover:text-ink font-medium"
                      >
                        <Reply size={12} />
                        <span>Reply</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Typing Indicator */}
          {typersInThisThread.length > 0 && (
            <div className="px-4 py-2 text-xs text-subink italic flex items-center gap-2 animate-fadeUp">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
              <span>
                {typersInThisThread.join(", ")} {typersInThisThread.length === 1 ? "is" : "are"}{" "}
                typing a thought...
              </span>
            </div>
          )}

          {/* Response Composer */}
          <div className="p-4 sm:p-5 rounded-2xl border border-line bg-surface shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink">
                {activeReplyToId ? "Replying to comment..." : "Your response..."}
              </span>
              {activeReplyToId && (
                <button
                  onClick={() => setActiveReplyToId(null)}
                  className="text-[11px] text-subink hover:text-ink"
                >
                  Cancel reply
                </button>
              )}
            </div>

            <textarea
              rows={3}
              value={replyText}
              onChange={handleReplyChange}
              placeholder="Explain what you think, ask a clarifying question, or guide them gently. Tanglish is welcomed! (e.g. 'First call stack la frame push aagum...')"
              className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-paper/30 focus:bg-white focus:outline-none focus:border-accent text-xs sm:text-sm text-ink placeholder:text-subink/60 resize-none transition leading-relaxed"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-accent font-medium">
                +5 Thinking Points for a helpful reply
              </span>
              <button
                onClick={() => handleSendComment(activeReplyToId)}
                disabled={submittingReply || !replyText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white hover:bg-accent-dark text-xs font-semibold transition disabled:opacity-50"
              >
                <Send size={13} />
                <span>{submittingReply ? "Posting..." : "Send Response"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <ThinkWithMeModal
        post={post}
        isOpen={showThinkModal}
        onClose={() => setShowThinkModal(false)}
      />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
