"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useCommunity } from "@/lib/CommunityContext";
import { StudyCircle } from "@/lib/types";
import { Users, Swords, Flame, ArrowRight, ShieldCheck } from "lucide-react";

export function CommunitySidebar() {
  const { onlineCount, activeThinkers, thinkingPoints } = useCommunity();
  const [circles, setCircles] = useState<StudyCircle[]>([]);

  useEffect(() => {
    fetch("/api/community/circles")
      .then((res) => res.json())
      .then((data) => {
        if (data.circles) {
          setCircles(data.circles.slice(0, 4));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <aside className="space-y-6">
      {/* 1. Live Thinkers Widget */}
      <div className="p-5 rounded-2xl border border-line bg-surface shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <h4 className="font-display font-semibold text-sm text-ink">
              Currently Thinking
            </h4>
          </div>
          <span className="text-xs font-bold text-accent-dark px-2 py-0.5 rounded-full bg-accent-light">
            {onlineCount} live
          </span>
        </div>

        <p className="text-xs text-subink leading-relaxed">
          Students currently working through doubts and reasoning challenges.
        </p>

        {activeThinkers.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {activeThinkers.slice(0, 8).map((t, idx) => (
              <div
                key={t.userId || idx}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-paper border border-line text-[11px] font-medium text-ink"
              >
                <div className="w-4 h-4 rounded-full bg-accent/20 text-accent-dark font-bold text-[9px] flex items-center justify-center">
                  {t.userName.charAt(0).toUpperCase()}
                </div>
                <span className="truncate max-w-[80px]">{t.userName}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-subink italic">
            You are currently the first active thinker in this room.
          </div>
        )}
      </div>

      {/* 2. Daily Thinking Challenge */}
      <div className="p-5 rounded-2xl border border-accent/20 bg-accent-light/40 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-accent-dark flex items-center gap-1.5">
            <Swords size={12} />
            Daily Challenge
          </span>
          <span className="text-[10px] font-bold text-accent-dark bg-white px-2 py-0.5 rounded-full border border-accent/20">
            +15 TP
          </span>
        </div>

        <p className="font-display font-semibold text-sm text-ink leading-snug">
          &ldquo;Reverse a singly linked list with only 2 pointers in O(n)&rdquo;
        </p>
        <p className="text-xs text-subink leading-relaxed">
          Most solutions use 3 pointers. Can you mutate references in-place without the extra pointer?
        </p>

        <Link
          href="/community?category=Challenges"
          className="inline-flex items-center gap-1 text-xs font-bold text-accent-dark hover:underline pt-1"
        >
          <span>Take on challenge</span>
          <ArrowRight size={12} />
        </Link>
      </div>

      {/* 3. Active Study Circles */}
      <div className="p-5 rounded-2xl border border-line bg-surface shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-display font-semibold text-sm text-ink flex items-center gap-1.5">
            <Users size={14} className="text-subink" />
            Study Circles
          </h4>
          <Link
            href="/community/circles"
            className="text-[11px] font-semibold text-accent-dark hover:underline"
          >
            All circles →
          </Link>
        </div>

        <div className="divide-y divide-line/60">
          {circles.map((c) => (
            <Link
              key={c.id}
              href={`/community/circles?circleId=${c.id}`}
              className="py-2.5 flex items-center justify-between group block"
            >
              <div>
                <p className="text-xs font-semibold text-ink group-hover:text-accent-dark transition">
                  {c.name}
                </p>
                <p className="text-[11px] text-subink line-clamp-1">{c.description}</p>
              </div>
              <span className="text-[10px] font-medium text-subink px-1.5 py-0.5 rounded bg-paper shrink-0 ml-2">
                {c.memberCount} members
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 4. Thinking Points Philosophy Banner */}
      <div className="p-4 rounded-xl border border-line bg-paper/60 space-y-1.5 text-xs text-subink">
        <div className="flex items-center gap-1.5 font-semibold text-ink">
          <ShieldCheck size={13} className="text-accent" />
          <span>ThinkTank Philosophy</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          &ldquo;Learn by thinking, not just by getting answers.&rdquo; Points are awarded for deep
          reasoning, admitting mistakes, and explaining concepts to peers.
        </p>
      </div>
    </aside>
  );
}
