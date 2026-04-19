"use client";

import { useState } from "react";
import type { ReactionEmoji, Post } from "@/types/database";
import { REACTION_EMOJI_MAP, REACTION_COLORS } from "@/lib/constants";
import CommentsSheet from "./CommentsSheet";

interface ReactionBarProps {
  post: Post;
  userReactions: ReactionEmoji[];
  userId: string | null;
}

export default function ReactionBar({ post, userReactions, userId }: ReactionBarProps) {
  const [counts, setCounts] = useState<Partial<Record<ReactionEmoji, number>>>(
    post.reaction_counts || {}
  );
  const [activeReactions, setActiveReactions] = useState<Set<ReactionEmoji>>(
    new Set(userReactions)
  );
  const [loading, setLoading] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [bookmarked, setBookmarked] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  const toggleReaction = async (emoji: ReactionEmoji) => {
    if (!userId || loading) return;
    setLoading(true);

    const wasActive = activeReactions.has(emoji);

    // Optimistic update
    setActiveReactions((prev) => {
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
      const res = await fetch(`/api/posts/${post.id}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });

      if (res.ok) {
        const data = await res.json();
        setCounts(data.reaction_counts);
      } else {
        // Rollback
        setActiveReactions((prev) => {
          const next = new Set(prev);
          if (wasActive) next.add(emoji);
          else next.delete(emoji);
          return next;
        });
        setCounts((prev) => ({
          ...prev,
          [emoji]: Math.max(0, (prev[emoji] || 0) + (wasActive ? 1 : -1)),
        }));
      }
    } catch {
      // Rollback on network error
      setActiveReactions((prev) => {
        const next = new Set(prev);
        if (wasActive) next.add(emoji);
        else next.delete(emoji);
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/pulse/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Knect Post", url });
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(url);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    }
  };

  const handleBookmark = async () => {
    if (!userId) return;
    const prev = bookmarked;
    setBookmarked(!prev);

    try {
      const res = await fetch(`/api/posts/${post.id}/bookmark`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setBookmarked(data.bookmarked);
      } else {
        setBookmarked(prev);
      }
    } catch {
      setBookmarked(prev);
    }
  };

  const emojis = Object.keys(REACTION_EMOJI_MAP) as ReactionEmoji[];
  const totalReactions = Object.values(counts).reduce((a, b) => a + (b || 0), 0);

  return (
    <>
      {/* Reaction summary line */}
      {totalReactions > 0 && (
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex -space-x-1">
            {emojis
              .filter((e) => (counts[e] || 0) > 0)
              .slice(0, 3)
              .map((e) => (
                <span key={e} className="text-xs">{REACTION_EMOJI_MAP[e]}</span>
              ))}
          </div>
          <span className="text-[11px] text-white/30 tabular-nums">{totalReactions}</span>
          {commentCount > 0 && (
            <>
              <span className="text-white/10 mx-1">&middot;</span>
              <span className="text-[11px] text-white/30 tabular-nums">{commentCount} comment{commentCount !== 1 ? "s" : ""}</span>
            </>
          )}
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center gap-0.5 pt-2 border-t border-white/[0.04]">
        {/* All 5 emoji reactions always visible */}
        {emojis.map((emoji) => {
          const isActive = activeReactions.has(emoji);
          const count = counts[emoji] || 0;
          const colors = REACTION_COLORS[emoji];

          return (
            <button
              key={emoji}
              onClick={() => toggleReaction(emoji)}
              disabled={!userId}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-full text-xs transition-all ${
                isActive
                  ? `${colors.bg} ${colors.text} font-semibold scale-105`
                  : "text-white/40 hover:bg-white/[0.04] hover:text-white/60"
              } ${!userId ? "opacity-40 cursor-default" : "press"}`}
            >
              <span className={`text-sm ${isActive ? "" : "grayscale opacity-60"}`}>{REACTION_EMOJI_MAP[emoji]}</span>
              {count > 0 && <span className="tabular-nums text-[11px]">{count}</span>}
            </button>
          );
        })}

        {/* Right side actions */}
        <div className="flex items-center gap-0.5 ml-auto">
          {/* Share */}
          <button
            onClick={handleShare}
            className="relative flex items-center gap-1 px-2 py-1.5 text-xs text-white/40 hover:bg-white/[0.04] hover:text-white/60 rounded-full transition-all press"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
            </svg>
            {shareToast && (
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald/20 text-emerald text-[10px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap backdrop-blur-sm">
                Link copied!
              </span>
            )}
          </button>

          {/* Bookmark */}
          <button
            onClick={handleBookmark}
            disabled={!userId}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-full text-xs transition-all ${
              bookmarked
                ? "text-gold"
                : "text-white/40 hover:bg-white/[0.04] hover:text-white/60"
            } ${!userId ? "opacity-40 cursor-default" : "press"}`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill={bookmarked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
          </button>

          {/* Comment button */}
          <button
            onClick={() => setCommentsOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-white/40 hover:bg-white/[0.04] hover:text-white/60 rounded-full transition-all press"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="tabular-nums">{commentCount}</span>
          </button>
        </div>
      </div>

      <CommentsSheet
        postId={post.id}
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        userId={userId}
        commentCount={commentCount}
        onCountChange={setCommentCount}
      />
    </>
  );
}
