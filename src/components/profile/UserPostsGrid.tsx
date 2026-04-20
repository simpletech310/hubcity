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
 * Instagram-style post grid + scrollable full-post viewer.
 *
 * Grid: 3-column aspect-square tiles for every post regardless of type.
 * Image posts show the image, video posts show image poster (or a dark
 * placeholder with a play icon), text-only posts show a colored card with
 * the first line of the body.
 *
 * Click any tile: opens a fullscreen overlay that renders every post as a
 * full PostCard, vertically stacked and scrollable. Scrolls the clicked
 * post into view on open so the user lands where they tapped.
 */
export default function UserPostsGrid({
  posts,
  userId,
  userReactions,
}: UserPostsGridProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const postRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll the clicked post into view when the overlay opens.
  useEffect(() => {
    if (openIndex == null) return;
    const target = postRefs.current[openIndex];
    if (target && overlayRef.current) {
      target.scrollIntoView({ behavior: "instant", block: "start" });
    }
  }, [openIndex]);

  // Escape key closes
  useEffect(() => {
    if (openIndex == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIndex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex]);

  // Lock body scroll while overlay is open
  useEffect(() => {
    if (openIndex == null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [openIndex]);

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-white/30 text-sm">No posts yet</div>
    );
  }

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-3 gap-0.5 rounded-xl overflow-hidden">
        {posts.map((post, idx) => {
          const totalReactions = post.reaction_counts
            ? Object.values(post.reaction_counts).reduce(
                (sum, n) => sum + ((n as number) ?? 0),
                0
              )
            : 0;
          const isVideo = post.media_type === "video";
          const isImage = post.media_type === "image" || (post.image_url && !isVideo);
          const tileImg = post.image_url ?? null;

          return (
            <button
              key={post.id}
              onClick={() => setOpenIndex(idx)}
              className="relative aspect-square group overflow-hidden bg-white/[0.04] press"
              aria-label="Open post"
            >
              {tileImg ? (
                <Image
                  src={tileImg}
                  alt="Post"
                  fill
                  sizes="(max-width: 430px) 33vw, 144px"
                  className="object-cover transition-opacity group-hover:opacity-80"
                />
              ) : isVideo && post.video_url ? (
                // Video post without a poster thumbnail — show a dark tile
                // with a play icon; user sees the frame once they open it.
                <div className="absolute inset-0 bg-gradient-to-br from-black via-deep to-black flex items-center justify-center">
                  <Icon name="video" size={22} className="text-white/30" />
                </div>
              ) : (
                // Text-only — render a colored card with a snippet
                <div className="absolute inset-0 bg-gradient-to-br from-hc-purple/20 via-royal/30 to-midnight p-2 flex items-center">
                  <p className="text-[10px] text-white/70 line-clamp-5 leading-snug">
                    {post.body || ""}
                  </p>
                </div>
              )}

              {/* Type indicator (top-right) */}
              {isVideo && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                    <polygon points="6,4 20,12 6,20" />
                  </svg>
                </div>
              )}

              {/* Hover overlay with stats — desktop only */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 pointer-events-none">
                <div className="flex items-center gap-3 w-full">
                  <span className="text-[10px] text-white flex items-center gap-1">
                    <Icon name="heart-pulse" size={10} className="text-white" />
                    {totalReactions}
                  </span>
                  <span className="text-[10px] text-white flex items-center gap-1">
                    <Icon name="chat" size={10} className="text-white" />
                    {post.comment_count ?? 0}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Fullscreen post viewer overlay */}
      {openIndex != null && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[400] bg-midnight overflow-y-auto overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-label="Posts"
        >
          {/* Sticky close bar */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-midnight via-midnight/90 to-transparent pointer-events-none">
            <button
              onClick={() => setOpenIndex(null)}
              className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white press hover:bg-black/80 pointer-events-auto shadow-lg"
              aria-label="Close posts"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <span className="font-heading font-bold text-white text-sm drop-shadow pointer-events-none">
              Posts
            </span>
            <div className="w-11 h-11" />
          </div>

          {/* Stacked posts */}
          <div className="max-w-[430px] mx-auto flex flex-col gap-3 px-3 pb-24 -mt-12">
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
      )}
    </>
  );
}
