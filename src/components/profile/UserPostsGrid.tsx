"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Icon from "@/components/ui/Icon";
import PostCard from "@/components/pulse/PostCard";
import type { Post, ReactionEmoji } from "@/types/database";

interface UserPostsGridProps {
  posts: Post[];
  userId: string | null;
  userReactions: Record<string, ReactionEmoji[]>;
}

/**
 * Culture blockprint post grid: 3-col framed cells with 2px gap. Reaction
 * overlay becomes an inset ink-block bar pinned to the bottom of the tile.
 */
export default function UserPostsGrid({
  posts,
  userId,
  userReactions,
}: UserPostsGridProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const postRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (openIndex == null) return;
    const target = postRefs.current[openIndex];
    if (target && overlayRef.current) {
      target.scrollIntoView({ behavior: "instant", block: "start" });
    }
  }, [openIndex]);

  useEffect(() => {
    if (openIndex == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIndex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex]);

  if (posts.length === 0) {
    return (
      <div
        className="text-center py-12 c-kicker"
        style={{ color: "var(--ink-mute)" }}
      >
        § NO POSTS YET
      </div>
    );
  }

  if (openIndex != null) {
    return (
      <div className="animate-in fade-in duration-300">
        <div
          className="flex items-center mb-4 sticky top-[60px] z-20 py-2 -mx-4 px-4"
          style={{
            background: "var(--paper)",
            borderBottom: "2px solid var(--rule-strong-c)",
          }}
        >
          <button
            onClick={() => setOpenIndex(null)}
            className="c-ui press inline-flex items-center gap-1.5"
            style={{
              background: "var(--ink-strong)",
              color: "var(--gold-c)",
              padding: "8px 12px",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            GRID VIEW
          </button>
        </div>

        <div className="flex flex-col gap-3 pb-24">
          {posts.map((post, idx) => (
            <div
              key={post.id}
              ref={(el) => {
                postRefs.current[idx] = el;
              }}
              data-post-index={idx}
            >
              <PostCard
                post={post}
                userReactions={userReactions[post.id] || []}
                userId={userId}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-3 animate-in fade-in duration-300"
      style={{ gap: 2 }}
    >
      {posts.map((post, idx) => {
        const totalReactions = post.reaction_counts
          ? Object.values(post.reaction_counts).reduce(
              (sum, n) => sum + ((n as number) ?? 0),
              0
            )
          : 0;
        const isVideo = post.media_type === "video";
        const tileImg = post.image_url ?? null;

        return (
          <button
            key={post.id}
            onClick={() => {
              setOpenIndex(idx);
              setTimeout(() => {
                postRefs.current[idx]?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }, 50);
            }}
            className="relative aspect-square group overflow-hidden press c-frame"
            style={{ background: "var(--paper)" }}
            aria-label="Open post"
          >
            {tileImg ? (
              <Image
                src={tileImg}
                alt="Post"
                fill
                sizes="(max-width: 430px) 33vw, 144px"
                className="object-cover"
              />
            ) : isVideo && post.video_url ? (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: "var(--ink-strong)" }}
              >
                <Icon
                  name="video"
                  size={22}
                  style={{ color: "var(--gold-c)" }}
                />
              </div>
            ) : (
              <div
                className="absolute inset-0 p-2 flex items-center"
                style={{ background: "var(--paper)" }}
              >
                <p
                  className="c-serif-it line-clamp-5"
                  style={{
                    fontSize: 11,
                    color: "var(--ink-soft)",
                    lineHeight: 1.4,
                  }}
                >
                  {post.body || ""}
                </p>
              </div>
            )}

            {isVideo && (
              <div
                className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center"
                style={{ background: "var(--ink-strong)" }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--gold-c)">
                  <polygon points="6,4 20,12 6,20" />
                </svg>
              </div>
            )}

            {/* Inset ink-block reaction overlay on hover */}
            <div
              className="absolute left-0 right-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-3 px-2 py-1"
              style={{ background: "var(--ink-strong)" }}
            >
              <span
                className="c-meta flex items-center gap-1"
                style={{ color: "var(--gold-c)", fontWeight: 700 }}
              >
                <Icon name="heart-pulse" size={10} />
                {totalReactions}
              </span>
              <span
                className="c-meta flex items-center gap-1"
                style={{ color: "var(--gold-c)", fontWeight: 700 }}
              >
                <Icon name="chat" size={10} />
                {post.comment_count ?? 0}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
