"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useCommunity } from "@/lib/CommunityContext";
import {
  CommunityPost,
  POST_TYPE_META,
  REACTION_META,
  ReactionType,
} from "@/lib/types";
import {
  MessageSquare,
  Sparkles,
  MoreHorizontal,
  Trash2,
  Share2,
  HeartHandshake,
  Check,
} from "lucide-react";
import { ThinkWithMeModal } from "./ThinkWithMeModal";
import { AuthModal } from "@/components/AuthModal";

export function PostCard({ post }: { post: CommunityPost }) {
  const { user } = useAuth();
  const { toggleReaction, relateToMistake, deletePost } = useCommunity();

  const [showThinkModal, setShowThinkModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const meta = POST_TYPE_META[post.type] || POST_TYPE_META.doubt;
  const isAuthor = user?.id === post.authorId;
  const myReaction = user ? post.userReactions?.[user.id] : undefined;

  const handleReactionClick = (e: React.MouseEvent, rKey: ReactionType) => {
    e.stopPropagation();
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    toggleReaction(post.id, rKey);
  };

  const handleRelateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    relateToMistake(post.id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/community/${post.id}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <>
      <article className="group py-6 px-4 sm:px-6 bg-surface hover:bg-paper/30 transition-colors border-b border-line">
        {/* Top meta row */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Category tag */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${meta.tagClass}`}
            >
              <span>{meta.icon}</span>
              <span>{meta.label}</span>
            </span>

            {/* Subject pill */}
            {post.subject && (
              <span className="text-[11px] font-medium text-subink px-2 py-0.5 rounded-md bg-paper border border-line">
                {post.subject}
              </span>
            )}

            {/* Author & time */}
            <span className="text-xs text-subink flex items-center gap-1.5">
              <span className="font-semibold text-ink">{post.authorName}</span>
              <span>·</span>
              <span>{formatTimeAgo(post.createdAt)}</span>
            </span>
          </div>

          {/* Context menu for author */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-lg text-subink hover:text-ink hover:bg-paper transition opacity-60 group-hover:opacity-100"
              title="More options"
            >
              <MoreHorizontal size={15} />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-36 bg-surface border border-line rounded-xl shadow-soft py-1 z-20 animate-fadeUp text-xs">
                <button
                  onClick={handleShare}
                  className="w-full px-3 py-1.5 text-left text-ink hover:bg-paper flex items-center gap-2"
                >
                  <Share2 size={13} />
                  <span>{copied ? "Copied Link!" : "Share Link"}</span>
                </button>
                {isAuthor && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      deletePost(post.id);
                    }}
                    className="w-full px-3 py-1.5 text-left text-peer-critic hover:bg-rose-50 flex items-center gap-2"
                  >
                    <Trash2 size={13} />
                    <span>Delete thought</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title link */}
        <Link href={`/community/${post.id}`} className="block group/title">
          <h3 className="font-display font-semibold text-base sm:text-lg text-ink group-hover/title:text-accent-dark transition leading-snug mb-2">
            {post.title}
          </h3>
        </Link>

        {/* Content */}
        {post.type === "mistake" && post.mistakeDetails ? (
          <div className="my-3 p-3.5 rounded-xl border border-line bg-paper/50 space-y-2 text-xs">
            <div>
              <span className="font-semibold text-ink">What went wrong: </span>
              <span className="text-subink">{post.mistakeDetails.whatWentWrong}</span>
            </div>
            <div>
              <span className="font-semibold text-emerald-800">What I learned: </span>
              <span className="text-subink">{post.mistakeDetails.whatILearned}</span>
            </div>

            {/* Relate count */}
            <div className="pt-1 flex items-center justify-between">
              <span className="text-[11px] text-subink">
                {post.mistakeDetails.relateCount || 1} students relate to this mistake
              </span>
              <button
                type="button"
                onClick={handleRelateClick}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-line hover:border-accent text-xs font-semibold text-ink transition"
              >
                <HeartHandshake size={13} className="text-accent" />
                <span>This happened to me too</span>
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-subink leading-relaxed line-clamp-3 mb-4 font-normal">
            {post.content}
          </p>
        )}

        {/* Bottom Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Meaningful Reactions */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(Object.keys(REACTION_META) as ReactionType[]).map((rKey) => {
              const rMeta = REACTION_META[rKey];
              const count = post.reactions?.[rKey] || 0;
              const isSelected = myReaction === rKey;

              return (
                <button
                  key={rKey}
                  type="button"
                  onClick={(e) => handleReactionClick(e, rKey)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition border ${
                    isSelected
                      ? "bg-accent-light border-accent/40 text-accent-dark font-semibold shadow-xs"
                      : "bg-surface border-line/80 text-subink hover:bg-paper hover:text-ink hover:border-line"
                  }`}
                  title={rMeta.label}
                >
                  <span className="text-xs">{rMeta.icon}</span>
                  <span className="text-[11px] font-medium">{rMeta.label}</span>
                  {count > 0 && <span className="text-[10px] font-bold opacity-80">{count}</span>}
                </button>
              );
            })}
          </div>

          {/* Right actions: Think With Me & Discussion link */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Think With Me button */}
            <button
              type="button"
              onClick={() => setShowThinkModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-light text-accent-dark text-xs font-bold hover:bg-accent/15 border border-accent/25 transition shadow-xs"
            >
              <Sparkles size={13} className="text-accent-dark" />
              <span>Think With Me</span>
              {post.thinkingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-white text-[10px] text-accent-dark font-bold">
                  {post.thinkingCount}
                </span>
              )}
            </button>

            {/* Discussion count */}
            <Link
              href={`/community/${post.id}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-line bg-paper/60 hover:bg-paper text-subink hover:text-ink text-xs font-medium transition"
            >
              <MessageSquare size={13} />
              <span>{post.replyCount || 0}</span>
            </Link>
          </div>
        </div>
      </article>

      <ThinkWithMeModal
        post={post}
        isOpen={showThinkModal}
        onClose={() => setShowThinkModal(false)}
      />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
