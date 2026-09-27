"use client";

import React from "react";
import { useCommunity } from "@/lib/CommunityContext";
import { Bell, Check, MessageSquare, Lightbulb, Trophy } from "lucide-react";
import Link from "next/link";

export function NotificationsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { notifications, markNotificationAsRead } = useCommunity();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end sm:p-6 bg-ink/20 backdrop-blur-sm animate-fadeUp">
      <div className="bg-surface border border-line w-full sm:max-w-md max-h-[85vh] sm:rounded-2xl shadow-soft flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-line flex items-center justify-between bg-paper/50">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-accent" />
            <h3 className="font-display font-semibold text-ink text-base">Notifications</h3>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-subink hover:text-ink font-medium px-2 py-1 rounded-md hover:bg-paper transition"
          >
            Close
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-line/60">
          {notifications.length === 0 ? (
            <div className="p-10 text-center text-subink">
              <p className="text-sm font-medium">Quiet here</p>
              <p className="text-xs text-subink/80 mt-1">
                You will be notified when students reply to your thoughts or react.
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              const Icon =
                n.type === "reply"
                  ? MessageSquare
                  : n.type === "points"
                  ? Trophy
                  : Lightbulb;

              return (
                <div
                  key={n.id}
                  className={`p-4 transition hover:bg-paper/40 flex items-start gap-3 ${
                    !n.read ? "bg-accent-light/30" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-paper border border-line flex items-center justify-center shrink-0 text-accent">
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-ink leading-relaxed">
                      {n.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[11px] text-subink">
                        {new Date(n.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {n.postId && (
                        <Link
                          href={`/community/${n.postId}`}
                          onClick={() => {
                            markNotificationAsRead(n.id);
                            onClose();
                          }}
                          className="text-[11px] font-semibold text-accent-dark hover:underline"
                        >
                          View discussion →
                        </Link>
                      )}
                      {!n.read && (
                        <button
                          onClick={() => markNotificationAsRead(n.id)}
                          className="ml-auto inline-flex items-center gap-1 text-[10px] text-subink hover:text-ink"
                        >
                          <Check size={11} /> Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
