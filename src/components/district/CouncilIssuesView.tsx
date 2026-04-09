"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";

interface Issue {
  id: string;
  title: string;
  issue_type: string;
  status: string;
  priority: string;
  location_text: string | null;
  upvote_count: number;
  created_at: string;
}

interface CouncilIssuesViewProps {
  district: number;
}

const STATUS_FILTERS = ["all", "reported", "in_progress", "resolved"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const STATUS_LABELS: Record<string, string> = {
  all: "All",
  reported: "Reported",
  in_progress: "In Progress",
  resolved: "Resolved",
};

const STATUS_COLORS: Record<string, string> = {
  reported: "bg-gold/15 text-gold border-gold/30",
  acknowledged: "bg-cyan/15 text-cyan border-cyan/30",
  in_progress: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  resolved: "bg-emerald/15 text-emerald border-emerald/30",
  closed: "bg-white/10 text-white/30 border-white/10",
};

const ISSUE_TYPE_COLORS: Record<string, string> = {
  pothole: "bg-gold/15 text-gold",
  streetlight: "bg-cyan/15 text-cyan",
  graffiti: "bg-pink-500/15 text-pink-400",
  trash: "bg-emerald/15 text-emerald",
  flooding: "bg-blue-500/15 text-blue-400",
  parking: "bg-purple-500/15 text-purple-400",
  noise: "bg-coral/15 text-coral",
  sidewalk: "bg-gold/15 text-gold",
  tree: "bg-emerald/15 text-emerald",
  parks: "bg-emerald/15 text-emerald",
  water: "bg-blue-500/15 text-blue-400",
  stray: "bg-pink-500/15 text-pink-400",
  safety: "bg-coral/15 text-coral",
  other: "bg-white/10 text-white/40",
};

const ISSUE_TYPE_ICONS: Record<string, string> = {
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
  stray: "🐾",
  safety: "⚠️",
  other: "📋",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function CouncilIssuesView({ district }: CouncilIssuesViewProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");

  const fetchIssues = useCallback(async () => {
    try {
      const res = await fetch(`/api/districts/${district}/issues`);
      if (res.ok) {
        const data = await res.json();
        setIssues(data.issues || []);
      }
    } catch {
      // silent
    }
    setLoading(false);
  }, [district]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const filtered = filter === "all" ? issues : issues.filter((i) => i.status === filter);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {STATUS_FILTERS.map((s) => (
            <div key={s} className="h-8 w-20 rounded-full bg-white/5 animate-pulse flex-shrink-0" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card-elevated rounded-2xl p-4 animate-pulse">
            <div className="space-y-2">
              <div className="h-3 bg-white/10 rounded w-1/4" />
              <div className="h-3.5 bg-white/10 rounded w-2/3" />
              <div className="h-2.5 bg-white/5 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              filter === s
                ? "border-gold/30 bg-gold/10 text-gold"
                : "border-border-subtle bg-white/5 text-txt-secondary hover:text-white"
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card variant="glass-elevated">
          <p className="text-sm text-txt-secondary text-center py-6">No reported issues</p>
        </Card>
      ) : (
        filtered.map((issue) => (
          <Link
            key={issue.id}
            href={`/city-hall/issues/${issue.id}`}
            className="block glass-card-elevated rounded-2xl p-4 press hover:border-white/10 transition-all"
          >
            <div className="flex items-start gap-3">
              {/* Issue type icon */}
              <div
                className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-base ${
                  ISSUE_TYPE_COLORS[issue.issue_type] || ISSUE_TYPE_COLORS.other
                }`}
              >
                {ISSUE_TYPE_ICONS[issue.issue_type] || ISSUE_TYPE_ICONS.other}
              </div>

              <div className="flex-1 min-w-0">
                {/* Badges row */}
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      STATUS_COLORS[issue.status] || STATUS_COLORS.closed
                    }`}
                  >
                    {issue.status.replace("_", " ")}
                  </span>
                  {(issue.priority === "high" || issue.priority === "critical") && (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-coral/15 text-coral border border-coral/30">
                      {issue.priority}
                    </span>
                  )}
                </div>

                {/* Title */}
                <p className="text-sm font-semibold text-white truncate">{issue.title}</p>

                {/* Meta row */}
                <div className="flex items-center gap-3 mt-1.5">
                  {issue.location_text && (
                    <span className="text-[11px] text-txt-secondary truncate">
                      {issue.location_text}
                    </span>
                  )}
                  <span className="text-[11px] text-txt-secondary flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                    {issue.upvote_count}
                  </span>
                  <span className="text-[10px] text-txt-secondary ml-auto flex-shrink-0">
                    {timeAgo(issue.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
