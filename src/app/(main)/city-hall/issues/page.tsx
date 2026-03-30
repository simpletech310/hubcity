"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Chip from "@/components/ui/Chip";
import type { CityIssue } from "@/types/database";

const ISSUE_ICONS: Record<string, string> = {
  pothole: "🕳️",
  streetlight: "💡",
  graffiti: "🎨",
  trash: "🗑️",
  flooding: "🌊",
  parking: "🅿️",
  noise: "🔊",
  sidewalk: "🚶",
  tree: "🌳",
  parks: "🏞️",
  water: "💧",
  stray: "🐕",
  safety: "🚨",
  other: "📋",
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
  reported: "gold",
  acknowledged: "cyan",
  in_progress: "purple",
  resolved: "emerald",
  closed: "coral",
};

const ISSUE_TYPES = [
  "all",
  "pothole",
  "streetlight",
  "graffiti",
  "trash",
  "flooding",
  "sidewalk",
  "parks",
  "safety",
  "other",
];

const STATUS_FILTERS = ["all", "reported", "acknowledged", "in_progress", "resolved"];

export default function CityIssuesPage() {
  const [issues, setIssues] = useState<CityIssue[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    in_progress: 0,
    resolved_this_month: 0,
  });
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/issues?${params}`);
      if (res.ok) {
        const data = await res.json();
        setIssues(data.issues);
        setStats(data.stats);
      }
      setLoading(false);
    }
    load();
  }, [typeFilter, statusFilter]);

  function daysSince(date: string) {
    const d = Math.floor(
      (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (d === 0) return "Today";
    if (d === 1) return "1 day ago";
    return `${d} days ago`;
  }

  return (
    <div className="animate-fade-in pb-24">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-coral/20 via-midnight to-midnight" />
        <div className="relative px-5 pt-6 pb-8">
          <Link
            href="/city-hall"
            className="inline-flex items-center gap-1.5 text-gold text-sm font-semibold mb-4 press"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M10 12L6 8l4-4" />
            </svg>
            City Hall
          </Link>
          <h1 className="font-heading text-2xl font-bold mb-1">
            City Issue Tracker
          </h1>
          <p className="text-sm text-txt-secondary">
            Report issues. Track progress. Hold the city accountable.
          </p>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="px-5 -mt-3 mb-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Reported", value: stats.total, color: "#F2A900" },
            { label: "In Progress", value: stats.in_progress, color: "#8B5CF6" },
            { label: "Resolved (Month)", value: stats.resolved_this_month, color: "#10B981" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl bg-card border border-border-subtle p-3 text-center"
            >
              <p className="text-xl font-bold" style={{ color: s.color }}>
                {s.value}
              </p>
              <p className="text-[10px] text-txt-secondary mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Report CTA */}
      <div className="px-5 mb-5">
        <div className="rounded-xl bg-gradient-to-r from-coral/10 to-gold/10 border border-coral/20 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-coral/20 flex items-center justify-center shrink-0">
              <span className="text-lg">📢</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">Report an Issue</p>
              <p className="text-xs text-txt-secondary">
                Use <span className="text-gold font-semibold">#pothole</span>,{" "}
                <span className="text-gold font-semibold">#streetlight</span>,{" "}
                <span className="text-gold font-semibold">#graffiti</span> in
                your Pulse posts to auto-report!
              </p>
            </div>
            <Link
              href="/pulse"
              className="px-3 py-1.5 bg-coral text-white text-xs font-bold rounded-lg press shrink-0"
            >
              Post
            </Link>
          </div>
        </div>
      </div>

      {/* Type Filters */}
      <div className="px-5 mb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {ISSUE_TYPES.map((t) => (
            <Chip
              key={t}
              label={
                t === "all"
                  ? "All"
                  : `${ISSUE_ICONS[t] || ""} ${t.charAt(0).toUpperCase() + t.slice(1)}`
              }
              active={typeFilter === t}
              onClick={() => setTypeFilter(t)}
            />
          ))}
        </div>
      </div>

      {/* Status Filters */}
      <div className="px-5 mb-5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {STATUS_FILTERS.map((s) => (
            <Chip
              key={s}
              label={s === "all" ? "All Statuses" : STATUS_CONFIG[s]?.label || s}
              active={statusFilter === s}
              onClick={() => setStatusFilter(s)}
            />
          ))}
        </div>
      </div>

      {/* Issues List */}
      <div className="px-5 space-y-3">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && issues.length === 0 && (
          <Card>
            <div className="text-center py-8">
              <p className="text-3xl mb-3">🎉</p>
              <p className="text-sm font-semibold">No issues found</p>
              <p className="text-xs text-txt-secondary mt-1">
                {typeFilter !== "all" || statusFilter !== "all"
                  ? "Try different filters"
                  : "Compton is looking good!"}
              </p>
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
                {/* Left accent bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ backgroundColor: statusCfg.color }}
                />

                <div className="pl-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg shrink-0">
                        {ISSUE_ICONS[issue.type] || "📋"}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">
                          {issue.title}
                        </p>
                        {issue.location_text && (
                          <p className="text-xs text-txt-secondary truncate">
                            📍 {issue.location_text}
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
                            i <= stepIndex ? statusCfg.color : "rgba(255,255,255,0.06)",
                        }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-txt-secondary">
                    <div className="flex items-center gap-3">
                      <span>👍 {issue.upvote_count}</span>
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
