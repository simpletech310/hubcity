"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import GifPicker from "@/components/social/GifPicker";

export type DMMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  gif_url: string | null;
  image_url: string | null;
  created_at: string;
  read_at?: string | null;
};

interface DMThreadProps {
  conversationId: string;
  currentUserId: string;
  otherAvatarUrl: string | null;
  otherName: string;
  initialMessages: DMMessage[];
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function sameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yday = new Date();
  yday.setDate(today.getDate() - 1);
  if (sameDay(iso, today.toISOString())) return "Today";
  if (sameDay(iso, yday.toISOString())) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

/**
 * DMThread — the live chat UX for /messages/[conversationId].
 *
 * Owns:
 *  - Initial message list (from server prop)
 *  - Supabase realtime subscription on `messages-${conversationId}` that
 *    appends INSERTs as they land (filtered by conversation_id server-side
 *    via the postgres_changes filter).
 *  - Optimistic send via POST /api/conversations/[id]/messages.
 *  - Mark-as-read — the server's GET route auto-bumps last_read_at, so we
 *    fire a one-off fetch on mount. No-op on the response.
 *  - Cleanup: removes the channel on unmount.
 */
export default function DMThread({
  conversationId,
  currentUserId,
  otherAvatarUrl,
  otherName,
  initialMessages,
}: DMThreadProps) {
  const [messages, setMessages] = useState<DMMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gifOpen, setGifOpen] = useState(false);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll to bottom on any message change.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Mark-as-read: the GET route updates last_read_at as a side effect, so a
  // fire-and-forget call is the cheapest way to get that bump on mount.
  useEffect(() => {
    fetch(`/api/conversations/${conversationId}/messages`, { method: "GET" }).catch(
      () => {
        /* best effort */
      },
    );
  }, [conversationId]);

  // Realtime subscription — appends new inserts for this conversation.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as DMMessage;
          setMessages((prev) => {
            // De-dupe: optimistic inserts stamped with a temp id may already
            // be matched by a realtime row with the real id. We match on
            // (sender, body, created_at within a tolerance).
            if (prev.some((m) => m.id === row.id)) return prev;
            // Replace a matching optimistic stub if present.
            const idx = prev.findIndex(
              (m) =>
                m.id.startsWith("tmp-") &&
                m.sender_id === row.sender_id &&
                (m.body ?? "") === (row.body ?? ""),
            );
            if (idx >= 0) {
              const next = prev.slice();
              next[idx] = row;
              return next;
            }
            return [...prev, row];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const send = useCallback(
    async (args: { text?: string; gifUrl?: string }) => {
      const body = (args.text ?? "").trim();
      const gifUrl = args.gifUrl?.trim();
      if (!body && !gifUrl) return;
      if (sending) return;
      setError(null);
      setSending(true);

      // Optimistic stub — swapped out when the realtime INSERT (or POST
      // response) comes back with the real id.
      const tmpId = `tmp-${Date.now()}`;
      const optimistic: DMMessage = {
        id: tmpId,
        conversation_id: conversationId,
        sender_id: currentUserId,
        body: body || null,
        gif_url: gifUrl ?? null,
        image_url: null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      if (body) setDraft("");

      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(body ? { body } : {}),
            ...(gifUrl ? { gif_url: gifUrl } : {}),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Couldn't send.");
        const real = data.message as DMMessage;
        setMessages((prev) => {
          // If realtime already inserted, drop the stub; otherwise swap in.
          if (prev.some((m) => m.id === real.id)) {
            return prev.filter((m) => m.id !== tmpId);
          }
          return prev.map((m) => (m.id === tmpId ? real : m));
        });
      } catch (e: unknown) {
        // Roll back the optimistic stub.
        setMessages((prev) => prev.filter((m) => m.id !== tmpId));
        if (body) setDraft(body);
        setError(e instanceof Error ? e.message : "Couldn't send.");
      } finally {
        setSending(false);
        inputRef.current?.focus();
      }
    },
    [conversationId, currentUserId, sending],
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void send({ text: draft });
  }

  return (
    <>
      {/* Scrollable message list */}
      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
        style={{ scrollbarWidth: "thin", background: "var(--paper)" }}
      >
        {messages.length === 0 && (
          <div className="text-center py-16">
            <p
              className="c-serif-it"
              style={{ fontSize: 14, color: "var(--ink-strong)", opacity: 0.7 }}
            >
              Say hi to {otherName}.
            </p>
          </div>
        )}

        {messages.map((m, i) => {
          const mine = m.sender_id === currentUserId;
          const prev = messages[i - 1];
          const showDay = !prev || !sameDay(prev.created_at, m.created_at);
          return (
            <div key={m.id}>
              {showDay && (
                <div className="flex items-center gap-3 my-4">
                  <span
                    className="flex-1"
                    style={{ borderTop: "2px solid var(--rule-strong-c)" }}
                  />
                  <span
                    className="c-kicker tabular-nums"
                    style={{ fontSize: 10, opacity: 0.55 }}
                  >
                    {dayLabel(m.created_at)}
                  </span>
                  <span
                    className="flex-1"
                    style={{ borderTop: "2px solid var(--rule-strong-c)" }}
                  />
                </div>
              )}
              <div className={`flex ${mine ? "justify-end" : "justify-start"} items-end gap-2`}>
                {!mine && (
                  <div
                    className="w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                    style={{
                      background: "var(--gold-c)",
                      border: "2px solid var(--rule-strong-c)",
                      color: "var(--ink-strong)",
                    }}
                  >
                    {otherAvatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={otherAvatarUrl}
                        alt={otherName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span
                        style={{
                          fontFamily: "var(--font-archivo), Archivo, sans-serif",
                          fontWeight: 800,
                          fontSize: 9,
                        }}
                      >
                        {otherName.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                )}
                <div className={`max-w-[75%] flex flex-col ${mine ? "items-end" : "items-start"}`}>
                  <div
                    className="px-3 py-2"
                    style={
                      mine
                        ? {
                            background: "var(--gold-c)",
                            border: "2px solid var(--rule-strong-c)",
                            color: "var(--ink-strong)",
                            fontSize: 14,
                            lineHeight: 1.4,
                            fontFamily: "var(--font-fraunces), serif",
                          }
                        : {
                            background: "var(--paper)",
                            border: "2px solid var(--rule-strong-c)",
                            color: "var(--ink-strong)",
                            fontSize: 14,
                            lineHeight: 1.4,
                            fontFamily: "var(--font-fraunces), serif",
                          }
                    }
                  >
                    {m.body}
                    {m.gif_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.gif_url}
                        alt="gif"
                        className="mt-1 max-w-full"
                        style={{ border: "2px solid var(--rule-strong-c)" }}
                      />
                    )}
                    {m.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.image_url}
                        alt="attachment"
                        className="mt-1 max-w-full"
                        style={{ border: "2px solid var(--rule-strong-c)" }}
                      />
                    )}
                  </div>
                  <span
                    className="c-kicker mt-1 tabular-nums"
                    style={{ fontSize: 9, opacity: 0.55 }}
                  >
                    {formatTime(m.created_at)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky composer — paper with ink top rule */}
      <div
        className="sticky bottom-0 px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3"
        style={{
          background: "var(--paper)",
          borderTop: "2px solid var(--rule-strong-c)",
        }}
      >
        {error && (
          <p
            className="mb-2 px-4 c-serif-it"
            style={{ fontSize: 11, color: "var(--ink-strong)" }}
          >
            {error}
          </p>
        )}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            aria-label="Add GIF"
            onClick={() => setGifOpen(true)}
            disabled={sending}
            className="flex items-center justify-center press disabled:opacity-50"
            style={{
              width: 40,
              height: 40,
              background: "var(--paper)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--ink-strong)",
              fontFamily: "var(--font-dm-mono), monospace",
              fontWeight: 500,
              fontSize: 10,
              letterSpacing: "0.12em",
            }}
          >
            GIF
          </button>
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Message ${otherName}…`}
            className="flex-1 outline-none px-3"
            style={{
              background: "var(--paper-warm)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--ink-strong)",
              height: 40,
              fontSize: 14,
              fontFamily: "var(--font-fraunces), serif",
            }}
            maxLength={2000}
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            aria-label="Send"
            className="c-btn c-btn-primary press disabled:opacity-40"
            style={{ width: 40, height: 40, padding: 0 }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3l5 5-5 5" />
            </svg>
          </button>
        </form>
      </div>

      <GifPicker
        open={gifOpen}
        onClose={() => setGifOpen(false)}
        onPick={(url) => void send({ gifUrl: url })}
        title={`GIF for ${otherName}`}
      />
    </>
  );
}
