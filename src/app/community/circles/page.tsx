"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CommunityNav } from "@/components/community/CommunityNav";
import { StudyCirclesView } from "@/components/community/StudyCirclesView";
import { CommunityAuthGuard } from "@/components/community/CommunityAuthGuard";

function CirclesContent() {
  const searchParams = useSearchParams();
  const circleId = searchParams.get("circleId") || undefined;
  return <StudyCirclesView initialCircleId={circleId} />;
}

export default function CirclesPage() {
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <CommunityNav activeTab="community" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <CommunityAuthGuard>
          <Suspense
            fallback={
              <div className="py-20 text-center text-subink">
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs">Loading study circles...</p>
              </div>
            }
          >
            <CirclesContent />
          </Suspense>
        </CommunityAuthGuard>
      </main>
    </div>
  );
}
