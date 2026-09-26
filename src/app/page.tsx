"use client";

import { useState } from "react";
import { Sidebar, MobileNav, Section } from "@/components/Sidebar";
import { LearningSession } from "@/components/LearningSession";
import { PeerTeam } from "@/components/PeerTeam";
import { DebateMode } from "@/components/DebateMode";
import { MistakeMuseum } from "@/components/MistakeMuseum";
import { TeachTheAI } from "@/components/TeachTheAI";
import { NoAIRound } from "@/components/NoAIRound";
import { ExplainMyWay } from "@/components/ExplainMyWay";
import { GrowthDashboard } from "@/components/GrowthDashboard";

export default function Home() {
  const [section, setSection] = useState<Section>("session");

  return (
    <div className="flex min-h-screen">
      <Sidebar active={section} onChange={setSection} />

      <div className="flex-1 min-w-0">
        <MobileNav active={section} onChange={setSection} />

        <main className="px-4 sm:px-6 lg:px-10 py-8 md:py-12">
          {section === "session" && <LearningSession />}
          {section === "team" && <PeerTeam />}
          {section === "debate" && <DebateMode />}
          {section === "museum" && <MistakeMuseum onPractice={() => setSection("session")} />}
          {section === "teach" && <TeachTheAI />}
          {section === "noai" && <NoAIRound />}
          {section === "explain" && <ExplainMyWay />}
          {section === "growth" && <GrowthDashboard onGoToNoAi={() => setSection("noai")} />}
        </main>
      </div>
    </div>
  );
}
