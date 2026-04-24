"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";

interface CommentAuthor {
  id: string;
  display_name: string;
  avatar_url: string | null;
  handle: string | null;
}

interface Comment {
  id: string;
  body: string;
  is_published: boolean;
  created_at: string;
  author: CommentAuthor | null;
  like_count?: number;
  liked?: boolean;
}

interface GroupCommentsSheetProps {
  groupId: string;
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  isMember: boolean;
  isAdminOrMod: boolean;
  commentCount: number;
  onCountChange: (count: number) => void;
}

function CommentSkeleton() {
  return (
    <div className="flex gap-2.5 animate-pulse">
      <div
        className="w-8 h-8 rounded-full"
        style={{ background: "var(--paper-soft)" }}
      />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-24" style={{ background: "var(--paper-soft)" }} />
        <div className="h-3 w-full" style={{ background: "var(--paper-soft)" }} />
        <div className="h-3 w-2/3" style={{ background: "var(--paper-soft)" }} />
      </div>
    </div>
  );
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function GroupCommentsSheet({
  groupId, postId, isOpen, onClose, userId, isMember, isAdminOrMod, commentCount, onCountChange,
}: GroupCommentsSheetProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments ?? []);
      }
    } catch {}
    setLoading(false);
  }, [groupId, postId]);

  useEffect(() => {
    if (isOpen) {
      fetchComments();
      document.body.style.overflow = "hidden";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen, fetchComments]);

  const handleSubmit = async () => {
    if (!body.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        onCountChange(commentCount + 1);
        setBody("");
      }
    } catch {}
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/posts/${postId}/comments/${commentId}`, { method: "DELETE" });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        onCountChange(Math.max(0, commentCount - 1));
      }
    } catch {}
    setDeleteConfirm(null);
  };

  const handleLike = async (commentId: string) => {
    // Optimistic update
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, liked: !c.liked, like_count: (c.like_count || 0) + (c.liked ? -1 : 1) }
          : c
      )
    );
    try {
      await fetch(`/api/groups/${groupId}/posts/${postId}/comments/${commentId}/like`, { method: "POST" });
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        style={{ background: "color-mix(in srgb, var(--ink-strong) 55%, transparent)" }}
      />
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 max-h-[75vh] flex flex-col"
        style={{
          background: "var(--paper)",
          borderTop: "3px solid var(--rule-strong-c)",
          borderLeft: "2px solid var(--rule-strong-c)",
          borderRight: "2px solid var(--rule-strong-c)",
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 px-5 py-3 flex items-center justify-between shrink-0"
          style={{
            background: "var(--paper)",
            borderBottom: "2px solid var(--rule-strong-c)",
          }}
        >
          <h3 className="c-card-t" style={{ fontSize: 13, color: "var(--ink-strong)" }}>
            COMMENTS ({commentCount})
          </h3>
          <button
            onClick={onClose}
            className="p-1 press"
            style={{ color: "var(--ink-strong)" }}
            aria-label="Close"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {loading ? (
            <>
              <CommentSkeleton />
              <CommentSkeleton />
              <CommentSkeleton />
            </>
          ) : comments.length === 0 ? (
            <div className="text-center py-10">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--ink-strong)"
                strokeWidth="1.5"
                className="mx-auto mb-2"
                style={{ opacity: 0.35 }}
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="c-kicker" style={{ fontSize: 10, opacity: 0.7 }}>NO COMMENTS YET</p>
              {isMember && (
                <p className="c-serif-it mt-1" style={{ fontSize: 12 }}>
                  Be the first to comment
                </p>
              )}
            </div>
          ) : (
            comments.map((comment, i) => {
              const canDelete = isAdminOrMod || comment.author?.id === userId;
              const authorInitials = comment.author?.display_name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

              return (
                <div
                  key={comment.id}
                  className="flex gap-2.5 group py-2"
                  style={{
                    borderTop: i === 0 ? undefined : "2px solid var(--rule-strong-c)",
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                    style={{
                      background: "var(--gold-c)",
                      border: "2px solid var(--rule-strong-c)",
                    }}
                  >
                    {comment.author?.avatar_url ? (
                      <Image src={comment.author.avatar_url} alt="" width={32} height={32} className="w-full h-full object-cover" />
                    ) : (
                      <span
                        className="c-card-t"
                        style={{ fontSize: 9, color: "var(--ink-strong)" }}
                      >
                        {authorInitials}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="px-3 py-2"
                      style={{
                        background: "var(--paper-warm)",
                        border: "2px solid var(--rule-strong-c)",
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="c-card-t"
                          style={{ fontSize: 11, color: "var(--ink-strong)" }}
                        >
                          {comment.author?.display_name || "Unknown"}
                        </span>
                        <span className="c-kicker" style={{ fontSize: 9, opacity: 0.55 }}>
                          {timeAgo(comment.created_at).toUpperCase()}
                        </span>
                      </div>
                      <p
                        className="c-body mt-0.5"
                        style={{ fontSize: 13, color: "var(--ink-strong)", lineHeight: 1.45 }}
                      >
                        {comment.body}
                      </p>
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center gap-3 mt-1 px-1">
                      {/* Like */}
                      {userId && (
                        <button
                          onClick={() => handleLike(comment.id)}
                          className="flex items-center gap-1 c-kicker press"
                          style={{
                            fontSize: 9,
                            color: "var(--ink-strong)",
                            opacity: comment.liked ? 1 : 0.55,
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill={comment.liked ? "var(--gold-c)" : "none"} stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                          {(comment.like_count || 0) > 0 && <span>{comment.like_count}</span>}
                        </button>
                      )}

                      {/* Delete */}
                      {canDelete && (
                        <>
                          {deleteConfirm === comment.id ? (
                            <button
                              onClick={() => handleDelete(comment.id)}
                              className="c-kicker press"
                              style={{ fontSize: 9, color: "var(--ink-strong)", fontWeight: 700 }}
                            >
                              CONFIRM DELETE
                            </button>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(comment.id)}
                              className="c-kicker opacity-0 group-hover:opacity-100 press"
                              style={{ fontSize: 9, color: "var(--ink-strong)", opacity: 0.55 }}
                            >
                              DELETE
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        {isMember && (
          <div
            className="sticky bottom-0 px-5 py-3 shrink-0"
            style={{
              background: "var(--paper)",
              borderTop: "2px solid var(--rule-strong-c)",
            }}
          >
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Write a comment…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
                }}
                className="flex-1 px-3 py-2.5 focus:outline-none"
                style={{
                  background: "var(--paper-warm)",
                  border: "2px solid var(--rule-strong-c)",
                  color: "var(--ink-strong)",
                  fontFamily: "var(--font-body), Inter, sans-serif",
                  fontSize: 13,
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={!body.trim() || submitting}
                className="c-btn c-btn-primary c-btn-sm press disabled:opacity-40"
              >
                {submitting ? "…" : "SEND"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
