"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Comment } from "@/types/database";

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

  const handleSubmit = async () => {
    if (!userId || !body.trim() || submitting) return;

    const trimmed = body.trim();
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

    // Optimistically add
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
        // Refetch for accurate data
        await fetchComments();
        // Scroll to bottom
        setTimeout(() => {
          listRef.current?.scrollTo({
            top: listRef.current.scrollHeight,
            behavior: "smooth",
          });
        }, 100);
      } else {
        // Rollback
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

  const handleReply = (comment: Comment) => {
    setReplyTo(comment);
    inputRef.current?.focus();
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
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
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
                userId={userId}
              />
            ))
          )}
        </div>

        {/* Reply indicator */}
        {replyTo && (
          <div className="px-5 py-2 border-t border-border-subtle bg-white/5 flex items-center gap-2 shrink-0">
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
              <textarea
                ref={inputRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  replyTo ? "Write a reply..." : "Add a comment..."
                }
                className="flex-1 bg-white/5 border border-border-subtle rounded-xl px-3 py-2 text-sm text-white placeholder:text-txt-secondary resize-none focus:outline-none focus:border-gold/40 min-h-[38px] max-h-[100px]"
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
                onClick={handleSubmit}
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
    </div>
  );
}

/* ── Single comment row ────────────────────────────────── */

function CommentItem({
  comment,
  onReply,
  userId,
  isReply = false,
}: {
  comment: Comment;
  onReply: (c: Comment) => void;
  userId: string | null;
  isReply?: boolean;
}) {
  const name = comment.author?.display_name || "Anonymous";
  const initials = getInitials(name);

  return (
    <div className={isReply ? "ml-8" : ""}>
      <div className="flex gap-2.5">
        {/* Avatar */}
        <div
          className={`${
            isReply ? "w-7 h-7 text-[9px]" : "w-8 h-8 text-[10px]"
          } rounded-full bg-gradient-to-br from-royal to-hc-purple flex items-center justify-center text-gold font-heading font-bold ring-1 ring-white/5 shrink-0`}
        >
          {initials}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold text-white truncate">
              {name}
            </span>
            <span className="text-[10px] text-txt-secondary shrink-0">
              {getTimeAgo(comment.created_at)}
            </span>
          </div>
          <p className="text-sm text-white/90 mt-0.5 break-words whitespace-pre-wrap">
            {comment.body}
          </p>
          {userId && !isReply && (
            <button
              onClick={() => onReply(comment)}
              className="text-[11px] text-txt-secondary hover:text-gold press mt-1 transition-colors"
            >
              Reply
            </button>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              userId={userId}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}
