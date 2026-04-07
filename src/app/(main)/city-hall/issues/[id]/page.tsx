"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { CityIssue } from "@/types/database";

const ISSUE_ICONS: Record<string, string> = {
  pothole: "🕳️", streetlight: "💡", graffiti: "🎨", trash: "🗑️",
  flooding: "🌊", parking: "🅿️", noise: "🔊", sidewalk: "🚶",
  tree: "🌳", parks: "🏞️", water: "💧", stray: "🐕", safety: "🚨", other: "📋",
};

type BadgeVariant = "gold" | "cyan" | "purple" | "emerald" | "coral";
const STATUS_BADGE: Record<string, BadgeVariant> = {
  reported: "gold", acknowledged: "cyan", in_progress: "purple", resolved: "emerald", closed: "coral",
};

const STATUS_LABELS: Record<string, string> = {
  reported: "Reported", acknowledged: "Acknowledged",
  in_progress: "In Progress", resolved: "Resolved", closed: "Closed",
};

interface IssueComment {
  id: string;
  issue_id: string;
  author_id: string;
  body: string;
  is_official: boolean;
  created_at: string;
  author: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    role: string;
  };
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  city_official: "City Official",
  city_ambassador: "Ambassador",
  citizen: "Citizen",
};

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const issueId = params?.id as string;

  const [issue, setIssue] = useState<CityIssue | null>(null);
  const [userUpvoted, setUserUpvoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState(false);
  const [comments, setComments] = useState<IssueComment[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (!issueId) return;
    async function load() {
      const [issueRes, commentsRes] = await Promise.all([
        fetch(`/api/issues/${issueId}`),
        fetch(`/api/issues/${issueId}/comments`),
      ]);
      if (issueRes.ok) {
        const data = await issueRes.json();
        setIssue(data.issue);
        setUserUpvoted(data.user_upvoted);
      }
      if (commentsRes.ok) {
        const data = await commentsRes.json();
        setComments(data.comments);
      }
      setLoading(false);
    }
    load();
  }, [issueId]);

  async function handleAddComment() {
    if (!commentBody.trim() || submittingComment) return;
    setSubmittingComment(true);
    const res = await fetch(`/api/issues/${issueId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: commentBody }),
    });
    if (res.ok) {
      const data = await res.json();
      setComments((prev) => [...prev, data.comment]);
      setCommentBody("");
    }
    setSubmittingComment(false);
  }

  async function handleUpvote() {
    if (upvoting) return;
    setUpvoting(true);
    const res = await fetch(`/api/issues/${issueId}/upvote`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setUserUpvoted(data.upvoted);
      if (issue) setIssue({ ...issue, upvote_count: data.count });
    }
    setUpvoting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center">
        <p className="text-coral font-semibold mb-2">Issue not found</p>
        <Button variant="secondary" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const steps = ["reported", "acknowledged", "in_progress", "resolved"];
  const currentStep = steps.indexOf(issue.status);

  function formatDate(d: string | null) {
    if (!d) return null;
    return new Date(d).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
    });
  }

  return (
    <div className="animate-fade-in pb-24">
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <Link
          href="/city-hall/issues"
          className="inline-flex items-center gap-1.5 text-gold text-sm font-semibold press"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M10 12L6 8l4-4" />
          </svg>
          Issue Tracker
        </Link>
      </div>

      <div className="px-5">
        {/* Title Card */}
        <Card className="mb-5">
          <div className="flex items-start gap-3">
            <span className="text-3xl">{ISSUE_ICONS[issue.type] || "📋"}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge label={issue.type.replace("_", " ")} variant="gold" />
                <Badge label={STATUS_LABELS[issue.status]} variant={STATUS_BADGE[issue.status]} />
                {issue.priority !== "normal" && (
                  <Badge
                    label={issue.priority}
                    variant={issue.priority === "critical" ? "coral" : issue.priority === "high" ? "gold" : "cyan"}
                  />
                )}
              </div>
              <h1 className="font-heading text-lg font-bold leading-snug">{issue.title}</h1>
            </div>
          </div>
        </Card>

        {/* Progress Timeline */}
        <div className="mb-5">
          <h2 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-3">
            Status Timeline
          </h2>
          <div className="space-y-0">
            {steps.map((step, i) => {
              const isActive = i <= currentStep;
              const isCurrent = i === currentStep;
              const colors = {
                reported: "#F2A900", acknowledged: "#3B82F6",
                in_progress: "#8B5CF6", resolved: "#10B981",
              };
              const color = colors[step as keyof typeof colors] || "#6B7280";
              const timestamps: Record<string, string | null> = {
                reported: issue.created_at,
                acknowledged: issue.acknowledged_at,
                in_progress: issue.acknowledged_at, // Use acknowledged as proxy
                resolved: issue.resolved_at,
              };

              return (
                <div key={step} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${isCurrent ? "scale-125" : ""}`}
                      style={{
                        borderColor: isActive ? color : "rgba(255,255,255,0.1)",
                        backgroundColor: isActive ? color : "transparent",
                      }}
                    />
                    {i < steps.length - 1 && (
                      <div
                        className="w-0.5 h-8"
                        style={{
                          backgroundColor: i < currentStep ? color : "rgba(255,255,255,0.06)",
                        }}
                      />
                    )}
                  </div>
                  <div className={`pb-4 ${!isActive ? "opacity-40" : ""}`}>
                    <p className="text-sm font-semibold" style={{ color: isActive ? color : undefined }}>
                      {STATUS_LABELS[step]}
                    </p>
                    {isActive && timestamps[step] && (
                      <p className="text-[11px] text-txt-secondary">
                        {formatDate(timestamps[step])}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Details */}
        {issue.description && (
          <Card className="mb-4">
            <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-2">
              Description
            </h3>
            <p className="text-sm whitespace-pre-wrap">{issue.description}</p>
          </Card>
        )}

        {/* Location */}
        {issue.location_text && (
          <Card className="mb-4">
            <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-2">
              Location
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-lg">📍</span>
              <p className="text-sm">{issue.location_text}</p>
            </div>
            {issue.district && (
              <p className="text-xs text-txt-secondary mt-1 ml-7">
                District {issue.district}
              </p>
            )}
          </Card>
        )}

        {/* Image */}
        {issue.image_url && (
          <div className="mb-4 rounded-xl overflow-hidden">
            <img src={issue.image_url} alt="Issue photo" className="w-full" />
          </div>
        )}

        {/* Department */}
        {issue.assigned_department && (
          <Card className="mb-4">
            <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-2">
              Assigned Department
            </h3>
            <p className="text-sm font-semibold">{issue.assigned_department}</p>
            {issue.forwarded_at && (
              <p className="text-xs text-emerald mt-1">
                ✓ Forwarded {formatDate(issue.forwarded_at)}
              </p>
            )}
          </Card>
        )}

        {/* Resolution */}
        {issue.resolution_notes && (
          <Card className="mb-4 border-emerald/20">
            <h3 className="text-xs font-semibold text-emerald uppercase tracking-wider mb-2">
              Resolution
            </h3>
            <p className="text-sm">{issue.resolution_notes}</p>
            {issue.resolved_at && (
              <p className="text-xs text-txt-secondary mt-2">
                Resolved {formatDate(issue.resolved_at)}
              </p>
            )}
          </Card>
        )}

        {/* Upvote */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleUpvote}
            disabled={upvoting}
            className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 press transition-all ${
              userUpvoted
                ? "bg-gold/20 border border-gold/40 text-gold"
                : "bg-card border border-border-subtle text-txt-secondary"
            }`}
          >
            👍 {userUpvoted ? "Upvoted" : "Upvote"} · {issue.upvote_count}
          </button>

          {issue.source_post_id && (
            <Link
              href="/pulse"
              className="flex-1 py-3 rounded-xl bg-card border border-border-subtle text-sm font-bold text-center press"
            >
              💬 View Post
            </Link>
          )}
        </div>

        {/* Updates / Comments Section */}
        <div className="mt-8">
          <h2 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-4">
            Updates & Comments
          </h2>

          {comments.length === 0 && (
            <p className="text-sm text-txt-secondary mb-4">
              No updates yet. Be the first to comment.
            </p>
          )}

          <div className="space-y-3 mb-6">
            {comments.map((comment) => (
              <Card
                key={comment.id}
                className={comment.is_official ? "border-gold/30" : ""}
              >
                <div className="flex items-start gap-3">
                  {comment.author?.avatar_url ? (
                    <img
                      src={comment.author.avatar_url}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      {comment.author?.display_name?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold truncate">
                        {comment.author?.display_name || "Unknown"}
                      </span>
                      {comment.is_official && (
                        <Badge label={ROLE_LABELS[comment.author?.role] || "Official"} variant="gold" />
                      )}
                      {!comment.is_official && comment.author?.role && comment.author.role !== "citizen" && (
                        <Badge label={ROLE_LABELS[comment.author.role] || comment.author.role} variant="cyan" />
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                    <p className="text-[11px] text-txt-secondary mt-1.5">
                      {formatDate(comment.created_at)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Comment Input */}
          <Card>
            <textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Add an update or comment..."
              rows={3}
              className="w-full bg-transparent text-sm resize-none outline-none placeholder:text-txt-secondary/50 mb-3"
            />
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={handleAddComment}
                disabled={!commentBody.trim() || submittingComment}
              >
                {submittingComment ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
