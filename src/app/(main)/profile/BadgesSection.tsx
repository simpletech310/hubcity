"use client";

import { useEffect, useState, useCallback } from "react";

interface CitizenBadge {
  id: string;
  user_id: string;
  badge_type: string;
  badge_name: string;
  badge_icon: string;
  earned_at: string;
}

const ALL_BADGE_TYPES: { type: string; icon: string; name: string }[] = [
  { type: "first_post", icon: "\u270D\uFE0F", name: "First Post" },
  { type: "first_rsvp", icon: "\uD83C\uDF9F\uFE0F", name: "Event Goer" },
  { type: "first_order", icon: "\uD83D\uDED2", name: "First Purchase" },
  { type: "pollster", icon: "\uD83D\uDDF3\uFE0F", name: "Voice of the People" },
  { type: "voice_heard", icon: "\uD83D\uDCE3", name: "Voice Heard" },
  { type: "community_champion", icon: "\uD83C\uDFC6", name: "Community Champion" },
  { type: "issue_reporter", icon: "\uD83D\uDD27", name: "City Fixer" },
  { type: "shop_local_5", icon: "\uD83D\uDECD\uFE0F", name: "Shop Local Hero" },
  { type: "district_pride", icon: "\uD83D\uDCCD", name: "District Pride" },
];

export default function BadgesSection() {
  const [earnedBadges, setEarnedBadges] = useState<CitizenBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBadges = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/badges/check", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setEarnedBadges(data.badges ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  const earnedTypes = new Set(earnedBadges.map((b) => b.badge_type));

  return (
    <section className="px-5 mb-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-5" style={{ background: "var(--gold-c)" }} />
        <h2 className="c-card-t" style={{ fontSize: 16, color: "var(--ink-strong)" }}>Achievements</h2>
        <span className="c-meta" style={{ fontSize: 10 }}>
          {earnedBadges.length}/{ALL_BADGE_TYPES.length}
        </span>
        <button
          onClick={() => fetchBadges(true)}
          disabled={refreshing}
          className="ml-auto flex items-center gap-1 c-kicker press disabled:opacity-50"
          style={{ color: "var(--ink-strong)", fontSize: 10, letterSpacing: "0.12em" }}
        >
          <svg
            width="12"
            height="12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className={refreshing ? "animate-spin" : ""}
          >
            <path d="M1 6a5 5 0 0 1 9-3M11 6a5 5 0 0 1-9 3" />
            <path d="M10 1v2.5H7.5M2 11V8.5H4.5" />
          </svg>
          {refreshing ? "CHECKING..." : "CHECK"}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-3 h-[88px] animate-pulse"
              style={{
                background: "var(--paper-soft)",
                border: "2px solid var(--rule-strong-c)",
              }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5">
          {ALL_BADGE_TYPES.map((badge) => {
            const earned = earnedTypes.has(badge.type);
            const earnedBadge = earnedBadges.find(
              (b) => b.badge_type === badge.type
            );

            return (
              <div
                key={badge.type}
                className="p-3 text-center relative overflow-hidden"
                style={{
                  background: earned ? "var(--paper-warm)" : "var(--paper-soft)",
                  border: "2px solid var(--rule-strong-c)",
                  opacity: earned ? 1 : 0.45,
                }}
              >
                {earned && (
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "var(--gold-c)" }} />
                )}
                <div
                  className={`text-2xl mb-1.5 ${
                    earned ? "" : "grayscale blur-[1px]"
                  }`}
                >
                  {earned ? badge.icon : "?"}
                </div>
                <p
                  className="c-kicker"
                  style={{
                    fontSize: 10,
                    color: "var(--ink-strong)",
                    opacity: earned ? 1 : 0.6,
                    letterSpacing: "0.08em",
                  }}
                >
                  {badge.name}
                </p>
                {earned && earnedBadge && (
                  <p className="c-meta mt-0.5" style={{ fontSize: 9, opacity: 0.6 }}>
                    {new Date(earnedBadge.earned_at).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric" }
                    )}
                  </p>
                )}
                {!earned && (
                  <p className="c-meta mt-0.5" style={{ fontSize: 9, opacity: 0.5 }}>
                    Locked
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
