"use client";

import React from "react";
import { CommunityNav } from "@/components/community/CommunityNav";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { CommunitySidebar } from "@/components/community/CommunitySidebar";

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <CommunityNav activeTab="community" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Feed Column */}
          <div className="lg:col-span-8 min-w-0">
            <CommunityFeed />
          </div>

          {/* Right Column: Currently thinking / Study circles / Daily challenge */}
          <div className="hidden lg:block lg:col-span-4 sticky top-24">
            <CommunitySidebar />
          </div>
        </div>
      </main>
    </div>
  );
}
