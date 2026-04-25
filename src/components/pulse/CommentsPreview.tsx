"use client";

export type PreviewComment = {
  id: string;
  body: string;
  created_at: string;
  author_display_name: string;
  author_handle: string | null;
  author_verification_status?: string | null;
};

/**
 * Always-visible inline comment section beneath a PostCard.
 *
 * • 0 comments   → "Be the first to comment…" tap target
 * • 1–2 comments → inline author + body rows, tappable to open sheet
 * • 3+ comments  → "View all N comments →" + 2 inline preview rows
 *
 * Tapping any element opens the full CommentsSheet (via onOpen).
 * Comment reactions live inside the CommentsSheet itself.
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
  // When there are more comments than the 2-row preview, or when we have a
  // count but no fetched previews (e.g. logged-out), show the "View all" link.
  const showViewAll =
    totalCount > 2 || (totalCount > 0 && comments.length === 0);

  return (
    <div
      className="px-4 pb-3 pt-2"
      style={{ borderTop: "2px solid var(--rule-strong-c)" }}
    >
      {/* View all link */}
      {showViewAll && (
        <button
          type="button"
          onClick={onOpen}
          className="c-kicker block press mb-1.5"
          style={{ color: "var(--ink-strong)", opacity: 0.6 }}
        >
          View all {totalCount} comment{totalCount !== 1 ? "s" : ""} →
        </button>
      )}

      {/* Inline preview rows — tappable, open full sheet */}
      {comments.slice(0, 2).map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={onOpen}
          className="flex gap-2 text-left w-full press mb-0.5"
          style={{ fontSize: 12, lineHeight: 1.35 }}
        >
          <span
            className="shrink-0 font-semibold"
            style={{ color: "var(--ink-strong)" }}
          >
            {c.author_display_name}
          </span>
          <span
            className="line-clamp-1 min-w-0 c-body"
            style={{ color: "var(--ink-strong)", opacity: 0.72 }}
          >
            {c.body}
          </span>
        </button>
      ))}

      {/* Empty state CTA */}
      {totalCount === 0 && (
        <button
          type="button"
          onClick={onOpen}
          className="press c-meta"
          style={{ color: "var(--ink-strong)", opacity: 0.4 }}
        >
          Be the first to comment…
        </button>
      )}
    </div>
  );
}
