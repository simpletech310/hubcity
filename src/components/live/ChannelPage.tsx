"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import StreamCard from "./StreamCard";
import ChannelSubscribeButton from "./ChannelSubscribeButton";
import TipJar from "@/components/TipJar";
import type {
  Channel,
  ChannelVideo,
  LiveStream,
  TimeBlock,
  ChannelType,
} from "@/types/database";

type TabId = "videos" | "live" | "about";

const TABS: { id: TabId; label: string }[] = [
  { id: "videos", label: "Videos" },
  { id: "live", label: "Live" },
  { id: "about", label: "About" },
];

const TYPE_BADGE: Record<
  ChannelType,
  { label: string; variant: "gold" | "blue" | "coral" | "emerald" | "cyan" | "purple" | "pink" }
> = {
  school: { label: "School", variant: "emerald" },
  city: { label: "City", variant: "cyan" },
  organization: { label: "Org", variant: "purple" },
  media: { label: "Media", variant: "pink" },
  community: { label: "Community", variant: "blue" },
  museum: { label: "Museum", variant: "cyan" },
  food: { label: "Food", variant: "coral" },
  home: { label: "Home", variant: "emerald" },
  art: { label: "Art", variant: "purple" },
  fashion: { label: "Fashion", variant: "pink" },
  wellness: { label: "Wellness", variant: "emerald" },
  comedy: { label: "Comedy", variant: "gold" },
  talk: { label: "Talk", variant: "blue" },
  business: { label: "Business", variant: "gold" },
  tech: { label: "Tech", variant: "cyan" },
  education: { label: "Learn", variant: "blue" },
  civic: { label: "Civic", variant: "cyan" },
  music: { label: "Music", variant: "purple" },
  faith: { label: "Faith", variant: "gold" },
  sports: { label: "Sports", variant: "coral" },
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function channelInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatViews(count: number) {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

function formatTimeBlock(time: string) {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${m} ${ampm}`;
}

interface ChannelPageProps {
  channel: Channel;
  videos: ChannelVideo[];
  streams: LiveStream[];
  timeBlocks: TimeBlock[];
  isFollowing: boolean;
  userId: string | null;
  stripeAccountId: string | null;
}

export default function ChannelPage({
  channel,
  videos,
  streams,
  timeBlocks,
  isFollowing: initialFollowing,
  userId,
  stripeAccountId,
}: ChannelPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("videos");
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(channel.follower_count);
  const [watchingStream, setWatchingStream] = useState<LiveStream | null>(null);

  const badge = TYPE_BADGE[channel.type] || TYPE_BADGE.community;
  const activeStreams = streams.filter((s) => s.status === "active");
  const upcomingStreams = streams.filter((s) => s.status === "idle");

  const handleFollow = useCallback(async () => {
    if (!userId) return;
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    setFollowerCount((c) => (wasFollowing ? Math.max(0, c - 1) : c + 1));

    try {
      await fetch(`/api/channels/${channel.id}/follow`, { method: "POST" });
    } catch {
      setFollowing(wasFollowing);
      setFollowerCount((c) => (wasFollowing ? c + 1 : Math.max(0, c - 1)));
    }
  }, [userId, following, channel.id]);

  // The hero piece: a featured video, falls back to the latest one. Drives the
  // big cinematic top slab — title, trailer button, PPV/subs badge, watch CTA.
  const heroVideo = videos.find((v) => v.is_featured) ?? videos[0] ?? null;
  const heroThumb = heroVideo
    ? heroVideo.thumbnail_url ??
      (heroVideo.mux_playback_id
        ? `https://image.mux.com/${heroVideo.mux_playback_id}/thumbnail.webp?width=1200&height=675&time=5`
        : null)
    : null;
  const heroBackdrop = heroThumb ?? channel.banner_url ?? null;

  // PPV / subscriber price helper
  const formatPrice = (cents: number | null | undefined) => {
    if (!cents) return null;
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Featured rail vs the rest of the catalog
  const featuredVideos = videos.filter((v) => v.is_featured);
  const regularVideos = videos.filter((v) => !v.is_featured);

  // Compact PPV chip used on tiles
  const accessChip = (v: ChannelVideo) => {
    const price = formatPrice(v.price_cents);
    if (v.access_type === "ppv" || (v.is_premium && price)) {
      return (
        <span
          className="inline-flex items-center px-1.5 c-kicker"
          style={{
            background: "var(--gold-c)",
            color: "var(--ink-strong)",
            fontSize: 9,
            height: 17,
            border: "1.5px solid var(--ink-strong)",
          }}
        >
          {price ?? "RENT"}
        </span>
      );
    }
    if (v.access_type === "subscribers" || v.is_premium) {
      return (
        <span
          className="inline-flex items-center px-1.5 c-kicker"
          style={{
            background: "var(--ink-strong)",
            color: "var(--gold-c)",
            fontSize: 9,
            height: 17,
            border: "1.5px solid var(--ink-strong)",
          }}
        >
          SUBS
        </span>
      );
    }
    return null;
  };

  return (
    <div className="culture-surface min-h-dvh animate-fade-in pb-safe">
      {/* ══════════════════════════════════════════════════════════
         CINEMA HERO  —  big poster, gradient, title, watch + trailer
         ══════════════════════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: "16/10",
          background: "var(--ink-strong)",
          borderBottom: "3px solid var(--gold-c)",
        }}
      >
        {heroBackdrop ? (
          <img
            src={heroBackdrop}
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity: 0.7 }}
          />
        ) : (
          <div className="w-full h-full" style={{ background: "var(--ink-strong)" }} />
        )}

        {/* Cinematic gradients */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(26,21,18,0.55) 0%, rgba(26,21,18,0.15) 35%, rgba(26,21,18,0.85) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(26,21,18,0.7) 0%, rgba(26,21,18,0.25) 50%, transparent 100%)",
          }}
        />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 flex items-center justify-center press z-10"
          style={{
            width: 38,
            height: 38,
            background: "var(--paper)",
            border: "2px solid var(--rule-strong-c)",
            color: "var(--ink-strong)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Channel chip top right */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          {activeStreams.length > 0 && (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-1"
              style={{ background: "#E84855", color: "var(--paper)", border: "2px solid var(--paper)" }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "var(--paper)" }}
              />
              <span className="c-kicker" style={{ fontSize: 9, color: "var(--paper)" }}>LIVE NOW</span>
            </span>
          )}
        </div>

        {/* Bottom slab — title + actions */}
        <div className="absolute inset-x-0 bottom-0 px-5 pb-5">
          {heroVideo ? (
            <>
              <div className="flex items-center gap-2 mb-2.5">
                <span
                  className="c-kicker inline-flex items-center gap-1.5"
                  style={{ fontSize: 9, color: "var(--gold-c)", letterSpacing: "0.16em" }}
                >
                  <span style={{ width: 6, height: 6, background: "var(--gold-c)", display: "inline-block" }} />
                  {heroVideo.is_featured ? "FEATURED PRESENTATION" : "NOW PLAYING"}
                </span>
                {heroVideo.access_type === "ppv" || (heroVideo.is_premium && heroVideo.price_cents) ? (
                  <span
                    className="inline-flex items-center px-2 py-0.5 c-kicker"
                    style={{
                      background: "var(--gold-c)",
                      color: "var(--ink-strong)",
                      fontSize: 9,
                      border: "2px solid var(--paper)",
                    }}
                  >
                    RENT {formatPrice(heroVideo.price_cents) ?? ""}
                  </span>
                ) : heroVideo.access_type === "subscribers" || heroVideo.is_premium ? (
                  <span
                    className="inline-flex items-center px-2 py-0.5 c-kicker"
                    style={{
                      background: "var(--paper)",
                      color: "var(--ink-strong)",
                      fontSize: 9,
                      border: "2px solid var(--paper)",
                    }}
                  >
                    SUBSCRIBERS
                  </span>
                ) : null}
              </div>
              <h2
                className="c-hero line-clamp-2"
                style={{
                  fontSize: 30,
                  lineHeight: 0.96,
                  letterSpacing: "-0.025em",
                  color: "var(--paper)",
                  textShadow: "0 2px 12px rgba(0,0,0,0.55)",
                }}
              >
                {heroVideo.title}
              </h2>
              {heroVideo.description && (
                <p
                  className="c-serif-it mt-2 line-clamp-2"
                  style={{ fontSize: 13, color: "var(--paper)", opacity: 0.85, lineHeight: 1.4 }}
                >
                  {heroVideo.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-3.5">
                <Link
                  href={`/live/watch/${heroVideo.id}`}
                  className="inline-flex items-center justify-center gap-2 press"
                  style={{
                    background: "var(--gold-c)",
                    color: "var(--ink-strong)",
                    border: "2px solid var(--paper)",
                    padding: "10px 18px",
                    fontFamily: "var(--font-archivo-narrow), sans-serif",
                    fontWeight: 800,
                    fontSize: 12,
                    letterSpacing: "0.08em",
                    boxShadow: "3px 3px 0 rgba(0,0,0,0.5)",
                  }}
                >
                  <svg width="11" height="11" fill="currentColor" viewBox="0 0 10 10">
                    <polygon points="2.5,1.5 9,5 2.5,8.5" />
                  </svg>
                  {heroVideo.access_type === "ppv" || (heroVideo.is_premium && heroVideo.price_cents)
                    ? "WATCH NOW"
                    : "WATCH"}
                </Link>
                {(heroVideo.preview_seconds && heroVideo.preview_seconds > 0) ||
                heroVideo.access_type === "ppv" ||
                heroVideo.is_premium ? (
                  <Link
                    href={`/live/watch/${heroVideo.id}?preview=1`}
                    className="inline-flex items-center justify-center gap-2 press"
                    style={{
                      background: "transparent",
                      color: "var(--paper)",
                      border: "2px solid var(--paper)",
                      padding: "10px 16px",
                      fontFamily: "var(--font-archivo-narrow), sans-serif",
                      fontWeight: 700,
                      fontSize: 11,
                      letterSpacing: "0.08em",
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    TRAILER
                  </Link>
                ) : null}
                {heroVideo.duration && (
                  <span
                    className="c-kicker tabular-nums ml-1"
                    style={{ fontSize: 10, color: "var(--paper)", opacity: 0.7 }}
                  >
                    {formatDuration(heroVideo.duration)}
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="c-kicker mb-2" style={{ fontSize: 9, color: "var(--gold-c)", letterSpacing: "0.16em" }}>
                § THE CHANNEL
              </div>
              <h2
                className="c-hero"
                style={{
                  fontSize: 36,
                  lineHeight: 0.94,
                  letterSpacing: "-0.025em",
                  color: "var(--paper)",
                  textShadow: "0 2px 12px rgba(0,0,0,0.55)",
                }}
              >
                {channel.name}
              </h2>
              {channel.description && (
                <p
                  className="c-serif-it mt-2 line-clamp-2"
                  style={{ fontSize: 13, color: "var(--paper)", opacity: 0.85 }}
                >
                  {channel.description}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
         CHANNEL META BAR  —  avatar, name, type, follower count
         ══════════════════════════════════════════════════════════ */}
      <div
        className="px-5 py-4 flex items-center gap-3.5"
        style={{
          background: "var(--paper)",
          borderBottom: "2px solid var(--rule-strong-c)",
        }}
      >
        {/* Avatar */}
        <div
          className="overflow-hidden shrink-0"
          style={{
            width: 56,
            height: 56,
            background: "var(--gold-c)",
            border: "2px solid var(--rule-strong-c)",
            boxShadow: "3px 3px 0 var(--rule-strong-c)",
          }}
        >
          {channel.avatar_url ? (
            <img src={channel.avatar_url} alt={channel.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="c-hero" style={{ fontSize: 20, color: "var(--ink-strong)" }}>
                {channelInitials(channel.name)}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="c-card-t flex items-center gap-1.5" style={{ fontSize: 17, color: "var(--ink-strong)", lineHeight: 1.05 }}>
            <span className="truncate">{channel.name}</span>
            {channel.is_verified && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: "var(--gold-c)" }} className="shrink-0">
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              </svg>
            )}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge label={badge.label} variant={badge.variant} />
            <span className="c-kicker tabular-nums" style={{ fontSize: 9, opacity: 0.65 }}>
              {followerCount.toLocaleString()} FOLLOWERS
            </span>
            {videos.length > 0 && (
              <>
                <span className="c-kicker" style={{ fontSize: 9, opacity: 0.4 }}>·</span>
                <span className="c-kicker tabular-nums" style={{ fontSize: 9, opacity: 0.65 }}>
                  {videos.length} {videos.length === 1 ? "VIDEO" : "VIDEOS"}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
         ACTIONS  —  follow / subscribe / tip
         ══════════════════════════════════════════════════════════ */}
      {(userId || stripeAccountId) && (
        <div
          className="px-5 py-3 flex flex-col gap-2"
          style={{ borderBottom: "2px solid var(--rule-strong-c)", background: "var(--paper)" }}
        >
          {userId && (
            <div className="flex gap-2">
              <button
                onClick={handleFollow}
                className={following ? "c-btn c-btn-outline c-btn-sm flex-1 press" : "c-btn c-btn-primary c-btn-sm flex-1 press"}
              >
                {following ? "✓ FOLLOWING" : "+ FOLLOW"}
              </button>
              <div className="flex-1">
                <ChannelSubscribeButton channel={channel} userId={userId} />
              </div>
            </div>
          )}
          {stripeAccountId && (
            <TipJar
              channelId={channel.id}
              channelName={channel.name}
              stripeAccountId={stripeAccountId}
            />
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
         TABS  —  videos / live / about
         ══════════════════════════════════════════════════════════ */}
      <div className="flex" style={{ borderBottom: "2px solid var(--rule-strong-c)", background: "var(--paper)" }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-3 text-center press relative"
              style={{
                background: isActive ? "var(--ink-strong)" : "var(--paper)",
                color: isActive ? "var(--gold-c)" : "var(--ink-strong)",
                fontFamily: "var(--font-archivo-narrow), sans-serif",
                fontWeight: 800,
                fontSize: 11,
                letterSpacing: "0.12em",
              }}
            >
              {tab.label.toUpperCase()}
              {tab.id === "videos" && videos.length > 0 && (
                <span
                  className="ml-1.5 tabular-nums"
                  style={{ fontSize: 10, opacity: isActive ? 0.75 : 0.5 }}
                >
                  {videos.length}
                </span>
              )}
              {tab.id === "live" && activeStreams.length > 0 && (
                <span
                  className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full animate-pulse align-middle"
                  style={{ background: "#E84855" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════
         VIDEOS TAB  —  featured rail + main grid
         ══════════════════════════════════════════════════════════ */}
      {activeTab === "videos" && (
        <div className="animate-fade-in pt-5 pb-2">
          {videos.length === 0 ? (
            <div className="text-center py-12 px-5">
              <div
                className="w-16 h-16 flex items-center justify-center mx-auto mb-4"
                style={{ background: "var(--ink-strong)" }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: "var(--gold-c)" }}>
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <p className="c-card-t mb-1" style={{ fontSize: 15, color: "var(--ink-strong)" }}>No videos yet</p>
              <p className="c-serif-it" style={{ fontSize: 12, color: "var(--ink-strong)", opacity: 0.7 }}>
                This channel hasn&apos;t published anything yet.
              </p>
            </div>
          ) : (
            <>
              {/* Featured rail */}
              {featuredVideos.length > 1 && (
                <section className="mb-6">
                  <div className="px-5 mb-3">
                    <div className="flex items-baseline gap-3 pb-2" style={{ borderBottom: "2px solid var(--rule-strong-c)" }}>
                      <span className="c-display c-tabnum" style={{ fontSize: 22, color: "var(--gold-c)", lineHeight: 1, letterSpacing: "-0.02em" }}>
                        № 01
                      </span>
                      <span className="c-kicker" style={{ fontSize: 11, letterSpacing: "0.14em" }}>
                        FEATURED
                      </span>
                    </div>
                  </div>
                  <div className="flex overflow-x-auto scrollbar-hide gap-3 pb-2 px-5">
                    {featuredVideos.map((video) => {
                      const thumb = video.thumbnail_url ??
                        (video.mux_playback_id
                          ? `https://image.mux.com/${video.mux_playback_id}/thumbnail.webp?width=480&height=270&time=5`
                          : null);
                      const chip = accessChip(video);
                      return (
                        <Link
                          key={video.id}
                          href={`/live/watch/${video.id}`}
                          className="shrink-0 press"
                          style={{ width: 260 }}
                        >
                          <div
                            className="relative overflow-hidden"
                            style={{
                              aspectRatio: "16/9",
                              background: "var(--ink-strong)",
                              border: "2px solid var(--rule-strong-c)",
                              boxShadow: "3px 3px 0 var(--rule-strong-c)",
                            }}
                          >
                            {thumb ? (
                              <img src={thumb} alt={video.title} className="w-full h-full object-cover" />
                            ) : null}
                            <div
                              className="absolute inset-0"
                              style={{ background: "linear-gradient(180deg, transparent 50%, rgba(26,21,18,0.85) 100%)" }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div
                                className="flex items-center justify-center"
                                style={{
                                  width: 44,
                                  height: 44,
                                  background: "var(--gold-c)",
                                  border: "2px solid var(--paper)",
                                  boxShadow: "2px 2px 0 rgba(0,0,0,0.45)",
                                }}
                              >
                                <svg width="14" height="14" fill="var(--ink-strong)" viewBox="0 0 10 10">
                                  <polygon points="3,1.5 9,5 3,8.5" />
                                </svg>
                              </div>
                            </div>
                            <div className="absolute top-2 left-2 flex items-center gap-1.5">
                              <span className="c-badge-gold" style={{ fontSize: 9 }}>FEATURED</span>
                              {chip}
                            </div>
                            {video.duration && (
                              <div
                                className="absolute bottom-2 right-2 px-1.5 c-kicker tabular-nums"
                                style={{ background: "rgba(0,0,0,0.78)", color: "var(--paper)", fontSize: 10 }}
                              >
                                {formatDuration(video.duration)}
                              </div>
                            )}
                          </div>
                          <h3
                            className="c-card-t mt-2 line-clamp-2"
                            style={{ fontSize: 13, color: "var(--ink-strong)", lineHeight: 1.25 }}
                          >
                            {video.title}
                          </h3>
                          <p className="c-meta mt-0.5" style={{ fontSize: 9 }}>
                            {formatViews(video.view_count)} VIEWS
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Main catalog */}
              {regularVideos.length > 0 && (
                <section className="mb-2">
                  <div className="px-5 mb-3">
                    <div className="flex items-baseline gap-3 pb-2" style={{ borderBottom: "2px solid var(--rule-strong-c)" }}>
                      <span className="c-display c-tabnum" style={{ fontSize: 22, color: "var(--gold-c)", lineHeight: 1, letterSpacing: "-0.02em" }}>
                        № {featuredVideos.length > 1 ? "02" : "01"}
                      </span>
                      <span className="c-kicker" style={{ fontSize: 11, letterSpacing: "0.14em" }}>
                        ALL VIDEOS
                      </span>
                      <span className="ml-auto c-kicker tabular-nums" style={{ fontSize: 9, opacity: 0.55 }}>
                        {regularVideos.length}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-5 px-5">
                    {regularVideos.map((video) => {
                      const thumb = video.thumbnail_url ??
                        (video.mux_playback_id
                          ? `https://image.mux.com/${video.mux_playback_id}/thumbnail.webp?width=400&height=225&time=5`
                          : null);
                      const chip = accessChip(video);
                      return (
                        <Link
                          key={video.id}
                          href={`/live/watch/${video.id}`}
                          className="press group"
                        >
                          <div
                            className="relative overflow-hidden"
                            style={{
                              aspectRatio: "16/9",
                              background: "var(--ink-strong)",
                              border: "2px solid var(--rule-strong-c)",
                            }}
                          >
                            {thumb ? (
                              <img src={thumb} alt={video.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: "var(--paper)", opacity: 0.3 }}>
                                  <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                              </div>
                            )}
                            <div
                              className="absolute inset-0"
                              style={{ background: "linear-gradient(180deg, transparent 55%, rgba(26,21,18,0.7) 100%)" }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div
                                className="flex items-center justify-center transition-transform group-hover:scale-110"
                                style={{
                                  width: 32,
                                  height: 32,
                                  background: "var(--gold-c)",
                                  border: "2px solid var(--paper)",
                                  boxShadow: "2px 2px 0 rgba(0,0,0,0.4)",
                                }}
                              >
                                <svg width="11" height="11" fill="var(--ink-strong)" viewBox="0 0 10 10">
                                  <polygon points="3,1.5 9,5 3,8.5" />
                                </svg>
                              </div>
                            </div>
                            {chip && (
                              <div className="absolute top-1.5 left-1.5">
                                {chip}
                              </div>
                            )}
                            {video.duration && (
                              <div
                                className="absolute bottom-1.5 right-1.5 px-1.5 c-kicker tabular-nums"
                                style={{ background: "rgba(0,0,0,0.78)", color: "var(--paper)", fontSize: 9 }}
                              >
                                {formatDuration(video.duration)}
                              </div>
                            )}
                          </div>
                          <h3 className="c-card-t mt-1.5 line-clamp-2" style={{ fontSize: 12, color: "var(--ink-strong)", lineHeight: 1.25 }}>
                            {video.title}
                          </h3>
                          <p className="c-meta mt-0.5" style={{ fontSize: 9 }}>
                            {formatViews(video.view_count)} VIEWS
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Live Tab ────────────────────────────────────── */}
      {activeTab === "live" && (
        <div className="animate-fade-in px-5">
          {activeStreams.length > 0 && (
            <div className="mb-6">
              <h3 className="c-hero mb-3 flex items-center gap-2" style={{ fontSize: 20, color: "var(--ink-strong)" }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#E84855" }} />
                LIVE NOW
              </h3>
              <div className="space-y-3">
                {activeStreams.map((stream) => (
                  <StreamCard
                    key={stream.id}
                    stream={stream}
                    isLive
                    onWatch={() => setWatchingStream(stream)}
                  />
                ))}
              </div>
            </div>
          )}

          {upcomingStreams.length > 0 ? (
            <div>
              <h3 className="c-hero mb-3" style={{ fontSize: 20, color: "var(--ink-strong)" }}>UPCOMING</h3>
              <div className="space-y-3">
                {upcomingStreams.map((stream) => (
                  <StreamCard key={stream.id} stream={stream} />
                ))}
              </div>
            </div>
          ) : activeStreams.length === 0 ? (
            <div className="text-center py-10">
              <div
                className="w-16 h-16 flex items-center justify-center mx-auto mb-3"
                style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: "var(--ink-strong)", opacity: 0.5 }}>
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <p className="c-body">No streams scheduled</p>
            </div>
          ) : null}
        </div>
      )}

      {/* ── About Tab ───────────────────────────────────── */}
      {activeTab === "about" && (
        <div className="animate-fade-in px-5 space-y-5">
          {/* Description */}
          {channel.description && (
            <div
              className="p-4"
              style={{
                background: "var(--paper)",
                border: "2px solid var(--rule-strong-c)",
                color: "var(--ink-strong)",
              }}
            >
              <h3 className="c-kicker mb-2" style={{ fontSize: 10 }}>
                § ABOUT
              </h3>
              <p className="c-body">{channel.description}</p>
            </div>
          )}

          {/* Schedule */}
          {timeBlocks.length > 0 && (
            <div>
              <h3 className="c-kicker mb-3" style={{ fontSize: 10 }}>
                § BROADCAST SCHEDULE
              </h3>
              <div className="space-y-2">
                {timeBlocks.map((tb) => (
                  <div
                    key={tb.id}
                    className="p-3"
                    style={{
                      background: "var(--paper)",
                      border: "2px solid var(--rule-strong-c)",
                      color: "var(--ink-strong)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 text-center shrink-0">
                        <p className="c-card-t" style={{ fontSize: 11, color: "var(--gold-c)" }}>
                          {DAY_NAMES[tb.day_of_week]}
                        </p>
                      </div>
                      <div className="w-px h-6" style={{ background: "var(--rule-strong-c)", opacity: 0.3 }} />
                      <div className="flex-1 min-w-0">
                        <p className="c-card-t truncate" style={{ fontSize: 12 }}>
                          {tb.title || "Scheduled Broadcast"}
                        </p>
                        <p className="c-meta">
                          {formatTimeBlock(tb.start_time)} &ndash; {formatTimeBlock(tb.end_time)}
                        </p>
                      </div>
                      {tb.is_recurring && (
                        <span
                          className="c-kicker px-2 py-0.5"
                          style={{ fontSize: 9, background: "var(--gold-c)", color: "var(--ink-strong)", border: "1.5px solid var(--rule-strong-c)" }}
                        >
                          WEEKLY
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Channel info */}
          <div
            className="p-4"
            style={{
              background: "var(--paper)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--ink-strong)",
            }}
          >
            <h3 className="c-kicker mb-3" style={{ fontSize: 10 }}>
              § DETAILS
            </h3>
            <div className="space-y-2 c-body-sm">
              <div className="flex justify-between" style={{ borderBottom: "1.5px solid var(--rule-strong-c)", paddingBottom: 6 }}>
                <span className="c-meta">TYPE</span>
                <Badge label={badge.label} variant={badge.variant} />
              </div>
              <div className="flex justify-between" style={{ borderBottom: "1.5px solid var(--rule-strong-c)", paddingBottom: 6 }}>
                <span className="c-meta">FOLLOWERS</span>
                <span className="tabular-nums c-card-t" style={{ fontSize: 12 }}>{followerCount}</span>
              </div>
              <div className="flex justify-between" style={{ borderBottom: "1.5px solid var(--rule-strong-c)", paddingBottom: 6 }}>
                <span className="c-meta">VIDEOS</span>
                <span className="tabular-nums c-card-t" style={{ fontSize: 12 }}>{videos.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="c-meta">JOINED</span>
                <span className="c-card-t" style={{ fontSize: 12 }}>
                  {new Date(channel.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
