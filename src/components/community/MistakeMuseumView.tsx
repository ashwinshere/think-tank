"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCommunity } from "@/lib/CommunityContext";
import { useAuth } from "@/lib/AuthContext";
import { loadMistakes } from "@/lib/storage";
import { Mistake } from "@/lib/types";
import { CreatePostModal } from "./CreatePostModal";
import {
  Archive,
  HeartHandshake,
  Plus,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Share2,
} from "lucide-react";
import { AuthModal } from "@/components/AuthModal";

export function MistakeMuseumView() {
  const { user } = useAuth();
  const { posts, relateToMistake, createPost } = useCommunity();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [localMistakes, setLocalMistakes] = useState<Mistake[]>([]);
  const [publishingLocalId, setPublishingLocalId] = useState<string | null>(null);

  // Load private local mistakes from storage to allow 1-click publishing
  useEffect(() => {
    setLocalMistakes(loadMistakes());
  }, []);

  const mistakePosts = posts.filter((p) => p.type === "mistake");

  const handlePublishLocalMistake = async (m: Mistake) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setPublishingLocalId(m.id);
    try {
      await createPost({
        title: `Misconception in ${m.topic}: "${m.misconception}"`,
        content: `What went wrong: ${m.cause}`,
        type: "mistake",
        subject: "DSA",
        mistakeDetails: {
          whatWentWrong: m.cause,
          whatILearned: "Deconstructed the misconception and reviewed edge cases.",
          relateCount: 1,
        },
      });
      alert("Mistake shared with the community museum! Other students can now learn from it.");
    } catch (err) {
      console.error(err);
    } finally {
      setPublishingLocalId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/community"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-subink hover:text-ink transition group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Community Feed</span>
        </Link>

        <button
          onClick={() => {
            if (!user) {
              setShowAuthModal(true);
              return;
            }
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white hover:bg-accent-dark text-xs font-semibold shadow-sm transition"
        >
          <Plus size={14} />
          <span>Share a Mistake</span>
        </button>
      </div>

      {/* Hero Banner */}
      <div className="p-6 sm:p-8 rounded-2xl border border-line bg-surface shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-accent">
          <Archive size={20} />
          <span className="text-xs font-bold uppercase tracking-wider">
            Public Hall of Learning
          </span>
        </div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink">
          The Mistake Museum
        </h1>
        <p className="text-sm text-subink max-w-2xl leading-relaxed">
          The best engineers make plenty of mistakes — they just inspect them carefully. This is a
          safe, supportive space where students share misconceptions, logic bugs, and boundary traps
          so everyone learns faster.
        </p>
      </div>

      {/* 1-Click Share from Student's Private Museum if available */}
      {localMistakes.length > 0 && (
        <div className="p-5 rounded-2xl border border-accent/25 bg-accent-light/30 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-accent-dark uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} />
              Your Private Learning History ({localMistakes.length})
            </h3>
            <span className="text-[11px] text-accent-dark font-medium">
              Publish to help other students
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {localMistakes.slice(0, 4).map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-xl bg-white border border-line flex flex-col justify-between gap-2"
              >
                <div>
                  <p className="font-semibold text-xs text-ink truncate">{m.topic}</p>
                  <p className="text-[11px] text-subink line-clamp-1 italic mt-0.5">
                    &ldquo;{m.misconception}&rdquo;
                  </p>
                </div>
                <button
                  onClick={() => handlePublishLocalMistake(m)}
                  disabled={publishingLocalId === m.id}
                  className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-accent-dark hover:bg-accent-light px-2.5 py-1 rounded-lg border border-accent/20 transition self-start"
                >
                  <Share2 size={11} />
                  <span>{publishingLocalId === m.id ? "Sharing..." : "Publish to Museum"}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Public Mistakes Feed */}
      <div className="space-y-4">
        <h2 className="font-display font-semibold text-lg text-ink">
          Exhibits ({mistakePosts.length})
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {mistakePosts.length === 0 ? (
            <div className="p-12 text-center text-subink border border-line rounded-2xl bg-surface">
              <p className="font-display font-medium text-ink text-base">
                No mistakes displayed yet.
              </p>
              <p className="text-xs mt-1">Be the first to share what tripped you up and what you learned.</p>
            </div>
          ) : (
            mistakePosts.map((post) => {
              const details = post.mistakeDetails;
              return (
                <div
                  key={post.id}
                  className="p-6 rounded-2xl border border-line bg-surface hover:border-line shadow-xs space-y-4 transition"
                >
                  <div className="flex items-center justify-between text-xs text-subink">
                    <span className="font-semibold text-ink">
                      {post.isAnonymous ? "Anonymous Thinker" : post.authorName}
                    </span>
                    <span>
                      {new Date(post.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <Link href={`/community/${post.id}`}>
                    <h3 className="font-display font-semibold text-base sm:text-lg text-ink hover:text-accent-dark transition leading-snug">
                      &ldquo;{post.title}&rdquo;
                    </h3>
                  </Link>

                  {/* What went wrong & What I learned */}
                  <div className="space-y-2 text-xs sm:text-sm">
                    {details?.whatWentWrong && (
                      <div className="p-3 rounded-xl bg-paper/60 border border-line/60">
                        <strong className="text-ink font-semibold block mb-0.5">
                          What went wrong:
                        </strong>
                        <span className="text-subink leading-relaxed">
                          {details.whatWentWrong}
                        </span>
                      </div>
                    )}
                    {details?.whatILearned && (
                      <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                        <strong className="text-emerald-900 font-semibold block mb-0.5">
                          What I learned:
                        </strong>
                        <span className="text-emerald-950 leading-relaxed">
                          {details.whatILearned}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Relate bar */}
                  <div className="pt-2 border-t border-line flex items-center justify-between">
                    <span className="text-xs text-subink">
                      <strong className="text-ink font-semibold">
                        {details?.relateCount || 1}
                      </strong>{" "}
                      students relate to this mistake
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        if (!user) {
                          setShowAuthModal(true);
                          return;
                        }
                        relateToMistake(post.id);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-paper hover:bg-surface border border-line hover:border-accent text-xs font-semibold text-ink transition"
                    >
                      <HeartHandshake size={13} className="text-accent" />
                      <span>This happened to me too</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        initialType="mistake"
      />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
