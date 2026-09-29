"use client";

import { useState } from "react";
import {
  BrainCircuit,
  Home,
  MessagesSquare,
  Swords,
  Archive,
  GraduationCap,
  Target,
  Sparkles,
  LineChart,
  Code2,
  KeyRound,
  User as UserIcon,
  LogOut,
  Plus,
  Trash2,
  ChevronDown,
  MessageSquare,
  Users,
} from "lucide-react";
import { ApiKeyModal } from "./ApiKeyModal";
import { AuthModal } from "./AuthModal";
import { MemoryModal } from "./MemoryModal";
import { getStoredApiKey } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useConversations } from "@/lib/ConversationContext";
import { useCommunity } from "@/lib/CommunityContext";
import { useCodeSessions } from "@/lib/CodeSessionContext";

export type Section =
  | "session"
  | "code"
  | "community"
  | "team"
  | "debate"
  | "museum"
  | "teach"
  | "noai"
  | "explain"
  | "growth";

const NAV: { id: Section; label: string; icon: any }[] = [
  { id: "session", label: "Learning Session", icon: MessagesSquare },
  { id: "code", label: "Code Learning", icon: Code2 },
  { id: "community", label: "Community", icon: Users },
  { id: "team", label: "AI Peer Team", icon: BrainCircuit },
  { id: "debate", label: "AI Debate", icon: Swords },
  { id: "museum", label: "Mistake Museum", icon: Archive },
  { id: "teach", label: "Teach the AI", icon: GraduationCap },
  { id: "noai", label: "Think on Your Own", icon: Target },
  { id: "explain", label: "Explain It My Way", icon: Sparkles },
  { id: "growth", label: "My Growth", icon: LineChart },
];

export function Sidebar({
  active,
  onChange,
}: {
  active: Section;
  onChange: (s: Section) => void;
}) {
  const [openSettings, setOpenSettings] = useState(false);
  const [openAuth, setOpenAuth] = useState(false);
  const [openMemory, setOpenMemory] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [showCodeHistory, setShowCodeHistory] = useState(true);

  const { user, logout } = useAuth();
  const { onlineCount } = useCommunity();
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    deleteConversation,
  } = useConversations();

  const {
    codeSessions,
    activeCodeSessionId,
    setActiveCodeSessionId,
    deleteCodeSession,
    startNewCodeSession,
  } = useCodeSessions();

  const hasKey = Boolean(getStoredApiKey());

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-line bg-surface/60 h-screen sticky top-0 py-6 px-4 overflow-y-auto">
        {/* Brand */}
        <div className="flex items-center justify-between px-2 mb-6 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl2 bg-accent flex items-center justify-center">
              <Home className="w-4.5 h-4.5 text-white" size={18} />
            </div>
            <div>
              <p className="font-display font-semibold text-[15px] leading-tight">ThinkTank AI</p>
              <p className="text-[11px] text-subink leading-tight">Learn by thinking</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 shrink-0">
          {NAV.map(({ id, label, icon: Icon }) => (
            <div key={id}>
              <button
                onClick={() => onChange(id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${active === id
                    ? "bg-accent-light text-accent-dark font-semibold"
                    : "text-subink hover:bg-paper hover:text-ink"
                  }`}
              >
                <span className="flex items-center gap-3">
                  <Icon size={17} strokeWidth={2} />
                  {label}
                </span>

                {id === "community" && (
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-accent-dark font-bold px-2 py-0.5 rounded-full bg-accent-light border border-accent/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    {onlineCount}
                  </span>
                )}

                {id === "session" && user && conversations.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHistory(!showHistory);
                    }}
                    className="p-1 hover:text-ink text-subink/80 transition"
                    title="Toggle conversations"
                  >
                    <ChevronDown
                      size={14}
                      className={`transform transition-transform ${showHistory ? "rotate-180" : ""}`}
                    />
                  </button>
                )}

                {id === "code" && user && codeSessions.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCodeHistory(!showCodeHistory);
                    }}
                    className="p-1 hover:text-ink text-subink/80 transition"
                    title="Toggle code history"
                  >
                    <ChevronDown
                      size={14}
                      className={`transform transition-transform ${showCodeHistory ? "rotate-180" : ""}`}
                    />
                  </button>
                )}
              </button>

              {/* Nested conversation list for Learning Session */}
              {id === "session" && user && showHistory && conversations.length > 0 && (
                <div className="my-1.5 ml-4 pl-3 border-l border-line/80 space-y-1">
                  <div className="flex items-center justify-between py-1 pr-1">
                    <span className="text-[10px] uppercase font-bold text-subink tracking-wider">
                      Recent Chats
                    </span>
                    <button
                      onClick={() => {
                        setActiveConversationId(null);
                        onChange("session");
                      }}
                      className="inline-flex items-center gap-1 text-[10px] text-accent-dark font-semibold hover:underline"
                    >
                      <Plus size={11} /> New
                    </button>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-0.5 pr-1">
                    {conversations.slice(0, 10).map((conv) => (
                      <div
                        key={conv.id}
                        className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition cursor-pointer ${activeConversationId === conv.id
                            ? "bg-paper text-accent-dark font-medium border border-line"
                            : "text-subink hover:bg-paper hover:text-ink"
                          }`}
                        onClick={() => {
                          setActiveConversationId(conv.id);
                          onChange("session");
                        }}
                      >
                        <span className="truncate flex items-center gap-1.5">
                          <MessageSquare size={12} className="shrink-0 opacity-60" />
                          <span className="truncate">{conv.title || "Untitled Chat"}</span>
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-subink hover:text-peer-critic transition shrink-0"
                          title="Delete chat"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nested code session list for Code Learning */}
              {id === "code" && user && showCodeHistory && codeSessions.length > 0 && (
                <div className="my-1.5 ml-4 pl-3 border-l border-line/80 space-y-1">
                  <div className="flex items-center justify-between py-1 pr-1">
                    <span className="text-[10px] uppercase font-bold text-subink tracking-wider">
                      Code History
                    </span>
                    <button
                      onClick={() => {
                        startNewCodeSession();
                        onChange("code");
                      }}
                      className="inline-flex items-center gap-1 text-[10px] text-accent-dark font-semibold hover:underline"
                    >
                      <Plus size={11} /> New Code
                    </button>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-0.5 pr-1">
                    {codeSessions.slice(0, 10).map((sess) => (
                      <div
                        key={sess.id}
                        className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition cursor-pointer ${activeCodeSessionId === sess.id
                            ? "bg-paper text-accent-dark font-medium border border-line"
                            : "text-subink hover:bg-paper hover:text-ink"
                          }`}
                        onClick={() => {
                          setActiveCodeSessionId(sess.id);
                          onChange("code");
                        }}
                      >
                        <span className="truncate flex items-center gap-1.5">
                          <span className="text-[9px] font-bold px-1 rounded bg-accent-light text-accent-dark shrink-0">
                            {sess.language.slice(0, 3)}
                          </span>
                          <span className="truncate">{sess.title || "Untitled Code"}</span>
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCodeSession(sess.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-subink hover:text-peer-critic transition shrink-0"
                          title="Delete session"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer controls */}
        <div className="mt-auto pt-4 space-y-2 shrink-0">
          {/* User Account / Auth Widget */}
          {user ? (
            <div className="p-2.5 rounded-xl border border-line bg-paper/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-accent text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink truncate">{user.name}</p>
                    <p className="text-[10px] text-subink truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-1 text-subink hover:text-peer-critic transition shrink-0"
                  title="Log out"
                >
                  <LogOut size={14} />
                </button>
              </div>

              <button
                onClick={() => setOpenMemory(true)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg bg-accent-light text-accent-dark text-[11px] font-medium hover:brightness-95 transition"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles size={12} />
                  Memory &amp; Personalization
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-white text-accent-dark">
                  Active
                </span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setOpenAuth(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-accent text-white hover:bg-accent-dark text-xs font-semibold shadow-sm transition"
            >
              <UserIcon size={14} />
              Sign In to Save Chats
            </button>
          )}

          {/* AI Model Setting Button */}

        </div>
      </aside>

      <ApiKeyModal isOpen={openSettings} onClose={() => setOpenSettings(false)} />
      <AuthModal isOpen={openAuth} onClose={() => setOpenAuth(false)} />
      <MemoryModal isOpen={openMemory} onClose={() => setOpenMemory(false)} />
    </>
  );
}

export function MobileNav({
  active,
  onChange,
}: {
  active: Section;
  onChange: (s: Section) => void;
}) {
  const [openSettings, setOpenSettings] = useState(false);
  const [openAuth, setOpenAuth] = useState(false);
  const [openMemory, setOpenMemory] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <nav className="md:hidden sticky top-0 z-20 bg-surface/90 backdrop-blur border-b border-line overflow-x-auto">
        <div className="flex gap-1 px-3 py-2 min-w-max items-center justify-between">
          <div className="flex gap-1 items-center">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onChange(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap ${active === id ? "bg-accent-light text-accent-dark font-semibold" : "text-subink"
                  }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 pl-2">
            {user ? (
              <button
                onClick={() => setOpenMemory(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs border border-line bg-accent-light text-accent-dark font-medium"
                title="Memories"
              >
                <Sparkles size={12} />
              </button>
            ) : (
              <button
                onClick={() => setOpenAuth(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs bg-accent text-white font-medium"
              >
                <UserIcon size={12} />
              </button>
            )}

            <button
              onClick={() => setOpenSettings(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs border border-line bg-paper text-accent-dark font-medium"
              title="Configure Gemini API Key"
            >
              <KeyRound size={12} />
            </button>
          </div>
        </div>
      </nav>

      <ApiKeyModal isOpen={openSettings} onClose={() => setOpenSettings(false)} />
      <AuthModal isOpen={openAuth} onClose={() => setOpenAuth(false)} />
      <MemoryModal isOpen={openMemory} onClose={() => setOpenMemory(false)} />
    </>
  );
}
