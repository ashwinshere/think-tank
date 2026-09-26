"use client";

import { DEFAULT_SCORE, DEFAULT_USAGE, Mistake, ThinkingScore, UsageStats } from "./types";

const KEYS = {
  mistakes: "thinktank:mistakes",
  usage: "thinktank:usage",
  score: "thinktank:score",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadMistakes(): Mistake[] {
  return read<Mistake[]>(KEYS.mistakes, []);
}

export function saveMistake(mistake: Mistake) {
  const current = loadMistakes();
  write(KEYS.mistakes, [mistake, ...current]);
}

export function markMistakeCorrected(id: string) {
  const current = loadMistakes();
  write(
    KEYS.mistakes,
    current.map((m) => (m.id === id ? { ...m, status: "corrected" as const } : m))
  );
}

export function loadUsage(): UsageStats {
  return read<UsageStats>(KEYS.usage, DEFAULT_USAGE);
}

export function saveUsage(usage: UsageStats) {
  write(KEYS.usage, usage);
}

export function loadScore(): ThinkingScore {
  return read<ThinkingScore>(KEYS.score, DEFAULT_SCORE);
}

export function saveScore(score: ThinkingScore) {
  write(KEYS.score, score);
}

export function nudgeScore(delta: Partial<ThinkingScore>) {
  const current = loadScore();
  const next: ThinkingScore = { ...current };
  (Object.keys(delta) as (keyof ThinkingScore)[]).forEach((k) => {
    const v = delta[k];
    if (typeof v === "number") {
      next[k] = Math.max(0, Math.min(100, Math.round(current[k] + v)));
    }
  });
  saveScore(next);
  return next;
}
