"use client";

import { useEffect, useState } from "react";
import { Card, SectionHeader } from "./ui/Card";
import { Mistake } from "@/lib/types";
import { loadMistakes, markMistakeCorrected } from "@/lib/storage";
import { Archive, CheckCircle2 } from "lucide-react";

export function MistakeMuseum({ onPractice }: { onPractice?: (topic: string) => void }) {
  const [mistakes, setMistakes] = useState<Mistake[]>([]);

  useEffect(() => {
    setMistakes(loadMistakes());
  }, []);

  function correct(id: string) {
    markMistakeCorrected(id);
    setMistakes(loadMistakes());
  }

  return (
    <div className="max-w-3xl mx-auto">
      <SectionHeader
        eyebrow="Your Learning History"
        title="Mistake Museum"
        description="A gentle record of where your reasoning took a wrong turn — and whether you've fixed it since. Mistakes here are progress markers, not report cards."
      />

      {mistakes.length === 0 ? (
        <Card className="p-10 text-center">
          <Archive className="mx-auto text-subink mb-3" size={28} />
          <p className="font-display text-lg text-ink mb-1">Nothing here yet</p>
          <p className="text-sm text-subink max-w-sm mx-auto">
            When Critic spots a gap in your reasoning during a Learning Session, you can save it
            here to revisit later.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {mistakes.map((m, i) => (
            <Card key={m.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-subink mb-1">
                    Mistake #{String(mistakes.length - i).padStart(2, "0")} · {m.date}
                  </p>
                  <p className="font-display font-semibold text-ink text-lg mb-2">{m.topic}</p>
                  <p className="text-sm text-ink mb-1">
                    <span className="font-semibold">Misconception: </span>
                    &quot;{m.misconception}&quot;
                  </p>
                  <p className="text-sm text-subink">{m.cause}</p>
                </div>
                <span
                  className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    m.status === "corrected"
                      ? "bg-peer-mentorBg text-peer-mentor"
                      : "bg-peer-challengerBg text-peer-challenger"
                  }`}
                >
                  {m.status === "corrected" ? "Corrected" : "Needs practice"}
                </span>
              </div>
              {m.status !== "corrected" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => correct(m.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-paper border border-line hover:border-accent transition-colors"
                  >
                    <CheckCircle2 size={13} /> I've got this now
                  </button>
                  {onPractice && (
                    <button
                      onClick={() => onPractice(m.topic)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-accent-light text-accent-dark border border-accent/25 hover:bg-accent/10 transition-colors"
                    >
                      Try a similar problem
                    </button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
