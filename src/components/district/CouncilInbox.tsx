"use client";

import { useState, useEffect, useCallback } from "react";
import Card from "@/components/ui/Card";

interface Message {
  id: string;
  subject: string;
  body: string;
  is_read: boolean;
  created_at: string;
  sender: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
}

interface CouncilInboxProps {
  district: number;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function CouncilInbox({ district }: CouncilInboxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/districts/${district}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {
      // silent
    }
    setLoading(false);
  }, [district]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/districts/${district}/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: true }),
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, is_read: true } : m))
      );
    } catch {
      // silent
    }
  };

  const handleExpand = (message: Message) => {
    if (expandedId === message.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(message.id);
    if (!message.is_read) {
      markAsRead(message.id);
    }
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white">Inbox</h3>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card-elevated rounded-2xl p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/10 rounded w-1/3" />
                <div className="h-2.5 bg-white/5 rounded w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          Inbox
          {unreadCount > 0 && (
            <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </h3>
      </div>

      {messages.length === 0 ? (
        <Card variant="glass-elevated">
          <p className="text-sm text-txt-secondary text-center py-6">No messages yet</p>
        </Card>
      ) : (
        messages.map((message) => (
          <button
            key={message.id}
            onClick={() => handleExpand(message)}
            className="w-full text-left glass-card-elevated rounded-2xl p-4 press hover:border-white/10 transition-all"
          >
            <div className="flex items-start gap-3">
              {/* Unread dot */}
              <div className="flex-shrink-0 pt-1.5">
                {!message.is_read ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                ) : (
                  <div className="w-2.5 h-2.5" />
                )}
              </div>

              {/* Avatar */}
              <div className="flex-shrink-0">
                {message.sender.avatar_url ? (
                  <img
                    src={message.sender.avatar_url}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-txt-secondary">
                    {message.sender.display_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white truncate">
                    {message.sender.display_name}
                  </span>
                  {message.sender.is_verified && (
                    <svg className="w-3 h-3 text-cyan flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <span className="text-[10px] text-txt-secondary ml-auto flex-shrink-0">
                    {timeAgo(message.created_at)}
                  </span>
                </div>
                <p className={`text-sm mt-0.5 ${!message.is_read ? "font-semibold text-white" : "text-white/80"}`}>
                  {message.subject}
                </p>
                {expandedId === message.id ? (
                  <p className="text-xs text-txt-secondary mt-2 whitespace-pre-wrap">
                    {message.body}
                  </p>
                ) : (
                  <p className="text-xs text-txt-secondary mt-0.5 line-clamp-2">
                    {message.body}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))
      )}
    </div>
  );
}
