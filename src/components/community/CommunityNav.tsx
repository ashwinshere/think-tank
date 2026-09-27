"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useCommunity } from "@/lib/CommunityContext";
import {
  Home,
  BrainCircuit,
  Users,
  LineChart,
  User,
  Bell,
  Sparkles,
  LogOut,
  Flame,
} from "lucide-react";
import { NotificationsModal } from "./NotificationsModal";
import { AuthModal } from "@/components/AuthModal";

export function CommunityNav({
  activeTab,
  onTabChange,
}: {
  activeTab?: "home" | "think" | "community" | "progress" | "profile";
  onTabChange?: (tab: "home" | "think" | "community" | "progress" | "profile") => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { onlineCount, thinkingPoints, unreadNotificationsCount, isRealtimeConnected } =
    useCommunity();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isCommunityRoute = pathname.startsWith("/community");

  const navItems = [
    { id: "home", label: "Home", href: "/", icon: Home },
    { id: "think", label: "Think", href: "/?tab=think", icon: BrainCircuit },
    { id: "community", label: "Community", href: "/community", icon: Users },
    { id: "progress", label: "Progress", href: "/?tab=growth", icon: LineChart },
    { id: "profile", label: "Profile", href: "/?tab=profile", icon: User },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand & Online Thinkers Activity Indicator */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-sm tracking-tight group-hover:bg-accent-dark transition">
                T
              </div>
              <div>
                <span className="font-display font-bold text-ink text-base tracking-tight block leading-none">
                  ThinkTank
                </span>
                <span className="text-[10px] text-subink font-medium tracking-wide uppercase">
                  AI Study Room
                </span>
              </div>
            </Link>

            {/* Real-time Thinkers Online Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-paper border border-line text-xs font-medium text-subink">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              <span>
                <strong className="text-ink font-semibold">{onlineCount}</strong> {onlineCount === 1 ? "thinker" : "thinkers"} online
              </span>
            </div>
          </div>

          {/* Simple Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                (item.id === "community" && isCommunityRoute) ||
                (activeTab === item.id && !isCommunityRoute);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={(e) => {
                    if (onTabChange && item.href.startsWith("/?")) {
                      e.preventDefault();
                      onTabChange(item.id as any);
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent-light text-accent-dark font-semibold"
                      : "text-subink hover:text-ink hover:bg-paper"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Widgets */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Thinking Points Badge */}
            {user && (
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-light text-accent-dark text-xs font-bold border border-accent/20"
                title="Your earned Thinking Points"
              >
                <Flame size={13} className="text-accent-dark" />
                <span>{thinkingPoints} TP</span>
              </div>
            )}

            {/* Notifications Button */}
            {user && (
              <button
                onClick={() => setShowNotifications(true)}
                className="relative p-2 rounded-lg text-subink hover:text-ink hover:bg-paper border border-transparent hover:border-line transition"
                title="Notifications"
              >
                <Bell size={17} />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent animate-pulse" />
                )}
              </button>
            )}

            {/* Profile or Sign-In */}
            {user ? (
              <div className="flex items-center gap-2 pl-1 border-l border-line">
                <div
                  className="w-8 h-8 rounded-full bg-paper border border-line text-accent-dark font-bold text-xs flex items-center justify-center cursor-pointer"
                  title={user.name}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-ink leading-none">{user.name}</p>
                  <p className="text-[10px] text-accent font-medium leading-tight">Active thinker</p>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-subink hover:text-peer-critic transition rounded-md hover:bg-paper"
                  title="Sign out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-3.5 py-1.5 rounded-lg bg-accent text-white hover:bg-accent-dark text-xs font-semibold shadow-sm transition"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Mobile Real-time Indicator banner */}
        <div className="sm:hidden px-4 py-1 bg-paper/60 border-t border-line/60 flex items-center justify-between text-[11px] text-subink">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent" />
            <span>
              <strong className="text-ink font-semibold">{onlineCount}</strong> thinkers online
            </span>
          </div>
          {isRealtimeConnected && (
            <span className="text-[10px] text-accent font-medium">● Live real-time sync</span>
          )}
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-line flex items-center justify-around py-2 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            (item.id === "community" && isCommunityRoute) ||
            (activeTab === item.id && !isCommunityRoute);

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={(e) => {
                if (onTabChange && item.href.startsWith("/?")) {
                  e.preventDefault();
                  onTabChange(item.id as any);
                }
              }}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition ${
                isActive ? "text-accent-dark font-bold" : "text-subink hover:text-ink"
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
