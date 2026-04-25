"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Card from "@/components/ui/Card";
import Chip from "@/components/ui/Chip";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import type { Podcast, Channel } from "@/types/database";

// ---------------------------------------------------------------------------
// Channel filter config
// ---------------------------------------------------------------------------

type PodcastWithChannel = Podcast & { channel?: Channel };

const channelFilters: { label: string; value: string; iconName: IconName }[] = [
  { label: "All", value: "all", iconName: "podcast" },
  { label: "City Hall", value: "city_hall", iconName: "landmark" },
  { label: "Community", value: "community", iconName: "handshake" },
  { label: "Culture", value: "culture", iconName: "palette" },
  { label: "Business", value: "business", iconName: "briefcase" },
  { label: "Sports", value: "sports", iconName: "soccer" },
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
    <div className="culture-surface min-h-dvh animate-fade-in pb-safe">
      <div
        className="px-[18px] pt-5 pb-4"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <div className="c-kicker" style={{ opacity: 0.65 }}>
          § CULTURE MEDIA · LISTEN · COMPTON
        </div>
        <h1
          className="c-hero mt-2"
          style={{ fontSize: 56, lineHeight: 0.88, letterSpacing: "-0.02em" }}
        >
          Podcasts.
        </h1>
        <p className="c-serif-it mt-2" style={{ fontSize: 13 }}>
          Voices of Compton — stories, news &amp; conversations.
        </p>
      </div>

      {/* ── Quick Stats ── */}
      <div
        className="grid grid-cols-3 mb-6"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        {[
          { label: "EPISODES", value: podcasts.length, gold: true },
          {
            label: "LISTENS",
            value: podcasts.reduce((sum, p) => sum + (p.listen_count || 0), 0),
          },
          {
            label: "CHANNELS",
            value: new Set(podcasts.map((p) => p.channel_id).filter(Boolean)).size,
          },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="text-center"
            style={{
              padding: "14px 10px",
              borderRight: i < 2 ? "2px solid var(--rule-strong-c)" : "none",
              background: stat.gold ? "var(--gold-c)" : "var(--paper)",
            }}
          >
            <div className="c-display c-tabnum" style={{ fontSize: 22, lineHeight: 1 }}>{stat.value}</div>
            <div className="c-kicker mt-1.5" style={{ fontSize: 9 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Channel Filters ── */}
      <div className="flex gap-2 px-5 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {channelFilters.map((ch) => (
          <Chip
            key={ch.value}
            label={ch.label}
            icon={<Icon name={ch.iconName} size={14} />}
            active={activeChannel === ch.value}
            onClick={() => setActiveChannel(ch.value)}
          />
        ))}
      </div>

      {/* ── Episodes ── */}
      {loading ? (
        <div className="px-5 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-28" style={{ border: "2px solid var(--rule-strong-c)" }} />
          ))}
        </div>
      ) : podcasts.length === 0 ? (
        <div className="px-5 text-center py-16">
          <div
            className="w-16 h-16 mx-auto mb-4 flex items-center justify-center"
            style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
          >
            <Icon name="headphones" size={28} style={{ color: "var(--ink-strong)" }} />
          </div>
          <p className="c-card-t mb-1" style={{ color: "var(--ink-strong)" }}>No episodes found</p>
          <p className="c-meta mb-4">
            Try a different channel filter
          </p>
          <button
            onClick={() => setActiveChannel("all")}
            className="c-btn c-btn-outline c-btn-sm press"
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
          <div
            className="w-20 h-20 flex items-center justify-center shrink-0 overflow-hidden relative"
            style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
          >
            {podcast.thumbnail_url ? (
              <Image
                src={podcast.thumbnail_url}
                alt={podcast.title}
                fill
                className="object-cover"
              />
            ) : (
              <Icon name="podcast" size={28} style={{ color: "var(--ink-strong)" }} />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 py-0.5">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-heading font-bold text-[13px] line-clamp-2 leading-tight" style={{ color: "var(--ink-strong)" }}>
                {podcast.title}
              </h3>
            </div>

            {/* Channel name as host */}
            {podcast.channel?.name && (
              <p className="text-[11px] font-medium truncate mb-2" style={{ color: "var(--ink-mute)" }}>
                {podcast.channel.name}
              </p>
            )}

            {/* Bottom meta row */}
            <div className="flex items-center gap-2 flex-wrap">
              {podcast.episode_number && (
                <span className="text-[10px] font-semibold" style={{ color: "var(--ink-mute)" }}>
                  EP {podcast.episode_number}
                  {podcast.season_number > 1
                    ? ` / S${podcast.season_number}`
                    : ""}
                </span>
              )}
              <span className="text-[10px]" style={{ color: "var(--ink-mute)" }}>
                {formatDuration(podcast.duration)}
              </span>
              <span className="text-[10px] flex items-center gap-0.5" style={{ color: "var(--ink-mute)" }}>
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
