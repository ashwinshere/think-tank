import { adminDb } from "./firebase-admin";
import {
  CommunityPost,
  CommunityComment,
  StudyCircle,
  ThinkingAttempt,
  NotificationItem,
  PostType,
  ReactionType,
  SubjectType,
  OnlineThinker,
} from "./types";

// ==========================================
// In-Memory Real-time SSE Event Bus
// ==========================================
export type CommunityEventType =
  | "POST_CREATED"
  | "POST_UPDATED"
  | "POST_DELETED"
  | "COMMENT_CREATED"
  | "COMMENT_DELETED"
  | "REACTION_CHANGED"
  | "PRESENCE_CHANGED"
  | "TYPING_STATUS"
  | "THINKING_ATTEMPT";

export interface CommunityEvent {
  type: CommunityEventType;
  payload: any;
  timestamp: number;
}

type EventListener = (event: CommunityEvent) => void;

class CommunityEventBus {
  private listeners: Set<EventListener> = new Set();

  subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(type: CommunityEventType, payload: any) {
    const event: CommunityEvent = {
      type,
      payload,
      timestamp: Date.now(),
    };
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error("Error in community event listener:", err);
      }
    }
  }
}

// Global singleton across serverless invocations within the node process
const globalBus = (global as any).__thinktank_community_bus || new CommunityEventBus();
if (process.env.NODE_ENV !== "production") {
  (global as any).__thinktank_community_bus = globalBus;
}

export const communityEventBus = globalBus;

// ==========================================
// Typing State (In-Memory Fast Tracker)
// ==========================================
const typingState: Record<string, { userName: string; expiresAt: number }> = {};

export function registerTyping(threadId: string, userId: string, userName: string) {
  const key = `${threadId}:${userId}`;
  typingState[key] = {
    userName,
    expiresAt: Date.now() + 3500, // 3.5 seconds ttl
  };
  communityEventBus.emit("TYPING_STATUS", {
    threadId,
    userId,
    userName,
    isTyping: true,
  });
}

export function getActiveTypers(threadId: string, excludeUserId?: string): string[] {
  const now = Date.now();
  const typers: string[] = [];
  for (const [key, data] of Object.entries(typingState)) {
    if (data.expiresAt < now) {
      delete typingState[key];
      continue;
    }
    const [tId, uId] = key.split(":");
    if (tId === threadId && uId !== excludeUserId) {
      typers.push(data.userName);
    }
  }
  return typers;
}

// ==========================================
// Points Rules
// ==========================================
export const POINTS_AWARDS = {
  MEANINGFUL_DOUBT: 5,
  HELPFUL_EXPLANATION: 10,
  USEFUL_REPLY: 5,
  CHALLENGE_COMPLETED: 10,
  HELPFUL_CORRECTION: 8,
  TEACH_AI: 10,
  NO_AI_ROUND: 20,
  HELPING_STUDENT: 15,
  THINK_WITH_ME: 10,
} as const;

export async function awardThinkingPoints(
  userId: string,
  amount: number,
  reason: string,
  meta?: { postId?: string; postTitle?: string }
): Promise<number> {
  if (!userId || amount <= 0) return 0;
  try {
    const statsRef = adminDb.collection("user_stats").doc(userId);
    const snap = await statsRef.get();
    const current = snap.exists ? (snap.data()?.thinkingPoints || 0) : 0;
    const newPoints = current + amount;

    await statsRef.set(
      {
        thinkingPoints: newPoints,
        lastEarnedAt: new Date().toISOString(),
        lastEarnedReason: reason,
      },
      { merge: true }
    );

    // Create a notification for the student
    if (meta?.postId) {
      await createNotification({
        userId,
        actorId: "system",
        actorName: "ThinkTank",
        type: "points",
        postId: meta.postId,
        postTitle: meta.postTitle || "Community Activity",
        content: `You earned +${amount} Thinking Points for ${reason}!`,
      });
    }

    return newPoints;
  } catch (err) {
    console.error("Failed to award points:", err);
    return 0;
  }
}

export async function getUserThinkingPoints(userId: string): Promise<number> {
  if (!userId) return 0;
  try {
    const snap = await adminDb.collection("user_stats").doc(userId).get();
    return snap.exists ? snap.data()?.thinkingPoints || 0 : 0;
  } catch {
    return 0;
  }
}

// ==========================================
// Notifications
// ==========================================
export async function createNotification(
  data: Omit<NotificationItem, "id" | "read" | "createdAt">
): Promise<void> {
  if (!data.userId || data.userId === data.actorId) return; // Don't notify oneself
  try {
    const docRef = adminDb.collection("notifications").doc();
    const item: NotificationItem = {
      id: docRef.id,
      ...data,
      read: false,
      createdAt: new Date().toISOString(),
    };
    await docRef.set(item);
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}

export async function getUserNotifications(
  userId: string,
  limit: number = 20
): Promise<NotificationItem[]> {
  if (!userId) return [];
  try {
    const snap = await adminDb
      .collection("notifications")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as NotificationItem));
  } catch (err) {
    console.error("Failed to get notifications:", err);
    return [];
  }
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  try {
    await adminDb.collection("notifications").doc(notificationId).update({ read: true });
  } catch (err) {
    console.error("Failed to mark notification read:", err);
  }
}

// ==========================================
// Seed Starter Community Data
// ==========================================
export async function ensureStarterPosts(): Promise<void> {
  try {
    const snap = await adminDb.collection("community_posts").limit(1).get();
    if (!snap.empty) return; // Already seeded

    const starterPosts: Array<Omit<CommunityPost, "id">> = [
      {
        title: "Guys recursion puriyala 😭 someone explain?",
        content:
          "Bro indha recursion concept puriyave illa. Base condition reach aana appram return value epdi previous call ku pogudhu? Call stack visual model yaaravathu simple ah sollunga da.",
        type: "doubt",
        subject: "DSA",
        authorId: "student_bhavana",
        authorName: "Bhavana",
        authorEmail: "bhavana@thinktank.edu",
        createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        reactions: { helpful: 8, good_reasoning: 4, needs_evidence: 0, same_doubt: 12 },
        replyCount: 3,
        thinkingCount: 7,
        views: 48,
      },
      {
        title: "Why does BFS always guarantee the shortest path in unweighted graphs?",
        content:
          "I know BFS visits nodes level by level using a FIFO queue. But why can we be mathematically certain that when we first encounter the target node, no shorter path exists? What property of queue guarantees this?",
        type: "doubt",
        subject: "DSA",
        authorId: "student_kavitha",
        authorName: "Kavitha",
        authorEmail: "kavitha@thinktank.edu",
        createdAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
        reactions: { helpful: 14, good_reasoning: 9, needs_evidence: 1, same_doubt: 6 },
        replyCount: 4,
        thinkingCount: 12,
        views: 84,
      },
      {
        title: "⚔️ Challenge: Reverse a singly linked list with only 2 pointers instead of 3",
        content:
          "Standard solution uses `prev`, `curr`, and `next`. Can you solve it in O(n) time and O(1) space using only 2 pointers by cleverly mutating node connections? Share your reasoning before posting code!",
        type: "challenge",
        subject: "DSA",
        authorId: "student_arun",
        authorName: "Arun Kumar",
        authorEmail: "arun@thinktank.edu",
        createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        reactions: { helpful: 11, good_reasoning: 7, needs_evidence: 2, same_doubt: 2 },
        replyCount: 5,
        thinkingCount: 15,
        views: 112,
      },
      {
        title: "💡 Intuition: How the Call Stack actually unwinds in Depth-First Search",
        content:
          "After struggling with tree traversals for weeks, here is the mental model that clicked: Think of the call stack as bookmarks in a choose-your-own-adventure book. Each branch point holds your spot until you hit a dead end (null node), then snaps right back to the nearest junction.",
        type: "explain",
        subject: "DSA",
        authorId: "student_karthik",
        authorName: "Karthik R",
        authorEmail: "karthik@thinktank.edu",
        createdAt: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
        reactions: { helpful: 22, good_reasoning: 16, needs_evidence: 0, same_doubt: 1 },
        replyCount: 2,
        thinkingCount: 4,
        views: 140,
      },
      {
        title: "I used `i <= n` in binary search and spent 3 hours debugging undefined",
        content:
          "Off-by-one errors are humble teachers. In a 0-indexed array with length n, `arr[n]` triggers an out-of-bounds error or garbage value. Always keep your search interval invariant crystal clear: `[left, right]` vs `[left, right)`.",
        type: "mistake",
        subject: "DSA",
        authorId: "student_divya",
        authorName: "Divya M",
        authorEmail: "divya@thinktank.edu",
        createdAt: new Date(Date.now() - 1000 * 60 * 460).toISOString(),
        reactions: { helpful: 19, good_reasoning: 12, needs_evidence: 0, same_doubt: 18 },
        replyCount: 3,
        thinkingCount: 5,
        views: 165,
        mistakeDetails: {
          whatWentWrong: "Used i <= n in array loop condition causing index out-of-bounds access.",
          whatILearned: "Strictly specify interval invariants before writing the while loop.",
          relateCount: 28,
        },
      },
      {
        title: "🚀 Built a minimal distributed rate-limiter with sliding-window log",
        content:
          "Tried implementing token-bucket first, but sliding-window log handles bursty traffic better across clusters without race conditions. Would love feedback on memory optimization for high throughput Redis keys!",
        type: "project",
        subject: "Web",
        authorId: "student_siddharth",
        authorName: "Siddharth V",
        authorEmail: "siddharth@thinktank.edu",
        createdAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
        reactions: { helpful: 15, good_reasoning: 11, needs_evidence: 3, same_doubt: 4 },
        replyCount: 2,
        thinkingCount: 6,
        views: 92,
      },
    ];

    for (const post of starterPosts) {
      const docRef = adminDb.collection("community_posts").doc();
      await docRef.set({ id: docRef.id, ...post });

      // Add 2 comments to the first post
      if (post.title.includes("recursion puriyala")) {
        const c1Ref = docRef.collection("comments").doc();
        await c1Ref.set({
          id: c1Ref.id,
          postId: docRef.id,
          parentId: null,
          authorId: "student_arun",
          authorName: "Arun Kumar",
          content:
            "First function call aagumpothu stack la frame push aagum bro. Base case reached na stack la irundhu pop aagi return value previous caller ku return pannum. Simple analogy: Plate stack maari, top plate dhaan first edupom.",
          createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
          reactions: { helpful: 5, good_reasoning: 3, needs_evidence: 0, same_doubt: 0 },
        });

        const c2Ref = docRef.collection("comments").doc();
        await c2Ref.set({
          id: c2Ref.id,
          postId: docRef.id,
          parentId: c1Ref.id,
          authorId: "student_meena",
          authorName: "Meena S",
          content:
            "Aama! Return statement execution start aana dhaan unwinding nadakkum. Adhuku munadi ellam pending calls wait pannitu irukkum.",
          createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
          reactions: { helpful: 4, good_reasoning: 2, needs_evidence: 0, same_doubt: 0 },
        });
      }
    }

    // Ensure Starter Study Circles
    const circleSnap = await adminDb.collection("study_circles").limit(1).get();
    if (circleSnap.empty) {
      const starterCircles: Array<Omit<StudyCircle, "id">> = [
        {
          name: "DSA Warriors",
          description: "Tackling graph theory, dynamic programming, and algorithm proofs together.",
          category: "DSA",
          memberCount: 42,
          memberIds: ["student_arun", "student_bhavana", "student_kavitha"],
          challenges: [
            { id: "c1", title: "Implement Trie with Wildcard Matching", difficulty: "Medium", points: 15 },
            { id: "c2", title: "Topological Sort Cycle Detection without Tarjan", difficulty: "Hard", points: 25 },
          ],
          resources: [
            { id: "r1", title: "Visualizing Dynamic Programming DAGs", link: "#", type: "Guide" },
            { id: "r2", title: "Graph Representation Benchmarks", link: "#", type: "Article" },
          ],
          createdAt: new Date().toISOString(),
          creatorId: "student_arun",
        },
        {
          name: "AI Explorers",
          description: "Understanding transformers, attention mechanisms, embeddings and agents.",
          category: "AI",
          memberCount: 38,
          memberIds: ["student_siddharth", "student_karthik"],
          challenges: [
            { id: "c3", title: "Write Multi-Head Attention in NumPy from scratch", difficulty: "Hard", points: 30 },
          ],
          resources: [
            { id: "r3", title: "Attention Is All You Need Paper Breakdown", link: "#", type: "Paper" },
          ],
          createdAt: new Date().toISOString(),
          creatorId: "student_siddharth",
        },
        {
          name: "Web Builders",
          description: "Full-stack architectures, real-time protocols, databases and systems design.",
          category: "Web",
          memberCount: 29,
          memberIds: ["student_divya"],
          challenges: [
            { id: "c4", title: "Build an SSE real-time notification engine", difficulty: "Medium", points: 20 },
          ],
          resources: [
            { id: "r4", title: "WebSockets vs SSE for Interactive Learning", link: "#", type: "Tech Spec" },
          ],
          createdAt: new Date().toISOString(),
          creatorId: "student_divya",
        },
        {
          name: "Python Beginners",
          description: "Idiomatic Python, memory management, generators and clean code patterns.",
          category: "Python",
          memberCount: 51,
          memberIds: ["student_bhavana"],
          challenges: [
            { id: "c5", title: "Write a custom iterable with `__iter__` and `__next__`", difficulty: "Easy", points: 10 },
          ],
          resources: [
            { id: "r5", title: "Python Under the Hood: bytecode to PyObject", link: "#", type: "Guide" },
          ],
          createdAt: new Date().toISOString(),
          creatorId: "student_bhavana",
        },
      ];

      for (const circle of starterCircles) {
        const cRef = adminDb.collection("study_circles").doc();
        await cRef.set({ id: cRef.id, ...circle });
      }
    }
  } catch (err) {
    console.error("Error seeding starter posts:", err);
  }
}

// ==========================================
// Posts CRUD
// ==========================================
export async function getCommunityPosts(params: {
  category?: string;
  search?: string;
  limit?: number;
  circleId?: string;
}): Promise<CommunityPost[]> {
  await ensureStarterPosts();

  const limit = Math.min(60, params.limit || 30);
  let query: FirebaseFirestore.Query = adminDb.collection("community_posts");

  if (params.circleId) {
    query = query.where("circleId", "==", params.circleId);
  }

  if (params.category && params.category !== "All" && params.category !== "all") {
    const catLower = params.category.toLowerCase().replace(/s$/, "");
    query = query.where("type", "==", catLower);
  }

  const snap = await query.orderBy("createdAt", "desc").limit(limit).get();
  let posts = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as CommunityPost));

  // Natural query search (Tanglish and English keywords)
  if (params.search && params.search.trim()) {
    const q = params.search.toLowerCase().trim();
    const qTokens = q.split(/\s+/).filter(Boolean);

    posts = posts.filter((p) => {
      const haystack = (
        p.title +
        " " +
        p.content +
        " " +
        (p.subject || "") +
        " " +
        p.type +
        " " +
        p.authorName
      ).toLowerCase();

      return qTokens.some((tok) => haystack.includes(tok));
    });
  }

  return posts;
}

export async function getCommunityPostById(postId: string): Promise<CommunityPost | null> {
  await ensureStarterPosts();
  try {
    const doc = await adminDb.collection("community_posts").doc(postId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as CommunityPost;
  } catch (err) {
    console.error("Error getting post by ID:", err);
    return null;
  }
}

export async function createCommunityPost(data: {
  title: string;
  content: string;
  type: PostType;
  subject?: SubjectType;
  authorId: string;
  authorName: string;
  authorEmail?: string;
  circleId?: string;
  isAnonymous?: boolean;
  mistakeDetails?: {
    whatWentWrong: string;
    whatILearned: string;
    relateCount: number;
  };
}): Promise<CommunityPost> {
  const docRef = adminDb.collection("community_posts").doc();
  const newPost: CommunityPost = {
    id: docRef.id,
    title: data.title.trim().slice(0, 200),
    content: data.content.trim().slice(0, 3000),
    type: data.type,
    subject: data.subject || "Other",
    authorId: data.authorId,
    authorName: data.isAnonymous ? "Anonymous Thinker" : data.authorName,
    authorEmail: data.authorEmail,
    createdAt: new Date().toISOString(),
    reactions: { helpful: 0, good_reasoning: 0, needs_evidence: 0, same_doubt: 0 },
    userReactions: {},
    replyCount: 0,
    thinkingCount: 1,
    views: 1,
    circleId: data.circleId || undefined,
    isAnonymous: Boolean(data.isAnonymous),
    mistakeDetails: data.mistakeDetails
      ? {
          whatWentWrong: data.mistakeDetails.whatWentWrong.trim(),
          whatILearned: data.mistakeDetails.whatILearned.trim(),
          relateCount: 1,
          relatedUserIds: [data.authorId],
        }
      : undefined,
  };

  await docRef.set(newPost);

  // Award points for starting a thought / doubt
  const points = data.type === "doubt" ? POINTS_AWARDS.MEANINGFUL_DOUBT : 8;
  await awardThinkingPoints(data.authorId, points, `Starting a ${data.type}`, {
    postId: newPost.id,
    postTitle: newPost.title,
  });

  // Broadcast real-time event
  communityEventBus.emit("POST_CREATED", newPost);

  return newPost;
}

export async function deleteCommunityPost(postId: string, userId: string): Promise<boolean> {
  const ref = adminDb.collection("community_posts").doc(postId);
  const snap = await ref.get();
  if (!snap.exists) return false;
  const post = snap.data() as CommunityPost;
  if (post.authorId !== userId) return false;

  await ref.delete();
  communityEventBus.emit("POST_DELETED", { postId });
  return true;
}

export async function updateCommunityPost(
  postId: string,
  userId: string,
  updates: Partial<Pick<CommunityPost, "title" | "content" | "subject" | "type">>
): Promise<CommunityPost | null> {
  const ref = adminDb.collection("community_posts").doc(postId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const post = snap.data() as CommunityPost;
  if (post.authorId !== userId) return null;

  const updatedData = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await ref.update(updatedData);
  const updatedPost = { ...post, ...updatedData };
  communityEventBus.emit("POST_UPDATED", updatedPost);
  return updatedPost;
}

// ==========================================
// Comments
// ==========================================
export async function getCommentsForPost(postId: string): Promise<CommunityComment[]> {
  try {
    const snap = await adminDb
      .collection("community_posts")
      .doc(postId)
      .collection("comments")
      .orderBy("createdAt", "asc")
      .get();

    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as CommunityComment));
  } catch (err) {
    console.error("Error getting comments:", err);
    return [];
  }
}

export async function addCommentToPost(data: {
  postId: string;
  parentId?: string | null;
  authorId: string;
  authorName: string;
  content: string;
  isAi?: boolean;
  aiPersona?: string;
}): Promise<CommunityComment> {
  const postRef = adminDb.collection("community_posts").doc(data.postId);
  const postSnap = await postRef.get();
  if (!postSnap.exists) throw new Error("Post not found");
  const post = postSnap.data() as CommunityPost;

  const commentRef = postRef.collection("comments").doc();
  const newComment: CommunityComment = {
    id: commentRef.id,
    postId: data.postId,
    parentId: data.parentId || null,
    authorId: data.authorId,
    authorName: data.authorName,
    content: data.content.trim().slice(0, 2000),
    isAi: Boolean(data.isAi),
    aiPersona: data.aiPersona || undefined,
    createdAt: new Date().toISOString(),
    reactions: { helpful: 0, good_reasoning: 0, needs_evidence: 0, same_doubt: 0 },
    userReactions: {},
  };

  await commentRef.set(newComment);

  // Increment replyCount
  await postRef.update({
    replyCount: (post.replyCount || 0) + 1,
    updatedAt: new Date().toISOString(),
  });

  // Award points if student
  if (!data.isAi) {
    await awardThinkingPoints(data.authorId, POINTS_AWARDS.USEFUL_REPLY, "Posting a helpful reply", {
      postId: data.postId,
      postTitle: post.title,
    });

    // Notify post author
    await createNotification({
      userId: post.authorId,
      actorId: data.authorId,
      actorName: data.authorName,
      type: "reply",
      postId: data.postId,
      postTitle: post.title,
      content: `${data.authorName} replied to your thought: "${data.content.slice(0, 70)}..."`,
    });
  }

  // Broadcast real-time event
  communityEventBus.emit("COMMENT_CREATED", newComment);

  return newComment;
}

// ==========================================
// Reactions (Posts & Comments)
// ==========================================
export async function togglePostReaction(
  postId: string,
  userId: string,
  userName: string,
  reaction: ReactionType
): Promise<{ reactions: Record<ReactionType, number>; userReaction: ReactionType | null }> {
  const postRef = adminDb.collection("community_posts").doc(postId);
  const snap = await postRef.get();
  if (!snap.exists) throw new Error("Post not found");

  const post = snap.data() as CommunityPost;
  const reactions = { ...(post.reactions || { helpful: 0, good_reasoning: 0, needs_evidence: 0, same_doubt: 0 }) };
  const userReactions = { ...(post.userReactions || {}) };

  const prevReaction = userReactions[userId];
  let finalReaction: ReactionType | null = null;

  if (prevReaction === reaction) {
    // Untoggle
    reactions[reaction] = Math.max(0, (reactions[reaction] || 1) - 1);
    delete userReactions[userId];
    finalReaction = null;
  } else {
    // If they previously had another reaction, remove it
    if (prevReaction && reactions[prevReaction]) {
      reactions[prevReaction] = Math.max(0, reactions[prevReaction] - 1);
    }
    reactions[reaction] = (reactions[reaction] || 0) + 1;
    userReactions[userId] = reaction;
    finalReaction = reaction;

    // Notify post author if different user
    if (post.authorId !== userId) {
      await createNotification({
        userId: post.authorId,
        actorId: userId,
        actorName: userName,
        type: "reaction",
        postId,
        postTitle: post.title,
        content: `${userName} reacted with ${reaction.replace("_", " ")} to your post`,
      });
      // Award points for helping another student
      await awardThinkingPoints(post.authorId, 2, "Receiving helpful community reactions");
    }
  }

  await postRef.update({ reactions, userReactions });

  communityEventBus.emit("REACTION_CHANGED", {
    target: "post",
    postId,
    reactions,
    userId,
    userReaction: finalReaction,
  });

  return { reactions, userReaction: finalReaction };
}

export async function toggleRelateToMistake(
  postId: string,
  userId: string
): Promise<{ relateCount: number; hasRelated: boolean }> {
  const postRef = adminDb.collection("community_posts").doc(postId);
  const snap = await postRef.get();
  if (!snap.exists) throw new Error("Post not found");

  const post = snap.data() as CommunityPost;
  const mistakeDetails = post.mistakeDetails || {
    whatWentWrong: "",
    whatILearned: "",
    relateCount: 0,
    relatedUserIds: [],
  };

  const relatedUsers = new Set(mistakeDetails.relatedUserIds || []);
  let hasRelated = false;

  if (relatedUsers.has(userId)) {
    relatedUsers.delete(userId);
    mistakeDetails.relateCount = Math.max(0, (mistakeDetails.relateCount || 1) - 1);
    hasRelated = false;
  } else {
    relatedUsers.add(userId);
    mistakeDetails.relateCount = (mistakeDetails.relateCount || 0) + 1;
    hasRelated = true;
  }

  mistakeDetails.relatedUserIds = Array.from(relatedUsers);
  await postRef.update({ mistakeDetails });

  communityEventBus.emit("POST_UPDATED", {
    ...post,
    mistakeDetails,
  });

  return { relateCount: mistakeDetails.relateCount, hasRelated };
}

// ==========================================
// Thinking Attempts ("Think With Me")
// ==========================================
export async function recordThinkingAttempt(data: {
  postId: string;
  userId: string;
  userName: string;
  userReasoning: string;
  aiFeedback: ThinkingAttempt["aiFeedback"];
}): Promise<ThinkingAttempt> {
  const postRef = adminDb.collection("community_posts").doc(data.postId);
  const postSnap = await postRef.get();
  const post = postSnap.data() as CommunityPost | undefined;

  const attemptRef = postRef.collection("thinking_attempts").doc();
  const points = POINTS_AWARDS.THINK_WITH_ME;

  const attempt: ThinkingAttempt = {
    id: attemptRef.id,
    postId: data.postId,
    userId: data.userId,
    userName: data.userName,
    userReasoning: data.userReasoning,
    aiFeedback: data.aiFeedback,
    createdAt: new Date().toISOString(),
    pointsAwarded: points,
  };

  await attemptRef.set(attempt);

  if (postSnap.exists && post) {
    await postRef.update({
      thinkingCount: (post.thinkingCount || 0) + 1,
    });
  }

  await awardThinkingPoints(data.userId, points, "Exercising reasoning in Think With Me", {
    postId: data.postId,
    postTitle: post?.title || "Community Thought",
  });

  communityEventBus.emit("THINKING_ATTEMPT", attempt);

  return attempt;
}

// ==========================================
// Online Presence
// ==========================================
export async function updateOnlinePresence(
  userId: string,
  userName: string,
  currentPostId?: string,
  isThinking?: boolean
): Promise<void> {
  if (!userId) return;
  try {
    const ref = adminDb.collection("presence").doc(userId);
    const data: OnlineThinker = {
      userId,
      userName: userName || "Student",
      lastActive: Date.now(),
      currentPostId: currentPostId || undefined,
      isThinking: Boolean(isThinking),
    };
    await ref.set(data, { merge: true });
    communityEventBus.emit("PRESENCE_CHANGED", { userId, userName, isOnline: true });
  } catch (err) {
    console.error("Failed to update presence:", err);
  }
}

export async function getOnlineThinkersCount(): Promise<number> {
  try {
    // 2 minutes threshold for real active sessions
    const cutoff = Date.now() - 1000 * 120;
    const snap = await adminDb.collection("presence").where("lastActive", ">=", cutoff).get();
    // Return actual real count, with minimum 1 if the current user is active
    return Math.max(snap.size, 1);
  } catch (err) {
    console.error("Failed to get online count:", err);
    return 1;
  }
}

export async function getActiveThinkersList(): Promise<OnlineThinker[]> {
  try {
    const cutoff = Date.now() - 1000 * 120;
    const snap = await adminDb
      .collection("presence")
      .where("lastActive", ">=", cutoff)
      .orderBy("lastActive", "desc")
      .limit(15)
      .get();
    return snap.docs.map((d) => d.data() as OnlineThinker);
  } catch (err) {
    console.error("Failed to get active thinkers:", err);
    return [];
  }
}

// ==========================================
// Study Circles
// ==========================================
export async function getStudyCircles(): Promise<StudyCircle[]> {
  await ensureStarterPosts();
  try {
    const snap = await adminDb.collection("study_circles").orderBy("createdAt", "desc").get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as StudyCircle));
  } catch (err) {
    console.error("Failed to get study circles:", err);
    return [];
  }
}

export async function getStudyCircleById(id: string): Promise<StudyCircle | null> {
  await ensureStarterPosts();
  try {
    const doc = await adminDb.collection("study_circles").doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as StudyCircle;
  } catch (err) {
    return null;
  }
}

export async function joinStudyCircle(circleId: string, userId: string): Promise<StudyCircle | null> {
  const ref = adminDb.collection("study_circles").doc(circleId);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const circle = snap.data() as StudyCircle;
  const members = new Set(circle.memberIds || []);
  if (!members.has(userId)) {
    members.add(userId);
    const updated = {
      memberIds: Array.from(members),
      memberCount: members.size,
    };
    await ref.update(updated);
    return { ...circle, ...updated };
  }
  return circle;
}

export async function createStudyCircle(data: {
  name: string;
  description: string;
  category: string;
  creatorId: string;
}): Promise<StudyCircle> {
  const ref = adminDb.collection("study_circles").doc();
  const circle: StudyCircle = {
    id: ref.id,
    name: data.name.trim().slice(0, 60),
    description: data.description.trim().slice(0, 300),
    category: data.category || "DSA",
    memberCount: 1,
    memberIds: [data.creatorId],
    challenges: [],
    resources: [],
    createdAt: new Date().toISOString(),
    creatorId: data.creatorId,
  };
  await ref.set(circle);
  return circle;
}
