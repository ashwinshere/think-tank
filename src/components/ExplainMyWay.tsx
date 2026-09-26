"use client";

import { useState } from "react";
import { Card, SectionHeader } from "./ui/Card";
import { callAI } from "@/lib/api";
import { ExplainStyle } from "@/lib/types";
import { BookOpen, Film, Lightbulb, MessageCircle, Smile, Sparkles } from "lucide-react";

const STYLES: { id: ExplainStyle; label: string; icon: any }[] = [
  { id: "simple", label: "Simple", icon: Lightbulb },
  { id: "example", label: "Example", icon: BookOpen },
  { id: "meme", label: "Meme", icon: Smile },
  { id: "story", label: "Story", icon: MessageCircle },
  { id: "cinema", label: "Cinema-style", icon: Film },
  { id: "tanglish", label: "Tanglish", icon: Sparkles },
];

export function ExplainMyWay() {
  const [doubt, setDoubt] = useState("");
  const [style, setStyle] = useState<ExplainStyle>("simple");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function explain() {
    if (!doubt.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await callAI<{ explanation: string }>("explain_my_way", { doubt: doubt.trim(), style });
      setResult(res.explanation);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <SectionHeader
        eyebrow="Pick Your Vibe"
        title="Explain it my way"
        description="Same concept, different flavor. Useful when the 'textbook' explanation just isn't landing."
      />

      <Card className="p-6">
        <input
          value={doubt}
          onChange={(e) => setDoubt(e.target.value)}
          placeholder="Why does a stack use LIFO?"
          className="w-full rounded-full border border-line px-4 py-2.5 text-sm bg-paper focus:border-accent focus:bg-white outline-none transition-colors mb-4"
        />

        <div className="flex flex-wrap gap-2 mb-5">
          {STYLES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setStyle(id)}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                style === id
                  ? "bg-accent text-white border-accent"
                  : "bg-paper text-subink border-line hover:border-accent/40"
              }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        <button
          onClick={explain}
          disabled={loading || !doubt.trim()}
          className="px-5 py-2.5 rounded-full bg-accent text-white text-sm font-semibold disabled:opacity-40 hover:bg-accent-dark transition-colors"
        >
          {loading ? "Explaining..." : "Explain it"}
        </button>

        {result && (
          <div className="animate-fadeUp mt-5 bg-accent-light border border-accent/25 rounded-xl2 p-4">
            <p className="text-sm text-ink leading-relaxed">{result}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
