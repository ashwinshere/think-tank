"use client";

import { useEffect, useState } from "react";
import { X, Sparkles, Trash2, ShieldCheck, ToggleLeft, ToggleRight, Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

interface Memory {
  id: string;
  content: string;
  category: string;
  importance: number;
  createdAt: string;
}

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MemoryModal({ isOpen, onClose }: MemoryModalProps) {
  const { user, profile, updateProfile, getIdToken } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("education");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadMemories();
    }
  }, [isOpen, user]);

  async function loadMemories() {
    setLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/memories", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories || []);
      }
    } catch (err) {
      console.error("Failed to load memories:", err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteMemory(id: string) {
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/memories/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setMemories((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete memory:", err);
    }
  }

  async function clearAllMemories() {
    if (!confirm("Are you sure you want to clear all your saved memories?")) return;
    try {
      const token = await getIdToken();
      const res = await fetch("/api/memories", {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setMemories([]);
      }
    } catch (err) {
      console.error("Failed to clear memories:", err);
    }
  }

  async function handleAddMemory(e: React.FormEvent) {
    e.preventDefault();
    if (!newContent.trim()) return;

    setIsAdding(true);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          content: newContent.trim(),
          category: newCategory,
          importance: 0.8,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMemories((prev) => [data.memory, ...prev]);
        setNewContent("");
      }
    } catch (err) {
      console.error("Failed to add memory:", err);
    } finally {
      setIsAdding(false);
    }
  }

  async function togglePersonalization() {
    const nextState = !(profile?.personalizationEnabled ?? true);
    await updateProfile({ personalizationEnabled: nextState });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeUp">
      <div className="relative w-full max-w-lg rounded-2xl bg-surface border border-line shadow-2xl p-6 flex flex-col max-h-[85vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-subink hover:text-ink hover:bg-paper transition"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent-light text-accent-dark flex items-center justify-center">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg text-ink">Personalization &amp; Memory</h2>
            <p className="text-xs text-subink">What ThinkTank AI has learned about you across sessions</p>
          </div>
        </div>

        {/* Toggle Personalization */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-paper border border-line mb-4">
          <div>
            <p className="text-xs font-semibold text-ink">Active Personalization</p>
            <p className="text-[11px] text-subink">
              Allow Gemini peers to tailor examples to your learning goals &amp; background
            </p>
          </div>
          <button
            onClick={togglePersonalization}
            className="text-accent-dark hover:opacity-80 transition"
            title="Toggle personalization"
          >
            {profile?.personalizationEnabled ?? true ? (
              <ToggleRight size={28} className="text-accent" />
            ) : (
              <ToggleLeft size={28} className="text-subink" />
            )}
          </button>
        </div>

        {/* Add manual memory */}
        <form onSubmit={handleAddMemory} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Add a fact (e.g. Preparing for GATE 2027, Prefer C++)..."
            className="flex-1 rounded-xl border border-line px-3 py-2 text-xs bg-paper focus:bg-white focus:border-accent outline-none"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="rounded-xl border border-line px-2 py-2 text-xs bg-paper text-ink outline-none"
          >
            <option value="education">Education</option>
            <option value="project">Project</option>
            <option value="goal">Goal</option>
            <option value="preference">Preference</option>
            <option value="knowledge">Knowledge</option>
          </select>
          <button
            type="submit"
            disabled={isAdding || !newContent.trim()}
            className="px-3 py-2 rounded-xl bg-accent text-white text-xs font-medium hover:bg-accent-dark transition disabled:opacity-40 flex items-center gap-1"
          >
            <Plus size={14} /> Add
          </button>
        </form>

        {/* Memory list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[150px]">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-subink text-xs gap-2">
              <Loader2 size={16} className="animate-spin" /> Loading memories...
            </div>
          ) : memories.length === 0 ? (
            <div className="text-center py-8 px-4 text-subink text-xs bg-paper/50 rounded-xl border border-line/60">
              <p className="font-medium text-ink mb-1">No memories saved yet</p>
              <p className="text-[11px] leading-relaxed">
                As you chat and mention your field of study, ongoing projects, or goals, ThinkTank will automatically remember them here.
              </p>
            </div>
          ) : (
            memories.map((m) => (
              <div
                key={m.id}
                className="group flex items-start justify-between p-3 rounded-xl bg-paper/80 border border-line hover:border-accent/40 transition gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-accent-light text-accent-dark">
                      {m.category}
                    </span>
                    <span className="text-[10px] text-subink">
                      Importance: {Math.round(m.importance * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-ink font-medium leading-snug">{m.content}</p>
                </div>
                <button
                  onClick={() => deleteMemory(m.id)}
                  className="p-1 rounded-lg text-subink hover:text-peer-critic hover:bg-peer-criticBg transition opacity-60 group-hover:opacity-100 shrink-0"
                  title="Delete memory"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs text-subink">
          <div className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck size={14} className="text-accent-dark" />
            <span>Private &amp; isolated to your account</span>
          </div>
          {memories.length > 0 && (
            <button
              onClick={clearAllMemories}
              className="text-peer-critic hover:underline text-[11px] font-medium"
            >
              Clear all memories
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
