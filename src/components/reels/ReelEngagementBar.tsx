"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ReactionEmoji } from "@/types/database";
import { REACTION_EMOJI_MAP, REACTION_COLORS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import EmojiPicker from "@/components/social/EmojiPicker";
import GifPicker from "@/components/social/GifPicker";

/**
 * Vertical engagement rail for the reel viewer — heart/comment/share stack.
 * Mirrors the post engagement bar's logic but targets reel_reactions and
 * reel_comments tables. Subscribes to realtime on both for live updates.
 */

type ReelComment = {
  id: string;
  reel_id: string;
  author_id: string;
  body: string;
  parent_id: string | null;
  is_published: boolean;
  created_at: string;
  author?: {
    id: string;
    display_name: string;
    handle: string | null;
    avatar_url: string | null;
    role: string;
    verification_status: string;
  };
  replies?: ReelComment[];
};

interface ReelEngagementBarProps {
  reelId: string;
  authorId: string;
  initialReactionCounts?: Partial<Record<ReactionEmoji, number>>;
  initialCommentCount?: number;
  initialUserReactions?: ReactionEmoji[];
  userId: string | null;
  /** Optional layout override — default is the TikTok-style right rail on the reel overlay. */
  variant?: "rail" | "inline";
}

const GIF_TOKEN_RE = /^gif:(https?:\/\/\S+)$/;

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ReelEngagementBar({
  reelId,
  initialReactionCounts = {},
  initialCommentCount = 0,
  initialUserReactions = [],
  userId,
  variant = "rail",
}: ReelEngagementBarProps) {
  const [counts, setCounts] = useState<Partial<Record<ReactionEmoji, number>>>(
    initialReactionCounts,
  );
  const [userReactions, setUserReactions] = useState<Set<ReactionEmoji>>(
    new Set(initialUserReactions),
  );
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [emojiPalette, setEmojiPalette] = useState(false);
  const totalReactions = Object.values(counts).reduce((a, b) => a + (b || 0), 0);

  const [comments, setComments] = useState<ReelComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<ReelComment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [gifOpen, setGifOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Realtime on reel_reactions ─────────────────────────
  useEffect(() => {
    const supabase = createClient();
    let t: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const refetch = async () => {
      if (cancelled) return;
      const { data: reel } = await supabase
        .from("reels")
        .select("reaction_counts, comment_count")
        .eq("id", reelId)
        .single();
      if (cancelled) return;
      if (reel) {
        if (reel.reaction_counts) setCounts(reel.reaction_counts);
        if (typeof reel.comment_count === "number") setCommentCount(reel.comment_count);
      }
      if (userId) {
        const { data: mine } = await supabase
          .from("reel_reactions")
          .select("emoji")
          .eq("reel_id", reelId)
          .eq("user_id", userId);
        if (!cancelled && mine) {
          setUserReactions(new Set(mine.map((r) => r.emoji as ReactionEmoji)));
        }
      }
    };
    const schedule = () => {
      if (t) clearTimeout(t);
      t = setTimeout(refetch, 200);
    };

    const channel = supabase
      .channel(`reel-engagement-${reelId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reel_reactions", filter: `reel_id=eq.${reelId}` },
        schedule,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reel_comments", filter: `reel_id=eq.${reelId}` },
        () => {
          // Fresh comment count comes from the reels row's denormalized col.
          schedule();
          if (sheetOpen) void fetchComments();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      if (t) clearTimeout(t);
      supabase.removeChannel(channel);
    };
  }, [reelId, userId, sheetOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async (emoji: ReactionEmoji) => {
    if (!userId) return;
    const wasActive = userReactions.has(emoji);
    setUserReactions((prev) => {
      const next = new Set(prev);
      if (wasActive) next.delete(emoji);
      else next.add(emoji);
      return next;
    });
    setCounts((prev) => ({
      ...prev,
      [emoji]: Math.max(0, (prev[emoji] || 0) + (wasActive ? -1 : 1)),
    }));
    try {
      const res = await fetch(`/api/reels/${reelId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (res.ok) {
        const d = await res.json();
        setCounts(d.reaction_counts);
      }
    } catch {
      // rollback handled by realtime next tick
    }
  };

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reels/${reelId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } finally {
      setLoading(false);
    }
  }, [reelId]);

  useEffect(() => {
    if (sheetOpen) {
      fetchComments();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheetOpen, fetchComments]);

  const submit = async (overrideBody?: string) => {
    if (!userId || submitting) return;
    const raw = overrideBody ?? body;
    if (!raw.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reels/${reelId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: raw.trim(),
          parent_id: replyTo?.id ?? null,
        }),
      });
      if (res.ok) {
        setBody("");
        setReplyTo(null);
        await fetchComments();
        setCommentCount((n) => n + 1);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGif = (url: string) => {
    setGifOpen(false);
    submit(`gif:${url}`);
  };

  const handleEmoji = (emoji: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setBody((prev) => prev + emoji);
      return;
    }
    const start = ta.selectionStart ?? body.length;
    const end = ta.selectionEnd ?? body.length;
    const next = body.slice(0, start) + emoji + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + emoji.length;
    });
  };

  const emojis = Object.keys(REACTION_EMOJI_MAP) as ReactionEmoji[];
  const topEmoji: ReactionEmoji =
    emojis
      .filter((e) => (counts[e] || 0) > 0)
      .sort((a, b) => (counts[b] || 0) - (counts[a] || 0))[0] ?? "heart";

  // ── RAIL variant (overlay on a fullscreen reel) ─────────
  if (variant === "rail") {
    return (
      <>
        <div className="flex flex-col items-center gap-5 select-none">
          {/* Primary reaction — tap toggles heart, long-press opens palette */}
          <button
            type="button"
            onClick={() => toggle(topEmoji)}
            onContextMenu={(e) => {
              e.preventDefault();
              setEmojiPalette((v) => !v);
            }}
            className="flex flex-col items-center gap-1 press"
            aria-label="React"
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
                userReactions.has(topEmoji)
                  ? "bg-coral/20 border-coral/40 scale-105"
                  : "bg-black/40 border-white/20 hover:border-gold/40"
              }`}
            >
              <span className="text-xl">{REACTION_EMOJI_MAP[topEmoji]}</span>
            </div>
            <span className="text-[11px] font-bold text-white tabular-nums drop-shadow">
              {totalReactions}
            </span>
          </button>

          {/* Emoji palette on long-press */}
          {emojiPalette && (
            <div className="flex flex-col items-center gap-2 rounded-full bg-black/70 border border-white/10 backdrop-blur-md p-2">
              {emojis.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => {
                    toggle(e);
                    setEmojiPalette(false);
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center press ${
                    userReactions.has(e) ? REACTION_COLORS[e].bg : "hover:bg-white/10"
                  }`}
                >
                  <span className="text-base">{REACTION_EMOJI_MAP[e]}</span>
                </button>
              ))}
            </div>
          )}

          {/* Comments */}
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex flex-col items-center gap-1 press"
            aria-label="Comments"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md bg-black/40 border border-white/20 hover:border-gold/40 transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span className="text-[11px] font-bold text-white tabular-nums drop-shadow">
              {commentCount}
            </span>
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={() => {
              const url = `${window.location.origin}/reels?id=${reelId}`;
              if (navigator.share) navigator.share({ title: "Culture reel", url }).catch(() => {});
              else navigator.clipboard.writeText(url);
            }}
            className="flex flex-col items-center gap-1 press"
            aria-label="Share"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md bg-black/40 border border-white/20 hover:border-gold/40 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
              </svg>
            </div>
            <span className="text-[11px] font-bold text-white/70 drop-shadow">Share</span>
          </button>
        </div>

        {sheetOpen && (
          <Sheet
            onClose={() => setSheetOpen(false)}
            loading={loading}
            comments={comments}
            onReply={(c) => {
              setReplyTo(c);
              textareaRef.current?.focus();
            }}
            replyTo={replyTo}
            body={body}
            setBody={setBody}
            submit={submit}
            submitting={submitting}
            userId={userId}
            textareaRef={textareaRef}
            gifOpen={gifOpen}
            setGifOpen={setGifOpen}
            handleGif={handleGif}
            emojiOpen={emojiOpen}
            setEmojiOpen={setEmojiOpen}
            handleEmoji={handleEmoji}
            commentCount={commentCount}
            onCancelReply={() => setReplyTo(null)}
          />
        )}
      </>
    );
  }

  // ── INLINE variant (reserved for future use under a reel card) ──
  return null;
}

function Sheet({
  onClose,
  loading,
  comments,
  onReply,
  replyTo,
  body,
  setBody,
  submit,
  submitting,
  userId,
  textareaRef,
  gifOpen,
  setGifOpen,
  handleGif,
  emojiOpen,
  setEmojiOpen,
  handleEmoji,
  commentCount,
  onCancelReply,
}: {
  onClose: () => void;
  loading: boolean;
  comments: ReelComment[];
  onReply: (c: ReelComment) => void;
  replyTo: ReelComment | null;
  body: string;
  setBody: (v: string) => void;
  submit: (override?: string) => void;
  submitting: boolean;
  userId: string | null;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  gifOpen: boolean;
  setGifOpen: (v: boolean) => void;
  handleGif: (url: string) => void;
  emojiOpen: boolean;
  setEmojiOpen: (v: boolean) => void;
  handleEmoji: (e: string) => void;
  commentCount: number;
  onCancelReply: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[400] flex items-end sm:items-center sm:justify-center">
      <div
        className="absolute inset-0 sheet-backdrop animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-md glass-card-elevated rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col animate-sheet-up">
        {/* Grabber */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
          <p className="font-display text-[17px] leading-none text-white">
            {commentCount} {commentCount === 1 ? "comment" : "comments"}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center press hover:bg-white/[0.1]"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 2l10 10M12 2L2 12" />
            </svg>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-[12px] text-ivory/50 py-12">
              Be the first to comment.
            </p>
          ) : (
            comments.map((c) => (
              <CommentItem key={c.id} c={c} onReply={onReply} depth={0} />
            ))
          )}
        </div>

        {/* Reply-to strip */}
        {replyTo && (
          <div className="px-5 py-2 flex items-center justify-between bg-gold/5 border-t border-gold/10">
            <p className="text-[11px] text-ivory/60">
              Replying to{" "}
              <span className="text-gold font-semibold">
                {replyTo.author?.display_name ?? "someone"}
              </span>
            </p>
            <button
              type="button"
              onClick={onCancelReply}
              className="text-[10px] text-ivory/50 hover:text-white uppercase tracking-editorial-tight"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Composer */}
        <div className="px-4 pt-3 pb-4 border-t border-white/[0.06] relative">
          {(gifOpen || emojiOpen) && (
            <div className="absolute bottom-[72px] left-4 right-4 rounded-2xl overflow-hidden z-10">
              {gifOpen && (
                <GifPicker
                  onClose={() => setGifOpen(false)}
                  onPick={handleGif}
                />
              )}
              {emojiOpen && !gifOpen && (
                <EmojiPicker
                  onPick={(e) => {
                    handleEmoji(e);
                    setEmojiOpen(false);
                  }}
                  onClose={() => setEmojiOpen(false)}
                />
              )}
            </div>
          )}
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => {
                setEmojiOpen(!emojiOpen);
                setGifOpen(false);
              }}
              className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center press"
              aria-label="Emoji"
            >
              <span className="text-base">😊</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setGifOpen(!gifOpen);
                setEmojiOpen(false);
              }}
              className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center press text-[10px] font-bold tracking-wider text-gold"
              aria-label="GIF"
            >
              GIF
            </button>
            <textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={userId ? "Add a comment…" : "Sign in to comment"}
              disabled={!userId || submitting}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              className="flex-1 min-h-[40px] max-h-32 resize-none bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-2.5 text-[13px] text-ivory placeholder:text-ivory/40 focus:outline-none focus:border-gold/40"
            />
            <button
              type="button"
              onClick={() => submit()}
              disabled={!body.trim() || submitting || !userId}
              className="shrink-0 px-4 h-10 rounded-full bg-gold text-midnight text-[11px] font-bold uppercase tracking-editorial-tight press disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentItem({
  c,
  onReply,
  depth,
}: {
  c: ReelComment;
  onReply: (c: ReelComment) => void;
  depth: number;
}) {
  const gifMatch = c.body.match(GIF_TOKEN_RE);
  const initials =
    c.author?.display_name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";
  return (
    <div className={`flex gap-2.5 ${depth > 0 ? "ml-9 mt-3" : ""}`}>
      {c.author?.avatar_url ? (
        <Image
          src={c.author.avatar_url}
          alt=""
          width={32}
          height={32}
          className="rounded-full shrink-0 object-cover"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center text-[10px] font-bold text-gold shrink-0">
          {initials}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          {c.author?.handle ? (
            <Link
              href={`/user/${c.author.handle}`}
              className="text-[12px] font-semibold text-white hover:text-gold press"
            >
              {c.author.display_name}
            </Link>
          ) : (
            <span className="text-[12px] font-semibold text-white">
              {c.author?.display_name ?? "Someone"}
            </span>
          )}
          <span className="text-[10px] text-ivory/40">{timeAgo(c.created_at)}</span>
        </div>
        {gifMatch ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={gifMatch[1]}
            alt="GIF"
            className="mt-1.5 rounded-xl max-w-[240px] border border-white/10"
          />
        ) : (
          <p className="text-[13px] text-ivory/80 leading-snug mt-0.5 whitespace-pre-wrap break-words">
            {c.body}
          </p>
        )}
        <button
          type="button"
          onClick={() => onReply(c)}
          className="mt-1 text-[10px] font-bold uppercase tracking-editorial-tight text-ivory/40 hover:text-gold press"
        >
          Reply
        </button>
        {c.replies && c.replies.length > 0 && (
          <div className="mt-2 space-y-3">
            {c.replies.map((r) => (
              <CommentItem key={r.id} c={r} onReply={onReply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
