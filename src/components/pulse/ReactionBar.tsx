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
  const [expanded, setExpanded] = useState(false);
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
  const visibleEmojis = expanded ? emojis : emojis.slice(0, 3);
  const totalReactions = Object.values(counts).reduce((a, b) => a + (b || 0), 0);

  return (
    <>
      <div className="flex items-center gap-1 pt-3 border-t border-border-subtle">
        {visibleEmojis.map((emoji) => {
          const isActive = activeReactions.has(emoji);
          const count = counts[emoji] || 0;
          const colors = REACTION_COLORS[emoji];

          return (
            <button
              key={emoji}
              onClick={() => toggleReaction(emoji)}
              disabled={!userId}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs press transition-all ${
                isActive
                  ? `${colors.bg} ${colors.text} font-semibold`
                  : "text-txt-secondary hover:bg-white/5"
              } ${!userId ? "opacity-50 cursor-default" : ""}`}
            >
              <span className="text-sm">{REACTION_EMOJI_MAP[emoji]}</span>
              {count > 0 && <span>{count}</span>}
            </button>
          );
        })}

        {!expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center justify-center w-7 h-7 rounded-full text-txt-secondary hover:bg-white/5 press transition-all text-xs"
          >
            +
          </button>
        )}

        {/* Comment count — now clickable */}
        <button
          onClick={() => setCommentsOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-txt-secondary hover:bg-white/5 rounded-full press transition-all ml-auto"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {commentCount}
        </button>

        {totalReactions > 0 && (
          <span className="text-[10px] text-txt-secondary tabular-nums">
            {totalReactions}
          </span>
        )}
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
