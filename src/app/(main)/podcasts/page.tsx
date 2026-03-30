"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Card from "@/components/ui/Card";
import Chip from "@/components/ui/Chip";
import Badge from "@/components/ui/Badge";
import type { Podcast, Channel } from "@/types/database";

// ---------------------------------------------------------------------------
// Channel filter config
// ---------------------------------------------------------------------------

type PodcastWithChannel = Podcast & { channel?: Channel };

const channelFilters = [
  { label: "All", value: "all", icon: "🎙️" },
  { label: "City Hall", value: "city_hall", icon: "🏛️" },
  { label: "Community", value: "community", icon: "🤝" },
  { label: "Culture", value: "culture", icon: "🎨" },
  { label: "Business", value: "business", icon: "💼" },
  { label: "Sports", value: "sports", icon: "⚽" },
];

const channelBadgeVariant: Record<string, "gold" | "blue" | "coral" | "emerald" | "pink" | "purple" | "cyan"> = {
  city_hall: "blue",
  community: "emerald",
  culture: "pink",
  business: "gold",
  sports: "coral",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number | null): string {
  if (!seconds) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatListens(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function PodcastsPage() {
  const [activeChannel, setActiveChannel] = useState("all");
  const [podcasts, setPodcasts] = useState<PodcastWithChannel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPodcasts() {
      setLoading(true);
      try {
        const url =
          activeChannel === "all"
            ? "/api/podcasts"
            : `/api/podcasts?channel_id=${activeChannel}`;
        const res = await fetch(url);
        const data = await res.json();
        setPodcasts(data.podcasts ?? []);
      } catch {
        setPodcasts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPodcasts();
  }, [activeChannel]);

  return (
    <div className="animate-fade-in pb-safe">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/8 via-deep to-hc-purple/8 pattern-dots" />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/50 to-transparent" />

        <div className="relative z-10 px-5 pt-6 pb-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center">
              <span className="text-base">🎙️</span>
            </div>
            <p className="text-[10px] text-gold font-bold uppercase tracking-[0.2em]">
              Hub City Media
            </p>
          </div>
          <h1 className="font-heading text-[26px] font-bold leading-tight mb-1.5">
            Podcasts
          </h1>
          <p className="font-display italic text-sm text-txt-secondary">
            Voices of Compton — stories, news & conversations
          </p>
        </div>
      </div>

      {/* ── Quick Stats ── */}
      <div className="px-5 -mt-1 mb-5">
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: "Episodes", value: podcasts.length, color: "#F2A900" },
            {
              label: "Total Listens",
              value: podcasts.reduce((sum, p) => sum + (p.listen_count || 0), 0),
              color: "#22C55E",
            },
            {
              label: "Channels",
              value: new Set(podcasts.map((p) => p.channel_id).filter(Boolean)).size,
              color: "#06B6D4",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl bg-card border border-border-subtle p-3 text-center relative overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{ background: stat.color }}
              />
              <p
                className="font-heading font-bold text-lg leading-none mb-0.5"
                style={{ color: stat.color }}
              >
                {stat.value}
              </p>
              <p className="text-[9px] text-txt-secondary font-semibold uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Channel Filters ── */}
      <div className="flex gap-2 px-5 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {channelFilters.map((ch) => (
          <Chip
            key={ch.value}
            label={ch.label}
            icon={<span className="text-sm">{ch.icon}</span>}
            active={activeChannel === ch.value}
            onClick={() => setActiveChannel(ch.value)}
          />
        ))}
      </div>

      {/* ── Episodes ── */}
      {loading ? (
        <div className="px-5 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      ) : podcasts.length === 0 ? (
        <div className="px-5 text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-card mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">🎧</span>
          </div>
          <p className="text-sm font-bold mb-1">No episodes found</p>
          <p className="text-xs text-txt-secondary mb-4">
            Try a different channel filter
          </p>
          <button
            onClick={() => setActiveChannel("all")}
            className="text-xs text-gold font-semibold press"
          >
            Show all episodes
          </button>
        </div>
      ) : (
        <div className="px-5 space-y-3 stagger">
          {podcasts.map((podcast) => (
            <EpisodeCard key={podcast.id} podcast={podcast} />
          ))}
        </div>
      )}

      {/* ── Bottom spacer ── */}
      <div className="h-8" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Episode Card
// ---------------------------------------------------------------------------

function EpisodeCard({ podcast }: { podcast: PodcastWithChannel }) {
  const channelSlug = podcast.channel?.slug ?? "";
  const badgeVariant = channelBadgeVariant[channelSlug] ?? "gold";

  return (
    <Link href={`/podcasts/${podcast.id}`}>
      <Card hover padding={false}>
        <div className="flex gap-3 p-3">
          {/* Thumbnail / Placeholder */}
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-gold/10 to-hc-purple/10 flex items-center justify-center shrink-0 overflow-hidden relative">
            {podcast.thumbnail_url ? (
              <Image
                src={podcast.thumbnail_url}
                alt={podcast.title}
                fill
                className="object-cover rounded-xl"
              />
            ) : (
              <span className="text-3xl">🎙️</span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 py-0.5">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-heading font-bold text-[13px] line-clamp-2 leading-tight">
                {podcast.title}
              </h3>
            </div>

            {/* Channel name as host */}
            {podcast.channel?.name && (
              <p className="text-[11px] text-txt-secondary font-medium truncate mb-2">
                {podcast.channel.name}
              </p>
            )}

            {/* Bottom meta row */}
            <div className="flex items-center gap-2 flex-wrap">
              {podcast.episode_number && (
                <span className="text-[10px] text-txt-secondary font-semibold">
                  EP {podcast.episode_number}
                  {podcast.season_number > 1
                    ? ` / S${podcast.season_number}`
                    : ""}
                </span>
              )}
              <span className="text-[10px] text-txt-secondary">
                {formatDuration(podcast.duration)}
              </span>
              <span className="text-[10px] text-txt-secondary flex items-center gap-0.5">
                <svg
                  width="10"
                  height="10"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                  className="opacity-60"
                >
                  <path d="M8 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7.5 9V3.5A.5.5 0 0 1 8 3z" />
                  <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z" />
                </svg>
                {formatListens(podcast.listen_count)} listens
              </span>
              <Badge
                label={podcast.channel?.name ?? "Podcast"}
                variant={badgeVariant}
              />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
