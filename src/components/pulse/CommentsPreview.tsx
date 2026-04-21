"use client";

import Link from "next/link";

export type PreviewComment = {
  id: string;
  body: string;
  created_at: string;
  author_display_name: string;
  author_handle: string | null;
  author_verification_status?: string | null;
};

/**
 * Instagram-style inline comment preview — renders up to 2 top-level comments
 * under a post plus a "View all N comments" tap-target. Used by PostCard
 * and GroupPostCard.
 *
 *   @handle  body text…
 *   @handle  body text…
 *   View all 23 comments →
 */
export default function CommentsPreview({
  comments,
  totalCount,
  onOpen,
}: {
  comments: PreviewComment[];
  totalCount: number;
  onOpen: () => void;
}) {
  if (totalCount === 0) return null;

  return (
    <div className="px-4 pb-2 pt-1 space-y-1.5">
      {totalCount > 2 && (
        <button
          type="button"
          onClick={onOpen}
          className="block text-[11px] text-ivory/40 hover:text-ivory/70 press font-semibold uppercase tracking-editorial-tight"
        >
          View all {totalCount} comments →
        </button>
      )}
      {comments.slice(0, 2).map((c) => (
        <div key={c.id} className="flex gap-2 text-[12px] leading-snug">
          {c.author_handle ? (
            <Link
              href={`/user/${c.author_handle}`}
              className="shrink-0 font-semibold text-white hover:text-gold press"
            >
              {c.author_display_name}
            </Link>
          ) : (
            <span className="shrink-0 font-semibold text-white">
              {c.author_display_name}
            </span>
          )}
          <p className="text-ivory/70 line-clamp-2 min-w-0">{c.body}</p>
        </div>
      ))}
    </div>
  );
}
