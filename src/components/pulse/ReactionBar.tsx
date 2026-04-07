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

        {/* Comment button */}
        <button
          onClick={() => setCommentsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/40 hover:bg-white/[0.04] hover:text-white/60 rounded-full transition-all ml-auto press"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="tabular-nums">{commentCount}</span>
        </button>
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
