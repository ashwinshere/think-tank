"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import {
  Users,
  Lock,
  Sparkles,
  MessageSquare,
  Swords,
  Flame,
  ShieldCheck,
  LogIn,
  ArrowRight,
} from "lucide-react";

interface CommunityAuthGuardProps {
  children: React.ReactNode;
}

export function CommunityAuthGuard({ children }: CommunityAuthGuardProps) {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  // While checking auth status
  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-subink font-medium">Checking authentication status...</p>
      </div>
    );
  }

  // If user is authenticated, render community content
  if (user) {
    return <>{children}</>;
  }

  // If user is NOT signed in, render the Sign-In gate prompt
  const handleOpenAuth = (mode: "login" | "register" = "login") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6">
      <div className="border border-line rounded-3xl bg-surface p-6 sm:p-10 shadow-soft text-center space-y-8 animate-fadeUp">
        {/* Header Badge & Title */}
        <div className="space-y-3 max-w-lg mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-light text-accent-dark shadow-xs border border-accent/20">
            <Lock size={28} />
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-ink tracking-tight">
            Sign In to Join the ThinkTank Community
          </h2>
          <p className="text-xs sm:text-sm text-subink leading-relaxed">
            The ThinkTank Community is an exclusive space for signed-in members to discuss doubts,
            collaborate in study circles, and share learning insights together.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => handleOpenAuth("login")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-accent text-white hover:bg-accent-dark font-semibold text-xs sm:text-sm shadow-md transition transform active:scale-98"
          >
            <LogIn size={16} />
            <span>Sign In to Access Community</span>
          </button>

          <button
            onClick={() => handleOpenAuth("register")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-line bg-paper hover:bg-white text-ink font-semibold text-xs sm:text-sm transition"
          >
            <span>Create New Account</span>
            <ArrowRight size={14} className="text-subink" />
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-6 border-t border-line">
          <div className="p-4 rounded-2xl border border-line/70 bg-paper/40 space-y-2">
            <div className="flex items-center gap-2 text-accent-dark font-semibold text-xs sm:text-sm">
              <div className="p-1.5 rounded-lg bg-accent-light">
                <MessageSquare size={16} />
              </div>
              <span>Peer Doubt Solving</span>
            </div>
            <p className="text-xs text-subink leading-relaxed">
              Post questions, share code reasoning, and work with peers using step-by-step thinking guidance.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-line/70 bg-paper/40 space-y-2">
            <div className="flex items-center gap-2 text-accent-dark font-semibold text-xs sm:text-sm">
              <div className="p-1.5 rounded-lg bg-accent-light">
                <Users size={16} />
              </div>
              <span>Active Study Circles</span>
            </div>
            <p className="text-xs text-subink leading-relaxed">
              Join live rooms dedicated to DSA, Web Development, C/C++, and AI logic.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-line/70 bg-paper/40 space-y-2">
            <div className="flex items-center gap-2 text-accent-dark font-semibold text-xs sm:text-sm">
              <div className="p-1.5 rounded-lg bg-accent-light">
                <Swords size={16} />
              </div>
              <span>Mistake Museum</span>
            </div>
            <p className="text-xs text-subink leading-relaxed">
              Record logic oversights and learn from other students&apos; real mistakes so you never repeat them.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-line/70 bg-paper/40 space-y-2">
            <div className="flex items-center gap-2 text-accent-dark font-semibold text-xs sm:text-sm">
              <div className="p-1.5 rounded-lg bg-accent-light">
                <Flame size={16} />
              </div>
              <span>Earn Thinking Points</span>
            </div>
            <p className="text-xs text-subink leading-relaxed">
              Get recognized and rewarded for explaining concepts, admitting mistakes, and deep reasoning.
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-subink pt-2">
          <ShieldCheck size={14} className="text-accent" />
          <span>Signing in is fast and free. Your profile and chats will be saved automatically.</span>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />
    </div>
  );
}
