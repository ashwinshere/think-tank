"use client";

import { useState } from "react";
import { Sidebar, MobileNav, Section } from "@/components/Sidebar";
import { LearningSession } from "@/components/LearningSession";
import { CodeLearning } from "@/components/CodeLearning";
import { PeerTeam } from "@/components/PeerTeam";
import { DebateMode } from "@/components/DebateMode";
import { MistakeMuseum } from "@/components/MistakeMuseum";
import { TeachTheAI } from "@/components/TeachTheAI";
import { NoAIRound } from "@/components/NoAIRound";
import { ExplainMyWay } from "@/components/ExplainMyWay";
import { GrowthDashboard } from "@/components/GrowthDashboard";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { CommunitySidebar } from "@/components/community/CommunitySidebar";
import { CommunityAuthGuard } from "@/components/community/CommunityAuthGuard";

export default function Home() {
  const [section, setSection] = useState<Section>("session");

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar active={section} onChange={setSection} />

      <div className="flex-1 min-w-0">
        <MobileNav active={section} onChange={setSection} />

        <main className="px-4 sm:px-6 lg:px-10 py-8 md:py-12">
          {section === "session" && <LearningSession />}
          {section === "code" && <CodeLearning />}
          {section === "community" && (
            <CommunityAuthGuard>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl mx-auto">
                <div className="lg:col-span-8 min-w-0">
                  <CommunityFeed />
                </div>
                <div className="hidden lg:block lg:col-span-4 sticky top-6">
                  <CommunitySidebar />
                </div>
              </div>
            </CommunityAuthGuard>
          )}
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
