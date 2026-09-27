"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useCommunity } from "@/lib/CommunityContext";
import { StudyCircle, CommunityPost } from "@/lib/types";
import { PostCard } from "./PostCard";
import { CreatePostModal } from "./CreatePostModal";
import {
  Users,
  Plus,
  ArrowLeft,
  Swords,
  BookOpen,
  MessageSquare,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { AuthModal } from "@/components/AuthModal";

export function StudyCirclesView({
  initialCircleId,
}: {
  initialCircleId?: string;
}) {
  const { user } = useAuth();
  const { posts } = useCommunity();

  const [circles, setCircles] = useState<StudyCircle[]>([]);
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(
    initialCircleId || null
  );
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [showCreateCircleModal, setShowCreateCircleModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // New circle form state
  const [newCircleName, setNewCircleName] = useState("");
  const [newCircleDesc, setNewCircleDesc] = useState("");
  const [newCircleCat, setNewCircleCat] = useState("DSA");

  const fetchCircles = async () => {
    try {
      const res = await fetch("/api/community/circles");
      if (res.ok) {
        const data = await res.json();
        setCircles(data.circles || []);
        if (!selectedCircleId && data.circles?.length > 0) {
          setSelectedCircleId(data.circles[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load circles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCircles();
  }, []);

  const selectedCircle = circles.find((c) => c.id === selectedCircleId) || circles[0];
  const isMember = Boolean(user && selectedCircle?.memberIds?.includes(user.id));

  // Circle-filtered discussions
  const circlePosts = posts.filter(
    (p) =>
      p.circleId === selectedCircle?.id ||
      p.subject === selectedCircle?.category
  );

  const handleJoinCircle = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!selectedCircle) return;

    setJoining(true);
    try {
      const res = await fetch("/api/community/circles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", circleId: selectedCircle.id }),
      });
      if (res.ok) {
        fetchCircles();
      }
    } catch (err) {
      console.error("Failed to join circle:", err);
    } finally {
      setJoining(false);
    }
  };

  const handleCreateCircle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!newCircleName.trim()) return;

    try {
      const res = await fetch("/api/community/circles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCircleName,
          description: newCircleDesc,
          category: newCircleCat,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setShowCreateCircleModal(false);
        setNewCircleName("");
        setNewCircleDesc("");
        await fetchCircles();
        setSelectedCircleId(data.circle.id);
      }
    } catch (err) {
      console.error("Failed to create circle:", err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Navigation & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/community"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-subink hover:text-ink transition group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Community</span>
        </Link>

        <button
          onClick={() => {
            if (!user) {
              setShowAuthModal(true);
              return;
            }
            setShowCreateCircleModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white hover:bg-accent-dark text-xs font-semibold shadow-sm transition"
        >
          <Plus size={14} />
          <span>Create Circle</span>
        </button>
      </div>

      {/* Circle Selection Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {circles.map((c) => {
          const isSelected = selectedCircle?.id === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCircleId(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                isSelected
                  ? "bg-accent-light border-accent text-accent-dark shadow-xs"
                  : "bg-surface border-line text-subink hover:bg-paper hover:text-ink"
              }`}
            >
              <span>{c.name}</span>
              <span className="ml-1.5 opacity-70 text-[10px]">({c.memberCount})</span>
            </button>
          );
        })}
      </div>

      {selectedCircle && (
        <div className="space-y-6">
          {/* Active Circle Banner */}
          <div className="p-6 sm:p-8 rounded-2xl border border-line bg-surface shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold text-accent px-2 py-0.5 rounded-full bg-accent-light">
                    {selectedCircle.category}
                  </span>
                  <span className="text-xs text-subink">
                    {selectedCircle.memberCount} members
                  </span>
                </div>
                <h1 className="font-display font-bold text-2xl text-ink">
                  {selectedCircle.name}
                </h1>
                <p className="text-xs sm:text-sm text-subink mt-1 max-w-xl leading-relaxed">
                  {selectedCircle.description}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isMember ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                    <CheckCircle size={14} /> Joined Member
                  </span>
                ) : (
                  <button
                    onClick={handleJoinCircle}
                    disabled={joining}
                    className="px-4 py-2 rounded-xl bg-accent text-white hover:bg-accent-dark text-xs font-semibold transition"
                  >
                    {joining ? "Joining..." : "Join Circle"}
                  </button>
                )}

                <button
                  onClick={() => {
                    if (!user) {
                      setShowAuthModal(true);
                      return;
                    }
                    setShowCreatePostModal(true);
                  }}
                  className="px-4 py-2 rounded-xl border border-line bg-paper hover:bg-white text-xs font-semibold text-ink transition"
                >
                  Ask in Circle
                </button>
              </div>
            </div>
          </div>

          {/* Grid: Challenges & Resources */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Challenges */}
            <div className="p-5 rounded-2xl border border-line bg-surface space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                <Swords size={14} className="text-accent" />
                Active Challenges
              </h3>

              <div className="space-y-2">
                {selectedCircle.challenges?.length > 0 ? (
                  selectedCircle.challenges.map((ch) => (
                    <div
                      key={ch.id}
                      className="p-3 rounded-xl border border-line bg-paper/50 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-semibold text-ink">{ch.title}</p>
                        <span className="text-[10px] text-subink font-medium">
                          Difficulty: {ch.difficulty}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-accent-dark bg-white px-2 py-0.5 rounded-full border border-line">
                        +{ch.points} TP
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-subink italic py-2">
                    No open challenges currently. Propose one in discussions!
                  </p>
                )}
              </div>
            </div>

            {/* Resources */}
            <div className="p-5 rounded-2xl border border-line bg-surface space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                <BookOpen size={14} className="text-accent" />
                Handpicked Resources
              </h3>

              <div className="space-y-2">
                {selectedCircle.resources?.length > 0 ? (
                  selectedCircle.resources.map((res) => (
                    <div
                      key={res.id}
                      className="p-3 rounded-xl border border-line bg-paper/50 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-semibold text-ink">{res.title}</p>
                        <span className="text-[10px] text-subink font-medium">{res.type}</span>
                      </div>
                      <a
                        href={res.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-subink hover:text-ink p-1"
                      >
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-subink italic py-2">
                    Curated resources will appear here as members recommend them.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Circle Discussions Feed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-display font-semibold text-base text-ink flex items-center gap-2">
                <MessageSquare size={16} className="text-accent" />
                Circle Thoughts ({circlePosts.length})
              </h3>
            </div>

            <div className="border border-line rounded-2xl bg-surface divide-y divide-line overflow-hidden shadow-xs">
              {circlePosts.length === 0 ? (
                <div className="p-10 text-center text-subink space-y-2">
                  <p className="font-display font-medium text-ink text-sm">Quiet in this circle</p>
                  <p className="text-xs">
                    Start the first discussion for members of {selectedCircle.name}.
                  </p>
                </div>
              ) : (
                circlePosts.map((p) => <PostCard key={p.id} post={p} />)
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Circle Modal */}
      {showCreateCircleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-sm animate-fadeUp">
          <div className="bg-surface border border-line w-full max-w-md rounded-2xl shadow-card p-6 space-y-4">
            <h3 className="font-display font-semibold text-lg text-ink">
              Create a Study Circle
            </h3>
            <form onSubmit={handleCreateCircle} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Circle Name
                </label>
                <input
                  type="text"
                  value={newCircleName}
                  onChange={(e) => setNewCircleName(e.target.value)}
                  placeholder="e.g. Distributed Systems Lab"
                  className="w-full px-3.5 py-2 rounded-xl border border-line bg-paper/40 focus:bg-white text-xs text-ink focus:outline-none focus:border-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Category</label>
                <select
                  value={newCircleCat}
                  onChange={(e) => setNewCircleCat(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-line bg-paper text-xs text-ink focus:outline-none focus:border-accent"
                >
                  <option value="DSA">DSA</option>
                  <option value="AI">AI / ML</option>
                  <option value="Web">Web Systems</option>
                  <option value="Python">Python</option>
                  <option value="C">C / Systems</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Mission &amp; Focus
                </label>
                <textarea
                  rows={3}
                  value={newCircleDesc}
                  onChange={(e) => setNewCircleDesc(e.target.value)}
                  placeholder="What will members explore, challenge, and build together?"
                  className="w-full px-3.5 py-2 rounded-xl border border-line bg-paper/40 focus:bg-white text-xs text-ink focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateCircleModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-subink hover:bg-paper"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-dark"
                >
                  Launch Circle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedCircle && (
        <CreatePostModal
          isOpen={showCreatePostModal}
          onClose={() => setShowCreatePostModal(false)}
          initialType="doubt"
        />
      )}

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
