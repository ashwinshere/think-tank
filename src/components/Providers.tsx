"use client";

import { AuthProvider } from "@/lib/AuthContext";
import { ConversationProvider } from "@/lib/ConversationContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ConversationProvider>{children}</ConversationProvider>
    </AuthProvider>
  );
}
