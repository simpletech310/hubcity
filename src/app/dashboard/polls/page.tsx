"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";

interface PollSummary {
  id: string;
  question: string;
  poll_type: string;
  status: string;
  total_votes: number;
  is_anonymous: boolean;
  ends_at: string | null;
  created_at: string;
}

export default function DashboardPollsPage() {
  const [polls, setPolls] = useState<PollSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/polls?all=true");
      const data = await res.json();
      setPolls(data.polls ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const activePolls = polls.filter((p) => p.status === "active");
  const closedPolls = polls.filter((p) => p.status === "closed");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl text-white">Polls</h1>
          <p className="text-sm text-txt-secondary mt-1">
            Create polls and view results from the community.
          </p>
        </div>
        <Link
          href="/pulse"
          className="px-4 py-2 bg-gradient-to-r from-gold to-gold-light text-midnight rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
        >
          Create Poll
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : polls.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl block mb-3"><Icon name="chart" size={28} /></span>
          <p className="text-sm font-medium mb-1">No polls created yet</p>
          <p className="text-xs text-txt-secondary mb-4">
            Go to Pulse to create your first poll.
          </p>
        </div>
      ) : (
        <>
          {/* Active Polls */}
          {activePolls.length > 0 && (
            <section>
              <h2 className="font-heading font-bold text-sm text-white mb-3 flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-emerald" />
                Active ({activePolls.length})
              </h2>
              <div className="space-y-3">
                {activePolls.map((poll) => (
                  <PollRow key={poll.id} poll={poll} />
                ))}
              </div>
            </section>
          )}

          {/* Closed Polls */}
          {closedPolls.length > 0 && (
            <section>
              <h2 className="font-heading font-bold text-sm text-white/60 mb-3 flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-white/20" />
                Closed ({closedPolls.length})
              </h2>
              <div className="space-y-3">
                {closedPolls.map((poll) => (
                  <PollRow key={poll.id} poll={poll} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function PollRow({ poll }: { poll: PollSummary }) {
  const timeAgo = getTimeAgo(poll.created_at);
  const isActive = poll.status === "active";

  return (
    <Link href={`/dashboard/polls/${poll.id}`}>
      <Card hover padding>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                label={isActive ? "Active" : "Closed"}
                variant={isActive ? "emerald" : "coral"}
              />
              <Badge
                label={poll.poll_type === "temperature_check" ? "Temp Check" : "Multiple Choice"}
                variant="cyan"
              />
              {poll.is_anonymous && (
                <Badge label="Anonymous" variant="purple" />
              )}
            </div>
            <p className="text-[13px] font-semibold text-white line-clamp-2 mt-1.5">
              {poll.question}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[11px] text-txt-secondary">
                {poll.total_votes} vote{poll.total_votes !== 1 ? "s" : ""}
              </span>
              <span className="text-[11px] text-txt-secondary">{timeAgo}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-2xl font-bold text-gold">{poll.total_votes}</span>
            <p className="text-[10px] text-txt-secondary">votes</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffDay < 1) return "Today";
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
