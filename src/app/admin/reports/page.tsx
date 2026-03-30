"use client";

import { useState, useEffect, useCallback } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import type { ContentReport, ReportStatus } from "@/types/database";

interface ReportWithReporter extends Omit<ContentReport, "reporter"> {
  reporter: { id: string; display_name: string; avatar_url: string | null } | null;
}

const STATUS_FILTERS: { label: string; value: ReportStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Reviewed", value: "reviewed" },
  { label: "Dismissed", value: "dismissed" },
];

const REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  inappropriate: "Inappropriate",
  harassment: "Harassment",
  misinformation: "Misinformation",
  other: "Other",
};

const CONTENT_TYPE_BADGE: Record<string, { label: string; variant: "gold" | "emerald" | "coral" | "cyan" | "purple" | "blue" }> = {
  post: { label: "Post", variant: "cyan" },
  comment: { label: "Comment", variant: "purple" },
  business: { label: "Business", variant: "emerald" },
  event: { label: "Event", variant: "gold" },
  review: { label: "Review", variant: "coral" },
};

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportWithReporter[]>([]);
  const [filter, setFilter] = useState<ReportStatus | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const url =
        filter === "all"
          ? "/api/reports?status=pending"
          : `/api/reports?status=${filter}`;

      if (filter === "all") {
        // Fetch all statuses
        const [pending, reviewed, dismissed] = await Promise.all([
          fetch("/api/reports?status=pending").then((r) => r.json()),
          fetch("/api/reports?status=reviewed").then((r) => r.json()),
          fetch("/api/reports?status=dismissed").then((r) => r.json()),
        ]);
        const all = [
          ...(pending.reports || []),
          ...(reviewed.reports || []),
          ...(dismissed.reports || []),
        ].sort(
          (a: ReportWithReporter, b: ReportWithReporter) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setReports(all);
      } else {
        const res = await fetch(url);
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  async function handleDismiss(reportId: string) {
    setActionLoading(reportId);
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "dismissed" }),
      });
      if (res.ok) {
        fetchReports();
      }
    } catch (err) {
      console.error("Failed to dismiss report:", err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleTakeAction(reportId: string) {
    const notes = prompt("Enter admin notes for this action:");
    if (notes === null) return;

    setActionLoading(reportId);
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "reviewed", action_taken: notes }),
      });
      if (res.ok) {
        fetchReports();
      }
    } catch (err) {
      console.error("Failed to take action:", err);
    } finally {
      setActionLoading(null);
    }
  }

  const statusBadge = (status: ReportStatus) => {
    switch (status) {
      case "pending":
        return <Badge label="Pending" variant="gold" />;
      case "reviewed":
        return <Badge label="Reviewed" variant="emerald" />;
      case "dismissed":
        return <Badge label="Dismissed" variant="purple" />;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold mb-1">
            Content Reports
          </h1>
          <p className="text-sm text-txt-secondary">
            {reports.length} report{reports.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            active={filter === f.value}
            onClick={() => setFilter(f.value)}
          />
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-white/5 rounded w-1/3" />
                <div className="h-3 bg-white/5 rounded w-2/3" />
                <div className="h-3 bg-white/5 rounded w-1/4" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const typeBadge = CONTENT_TYPE_BADGE[report.content_type] || {
              label: report.content_type,
              variant: "blue" as const,
            };

            return (
              <Card key={report.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge
                        label={typeBadge.label}
                        variant={typeBadge.variant}
                      />
                      <Badge
                        label={REASON_LABELS[report.reason] || report.reason}
                        variant="coral"
                      />
                      {statusBadge(report.status)}
                    </div>

                    <p className="text-xs text-txt-secondary mb-1">
                      Reported by{" "}
                      <span className="text-white font-medium">
                        {report.reporter?.display_name || "Unknown User"}
                      </span>
                    </p>

                    {report.details && (
                      <p className="text-xs text-txt-secondary line-clamp-2 mb-2 bg-white/[0.03] rounded-lg px-3 py-2 border border-border-subtle">
                        &ldquo;{report.details}&rdquo;
                      </p>
                    )}

                    {report.action_taken && (
                      <p className="text-xs text-emerald/80 mb-2">
                        Admin notes: {report.action_taken}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[10px] text-txt-secondary">
                      <span>{timeAgo(report.created_at)}</span>
                      <span className="text-white/20">|</span>
                      <span>ID: {report.content_id.slice(0, 8)}...</span>
                    </div>
                  </div>

                  {report.status === "pending" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismiss(report.id)}
                        loading={actionLoading === report.id}
                      >
                        Dismiss
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleTakeAction(report.id)}
                        loading={actionLoading === report.id}
                      >
                        Take Action
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}

          {reports.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🛡️</p>
              <p className="text-sm text-txt-secondary">
                {filter === "pending"
                  ? "No pending reports"
                  : "No reports found"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
