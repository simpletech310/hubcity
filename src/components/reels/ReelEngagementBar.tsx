"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ReactionEmoji } from "@/types/database";
import { REACTION_EMOJI_MAP } from "@/lib/constants";
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
    const railTileStyle = (active: boolean): React.CSSProperties => ({
      width: 44,
      height: 44,
      background: active ? "var(--gold-c)" : "var(--ink-strong)",
      border: "2px solid var(--paper)",
      color: active ? "var(--ink-strong)" : "var(--paper)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    });
    const railCountStyle: React.CSSProperties = {
      fontFamily: "var(--font-dm-mono), monospace",
      fontWeight: 500,
      fontSize: 10,
      letterSpacing: "0.06em",
      color: "var(--paper)",
      textShadow: "0 1px 2px rgba(0,0,0,0.7)",
    };
    return (
      <>
        <div className="flex flex-col items-center gap-5 select-none">
          {/* Primary reaction — square ink tile, gold when active */}
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
            <div style={railTileStyle(userReactions.has(topEmoji))}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>{REACTION_EMOJI_MAP[topEmoji]}</span>
            </div>
            <span style={railCountStyle}>{totalReactions}</span>
          </button>

          {/* Emoji palette on long-press — paper column with ink border */}
          {emojiPalette && (
            <div
              className="flex flex-col items-center"
              style={{
                background: "var(--paper)",
                border: "2px solid var(--rule-strong-c)",
              }}
            >
              {emojis.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => {
                    toggle(e);
                    setEmojiPalette(false);
                  }}
                  className="flex items-center justify-center press"
                  style={{
                    width: 36,
                    height: 36,
                    background: userReactions.has(e) ? "var(--gold-c)" : "var(--paper)",
                    borderTop: "1px solid var(--rule-strong-c)",
                  }}
                >
                  <span style={{ fontSize: 16, lineHeight: 1 }}>{REACTION_EMOJI_MAP[e]}</span>
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
            <div style={railTileStyle(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span style={railCountStyle}>{commentCount}</span>
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
            <div style={railTileStyle(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
              </svg>
            </div>
            <span style={railCountStyle}>SHARE</span>
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
      <div
        className="relative w-full sm:max-w-md max-h-[85vh] flex flex-col animate-sheet-up"
        style={{
          background: "var(--paper)",
          color: "var(--ink-strong)",
          borderTop: "3px solid var(--rule-strong-c)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
        >
          <div>
            <div className="c-kicker" style={{ opacity: 0.65, fontSize: 10 }}>
              § COMMENTS
            </div>
            <p className="c-card-t" style={{ fontSize: 15, marginTop: 2 }}>
              {commentCount} {commentCount === 1 ? "Comment" : "Comments"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center press"
            style={{
              width: 32,
              height: 32,
              background: "var(--paper)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--ink-strong)",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M2 2l10 10M12 2L2 12" />
            </svg>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div
                className="rounded-full animate-spin"
                style={{
                  width: 24,
                  height: 24,
                  border: "2px solid rgba(26,21,18,0.2)",
                  borderTopColor: "var(--gold-c)",
                }}
              />
            </div>
          ) : comments.length === 0 ? (
            <p className="c-serif-it text-center py-12" style={{ fontSize: 13, opacity: 0.7 }}>
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
          <div
            className="px-5 py-2 flex items-center justify-between"
            style={{
              background: "var(--paper-warm)",
              borderTop: "2px solid var(--rule-strong-c)",
            }}
          >
            <p className="c-meta" style={{ textTransform: "none", fontSize: 11 }}>
              Replying to{" "}
              <span
                style={{
                  color: "var(--ink-strong)",
                  fontFamily: "var(--font-archivo-narrow)",
                  fontWeight: 800,
                }}
              >
                {replyTo.author?.display_name ?? "someone"}
              </span>
            </p>
            <button
              type="button"
              onClick={onCancelReply}
              className="c-kicker press"
              style={{ fontSize: 10, color: "var(--ink-strong)", opacity: 0.65 }}
            >
              CANCEL
            </button>
          </div>
        )}

        {/* Composer */}
        <div
          className="px-4 pt-3 pb-4 relative"
          style={{ borderTop: "2px solid var(--rule-strong-c)" }}
        >
          {(gifOpen || emojiOpen) && (
            <div className="absolute bottom-[72px] left-4 right-4 overflow-hidden z-10" style={{ border: "2px solid var(--rule-strong-c)" }}>
              {gifOpen && (
                <GifPicker
                  open={true}
                  onClose={() => setGifOpen(false)}
                  onPick={handleGif}
                />
              )}
              {emojiOpen && !gifOpen && (
                <EmojiPicker
                  open={true}
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
              className="flex items-center justify-center press"
              style={{
                width: 34,
                height: 34,
                background: "var(--paper)",
                border: "2px solid var(--rule-strong-c)",
              }}
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
              className="flex items-center justify-center press c-kicker"
              style={{
                width: 34,
                height: 34,
                background: "var(--paper)",
                border: "2px solid var(--rule-strong-c)",
                color: "var(--ink-strong)",
                fontSize: 10,
              }}
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
              className="flex-1 min-h-[40px] max-h-32 resize-none px-3 py-2 outline-none"
              style={{
                background: "var(--paper-warm)",
                border: "2px solid var(--rule-strong-c)",
                color: "var(--ink-strong)",
                fontSize: 13,
                fontFamily: "var(--font-fraunces), serif",
              }}
            />
            <button
              type="button"
              onClick={() => submit()}
              disabled={!body.trim() || submitting || !userId}
              className="c-btn c-btn-primary c-btn-sm press disabled:opacity-40 shrink-0"
              style={{ height: 34 }}
            >
              SEND
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
          style={{ border: "2px solid var(--rule-strong-c)" }}
        />
      ) : (
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--gold-c)",
            color: "var(--ink-strong)",
            border: "2px solid var(--rule-strong-c)",
            fontFamily: "var(--font-archivo), Archivo, sans-serif",
            fontWeight: 800,
            fontSize: 11,
          }}
        >
          {initials}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          {c.author?.handle ? (
            <Link
              href={`/user/${c.author.handle}`}
              className="c-card-t press"
              style={{ fontSize: 12, color: "var(--ink-strong)" }}
            >
              {c.author.display_name}
            </Link>
          ) : (
            <span className="c-card-t" style={{ fontSize: 12, color: "var(--ink-strong)" }}>
              {c.author?.display_name ?? "Someone"}
            </span>
          )}
          <span className="c-kicker" style={{ fontSize: 9, opacity: 0.55 }}>
            {timeAgo(c.created_at)}
          </span>
        </div>
        {gifMatch ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={gifMatch[1]}
            alt="GIF"
            className="mt-1.5 max-w-[240px]"
            style={{ border: "2px solid var(--rule-strong-c)" }}
          />
        ) : (
          <p
            className="c-body mt-0.5 whitespace-pre-wrap break-words"
            style={{ fontSize: 13, lineHeight: 1.4 }}
          >
            {c.body}
          </p>
        )}
        <button
          type="button"
          onClick={() => onReply(c)}
          className="mt-1 c-kicker press"
          style={{ fontSize: 10, color: "var(--ink-strong)", opacity: 0.55 }}
        >
          REPLY
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
