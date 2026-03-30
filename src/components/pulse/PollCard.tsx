"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { Poll, PollOption } from "@/types/database";
import { ROLE_BADGE_MAP } from "@/lib/constants";

interface PollCardProps {
  poll: Poll;
  userId: string | null;
}

export default function PollCard({ poll, userId }: PollCardProps) {
  const [options, setOptions] = useState<PollOption[]>(
    [...(poll.options || [])].sort((a, b) => a.sort_order - b.sort_order)
  );
  const [userVote, setUserVote] = useState<string | null>(poll.user_vote ?? null);
  const [totalVotes, setTotalVotes] = useState(poll.total_votes);
  const [isVoting, setIsVoting] = useState(false);
  const [tempSelection, setTempSelection] = useState<number | null>(null);

  const author = poll.author;
  const initials = author?.display_name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  const roleBadge = author?.role ? ROLE_BADGE_MAP[author.role] : null;
  const isVerified =
    author?.verification_status === "verified" ||
    author?.role === "city_official" ||
    author?.role === "admin";

  const timeAgo = getTimeAgo(poll.created_at);
  const hasVoted = userVote !== null;
  const isClosed = poll.status === "closed";
  const showResults = hasVoted || isClosed;
  const timeRemaining = poll.ends_at ? getTimeRemaining(poll.ends_at) : null;

  const handleVote = useCallback(
    async (optionId: string) => {
      if (!userId || hasVoted || isClosed || isVoting) return;

      // Save for rollback
      const prevOptions = [...options];
      const prevTotal = totalVotes;

      // Optimistic update
      setIsVoting(true);
      setUserVote(optionId);
      setTotalVotes((prev) => prev + 1);
      setOptions((prev) =>
        prev.map((opt) =>
          opt.id === optionId
            ? { ...opt, vote_count: opt.vote_count + 1 }
            : opt
        )
      );

      try {
        const res = await fetch(`/api/polls/${poll.id}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ option_id: optionId }),
        });

        if (!res.ok) throw new Error();

        const data = await res.json();
        if (data.poll?.options) {
          setOptions(
            [...data.poll.options].sort(
              (a: PollOption, b: PollOption) => a.sort_order - b.sort_order
            )
          );
        }
        if (data.poll?.total_votes !== undefined) setTotalVotes(data.poll.total_votes);
        if (data.user_vote !== undefined) setUserVote(data.user_vote);
      } catch {
        // Rollback
        setUserVote(null);
        setOptions(prevOptions);
        setTotalVotes(prevTotal);
      } finally {
        setIsVoting(false);
      }
    },
    [userId, hasVoted, isClosed, isVoting, poll.id, options, totalVotes]
  );

  const handleTempVote = useCallback(() => {
    if (tempSelection === null) return;
    const option = options[tempSelection];
    if (option) handleVote(option.id);
  }, [tempSelection, options, handleVote]);

  return (
    <Card hover className="relative overflow-hidden">
      {/* Cyan accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan/40 via-cyan/20 to-transparent" />

      {/* Type label row */}
      <div className="flex items-center gap-1.5 text-[10px] text-cyan font-semibold mb-2.5 tracking-wide">
        <span>📊</span>
        POLL
        {isClosed && (
          <span className="ml-1">
            <Badge label="Poll Closed" variant="coral" />
          </span>
        )}
      </div>

      {/* Author row — matches PostCard exactly */}
      <div className="flex items-center gap-3 mb-3">
        {author?.avatar_url ? (
          <Image
            src={author.avatar_url}
            alt={author.display_name}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-white/5"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan to-royal flex items-center justify-center text-gold font-heading font-bold text-sm ring-2 ring-white/5">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-bold truncate">
              {author?.display_name || "Unknown"}
            </p>
            {isVerified && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-cyan shrink-0">
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              </svg>
            )}
            {roleBadge && (
              <Badge label={roleBadge.label} variant={roleBadge.variant} />
            )}
          </div>
          <p className="text-[10px] text-txt-secondary">{timeAgo}</p>
        </div>
      </div>

      {/* Question */}
      <p className="text-[14px] font-semibold text-txt-primary leading-snug mb-3">
        {poll.question}
      </p>

      {/* Poll body */}
      {poll.poll_type === "temperature_check" ? (
        <TemperatureCheck
          options={options}
          showResults={showResults}
          userVote={userVote}
          totalVotes={totalVotes}
          tempSelection={tempSelection}
          setTempSelection={setTempSelection}
          onSubmit={handleTempVote}
          disabled={!userId || isClosed || isVoting}
        />
      ) : (
        <MultipleChoice
          options={options}
          showResults={showResults}
          userVote={userVote}
          totalVotes={totalVotes}
          onVote={handleVote}
          disabled={!userId || isClosed || isVoting}
        />
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-subtle">
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-txt-secondary">
            {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
          </span>
          {timeRemaining && !isClosed && (
            <span className="text-[11px] text-txt-secondary">
              {timeRemaining}
            </span>
          )}
          {!userId && (
            <span className="text-[11px] text-gold">Sign in to vote</span>
          )}
        </div>
        <button
          className="text-[11px] text-txt-secondary hover:text-cyan transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            if (navigator.share) {
              navigator.share({ url: `/pulse/polls/${poll.id}` });
            }
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>
      </div>
    </Card>
  );
}

/* ── Temperature Check ─────────────────────────────── */

const TEMP_EMOJIS = ["🥶", "😬", "😐", "😊", "🔥"];

function TemperatureCheck({
  options,
  showResults,
  userVote,
  totalVotes,
  tempSelection,
  setTempSelection,
  onSubmit,
  disabled,
}: {
  options: PollOption[];
  showResults: boolean;
  userVote: string | null;
  totalVotes: number;
  tempSelection: number | null;
  setTempSelection: (v: number | null) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  if (showResults) {
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-base mb-1 px-1">
          <span>🥶</span>
          <span>🔥</span>
        </div>
        {options.map((opt, i) => {
          const pct = totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0;
          const isUserChoice = opt.id === userVote;
          return (
            <div key={opt.id} className="relative">
              <div
                className={`
                  rounded-xl py-2.5 px-3 text-[12px] flex justify-between items-center
                  transition-all duration-300
                  ${isUserChoice ? "bg-deep/50 ring-1 ring-cyan/40" : "bg-deep/50"}
                `}
              >
                <div
                  className="absolute inset-0 rounded-xl bg-cyan/10 transition-all duration-500 ease-out"
                  style={{ width: `${pct}%` }}
                />
                <span className="relative z-10 flex items-center gap-1.5">
                  <span className="text-base">{opt.emoji || TEMP_EMOJIS[i] || "🔵"}</span>
                  {opt.label && <span className="text-txt-secondary">{opt.label}</span>}
                  {isUserChoice && (
                    <span className="text-cyan text-[10px] font-semibold">✓</span>
                  )}
                </span>
                <span className="relative z-10 text-txt-secondary font-medium">
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Voting UI: emoji scale buttons with submit
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-base px-1">
        <span>🥶</span>
        <span>🔥</span>
      </div>
      <div className="flex gap-1.5">
        {options.map((opt, i) => {
          const isSelected = tempSelection === i;
          return (
            <button
              key={opt.id}
              disabled={disabled}
              onClick={() => setTempSelection(i)}
              className={`
                flex-1 h-12 rounded-xl text-lg font-medium transition-all duration-200
                ${
                  isSelected
                    ? "bg-cyan/15 ring-1 ring-cyan/50 scale-105"
                    : "bg-deep/50 hover:bg-deep/70"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95 press"}
              `}
            >
              {opt.emoji || TEMP_EMOJIS[i] || "🔵"}
            </button>
          );
        })}
      </div>
      {tempSelection !== null && (
        <button
          disabled={disabled}
          onClick={onSubmit}
          className={`
            w-full py-2.5 rounded-xl text-[12px] font-semibold transition-all duration-200
            bg-gradient-to-r from-cyan to-royal text-white
            ${disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-90 active:scale-[0.98] press"}
          `}
        >
          Submit
        </button>
      )}
    </div>
  );
}

/* ── Multiple Choice ───────────────────────────────── */

function MultipleChoice({
  options,
  showResults,
  userVote,
  totalVotes,
  onVote,
  disabled,
}: {
  options: PollOption[];
  showResults: boolean;
  userVote: string | null;
  totalVotes: number;
  onVote: (optionId: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const pct = totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0;
        const isUserChoice = opt.id === userVote;

        if (showResults) {
          return (
            <div key={opt.id} className="relative">
              <div
                className={`
                  rounded-xl py-2.5 px-3 text-[12px] flex justify-between items-center
                  transition-all duration-300 overflow-hidden
                  ${isUserChoice ? "bg-deep/50 ring-1 ring-cyan/40" : "bg-deep/50"}
                `}
              >
                <div
                  className="absolute inset-0 rounded-xl bg-cyan/10 transition-all duration-500 ease-out"
                  style={{ width: `${pct}%` }}
                />
                <span className="relative z-10 flex items-center gap-1.5">
                  {opt.emoji && <span className="text-base">{opt.emoji}</span>}
                  <span className={isUserChoice ? "font-semibold text-cyan" : ""}>
                    {opt.label}
                  </span>
                  {isUserChoice && (
                    <span className="text-cyan text-[10px] font-semibold">✓</span>
                  )}
                </span>
                <span className={`relative z-10 font-medium ${isUserChoice ? "text-cyan" : "text-txt-secondary"}`}>
                  {pct}%
                </span>
              </div>
            </div>
          );
        }

        return (
          <button
            key={opt.id}
            disabled={disabled}
            onClick={() => onVote(opt.id)}
            className={`
              w-full rounded-xl py-2.5 px-3 text-[12px] text-left
              bg-deep/50 hover:bg-deep/70 transition-all duration-200
              flex items-center gap-1.5
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-[0.98] press"}
            `}
          >
            {opt.emoji && <span className="text-base">{opt.emoji}</span>}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────── */

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getTimeRemaining(endsAt: string): string | null {
  const now = new Date();
  const end = new Date(endsAt);
  const diffMs = end.getTime() - now.getTime();

  if (diffMs <= 0) return null;

  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffDay > 0) return `Ends in ${diffDay}d`;
  if (diffHr > 0) return `Ends in ${diffHr}h`;
  if (diffMin > 0) return `Ends in ${diffMin}m`;
  return "Ending soon";
}
