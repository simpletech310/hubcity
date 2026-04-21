"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import type { Comment } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import GifPicker from "@/components/social/GifPicker";
import EmojiPicker from "@/components/social/EmojiPicker";

// Comments reuse the existing `body` column. A body of the form `gif:<url>`
// is rendered as an embedded GIF instead of plain text. Keeps the backend
// schema untouched.
const GIF_TOKEN_RE = /^gif:(https?:\/\/\S+)$/;

function parseGif(body: string): string | null {
  const m = body.match(GIF_TOKEN_RE);
  return m ? m[1] : null;
}

interface CommentsSheetProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  commentCount: number;
  onCountChange: (count: number) => void;
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function CommentSkeleton() {
  return (
    <div className="flex gap-2.5 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-white/[0.06] shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <div className="w-20 h-3 rounded bg-white/[0.06]" />
          <div className="w-8 h-3 rounded bg-white/[0.04]" />
        </div>
        <div className="w-3/4 h-3.5 rounded bg-white/[0.04]" />
        <div className="w-1/2 h-3.5 rounded bg-white/[0.03]" />
      </div>
    </div>
  );
}

export default function CommentsSheet({
  postId,
  isOpen,
  onClose,
  userId,
  commentCount,
  onCountChange,
}: CommentsSheetProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [gifOpen, setGifOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, fetchComments]);

  // ── Realtime subscription ─────────────────────────────
  // While the sheet is open for this post, listen for any comment insert or
  // delete and refetch the list. Debounced 200ms so the echo of our own
  // optimistic post coalesces with the server write.
  useEffect(() => {
    if (!isOpen) return;
    const supabase = createClient();
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRefetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchComments();
      }, 200);
    };

    const channel = supabase
      .channel(`post-comments-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        scheduleRefetch,
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [isOpen, postId, fetchComments]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleSubmit = async (overrideBody?: string) => {
    if (!userId || submitting) return;
    const raw = overrideBody ?? body;
    if (!raw.trim()) return;

    const trimmed = raw.trim();
    setSubmitting(true);

    // Optimistic comment
    const optimistic: Comment = {
      id: `temp-${Date.now()}`,
      post_id: postId,
      author_id: userId,
      body: trimmed,
      parent_id: replyTo?.id ?? null,
      is_published: true,
      created_at: new Date().toISOString(),
      author: undefined,
      replies: [],
    };

    if (replyTo) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === replyTo.id
            ? { ...c, replies: [...(c.replies || []), optimistic] }
            : c
        )
      );
    } else {
      setComments((prev) => [...prev, optimistic]);
    }
    onCountChange(commentCount + 1);
    setBody("");
    setReplyTo(null);

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: trimmed,
          parent_id: replyTo?.id ?? null,
        }),
      });

      if (res.ok) {
        await fetchComments();
        setTimeout(() => {
          listRef.current?.scrollTo({
            top: listRef.current.scrollHeight,
            behavior: "smooth",
          });
        }, 100);
      } else {
        onCountChange(commentCount);
        await fetchComments();
      }
    } catch {
      onCountChange(commentCount);
      await fetchComments();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    // Optimistic remove
    setComments((prev) =>
      prev
        .filter((c) => c.id !== commentId)
        .map((c) => ({
          ...c,
          replies: c.replies?.filter((r) => r.id !== commentId),
        }))
    );
    onCountChange(Math.max(0, commentCount - 1));

    try {
      const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        await fetchComments();
        onCountChange(commentCount);
      }
    } catch {
      await fetchComments();
      onCountChange(commentCount);
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyTo(comment);
    inputRef.current?.focus();
  };

  const handleGifPick = (url: string) => {
    // Comments have no media column — store as a special token.
    void handleSubmit(`gif:${url}`);
  };

  const handleEmojiPick = (emoji: string) => {
    const el = inputRef.current;
    if (!el) {
      setBody((b) => b + emoji);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const next = body.slice(0, start) + emoji + body.slice(end);
    setBody(next);
    // Restore cursor after the inserted emoji
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleClose = () => {
    setBody("");
    setReplyTo(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-[430px] bg-card border-t border-border-subtle rounded-t-2xl animate-slide-up flex flex-col max-h-[80vh]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-border-subtle shrink-0">
          <button
            onClick={handleClose}
            className="text-sm text-txt-secondary press"
          >
            Close
          </button>
          <span className="text-sm font-heading font-bold text-gold">
            Comments
          </span>
          <span className="text-xs text-txt-secondary tabular-nums">
            {commentCount}
          </span>
        </div>

        {/* Comment list */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {loading && comments.length === 0 ? (
            <div className="space-y-5">
              <CommentSkeleton />
              <CommentSkeleton />
              <CommentSkeleton />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/10 mx-auto mb-3">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p className="text-sm text-txt-secondary">No comments yet</p>
              <p className="text-xs text-txt-secondary mt-1">
                Be the first to comment
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={handleReply}
                onDelete={handleDelete}
                userId={userId}
                postId={postId}
              />
            ))
          )}
        </div>

        {/* Reply indicator */}
        {replyTo && (
          <div className="px-5 py-2 border-t border-border-subtle bg-white/5 flex items-center gap-2 shrink-0 animate-in slide-in-from-bottom-2 duration-200">
            <span className="text-xs text-txt-secondary flex-1 truncate">
              Replying to{" "}
              <span className="text-gold">
                {replyTo.author?.display_name || "someone"}
              </span>
            </span>
            <button
              onClick={() => setReplyTo(null)}
              className="text-xs text-txt-secondary hover:text-white press"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Input bar */}
        <div className="px-5 py-3 border-t border-border-subtle shrink-0">
          {userId ? (
            <div className="flex items-end gap-2">
              {/* GIF + Emoji buttons */}
              <div className="flex items-center gap-1 pb-1 relative">
                <button
                  type="button"
                  onClick={() => {
                    setGifOpen(true);
                    setEmojiOpen(false);
                  }}
                  disabled={submitting}
                  aria-label="Add a GIF"
                  className="shrink-0 h-8 px-2 rounded-lg text-[10px] font-heading font-bold tracking-[0.15em] uppercase text-gold border border-gold/30 hover:bg-gold/10 press transition-colors disabled:opacity-40"
                >
                  GIF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmojiOpen((v) => !v);
                    setGifOpen(false);
                  }}
                  disabled={submitting}
                  aria-label="Add an emoji"
                  className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-base hover:bg-gold/10 press transition-colors disabled:opacity-40"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold/80">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" />
                    <line x1="15" y1="9" x2="15.01" y2="9" />
                  </svg>
                </button>
                <EmojiPicker
                  open={emojiOpen}
                  onClose={() => setEmojiOpen(false)}
                  onPick={handleEmojiPick}
                />
              </div>

              <textarea
                ref={inputRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  replyTo ? "Write a reply..." : "Add a comment..."
                }
                className="flex-1 bg-white/5 border border-border-subtle rounded-xl px-3 py-2 text-sm text-white placeholder:text-txt-secondary resize-none focus:outline-none focus:border-gold/40 min-h-[38px] max-h-[100px] transition-all"
                maxLength={1000}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <button
                onClick={() => handleSubmit()}
                disabled={!body.trim() || submitting}
                className="shrink-0 w-9 h-9 rounded-full bg-gold flex items-center justify-center press transition-all disabled:opacity-40 disabled:cursor-default"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-midnight/30 border-t-midnight rounded-full animate-spin" />
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-midnight"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
              </button>
            </div>
          ) : (
            <p className="text-center text-xs text-txt-secondary py-1">
              Sign in to comment
            </p>
          )}
        </div>
      </div>

      {/* GIF picker — posts immediately on pick */}
      <GifPicker
        open={gifOpen}
        onClose={() => setGifOpen(false)}
        onPick={handleGifPick}
        title={replyTo ? "Reply with a GIF" : "Comment with a GIF"}
      />
    </div>
  );
}

/* ── Single comment row ────────────────────────────────── */

function CommentItem({
  comment,
  onReply,
  onDelete,
  userId,
  postId,
  isReply = false,
}: {
  comment: Comment;
  onReply: (c: Comment) => void;
  onDelete: (id: string) => void;
  userId: string | null;
  postId: string;
  isReply?: boolean;
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const name = comment.author?.display_name || "Anonymous";
  const initials = getInitials(name);
  const avatarUrl = comment.author?.avatar_url;
  const isAuthor = userId === comment.author_id;

  const hasReplies = comment.replies && comment.replies.length > 0;
  const [showAllReplies, setShowAllReplies] = useState(false);
  const visibleReplies = showAllReplies
    ? comment.replies || []
    : (comment.replies || []).slice(0, 3);
  const hiddenCount = (comment.replies?.length || 0) - 3;

  const toggleLike = async () => {
    if (!userId) return;
    const prev = liked;
    const prevCount = likeCount;
    setLiked(!prev);
    setLikeCount(prev ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await fetch(
        `/api/posts/${postId}/comments/${comment.id}/like`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikeCount(data.like_count);
      } else {
        setLiked(prev);
        setLikeCount(prevCount);
      }
    } catch {
      setLiked(prev);
      setLikeCount(prevCount);
    }
  };

  return (
    <div className={isReply ? "ml-8 relative" : "relative"}>
      {/* Thread line for replies */}
      {isReply && (
        <div className="absolute -left-5 top-0 bottom-0 w-[2px] bg-white/[0.06] rounded-full" />
      )}

      <div className="flex gap-2.5">
        {/* Avatar */}
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name}
            width={isReply ? 28 : 32}
            height={isReply ? 28 : 32}
            className={`${
              isReply ? "w-7 h-7" : "w-8 h-8"
            } rounded-full object-cover ring-1 ring-white/5 shrink-0`}
          />
        ) : (
          <div
            className={`${
              isReply ? "w-7 h-7 text-[9px]" : "w-8 h-8 text-[10px]"
            } rounded-full bg-gradient-to-br from-royal to-hc-purple flex items-center justify-center text-gold font-heading font-bold ring-1 ring-white/5 shrink-0`}
          >
            {initials}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white truncate">
              {name}
            </span>
            <span className="text-[10px] text-txt-secondary shrink-0">
              {getTimeAgo(comment.created_at)}
            </span>
          </div>
          {(() => {
            const gifUrl = parseGif(comment.body);
            if (gifUrl) {
              return (
                <div className="mt-1 inline-block rounded-xl overflow-hidden bg-white/5 border border-border-subtle max-w-[220px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={gifUrl}
                    alt="GIF"
                    loading="lazy"
                    className="block w-full h-auto"
                  />
                </div>
              );
            }
            return (
              <p className="text-sm text-white/90 mt-0.5 break-words whitespace-pre-wrap">
                {comment.body}
              </p>
            );
          })()}

          {/* Actions row */}
          <div className="flex items-center gap-3 mt-1.5">
            {/* Like */}
            <button
              onClick={toggleLike}
              disabled={!userId}
              className={`flex items-center gap-1 text-[11px] press transition-colors ${
                liked ? "text-coral" : "text-txt-secondary hover:text-coral/60"
              } ${!userId ? "opacity-40" : ""}`}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill={liked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
              {likeCount > 0 && <span className="tabular-nums">{likeCount}</span>}
            </button>

            {/* Reply */}
            {userId && !isReply && (
              <button
                onClick={() => onReply(comment)}
                className="text-[11px] text-txt-secondary hover:text-gold press transition-colors"
              >
                Reply
              </button>
            )}

            {/* Delete */}
            {isAuthor && (
              <>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        onDelete(comment.id);
                        setShowDeleteConfirm(false);
                      }}
                      className="text-[10px] text-coral font-semibold press"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="text-[10px] text-txt-secondary press"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-[11px] text-txt-secondary hover:text-coral/60 press transition-colors"
                  >
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {hasReplies && (
        <div className="mt-3 space-y-3">
          {/* Thread connector line */}
          {visibleReplies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onDelete={onDelete}
              userId={userId}
              postId={postId}
              isReply
            />
          ))}
          {!showAllReplies && hiddenCount > 0 && (
            <button
              onClick={() => setShowAllReplies(true)}
              className="ml-8 text-[11px] text-gold/70 font-semibold press hover:text-gold transition-colors"
            >
              View {hiddenCount} more {hiddenCount === 1 ? "reply" : "replies"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
