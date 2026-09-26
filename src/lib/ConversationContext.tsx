"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";

export interface ConversationSummary {
  id: string;
  title: string;
  topic?: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage?: {
    content: string;
    role: string;
    persona?: string | null;
    createdAt: string;
  } | null;
}

interface ConversationContextType {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  loading: boolean;
  loadConversations: () => Promise<void>;
  createConversation: (title?: string, topic?: string) => Promise<string | null>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export function ConversationProvider({ children }: { children: React.ReactNode }) {
  const { user, getIdToken } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      return;
    }

    setLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/conversations?limit=40", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  }, [user, getIdToken]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const createConversation = async (title?: string, topic?: string): Promise<string | null> => {
    if (!user) return null;
    try {
      const token = await getIdToken();
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ title, topic }),
      });
      if (res.ok) {
        const data = await res.json();
        const newConv = data.conversation;
        setActiveConversationId(newConv.id);
        await loadConversations();
        return newConv.id;
      }
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
    return null;
  };

  const deleteConversation = async (id: string) => {
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeConversationId === id) {
          setActiveConversationId(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const renameConversation = async (id: string, title: string) => {
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, title } : c))
        );
      }
    } catch (err) {
      console.error("Failed to rename conversation:", err);
    }
  };

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        activeConversationId,
        setActiveConversationId,
        loading,
        loadConversations,
        createConversation,
        deleteConversation,
        renameConversation,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversations() {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error("useConversations must be used within a ConversationProvider");
  }
  return context;
}
