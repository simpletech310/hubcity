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
      <div className="w-8 h-8 rounded-full bg-white/[0.06]" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-24 bg-white/[0.06] rounded" />
        <div className="h-3 w-full bg-white/[0.06] rounded" />
        <div className="h-3 w-2/3 bg-white/[0.06] rounded" />
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
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 bg-deep border-t border-border-subtle rounded-t-2xl max-h-[75vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-deep/95 backdrop-blur-md px-5 py-3 border-b border-border-subtle flex items-center justify-between shrink-0">
          <h3 className="font-heading font-bold text-sm">Comments ({commentCount})</h3>
          <button onClick={onClose} className="p-1 text-txt-secondary hover:text-white">
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
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-white/10 mb-2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-xs text-txt-secondary">No comments yet</p>
              {isMember && <p className="text-[10px] text-txt-secondary mt-1">Be the first to comment</p>}
            </div>
          ) : (
            comments.map((comment) => {
              const canDelete = isAdminOrMod || comment.author?.id === userId;
              const authorInitials = comment.author?.display_name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

              return (
                <div key={comment.id} className="flex gap-2.5 group">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-royal to-hc-purple ring-1 ring-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
                    {comment.author?.avatar_url ? (
                      <Image src={comment.author.avatar_url} alt="" width={32} height={32} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[9px] font-bold text-gold">{authorInitials}</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="bg-white/[0.03] rounded-xl px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold">{comment.author?.display_name || "Unknown"}</span>
                        <span className="text-[10px] text-txt-secondary">{timeAgo(comment.created_at)}</span>
                      </div>
                      <p className="text-xs text-white/80 mt-0.5 leading-relaxed">{comment.body}</p>
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center gap-3 mt-1 px-1">
                      {/* Like */}
                      {userId && (
                        <button
                          onClick={() => handleLike(comment.id)}
                          className={`flex items-center gap-1 text-[10px] transition-colors ${
                            comment.liked ? "text-coral font-semibold" : "text-txt-secondary hover:text-white"
                          }`}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill={comment.liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                          {(comment.like_count || 0) > 0 && <span>{comment.like_count}</span>}
                        </button>
                      )}

                      {/* Delete */}
                      {canDelete && (
                        <>
                          {deleteConfirm === comment.id ? (
                            <button onClick={() => handleDelete(comment.id)} className="text-[10px] text-coral font-semibold">
                              Confirm delete
                            </button>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(comment.id)}
                              className="text-[10px] text-txt-secondary hover:text-coral transition-colors opacity-0 group-hover:opacity-100"
                            >
                              Delete
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
          <div className="sticky bottom-0 bg-deep/95 backdrop-blur-md border-t border-border-subtle px-5 py-3 shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Write a comment..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
                }}
                className="flex-1 bg-white/5 border border-border-subtle rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40"
              />
              <button
                onClick={handleSubmit}
                disabled={!body.trim() || submitting}
                className="px-3 py-2.5 rounded-xl bg-gold/20 text-gold text-xs font-semibold disabled:opacity-40 transition-opacity press"
              >
                {submitting ? "..." : "Send"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
