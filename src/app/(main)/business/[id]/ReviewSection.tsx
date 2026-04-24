"use client";

import { useEffect, useState, useCallback } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";

interface BusinessReview {
  id: string;
  business_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { display_name: string | null } | null;
}

interface ReviewStats {
  avg_rating: number;
  total: number;
  distribution: Record<number, number>;
}

function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const iconSize = size === "lg" ? 20 : size === "md" ? 16 : 14;
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{
            color: star <= Math.round(rating) ? "var(--gold-c)" : "var(--ink-strong)",
            opacity: star <= Math.round(rating) ? 1 : 0.2,
          }}
        >
          <Icon name="star" size={iconSize} />
        </span>
      ))}
    </span>
  );
}

function StarSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="inline-flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const on = star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            className="transition-transform duration-150 press"
            style={{
              color: on ? "var(--gold-c)" : "var(--ink-strong)",
              opacity: on ? 1 : 0.25,
              transform: on ? "scale(1.1)" : "scale(1)",
            }}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            role="radio"
            aria-checked={star === value}
          >
            <Icon name="star" size={22} />
          </button>
        );
      })}
    </div>
  );
}

function DistributionBar({ star, count, max }: { star: number; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span
        className="c-kicker w-4 text-right"
        style={{ fontSize: 10, opacity: 0.65 }}
      >
        {star}
      </span>
      <Icon name="star" size={10} style={{ color: "var(--gold-c)" }} />
      <div
        className="flex-1 overflow-hidden"
        style={{
          height: 6,
          background: "var(--paper-soft)",
          border: "1.5px solid var(--rule-strong-c)",
        }}
      >
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${pct}%`, background: "var(--gold-c)" }}
        />
      </div>
      <span className="text-[11px] text-txt-secondary w-6 text-right">{count}</span>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ReviewSection({ businessId }: { businessId: string }) {
  const [reviews, setReviews] = useState<BusinessReview[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?business_id=${businessId}`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      const data = await res.json();
      setReviews(data.reviews ?? []);
      setStats(data.stats ?? null);
    } catch {
      // Silently fail — section just shows empty state
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: businessId,
          rating,
          comment: comment.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to submit review");
      }

      setSuccess(true);
      setRating(0);
      setComment("");
      setShowForm(false);
      await fetchReviews();

      // Clear success message after 3s
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="px-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full bg-gold" />
          <h2 className="font-heading font-bold text-base">Reviews</h2>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl bg-card border border-border-subtle p-4 animate-pulse">
              <div className="h-3 bg-white/5 rounded w-1/3 mb-2" />
              <div className="h-2 bg-white/5 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const maxDistribution = stats
    ? Math.max(...Object.values(stats.distribution), 1)
    : 1;

  return (
    <div className="px-5 mb-6">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-gold" />
          <h2 className="font-heading font-bold text-base">Reviews</h2>
          {stats && stats.total > 0 && (
            <span className="text-xs text-txt-secondary">({stats.total})</span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setShowForm(!showForm);
            setError(null);
          }}
        >
          {showForm ? "Cancel" : "Write a Review"}
        </Button>
      </div>

      {/* Success message */}
      {success && (
        <div
          className="mb-3 px-4 py-2.5"
          style={{
            background: "var(--gold-c)",
            border: "2px solid var(--rule-strong-c)",
            color: "var(--ink-strong)",
            fontSize: 13,
            fontFamily: "var(--font-archivo-narrow), sans-serif",
            fontWeight: 800,
          }}
        >
          REVIEW SUBMITTED SUCCESSFULLY
        </div>
      )}

      {/* Rating summary */}
      {stats && stats.total > 0 && (
        <Card className="mb-3">
          <div className="flex items-start gap-5">
            {/* Big average */}
            <div className="text-center shrink-0">
              <p className="font-heading text-3xl font-bold text-gold">
                {stats.avg_rating.toFixed(1)}
              </p>
              <StarDisplay rating={stats.avg_rating} size="md" />
              <p className="text-[10px] text-txt-secondary mt-1">
                {stats.total} review{stats.total !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Distribution bars */}
            <div className="flex-1 space-y-1.5 pt-1">
              {[5, 4, 3, 2, 1].map((star) => (
                <DistributionBar
                  key={star}
                  star={star}
                  count={stats.distribution[star] ?? 0}
                  max={maxDistribution}
                />
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Write a Review form */}
      {showForm && (
        <Card className="mb-3">
          <form onSubmit={handleSubmit}>
            <p className="text-sm font-bold mb-3">Your Review</p>

            {/* Star selector */}
            <div className="mb-3">
              <label className="text-[11px] text-txt-secondary uppercase tracking-wider font-semibold block mb-1.5">
                Rating
              </label>
              <StarSelector value={rating} onChange={setRating} />
            </div>

            {/* Comment */}
            <div className="mb-4">
              <label
                htmlFor="review-comment"
                className="text-[11px] text-txt-secondary uppercase tracking-wider font-semibold block mb-1.5"
              >
                Comment (optional)
              </label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
                rows={3}
                className="w-full px-3 py-2 focus:outline-none resize-none"
                style={{
                  background: "var(--paper-warm)",
                  border: "2px solid var(--rule-strong-c)",
                  color: "var(--ink-strong)",
                  fontSize: 14,
                  fontFamily: "var(--font-fraunces), serif",
                }}
              />
            </div>

            {error && (
              <p className="text-coral text-xs mb-3">{error}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
              fullWidth
            >
              Submit Review
            </Button>
          </form>
        </Card>
      )}

      {/* Reviews list — 2px ink row dividers, no cards */}
      {reviews.length > 0 ? (
        <div>
          {reviews.map((review, i) => (
            <div
              key={review.id}
              className="py-4"
              style={{
                borderTop: i === 0 ? "2px solid var(--rule-strong-c)" : undefined,
                borderBottom: "2px solid var(--rule-strong-c)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: "var(--gold-c)",
                      border: "2px solid var(--rule-strong-c)",
                      color: "var(--ink-strong)",
                      fontFamily: "var(--font-archivo), Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: 13,
                    }}
                  >
                    {(review.profiles?.display_name || "A")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="c-card-t" style={{ fontSize: 13, color: "var(--ink-strong)" }}>
                      {review.profiles?.display_name || "Anonymous"}
                    </p>
                    <p className="c-kicker" style={{ fontSize: 9, opacity: 0.6 }}>
                      {formatDate(review.created_at).toUpperCase()}
                    </p>
                  </div>
                </div>
                <StarDisplay rating={review.rating} size="sm" />
              </div>
              {review.comment && (
                <p
                  className="c-body mt-2"
                  style={{ fontSize: 13, color: "var(--ink-strong)", lineHeight: 1.45 }}
                >
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        !showForm && (
          <div
            className="p-6 text-center"
            style={{
              background: "var(--paper)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            <p
              className="c-serif-it"
              style={{ fontSize: 14, color: "var(--ink-strong)", opacity: 0.8 }}
            >
              No reviews yet
            </p>
            <p
              className="c-kicker mt-1"
              style={{ fontSize: 10, opacity: 0.55 }}
            >
              BE THE FIRST TO SHARE YOUR EXPERIENCE
            </p>
          </div>
        )
      )}
    </div>
  );
}
