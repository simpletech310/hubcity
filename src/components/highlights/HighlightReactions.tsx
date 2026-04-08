"use client";

import { useState } from "react";
import type { ReactionEmoji } from "@/types/database";
import { REACTION_EMOJI_MAP } from "@/lib/constants";

interface HighlightReactionsProps {
  highlightId: string;
  reactionCounts: Partial<Record<ReactionEmoji, number>>;
  userReactions: ReactionEmoji[];
  userId: string | null;
}

const emojis: ReactionEmoji[] = ["heart", "fire", "clap", "hundred", "pray"];

export default function HighlightReactions({
  highlightId,
  reactionCounts: initialCounts,
  userReactions: initialUserReactions,
  userId,
}: HighlightReactionsProps) {
  const [counts, setCounts] = useState(initialCounts);
  const [activeReactions, setActiveReactions] = useState<Set<ReactionEmoji>>(
    new Set(initialUserReactions)
  );
  const [loading, setLoading] = useState(false);

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
      const res = await fetch(`/api/city-highlights/${highlightId}/react`, {
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

  return (
    <div className="flex items-center gap-1">
      {emojis.map((emoji) => {
        const isActive = activeReactions.has(emoji);
        const count = counts[emoji] || 0;

        return (
          <button
            key={emoji}
            onClick={(e) => {
              e.stopPropagation();
              toggleReaction(emoji);
            }}
            disabled={!userId}
            className={`flex items-center gap-0.5 px-2 py-1.5 rounded-full text-xs transition-all ${
              isActive
                ? "bg-white/20 scale-110"
                : "bg-black/40 hover:bg-black/60"
            } ${!userId ? "opacity-40" : "press"} backdrop-blur-sm`}
          >
            <span className={`text-sm ${isActive ? "" : "grayscale opacity-70"}`}>
              {REACTION_EMOJI_MAP[emoji]}
            </span>
            {count > 0 && (
              <span className="text-[10px] text-white tabular-nums font-medium">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
