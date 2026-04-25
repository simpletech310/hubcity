"use client";

import Link from "next/link";
import Image from "next/image";
import type { CivicOfficial } from "@/types/database";

interface OfficialCardProps {
  official: CivicOfficial;
  compact?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function OfficialCard({ official, compact = false }: OfficialCardProps) {
  const initials = getInitials(official.name);
  const flagCount = official.flags?.length ?? 0;
  const isUpForElection = official.term_expires?.includes("UP FOR ELECTION");

  return (
    <Link
      href={`/officials/${official.id}`}
      className={`group block transition-all ${compact ? "p-3" : "p-4"}`}
      style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={`shrink-0 rounded-full flex items-center justify-center overflow-hidden ${compact ? "w-10 h-10" : "w-14 h-14"}`}
          style={{ background: "var(--paper-soft)", border: "2px solid var(--rule-strong-c)" }}
        >
          {official.photo_url ? (
            <Image
              src={official.photo_url}
              alt={official.name}
              width={compact ? 40 : 56}
              height={compact ? 40 : 56}
              className="w-full h-full object-cover"
            />
          ) : (
            <span
              className={`font-bold text-gold font-heading ${
                compact ? "text-xs" : "text-sm"
              }`}
            >
              {initials}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={`font-bold truncate ${compact ? "text-[13px]" : "text-[15px]"}`}
              style={{ color: "var(--ink-strong)" }}
            >
              {official.name}
            </h3>
            {flagCount > 0 && (
              <span className="inline-flex items-center justify-center w-4.5 h-4.5 rounded-full bg-red-500/15 text-red-400 text-[9px] font-bold tabular-nums shrink-0">
                {flagCount}
              </span>
            )}
          </div>

          <p className="text-[12px] c-meta truncate">{official.title}</p>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {/* District badge */}
            {official.district && (
              <span className="inline-flex items-center rounded-full border border-gold/20 bg-gold/10 px-2 py-0.5 text-[9px] font-semibold text-gold uppercase tracking-wide">
                District {official.district}
              </span>
            )}

            {/* Trustee Area badge */}
            {official.trustee_area && (
              <span className="inline-flex items-center rounded-full border border-gold/20 bg-hc-purple/10 px-2 py-0.5 text-[9px] font-semibold text-gold uppercase tracking-wide">
                Area {official.trustee_area}
              </span>
            )}

            {/* Party */}
            {official.party && !compact && (
              <span className="text-[10px] c-meta">{official.party}</span>
            )}
          </div>

          {/* Extended info (non-compact only) */}
          {!compact && (
            <>
              {/* Running for */}
              {official.running_for && (
                <p className="mt-2 text-[11px] text-gold/80 font-medium">
                  Running for: {official.running_for}
                </p>
              )}

              {/* Election status */}
              {isUpForElection && (
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold text-amber-400 uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Up for Election
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
