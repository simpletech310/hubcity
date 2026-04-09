"use client";

import { useState } from "react";
import ImpactBadge from "@/components/officials/ImpactBadge";
import PositionBadge from "@/components/officials/PositionBadge";

interface VoteRecord {
  id: string;
  title: string;
  description?: string;
  category: string;
  vote_date: string;
  result: string;
  impact_level: string;
  aftermath?: string;
  position: string;
  notes?: string | null;
}

interface VotingRecordTableProps {
  votes: VoteRecord[];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const CATEGORY_COLORS: Record<string, string> = {
  budget: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  infrastructure: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  public_safety: "bg-red-500/15 text-red-400 border-red-500/20",
  housing: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  development: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  personnel: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  policy: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
};

export default function VotingRecordTable({ votes }: VotingRecordTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (votes.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
        <p className="text-sm text-white/40">No voting records available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {votes.map((vote) => {
        const isExpanded = expandedId === vote.id;
        const catStyle =
          CATEGORY_COLORS[vote.category] ||
          "bg-zinc-500/15 text-zinc-400 border-zinc-500/20";

        return (
          <div
            key={vote.id}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden transition-colors hover:border-zinc-700"
          >
            {/* Header row — always visible */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : vote.id)}
              className="w-full flex items-start gap-3 p-4 text-left"
            >
              {/* Date */}
              <span className="shrink-0 text-[11px] text-white/30 tabular-nums pt-0.5 w-[72px]">
                {formatDate(vote.vote_date)}
              </span>

              {/* Title + badges */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white leading-snug">
                  {vote.title}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${catStyle}`}
                  >
                    {vote.category.replace(/_/g, " ")}
                  </span>
                  <ImpactBadge level={vote.impact_level as "low" | "medium" | "high"} />
                  <PositionBadge position={vote.position} />
                </div>
              </div>

              {/* Expand indicator */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`shrink-0 text-white/20 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Expanded details */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-0 border-t border-zinc-800/60">
                <div className="pt-3 space-y-3">
                  {/* Result */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-white/30 uppercase tracking-wide font-semibold">
                      Result
                    </span>
                    <span className="text-[12px] text-white/70">{vote.result}</span>
                  </div>

                  {/* Description */}
                  {vote.description && (
                    <div>
                      <span className="text-[11px] text-white/30 uppercase tracking-wide font-semibold block mb-1">
                        Description
                      </span>
                      <p className="text-[12px] text-white/60 leading-relaxed">
                        {vote.description}
                      </p>
                    </div>
                  )}

                  {/* Aftermath */}
                  {vote.aftermath && (
                    <div>
                      <span className="text-[11px] text-white/30 uppercase tracking-wide font-semibold block mb-1">
                        Aftermath
                      </span>
                      <p className="text-[12px] text-white/60 leading-relaxed">
                        {vote.aftermath}
                      </p>
                    </div>
                  )}

                  {/* Notes */}
                  {vote.notes && (
                    <div>
                      <span className="text-[11px] text-white/30 uppercase tracking-wide font-semibold block mb-1">
                        Notes
                      </span>
                      <p className="text-[12px] text-white/50 italic leading-relaxed">
                        {vote.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
