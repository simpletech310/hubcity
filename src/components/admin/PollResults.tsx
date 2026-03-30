"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { Poll, PollOption } from "@/types/database";

interface PollResultsProps {
  polls: (Poll & { options: PollOption[] })[];
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function PollCard({ poll }: { poll: Poll & { options: PollOption[] } }) {
  const [expanded, setExpanded] = useState(false);
  const [closing, setClosing] = useState(false);
  const router = useRouter();

  const sortedOptions = [...(poll.options || [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const maxVotes = Math.max(...sortedOptions.map((o) => o.vote_count), 1);

  const closePoll = async () => {
    if (!confirm("Close this poll? No more votes will be accepted.")) return;
    setClosing(true);
    try {
      const res = await fetch(`/api/polls/${poll.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setClosing(false);
    }
  };

  return (
    <Card>
      <button
        type="button"
        className="w-full text-left cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold leading-snug">
              {poll.question}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge
                label={poll.poll_type === "temperature_check" ? "Temp Check" : "Multiple Choice"}
                variant="cyan"
              />
              <Badge
                label={poll.status}
                variant={poll.status === "active" ? "emerald" : "coral"}
              />
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[10px] text-txt-secondary">
                {poll.total_votes} vote{poll.total_votes !== 1 ? "s" : ""}
              </span>
              <span className="text-[10px] text-txt-secondary">
                {formatDate(poll.created_at)}
              </span>
            </div>
          </div>
          <svg
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            className={`text-txt-secondary shrink-0 mt-1 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-border-subtle space-y-3">
          {sortedOptions.map((option) => {
            const pct =
              poll.total_votes > 0
                ? Math.round((option.vote_count / poll.total_votes) * 100)
                : 0;
            const barWidth =
              maxVotes > 0
                ? Math.round((option.vote_count / maxVotes) * 100)
                : 0;

            return (
              <div key={option.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">
                    {option.emoji && `${option.emoji} `}
                    {option.label}
                  </span>
                  <span className="text-txt-secondary">
                    {option.vote_count} ({pct}%)
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}

          {poll.status === "active" && (
            <div className="pt-2">
              <Button
                variant="danger"
                size="sm"
                onClick={closePoll}
                loading={closing}
              >
                Close Poll
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default function PollResults({ polls }: PollResultsProps) {
  if (polls.length === 0) {
    return (
      <Card className="text-center py-8">
        <p className="text-txt-secondary text-sm">No polls yet</p>
        <p className="text-xs text-txt-secondary mt-1">
          Create polls from the community feed
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {polls.map((poll) => (
        <PollCard key={poll.id} poll={poll} />
      ))}
    </div>
  );
}
