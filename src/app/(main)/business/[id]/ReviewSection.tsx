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
  const sizeClass = size === "lg" ? "text-xl" : size === "md" ? "text-base" : "text-sm";
  return (
    <span className={`inline-flex gap-0.5 ${sizeClass}`} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= Math.round(rating) ? "text-gold" : "text-white/15"}>
          <Icon name="star" size={16} />
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
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`text-2xl transition-transform duration-150 press ${
            star <= (hovered || value) ? "text-gold scale-110" : "text-white/20 hover:text-white/40"
          }`}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          role="radio"
          aria-checked={star === value}
        >
          <Icon name="star" size={16} />
        </button>
      ))}
    </div>
  );
}

function DistributionBar({ star, count, max }: { star: number; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-txt-secondary w-4 text-right">{star}</span>
      <span className="text-gold text-[10px]"><Icon name="star" size={16} className="text-gold" /></span>
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full bg-gold transition-all duration-500"
          style={{ width: `${pct}%` }}
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
        <div className="mb-3 rounded-xl bg-emerald/10 border border-emerald/20 px-4 py-2.5 text-sm text-emerald font-medium">
          Review submitted successfully!
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
                className="w-full bg-white/5 border border-border-subtle rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-txt-secondary/50 focus:outline-none focus:border-gold/40 resize-none transition-colors"
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

      {/* Reviews list */}
      {reviews.length > 0 ? (
        <div className="space-y-2.5">
          {reviews.map((review) => (
            <Card key={review.id} padding={false}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    {/* Avatar placeholder */}
                    <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                      <span className="text-gold text-xs font-bold">
                        {(review.profiles?.display_name || "A")[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold leading-tight">
                        {review.profiles?.display_name || "Anonymous"}
                      </p>
                      <p className="text-[10px] text-txt-secondary">{formatDate(review.created_at)}</p>
                    </div>
                  </div>
                  <StarDisplay rating={review.rating} size="sm" />
                </div>
                {review.comment && (
                  <p className="text-[13px] text-txt-secondary leading-relaxed mt-1">
                    {review.comment}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        !showForm && (
          <div className="rounded-2xl bg-card border border-border-subtle p-6 text-center">
            <p className="text-txt-secondary text-sm">No reviews yet</p>
            <p className="text-[11px] text-txt-secondary/60 mt-1">Be the first to share your experience</p>
          </div>
        )
      )}
    </div>
  );
}
