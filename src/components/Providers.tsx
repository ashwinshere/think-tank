"use client";

import { AuthProvider } from "@/lib/AuthContext";
import { ConversationProvider } from "@/lib/ConversationContext";
import { CodeSessionProvider } from "@/lib/CodeSessionContext";
import { CommunityProvider } from "@/lib/CommunityContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ConversationProvider>
        <CodeSessionProvider>
          <CommunityProvider>{children}</CommunityProvider>
        </CodeSessionProvider>
      </ConversationProvider>
    </AuthProvider>
  );
}
