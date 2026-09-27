"use client";

import React from "react";
import { CommunityNav } from "@/components/community/CommunityNav";
import { MistakeMuseumView } from "@/components/community/MistakeMuseumView";

export default function MistakesPage() {
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <CommunityNav activeTab="community" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <MistakeMuseumView />
      </main>
    </div>
  );
}
