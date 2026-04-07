"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import type { CityIssue } from "@/types/database";

type BadgeVariant = "gold" | "cyan" | "purple" | "emerald" | "coral";
const STATUS_BADGE: Record<string, BadgeVariant> = {
  reported: "gold", acknowledged: "cyan", in_progress: "purple", resolved: "emerald", closed: "coral",
};

const ISSUE_ICONS: Record<string, IconName> = {
  pothole: "alert", streetlight: "lightbulb", graffiti: "palette", trash: "trash",
  flooding: "rain", parking: "parking", noise: "bell", sidewalk: "person",
  tree: "tree", parks: "tree", water: "rain", stray: "shield", safety: "shield", other: "document",
};

const STATUSES = ["all", "reported", "acknowledged", "in_progress", "resolved", "closed"];
const NEXT_STATUS: Record<string, string> = {
  reported: "acknowledged",
  acknowledged: "in_progress",
  in_progress: "resolved",
};

export default function AdminIssuesPage() {
  const [issues, setIssues] = useState<CityIssue[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadIssues();
  }, [statusFilter]);

  async function loadIssues() {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res = await fetch(`/api/issues?${params}`);
    if (res.ok) {
      const data = await res.json();
      setIssues(data.issues);
    }
    setLoading(false);
  }

  async function updateStatus(issueId: string, newStatus: string, notes?: string) {
    setUpdating(issueId);
    const body: Record<string, string> = { status: newStatus };
    if (notes) body.resolution_notes = notes;

    const res = await fetch(`/api/issues/${issueId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      setIssues((prev) =>
        prev.map((i) => (i.id === issueId ? data.issue : i))
      );
    }
    setUpdating(null);
  }

  async function updatePriority(issueId: string, priority: string) {
    const res = await fetch(`/api/issues/${issueId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority }),
    });
    if (res.ok) {
      const data = await res.json();
      setIssues((prev) =>
        prev.map((i) => (i.id === issueId ? data.issue : i))
      );
    }
  }

  function daysSince(date: string) {
    const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    return d === 0 ? "Today" : d === 1 ? "1d" : `${d}d`;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold mb-1">City Issues</h1>
        <p className="text-sm text-txt-secondary">
          {issues.length} issues · Manage, prioritize, and resolve
        </p>
      </div>

      {/* Export */}
      <div className="mb-4 flex gap-2">
        <a
          href="/api/admin/export/issues"
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-border-subtle text-xs font-semibold text-txt-secondary hover:text-white transition-colors"
        >
          <Icon name="download" size={12} className="inline mr-1" />Export CSV
        </a>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 flex-wrap mb-4">
        {STATUSES.map((s) => (
          <Chip
            key={s}
            label={s === "all" ? "All" : s.replace("_", " ")}
            active={statusFilter === s}
            onClick={() => setStatusFilter(s)}
          />
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="space-y-2">
        {!loading && issues.length === 0 && (
          <Card>
            <p className="text-sm text-txt-secondary text-center py-4">
              No issues found.
            </p>
          </Card>
        )}

        {issues.map((issue) => {
          const next = NEXT_STATUS[issue.status];

          return (
            <Card key={issue.id}>
              <div className="flex items-start gap-3">
                <span className="shrink-0">
                  <Icon name={ISSUE_ICONS[issue.type] || "document"} size={22} className="text-txt-secondary" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-sm font-bold">{issue.title}</p>
                    <Badge
                      label={issue.status.replace("_", " ")}
                      variant={STATUS_BADGE[issue.status]}
                    />
                    <Badge
                      label={issue.priority}
                      variant={
                        issue.priority === "critical"
                          ? "coral"
                          : issue.priority === "high"
                            ? "gold"
                            : "cyan"
                      }
                    />
                  </div>

                  <div className="flex items-center gap-3 text-xs text-txt-secondary mb-2">
                    {issue.location_text && (
                      <span className="flex items-center gap-0.5"><Icon name="pin" size={10} /> {issue.location_text}</span>
                    )}
                    {issue.district && <span>D{issue.district}</span>}
                    <span className="flex items-center gap-0.5"><Icon name="trending" size={10} /> {issue.upvote_count}</span>
                    <span>{daysSince(issue.created_at)}</span>
                    {issue.assigned_department && (
                      <span>→ {issue.assigned_department}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Advance Status */}
                    {next && (
                      <Button
                        size="sm"
                        loading={updating === issue.id}
                        onClick={() => {
                          if (next === "resolved") {
                            const notes = prompt("Resolution notes:");
                            updateStatus(issue.id, next, notes || undefined);
                          } else {
                            updateStatus(issue.id, next);
                          }
                        }}
                      >
                        → {next.replace("_", " ")}
                      </Button>
                    )}

                    {/* Priority buttons */}
                    {["low", "normal", "high", "critical"].map((p) => (
                      <button
                        key={p}
                        onClick={() => updatePriority(issue.id, p)}
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                          issue.priority === p
                            ? "bg-gold/20 text-gold"
                            : "bg-white/5 text-txt-secondary hover:text-white"
                        }`}
                      >
                        {p}
                      </button>
                    ))}

                    {/* Close */}
                    {issue.status === "resolved" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateStatus(issue.id, "closed")}
                      >
                        Close
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
