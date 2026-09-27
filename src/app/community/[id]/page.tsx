"use client";

import React from "react";
import { useParams } from "next/navigation";
import { CommunityNav } from "@/components/community/CommunityNav";
import { ThreadView } from "@/components/community/ThreadView";

export default function ThreadPage() {
  const params = useParams();
  const postId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <CommunityNav activeTab="community" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <ThreadView postId={postId} />
      </main>
    </div>
  );
}
