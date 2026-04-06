"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface PollOption {
  id: string;
  label: string;
  emoji: string | null;
  vote_count: number;
  percentage: number;
}

interface Voter {
  option_id: string;
  created_at: string;
  voter?: { display_name: string; avatar_url: string | null };
}

interface TimelineEntry {
  hour: string;
  count: number;
}

interface PollResults {
  poll: {
    id: string;
    question: string;
    poll_type: string;
    status: string;
    total_votes: number;
    is_anonymous: boolean;
    ends_at: string | null;
    created_at: string;
    author: { id: string; display_name: string } | null;
  };
  options: PollOption[];
  voters: Voter[];
  timeline: TimelineEntry[];
  total_votes: number;
}

export default function PollResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<PollResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [closingPoll, setClosingPoll] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/polls/${id}/results`);
      if (!res.ok) {
        setError("Failed to load poll results");
        setLoading(false);
        return;
      }
      const json = await res.json();
      setData(json);
      setLoading(false);
    }
    load();
  }, [id]);

  const handleClosePoll = async () => {
    if (!data || closingPoll) return;
    setClosingPoll(true);
    try {
      const res = await fetch(`/api/polls/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });
      if (res.ok) {
        setData({
          ...data,
          poll: { ...data.poll, status: "closed" },
        });
      }
    } catch {
      // ignore
    } finally {
      setClosingPoll(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="skeleton h-40 rounded-2xl" />
        <div className="skeleton h-60 rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-16">
        <span className="text-5xl block mb-3">⚠️</span>
        <p className="text-sm font-medium mb-1">{error || "Poll not found"}</p>
        <Link href="/dashboard/polls" className="text-gold text-sm font-semibold">
          Back to Polls
        </Link>
      </div>
    );
  }

  const { poll, options, voters, timeline } = data;
  const maxVotes = Math.max(...options.map((o) => o.vote_count), 1);
  const winnerIdx = options.reduce((best, opt, i) =>
    opt.vote_count > options[best].vote_count ? i : best, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/dashboard/polls" className="inline-flex items-center gap-1.5 text-gold text-sm font-semibold mb-3">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10 12L6 8l4-4" /></svg>
          All Polls
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge
                label={poll.status === "active" ? "Active" : "Closed"}
                variant={poll.status === "active" ? "emerald" : "coral"}
              />
              <Badge
                label={poll.poll_type === "temperature_check" ? "Temp Check" : "Multiple Choice"}
                variant="cyan"
              />
            </div>
            <h1 className="font-display text-xl text-white leading-tight">{poll.question}</h1>
            <p className="text-xs text-txt-secondary mt-1.5">
              Created {new Date(poll.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              {poll.author ? ` by ${(Array.isArray(poll.author) ? poll.author[0] : poll.author)?.display_name}` : ""}
            </p>
          </div>
          {poll.status === "active" && (
            <button
              onClick={handleClosePoll}
              disabled={closingPoll}
              className="shrink-0 px-4 py-2 bg-coral/10 text-coral border border-coral/20 rounded-xl text-xs font-bold hover:bg-coral/20 transition-colors"
            >
              {closingPoll ? "Closing..." : "Close Poll"}
            </button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card padding>
          <p className="text-[10px] text-txt-secondary uppercase tracking-wider font-semibold">Total Votes</p>
          <p className="text-2xl font-bold text-gold mt-1">{poll.total_votes}</p>
        </Card>
        <Card padding>
          <p className="text-[10px] text-txt-secondary uppercase tracking-wider font-semibold">Options</p>
          <p className="text-2xl font-bold text-white mt-1">{options.length}</p>
        </Card>
        <Card padding>
          <p className="text-[10px] text-txt-secondary uppercase tracking-wider font-semibold">Status</p>
          <p className={`text-lg font-bold mt-1 ${poll.status === "active" ? "text-emerald" : "text-coral"}`}>
            {poll.status === "active" ? "Live" : "Closed"}
          </p>
        </Card>
      </div>

      {/* Results Chart */}
      <Card padding>
        <h2 className="font-heading font-bold text-sm mb-4 flex items-center gap-2">
          <span>📊</span> Results Breakdown
        </h2>
        <div className="space-y-3">
          {options.map((opt, i) => {
            const isWinner = i === winnerIdx && poll.total_votes > 0;
            const barWidth = poll.total_votes > 0 ? (opt.vote_count / maxVotes) * 100 : 0;

            return (
              <div key={opt.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-medium flex items-center gap-1.5">
                    {opt.emoji && <span>{opt.emoji}</span>}
                    {opt.label}
                    {isWinner && <span className="text-gold text-[10px]">👑</span>}
                  </span>
                  <span className="text-[12px] text-txt-secondary">
                    {opt.vote_count} ({opt.percentage}%)
                  </span>
                </div>
                <div className="h-8 bg-deep/50 rounded-lg overflow-hidden relative">
                  <div
                    className={`h-full rounded-lg transition-all duration-700 ease-out ${isWinner ? "bg-gradient-to-r from-gold/40 to-gold/20" : "bg-cyan/20"}`}
                    style={{ width: `${barWidth}%` }}
                  />
                  <div className="absolute inset-0 flex items-center px-3">
                    <span className={`text-[11px] font-bold ${isWinner ? "text-gold" : "text-white/60"}`}>
                      {opt.percentage}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Vote Timeline */}
      {timeline.length > 0 && (
        <Card padding>
          <h2 className="font-heading font-bold text-sm mb-4 flex items-center gap-2">
            <span>📈</span> Vote Activity
          </h2>
          <div className="flex items-end gap-1 h-24">
            {timeline.map((entry, i) => {
              const maxCount = Math.max(...timeline.map((t) => t.count), 1);
              const height = (entry.count / maxCount) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 min-w-[4px] group relative"
                  title={`${entry.hour}: ${entry.count} votes`}
                >
                  <div
                    className="w-full bg-cyan/30 rounded-t transition-all hover:bg-cyan/50"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[9px] text-txt-secondary">
              {timeline[0]?.hour.split(" ")[0]}
            </span>
            <span className="text-[9px] text-txt-secondary">
              {timeline[timeline.length - 1]?.hour.split(" ")[0]}
            </span>
          </div>
        </Card>
      )}

      {/* Voters List (non-anonymous) */}
      {!poll.is_anonymous && voters.length > 0 && (
        <Card padding>
          <h2 className="font-heading font-bold text-sm mb-4 flex items-center gap-2">
            <span>👥</span> Recent Voters ({voters.length})
          </h2>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {voters.slice(0, 50).map((v, i) => {
              const opt = options.find((o) => o.id === v.option_id);
              return (
                <div key={i} className="flex items-center gap-3 py-1.5">
                  <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    {v.voter?.avatar_url ? (
                      <img src={v.voter.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-txt-secondary">
                        {v.voter?.display_name?.[0]?.toUpperCase() ?? "?"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[12px] font-medium text-white truncate block">
                      {v.voter?.display_name ?? "User"}
                    </span>
                  </div>
                  <span className="text-[11px] text-txt-secondary shrink-0">
                    {opt?.emoji} {opt?.label}
                  </span>
                  <span className="text-[10px] text-txt-secondary shrink-0">
                    {new Date(v.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {poll.is_anonymous && (
        <div className="text-center py-4">
          <span className="text-[11px] text-txt-secondary">
            🔒 This poll is anonymous — individual votes are hidden.
          </span>
        </div>
      )}
    </div>
  );
}
