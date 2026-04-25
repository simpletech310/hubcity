"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { CityIssue } from "@/types/database";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

const ISSUE_ICONS: Record<string, string> = {
  pothole: "alert", streetlight: "lightbulb", graffiti: "palette", trash: "trash",
  flooding: "alert", parking: "🅿•", noise: "bell", sidewalk: "person",
  tree: "tree", parks: "tree", water: "heart-pulse", stray: "alert", safety: "alert", other: "document",
};

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  reported: { color: "#F2A900", label: "Reported" },
  acknowledged: { color: "#3B82F6", label: "Acknowledged" },
  in_progress: { color: "#8B5CF6", label: "In Progress" },
  resolved: { color: "#10B981", label: "Resolved" },
  closed: { color: "#6B7280", label: "Closed" },
};

type BadgeVariant = "gold" | "cyan" | "purple" | "emerald" | "coral";

const STATUS_BADGE: Record<string, BadgeVariant> = {
  reported: "gold", acknowledged: "cyan", in_progress: "purple",
  resolved: "emerald", closed: "coral",
};

export default function MyReportedIssuesPage() {
  const [issues, setIssues] = useState<CityIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/issues?mine=true");
      if (res.ok) {
        const data = await res.json();
        setIssues(data.issues);
      }
      setLoading(false);
    }
    load();
  }, []);

  function daysSince(date: string) {
    const d = Math.floor(
      (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (d === 0) return "Today";
    if (d === 1) return "1 day ago";
    return `${d} days ago`;
  }

  return (
    <div className="culture-surface min-h-dvh animate-fade-in pb-24">
      {/* Header */}
      <div
        className="px-[18px] pt-5 pb-5"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <Link
          href="/city-hall/issues"
          className="inline-flex items-center gap-1.5 text-sm font-semibold mb-3 press"
          style={{ color: "var(--ink-strong)" }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M10 12L6 8l4-4" />
          </svg>
          Issue Tracker
        </Link>
        <div className="c-kicker" style={{ opacity: 0.65 }}>§ CITY HALL · MY REPORTS</div>
        <h1 className="c-hero mt-2" style={{ fontSize: 48, lineHeight: 0.9 }}>My Issues.</h1>
        <p className="c-serif-it mt-2" style={{ fontSize: 13 }}>
          Track the status of issues you have reported.
        </p>
      </div>

      {/* Issues List */}
      <div className="px-5 space-y-3 mt-5">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && issues.length === 0 && (
          <Card>
            <div className="text-center py-8">
              <p className="text-3xl mb-3"><Icon name="document" size={28} /></p>
              <p className="text-sm font-semibold">No issues reported yet</p>
              <p className="text-xs c-meta mt-1">
                See a problem in Compton? Report it and track its progress here.
              </p>
              <Link href="/city-hall/issues/new" className="c-btn c-btn-primary c-btn-sm mt-4">
                Report an Issue
              </Link>
            </div>
          </Card>
        )}

        {issues.map((issue) => {
          const statusCfg = STATUS_CONFIG[issue.status] || STATUS_CONFIG.reported;
          const steps = ["reported", "acknowledged", "in_progress", "resolved"];
          const stepIndex = steps.indexOf(issue.status);

          return (
            <Link key={issue.id} href={`/city-hall/issues/${issue.id}`}>
              <Card hover className="relative overflow-hidden">
                <div
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ backgroundColor: statusCfg.color }}
                />
                <div className="pl-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="shrink-0">
                        <Icon name={(ISSUE_ICONS[issue.type] || "document") as IconName} size={20} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">
                          {issue.title}
                        </p>
                        {issue.location_text && (
                          <p className="text-xs c-meta truncate">
                            <Icon name="pin" size={16} /> {issue.location_text}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge
                      label={statusCfg.label}
                      variant={STATUS_BADGE[issue.status] || "gold"}
                    />
                  </div>

                  {/* Progress bar */}
                  <div className="flex gap-1 mb-2">
                    {steps.map((step, i) => (
                      <div
                        key={step}
                        className="h-1 flex-1 rounded-full"
                        style={{
                          backgroundColor:
                            i <= stepIndex ? statusCfg.color : "var(--rule-strong-c)",
                        }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs c-meta">
                    <div className="flex items-center gap-3">
                      <span><Icon name="heart-pulse" size={16} /> {issue.upvote_count}</span>
                      {issue.district && <span>District {issue.district}</span>}
                      {issue.assigned_department && (
                        <span>{issue.assigned_department}</span>
                      )}
                    </div>
                    <span>{daysSince(issue.created_at)}</span>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
