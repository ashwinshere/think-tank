"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  CommunityPost,
  CommunityComment,
  NotificationItem,
  PostType,
  ReactionType,
  SubjectType,
  OnlineThinker,
} from "./types";
import { useAuth } from "./AuthContext";

interface CommunityContextType {
  posts: CommunityPost[];
  loading: boolean;
  onlineCount: number;
  activeThinkers: OnlineThinker[];
  currentCategory: string;
  setCurrentCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  thinkingPoints: number;
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  isRealtimeConnected: boolean;
  activeTypers: Record<string, string[]>;
  createPost: (data: {
    title: string;
    content: string;
    type: PostType;
    subject?: SubjectType;
    circleId?: string;
    isAnonymous?: boolean;
    mistakeDetails?: { whatWentWrong: string; whatILearned: string; relateCount: number };
  }) => Promise<{ ok: boolean; post?: CommunityPost; error?: string }>;
  deletePost: (postId: string) => Promise<{ ok: boolean; error?: string }>;
  toggleReaction: (
    postId: string,
    reaction: ReactionType
  ) => Promise<{ ok: boolean; reactions?: Record<ReactionType, number>; userReaction?: ReactionType | null }>;
  relateToMistake: (postId: string) => Promise<{ ok: boolean; relateCount?: number; hasRelated?: boolean }>;
  broadcastTyping: (threadId: string) => void;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  refreshPosts: () => Promise<void>;
  refreshPresence: () => Promise<void>;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineCount, setOnlineCount] = useState(1);
  const [activeThinkers, setActiveThinkers] = useState<OnlineThinker[]>([]);
  const [currentCategory, setCurrentCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [thinkingPoints, setThinkingPoints] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [activeTypers, setActiveTypers] = useState<Record<string, string[]>>({});

  const eventSourceRef = useRef<EventSource | null>(null);
  const typingDebounceRef = useRef<Record<string, number>>({});

  // 1. Fetch Posts with filtering
  const fetchPosts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (currentCategory && currentCategory !== "All") {
        params.set("category", currentCategory);
      }
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      const res = await fetch(`/api/community/posts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error("Failed to fetch community posts:", err);
    } finally {
      setLoading(false);
    }
  }, [currentCategory, searchQuery]);

  // 2. Fetch Online Presence
  const fetchPresence = useCallback(async () => {
    try {
      const res = await fetch("/api/community/presence");
      if (res.ok) {
        const data = await res.json();
        setOnlineCount(data.onlineCount || 1);
        setActiveThinkers(data.activeThinkers || []);
      }
    } catch (err) {
      console.error("Failed to fetch presence:", err);
    }
  }, []);

  // 3. Fetch User Stats (Thinking Points) & Notifications
  const fetchUserStats = useCallback(async () => {
    if (!user) {
      setThinkingPoints(0);
      setNotifications([]);
      return;
    }
    try {
      const [ptsRes, notifRes] = await Promise.all([
        fetch("/api/community/points"),
        fetch("/api/community/notifications"),
      ]);

      if (ptsRes.ok) {
        const data = await ptsRes.json();
        setThinkingPoints(data.points || 0);
      }

      if (notifRes.ok) {
        const data = await notifRes.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to fetch user stats/notifications:", err);
    }
  }, [user]);

  // Initial load & when filters change
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    fetchPresence();
    fetchUserStats();
  }, [fetchPresence, fetchUserStats]);

  // 4. Heartbeat presence update (every 25 seconds for logged-in user)
  useEffect(() => {
    if (!user) return;

    const sendHeartbeat = async () => {
      try {
        await fetch("/api/community/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isThinking: true }),
        });
      } catch (err) {
        // quiet error
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 25000);
    return () => clearInterval(interval);
  }, [user]);

  // 5. Real-Time SSE Subscription
  useEffect(() => {
    const sse = new EventSource("/api/community/stream");
    eventSourceRef.current = sse;

    sse.addEventListener("connected", () => {
      setIsRealtimeConnected(true);
    });

    sse.addEventListener("POST_CREATED", (e: MessageEvent) => {
      try {
        const newPost: CommunityPost = JSON.parse(e.data);
        setPosts((prev) => {
          if (prev.some((p) => p.id === newPost.id)) return prev;
          return [newPost, ...prev];
        });
      } catch (err) {
        console.error("Error handling POST_CREATED SSE:", err);
      }
    });

    sse.addEventListener("POST_UPDATED", (e: MessageEvent) => {
      try {
        const updatedPost: CommunityPost = JSON.parse(e.data);
        setPosts((prev) =>
          prev.map((p) => (p.id === updatedPost.id ? { ...p, ...updatedPost } : p))
        );
      } catch (err) {
        console.error("Error handling POST_UPDATED SSE:", err);
      }
    });

    sse.addEventListener("POST_DELETED", (e: MessageEvent) => {
      try {
        const { postId } = JSON.parse(e.data);
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      } catch (err) {
        console.error("Error handling POST_DELETED SSE:", err);
      }
    });

    sse.addEventListener("COMMENT_CREATED", (e: MessageEvent) => {
      try {
        const comment: CommunityComment = JSON.parse(e.data);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === comment.postId
              ? { ...p, replyCount: (p.replyCount || 0) + 1 }
              : p
          )
        );
      } catch (err) {
        console.error("Error handling COMMENT_CREATED SSE:", err);
      }
    });

    sse.addEventListener("REACTION_CHANGED", (e: MessageEvent) => {
      try {
        const { postId, reactions, userId: rUserId, userReaction } = JSON.parse(e.data);
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id !== postId) return p;
            const updated = { ...p, reactions };
            if (user && user.id === rUserId) {
              updated.userReactions = {
                ...(p.userReactions || {}),
                [user.id]: userReaction,
              };
            }
            return updated;
          })
        );
      } catch (err) {
        console.error("Error handling REACTION_CHANGED SSE:", err);
      }
    });

    sse.addEventListener("TYPING_STATUS", (e: MessageEvent) => {
      try {
        const { threadId, userName, isTyping } = JSON.parse(e.data);
        setActiveTypers((prev) => {
          const current = prev[threadId] || [];
          if (isTyping) {
            if (!current.includes(userName)) {
              return { ...prev, [threadId]: [...current, userName] };
            }
          } else {
            return { ...prev, [threadId]: current.filter((u) => u !== userName) };
          }
          return prev;
        });

        // Automatically expire typing indicator after 3.5 seconds
        setTimeout(() => {
          setActiveTypers((prev) => {
            const current = prev[threadId] || [];
            return { ...prev, [threadId]: current.filter((u) => u !== userName) };
          });
        }, 3500);
      } catch (err) {
        console.error("Error handling TYPING_STATUS SSE:", err);
      }
    });

    sse.addEventListener("PRESENCE_CHANGED", () => {
      fetchPresence();
    });

    sse.addEventListener("THINKING_ATTEMPT", (e: MessageEvent) => {
      try {
        const attempt = JSON.parse(e.data);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === attempt.postId
              ? { ...p, thinkingCount: (p.thinkingCount || 0) + 1 }
              : p
          )
        );
      } catch (err) {
        console.error("Error handling THINKING_ATTEMPT SSE:", err);
      }
    });

    sse.onerror = () => {
      setIsRealtimeConnected(false);
    };

    return () => {
      sse.close();
      eventSourceRef.current = null;
    };
  }, [user, fetchPresence]);

  // 6. User Actions
  const createPost = async (data: {
    title: string;
    content: string;
    type: PostType;
    subject?: SubjectType;
    circleId?: string;
    isAnonymous?: boolean;
    mistakeDetails?: { whatWentWrong: string; whatILearned: string; relateCount: number };
  }) => {
    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok) {
        return { ok: false, error: resData.error || "Failed to create post" };
      }

      setThinkingPoints((prev) => prev + (data.type === "doubt" ? 5 : 8));
      return { ok: true, post: resData.post };
    } catch (err: any) {
      return { ok: false, error: err.message || "Network error" };
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const res = await fetch(`/api/community/posts/${postId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        return { ok: false, error: data.error || "Failed to delete" };
      }
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message || "Network error" };
    }
  };

  const toggleReaction = async (postId: string, reaction: ReactionType) => {
    // Optimistic local update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const currentReactions = { ...(p.reactions || { helpful: 0, good_reasoning: 0, needs_evidence: 0, same_doubt: 0 }) };
        const myPrev = p.userReactions?.[user?.id || ""];

        if (myPrev === reaction) {
          currentReactions[reaction] = Math.max(0, currentReactions[reaction] - 1);
          return {
            ...p,
            reactions: currentReactions,
            userReactions: { ...(p.userReactions || {}), [user?.id || ""]: undefined as any },
          };
        } else {
          if (myPrev && currentReactions[myPrev]) {
            currentReactions[myPrev] = Math.max(0, currentReactions[myPrev] - 1);
          }
          currentReactions[reaction] = (currentReactions[reaction] || 0) + 1;
          return {
            ...p,
            reactions: currentReactions,
            userReactions: { ...(p.userReactions || {}), [user?.id || ""]: reaction },
          };
        }
      })
    );

    try {
      const res = await fetch("/api/community/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, reaction }),
      });
      const data = await res.json();
      if (!res.ok) {
        fetchPosts(); // Rollback on failure
        return { ok: false };
      }
      return { ok: true, reactions: data.reactions, userReaction: data.userReaction };
    } catch {
      fetchPosts();
      return { ok: false };
    }
  };

  const relateToMistake = async (postId: string) => {
    try {
      const res = await fetch("/api/community/relate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json();
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id !== postId || !p.mistakeDetails) return p;
            return {
              ...p,
              mistakeDetails: {
                ...p.mistakeDetails,
                relateCount: data.relateCount,
              },
            };
          })
        );
        return { ok: true, relateCount: data.relateCount, hasRelated: data.hasRelated };
      }
      return { ok: false };
    } catch {
      return { ok: false };
    }
  };

  const broadcastTyping = (threadId: string) => {
    if (!user) return;
    const now = Date.now();
    const last = typingDebounceRef.current[threadId] || 0;
    if (now - last < 2000) return; // Debounce typing pings
    typingDebounceRef.current[threadId] = now;

    fetch("/api/community/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId }),
    }).catch(() => {});
  };

  const markNotificationAsRead = async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    try {
      await fetch("/api/community/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
    } catch {
      // quiet
    }
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <CommunityContext.Provider
      value={{
        posts,
        loading,
        onlineCount,
        activeThinkers,
        currentCategory,
        setCurrentCategory,
        searchQuery,
        setSearchQuery,
        thinkingPoints,
        notifications,
        unreadNotificationsCount,
        isRealtimeConnected,
        activeTypers,
        createPost,
        deletePost,
        toggleReaction,
        relateToMistake,
        broadcastTyping,
        markNotificationAsRead,
        refreshPosts: fetchPosts,
        refreshPresence: fetchPresence,
      }}
    >
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity() {
  const context = useContext(CommunityContext);
  if (!context) {
    throw new Error("useCommunity must be used within a CommunityProvider");
  }
  return context;
}
