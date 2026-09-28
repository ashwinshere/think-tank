"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { CodeSessionSummary, CodeSessionDetail } from "./types";

interface CodeSessionContextType {
  codeSessions: CodeSessionSummary[];
  activeCodeSessionId: string | null;
  setActiveCodeSessionId: (id: string | null) => void;
  loading: boolean;
  loadCodeSessions: () => Promise<void>;
  saveCodeSession: (sessionData: Partial<CodeSessionDetail>) => Promise<string | null>;
  loadCodeSessionById: (id: string) => Promise<CodeSessionDetail | null>;
  deleteCodeSession: (id: string) => Promise<void>;
  newSessionSignal: number;
  startNewCodeSession: () => void;
}

const CodeSessionContext = createContext<CodeSessionContextType | undefined>(undefined);

export function CodeSessionProvider({ children }: { children: React.ReactNode }) {
  const { user, getIdToken } = useAuth();
  const [codeSessions, setCodeSessions] = useState<CodeSessionSummary[]>([]);
  const [activeCodeSessionId, setActiveCodeSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [newSessionSignal, setNewSessionSignal] = useState(0);

  const loadCodeSessions = useCallback(async () => {
    if (!user) {
      setCodeSessions([]);
      return;
    }

    setLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/code-sessions?limit=50", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setCodeSessions(data.codeSessions || []);
      }
    } catch (err) {
      console.error("Failed to load code sessions:", err);
    } finally {
      setLoading(false);
    }
  }, [user, getIdToken]);

  useEffect(() => {
    loadCodeSessions();
  }, [loadCodeSessions]);

  const saveCodeSession = async (
    sessionData: Partial<CodeSessionDetail>
  ): Promise<string | null> => {
    if (!user) return null;
    try {
      const token = await getIdToken();
      const res = await fetch("/api/code-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(sessionData),
      });

      if (res.ok) {
        const data = await res.json();
        const savedSession = data.session;
        setActiveCodeSessionId(savedSession.id);
        await loadCodeSessions();
        return savedSession.id;
      }
    } catch (err) {
      console.error("Failed to save code session:", err);
    }
    return null;
  };

  const loadCodeSessionById = async (id: string): Promise<CodeSessionDetail | null> => {
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/code-sessions/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        return data.session as CodeSessionDetail;
      }
    } catch (err) {
      console.error("Failed to fetch code session details:", err);
    }
    return null;
  };

  const deleteCodeSession = async (id: string) => {
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/code-sessions/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setCodeSessions((prev) => prev.filter((s) => s.id !== id));
        if (activeCodeSessionId === id) {
          setActiveCodeSessionId(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete code session:", err);
    }
  };

  const startNewCodeSession = () => {
    setActiveCodeSessionId(null);
    setNewSessionSignal((prev) => prev + 1);
  };

  return (
    <CodeSessionContext.Provider
      value={{
        codeSessions,
        activeCodeSessionId,
        setActiveCodeSessionId,
        loading,
        loadCodeSessions,
        saveCodeSession,
        loadCodeSessionById,
        deleteCodeSession,
        newSessionSignal,
        startNewCodeSession,
      }}
    >
      {children}
    </CodeSessionContext.Provider>
  );
}

export function useCodeSessions() {
  const context = useContext(CodeSessionContext);
  if (!context) {
    throw new Error("useCodeSessions must be used within a CodeSessionProvider");
  }
  return context;
}
