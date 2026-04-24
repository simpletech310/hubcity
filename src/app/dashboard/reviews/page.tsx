"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import type { Profile } from "@/types/database";

// ── Types ────────────────────────────────────────────────────────────────────

type ReviewTab = "all" | "pending" | "replied";

interface ReviewRow {
  id: string;
  business_id: string;
  reviewer_id: string;
  rating: number;
  body: string | null;
  reply: string | null;
  replied_at: string | null;
  is_published: boolean;
  created_at: string;
  reviewer: Pick<Profile, "display_name" | "avatar_url"> | null;
}

// ── Constants ────────────────────────────────────────────────────────────────

const QUICK_REPLIES = [
  "Thank you for your kind words!",
  "We appreciate the feedback — we're working on it!",
  "Thanks for visiting, hope to see you again!",
] as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill={n <= rating ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={2}
          className={n <= rating ? "text-gold" : "text-white/20"}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      ))}
    </span>
  );
}

function Avatar({
  url,
  name,
  size = 36,
}: {
  url: string | null;
  name: string;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full bg-gold/15 flex items-center justify-center flex-shrink-0 text-gold font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials || "?"}
    </div>
  );
}

function TabChip({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[44px] px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
        active
          ? "bg-gold text-midnight"
          : "bg-white/6 text-txt-secondary hover:text-white hover:bg-white/10"
      }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            active ? "bg-midnight/20 text-midnight" : "bg-gold/20 text-gold"
          }`}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border-subtle bg-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-2.5 w-1/4" />
        </div>
        <Skeleton className="h-2.5 w-10 flex-shrink-0" />
      </div>
      <Skeleton className="h-2.5 w-full" />
      <Skeleton className="h-2.5 w-4/5" />
    </div>
  );
}

// ── Review card ───────────────────────────────────────────────────────────────

function ReviewCard({
  review,
  onReplySubmit,
}: {
  review: ReviewRow;
  onReplySubmit: (id: string, reply: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(review.reply ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReplied = !!review.reply;
  const reviewerName = review.reviewer?.display_name ?? "Reviewer";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    try {
      await onReplySubmit(review.id, trimmed);
      setOpen(false);
    } catch {
      setError("Failed to save reply. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function applyQuickReply(preset: string) {
    setText(preset);
  }

  return (
    <div className="rounded-2xl border border-border-subtle bg-card overflow-hidden">
      {/* Top row */}
      <div className="flex items-start gap-3 p-4">
        <Avatar url={review.reviewer?.avatar_url ?? null} name={reviewerName} size={40} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-sm font-semibold text-white truncate">{reviewerName}</p>
            <span className="text-[10px] text-txt-secondary flex-shrink-0">
              {relativeTime(review.created_at)}
            </span>
          </div>

          <StarRating rating={review.rating} />

          {review.body && (
            <p className="text-[13px] text-txt-secondary leading-relaxed mt-2">
              {review.body}
            </p>
          )}
        </div>
      </div>

      {/* Replied badge / existing reply */}
      {isReplied && !open && (
        <div className="mx-4 mb-4 rounded-xl bg-white/4 border border-border-subtle px-3.5 py-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gold">
              Your reply
            </span>
            <button
              onClick={() => {
                setText(review.reply ?? "");
                setOpen(true);
              }}
              className="text-[10px] text-txt-secondary hover:text-white transition-colors"
            >
              Edit
            </button>
          </div>
          <p className="text-[13px] text-txt-secondary leading-relaxed">
            {review.reply}
          </p>
        </div>
      )}

      {/* Reply action row */}
      {!isReplied && !open && (
        <div className="px-4 pb-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30">
            <span className="w-1.5 h-1.5 rounded-full bg-gold/60" />
            Awaiting reply
          </span>
          <button
            onClick={() => setOpen(true)}
            className="min-h-[36px] px-3.5 py-1.5 rounded-full bg-gold/10 text-gold text-xs font-semibold hover:bg-gold/20 transition-colors"
          >
            Reply
          </button>
        </div>
      )}

      {/* Inline reply form */}
      {open && (
        <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-3">
          {/* Quick reply chips */}
          <div className="flex flex-wrap gap-2">
            {QUICK_REPLIES.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => applyQuickReply(preset)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-border-subtle text-txt-secondary hover:text-white hover:bg-white/10 transition-colors leading-tight text-left"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Textarea */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your reply..."
            rows={3}
            className="w-full bg-white/5 border border-border-subtle rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-txt-secondary/50 focus:outline-none focus:border-gold/40 resize-none transition-colors"
            autoFocus
          />

          {error && <p className="text-[12px] text-coral">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError(null);
                setText(review.reply ?? "");
              }}
              className="flex-1 min-h-[40px] rounded-xl bg-white/5 text-txt-secondary text-sm font-medium hover:bg-white/10 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !text.trim()}
              className="flex-1 min-h-[40px] rounded-xl bg-gold text-midnight text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {saving ? "Saving…" : isReplied ? "Update" : "Post Reply"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Summary bar ───────────────────────────────────────────────────────────────

function SummaryBar({ reviews }: { reviews: ReviewRow[] }) {
  if (reviews.length === 0) return null;

  const avg =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const pending = reviews.filter((r) => !r.reply).length;

  return (
    <div className="rounded-2xl border border-gold/20 bg-gold/5 px-4 py-3.5 flex items-center gap-4">
      <div className="text-center min-w-[52px]">
        <p className="font-heading text-2xl font-bold text-gold leading-none">
          {avg.toFixed(1)}
        </p>
        <div className="flex justify-center mt-1">
          <StarRating rating={Math.round(avg)} />
        </div>
      </div>

      <div className="w-px h-10 bg-white/10 flex-shrink-0" />

      <div className="flex-1 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-semibold text-white">{reviews.length}</p>
          <p className="text-[10px] text-txt-secondary mt-0.5">
            Total review{reviews.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-white">{pending}</p>
          <p className="text-[10px] text-txt-secondary mt-0.5">
            Need{pending === 1 ? "s" : ""} reply
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: ReviewTab }) {
  const copy: Record<ReviewTab, { headline: string; sub: string }> = {
    all: {
      headline: "No reviews yet.",
      sub: "They'll appear here when customers review your business.",
    },
    pending: {
      headline: "All caught up!",
      sub: "No reviews are waiting for a reply.",
    },
    replied: {
      headline: "No replied reviews yet.",
      sub: "Reviews you've responded to will show here.",
    },
  };

  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mb-4">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="text-gold/60"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      </div>
      <p className="text-white font-medium text-sm mb-1.5">{copy[tab].headline}</p>
      <p className="text-txt-secondary text-xs leading-relaxed max-w-[240px]">
        {copy[tab].sub}
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState<ReviewTab>("all");
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);

  const supabase = createClient();

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const loadReviews = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // Get the business for this owner
    const { data: bizRow } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!bizRow?.id) {
      setLoading(false);
      return;
    }

    const { data: reviewData } = await supabase
      .from("business_reviews")
      .select(
        "*, reviewer:profiles!business_reviews_reviewer_id_fkey(display_name, avatar_url)"
      )
      .eq("business_id", bizRow.id)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (reviewData) {
      setReviews(reviewData as ReviewRow[]);
    }

    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // ── Reply handler ──────────────────────────────────────────────────────────
  async function handleReplySubmit(reviewId: string, replyText: string) {
    const { error } = await supabase
      .from("business_reviews")
      .update({ reply: replyText, replied_at: new Date().toISOString() })
      .eq("id", reviewId);

    if (error) throw error;

    // Optimistic update
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? { ...r, reply: replyText, replied_at: new Date().toISOString() }
          : r
      )
    );
  }

  // ── Filtered views ─────────────────────────────────────────────────────────
  const pendingReviews = reviews.filter((r) => !r.reply);
  const repliedReviews = reviews.filter((r) => !!r.reply);

  const visibleReviews =
    activeTab === "pending"
      ? pendingReviews
      : activeTab === "replied"
      ? repliedReviews
      : reviews;

  return (
    <div className="px-0 py-0">
      {/* Page header */}
      <div className="px-4 pt-5 pb-4 border-b border-border-subtle">
        <h1 className="font-heading text-xl font-bold">Reviews</h1>
        <p className="text-xs text-txt-secondary mt-0.5">
          Manage and reply to customer reviews
        </p>
      </div>

      {/* Tab strip */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide border-b border-border-subtle">
        <TabChip
          label="All"
          active={activeTab === "all"}
          count={reviews.length}
          onClick={() => setActiveTab("all")}
        />
        <TabChip
          label="Pending replies"
          active={activeTab === "pending"}
          count={pendingReviews.length}
          onClick={() => setActiveTab("pending")}
        />
        <TabChip
          label="Replied"
          active={activeTab === "replied"}
          onClick={() => setActiveTab("replied")}
        />
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <>
            <div className="h-[72px] skeleton rounded-2xl" />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            {/* Summary only on All tab */}
            {activeTab === "all" && <SummaryBar reviews={reviews} />}

            {visibleReviews.length === 0 ? (
              <EmptyState tab={activeTab} />
            ) : (
              visibleReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onReplySubmit={handleReplySubmit}
                />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
