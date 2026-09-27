"use client";

import { AuthProvider } from "@/lib/AuthContext";
import { ConversationProvider } from "@/lib/ConversationContext";
import { CommunityProvider } from "@/lib/CommunityContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ConversationProvider>
        <CommunityProvider>{children}</CommunityProvider>
      </ConversationProvider>
    </AuthProvider>
  );
}
