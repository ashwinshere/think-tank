"use client";

import React, { useState } from "react";
import { useCommunity } from "@/lib/CommunityContext";
import { PostCard } from "./PostCard";
import { CreatePostModal } from "./CreatePostModal";
import { Search, Plus, Radio, Sparkles, Filter } from "lucide-react";
import { PostType } from "@/lib/types";

const CATEGORIES = [
  { id: "All", label: "All" },
  { id: "Doubts", label: "Doubts", type: "doubt" },
  { id: "Challenges", label: "Challenges", type: "challenge" },
  { id: "Explain", label: "Explain", type: "explain" },
  { id: "Projects", label: "Projects", type: "project" },
  { id: "Mistakes", label: "Mistakes", type: "mistake" },
];

export function CommunityFeed() {
  const {
    posts,
    loading,
    onlineCount,
    currentCategory,
    setCurrentCategory,
    searchQuery,
    setSearchQuery,
    isRealtimeConnected,
  } = useCommunity();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<PostType>("doubt");

  const handleOpenComposer = (type: PostType = "doubt") => {
    setModalInitialType(type);
    setShowCreateModal(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="border-b border-line pb-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink tracking-tight">
                ThinkTank Community
              </h1>
              {isRealtimeConnected && (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <p className="text-sm text-subink leading-relaxed">
              Ask something. Share what you think. Figure it out together.
            </p>
          </div>

          {/* "+ Ask the Community" button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenComposer("doubt")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white hover:bg-accent-dark text-xs sm:text-sm font-semibold shadow-sm transition"
            >
              <Plus size={16} />
              <span>Ask the Community</span>
            </button>
          </div>
        </div>

        {/* Real-time thinkers indicator pill */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-subink">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <span className="text-ink font-semibold">{onlineCount}</span>
            <span>{onlineCount === 1 ? "thinker" : "thinkers"} online right now</span>
          </div>

          <span className="text-[11px] text-subink italic hidden sm:block">
            AI is your thinking partner · Not the answer dispenser
          </span>
        </div>
      </div>

      {/* 2. Search & Category Filter Bar */}
      <div className="space-y-3">
        {/* Natural Search Bar */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subink"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search discussions... (e.g. 'recursion purila', 'BFS shortest path', 'pointer')"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-line bg-surface focus:bg-white focus:outline-none focus:border-accent text-xs sm:text-sm text-ink placeholder:text-subink/60 transition shadow-xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = currentCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCurrentCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition border ${
                  isSelected
                    ? "bg-accent-light border-accent/40 text-accent-dark font-bold shadow-xs"
                    : "border-line bg-surface text-subink hover:bg-paper hover:text-ink"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Live Posts Feed */}
      <div className="border border-line rounded-2xl bg-surface divide-y divide-line overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-subink space-y-2">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs">Connecting to community thoughts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center text-subink space-y-3">
            <p className="font-display font-medium text-ink text-base">
              No one has asked this yet.
            </p>
            <p className="text-xs text-subink max-w-sm mx-auto leading-relaxed">
              Quiet here. Be the first thinker to start the discussion or share a problem you are
              grappling with.
            </p>
            <button
              onClick={() => handleOpenComposer("doubt")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-light text-accent-dark font-semibold text-xs hover:bg-accent/15 transition border border-accent/20"
            >
              <Plus size={14} />
              <span>Start the first discussion</span>
            </button>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>

      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        initialType={modalInitialType}
      />
    </div>
  );
}
