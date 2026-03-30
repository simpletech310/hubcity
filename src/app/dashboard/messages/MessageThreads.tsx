"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import type { Message } from "@/types/database";

interface Thread {
  customerId: string;
  customerName: string;
  customerAvatar: string | null;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

function timeAgo(date: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function MessageThreads({
  threads,
  businessId,
  ownerId,
}: {
  threads: Thread[];
  businessId: string;
  ownerId: string;
}) {
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<
    (Message & {
      sender?: { id: string; display_name: string; avatar_url: string | null };
    })[]
  >([]);
  const [reply, setReply] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  async function openThread(customerId: string) {
    setSelectedThread(customerId);
    setLoadingMessages(true);

    try {
      const res = await fetch(
        `/api/messages?business_id=${businessId}&customer_id=${customerId}`
      );
      const data = await res.json();
      setThreadMessages(data.messages ?? []);
    } catch {
      setThreadMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }

  async function sendReply() {
    if (!reply.trim() || !selectedThread) return;
    setSending(true);

    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: businessId,
          recipient_id: selectedThread,
          body: reply.trim(),
        }),
      });

      setReply("");
      // Reload thread
      await openThread(selectedThread);
    } catch {
      // Silently fail
    } finally {
      setSending(false);
    }
  }

  const selectedCustomer = threads.find(
    (t) => t.customerId === selectedThread
  );

  if (selectedThread && selectedCustomer) {
    return (
      <div className="space-y-3">
        {/* Thread Header */}
        <button
          onClick={() => setSelectedThread(null)}
          className="inline-flex items-center gap-1.5 text-sm text-txt-secondary hover:text-white transition-colors"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="flex items-center gap-3 pb-3 border-b border-border-subtle">
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold overflow-hidden">
            {selectedCustomer.customerAvatar ? (
              <img
                src={selectedCustomer.customerAvatar}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              selectedCustomer.customerName.charAt(0).toUpperCase()
            )}
          </div>
          <span className="text-sm font-semibold">
            {selectedCustomer.customerName}
          </span>
        </div>

        {/* Messages */}
        {loadingMessages ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {threadMessages.map((msg) => {
              const isOwner = msg.sender_id === ownerId;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwner ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                      isOwner
                        ? "bg-gold/15 text-white rounded-br-sm"
                        : "bg-white/5 text-white rounded-bl-sm"
                    }`}
                  >
                    <p>{msg.body}</p>
                    <p className="text-[10px] text-txt-secondary mt-0.5">
                      {timeAgo(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reply Box */}
        <div className="flex gap-2">
          <input
            type="text"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendReply();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 border border-border-subtle rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40"
          />
          <Button
            onClick={sendReply}
            loading={sending}
            size="sm"
            disabled={!reply.trim()}
          >
            Send
          </Button>
        </div>
      </div>
    );
  }

  // Thread list
  return (
    <div className="space-y-2">
      {threads.map((thread) => (
        <button
          key={thread.customerId}
          onClick={() => openThread(thread.customerId)}
          className="w-full text-left"
        >
          <Card hover>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold shrink-0 overflow-hidden">
                {thread.customerAvatar ? (
                  <img
                    src={thread.customerAvatar}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  thread.customerName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold truncate">
                    {thread.customerName}
                  </p>
                  <span className="text-[10px] text-txt-secondary shrink-0 ml-2">
                    {timeAgo(thread.lastAt)}
                  </span>
                </div>
                <p className="text-xs text-txt-secondary truncate mt-0.5">
                  {thread.lastMessage}
                </p>
              </div>
              {thread.unread > 0 && (
                <div className="w-5 h-5 rounded-full bg-gold flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-midnight">
                    {thread.unread}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </button>
      ))}
    </div>
  );
}
