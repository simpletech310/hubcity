"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import Badge from "@/components/ui/Badge";
import StreamCard from "./StreamCard";
import CreateStreamModal from "./CreateStreamModal";
import PreRollAd from "./PreRollAd";
import LiveSimulatedPlayer from "./LiveSimulatedPlayer";
import RelatedToLive from "./RelatedToLive";
import type { RelatedToLiveData } from "@/lib/live/relatedToLive";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import type {
  Channel,
  ChannelVideo,
  LiveStream,
  TimeBlock,
  ChannelType,
  VideoAd,
  Show,
  ScheduledBroadcast,
} from "@/types/database";
import { LOCAL_CHANNEL_TYPES } from "@/types/database";

const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), {
  ssr: false,
});

// ── Types & Constants ──────────────────────────────────────
type TabId = "home" | "live" | "originals" | "channels" | "schedule";

const TABS: { id: TabId; label: string; icon?: string }[] = [
  { id: "home", label: "Home" },
  { id: "live", label: "Live", icon: "live" },
  { id: "originals", label: "Originals" },
  { id: "channels", label: "Channels" },
  { id: "schedule", label: "Schedule" },
];

const NATIONAL_CHANNEL_FILTERS: { label: string; value: ChannelType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Food", value: "food" },
  { label: "Home", value: "home" },
  { label: "Art", value: "art" },
  { label: "Fashion", value: "fashion" },
  { label: "Wellness", value: "wellness" },
  { label: "Comedy", value: "comedy" },
  { label: "Talk", value: "talk" },
  { label: "Business", value: "business" },
  { label: "Tech", value: "tech" },
  { label: "Learn", value: "education" },
  { label: "Community", value: "civic" },
  { label: "Music", value: "music" },
  { label: "Faith", value: "faith" },
  { label: "Sports", value: "sports" },
];

type TypeBadgeVariant = "gold" | "blue" | "coral" | "emerald" | "cyan" | "purple" | "pink";

const TYPE_BADGE: Record<ChannelType, { label: string; variant: TypeBadgeVariant }> = {
  // Legacy local types
  school: { label: "School", variant: "emerald" },
  city: { label: "City", variant: "cyan" },
  organization: { label: "Org", variant: "purple" },
  media: { label: "Media", variant: "pink" },
  community: { label: "Community", variant: "blue" },
  museum: { label: "Museum", variant: "cyan" },
  // New national thematic types
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
  civic: { label: "Community", variant: "cyan" },
  music: { label: "Music", variant: "purple" },
  faith: { label: "Faith", variant: "gold" },
  sports: { label: "Sports", variant: "coral" },
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── Accent colors for hero rotation ──────────────────────
const HERO_ACCENTS = ["#F2A900", "#EF4444", "#8B5CF6", "#22C55E", "#FF6B6B", "#06B6D4", "#EC4899", "#F59E0B", "#3B82F6"];

const VIDEO_TYPE_LABEL: Record<string, string> = {
  featured: "Featured",
  original: "Original",
  city_hall: "City Hall",
  on_demand: "On Demand",
  podcast: "Podcast",
  replay: "Replay",
};

// Local (verified-address-only) channel types are defined in @/types/database.

// ── Helpers ────────────────────────────────────────────────
function channelInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
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

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

// ── Props ──────────────────────────────────────────────────
interface CultureTVProps {
  channels: Channel[];
  streams: LiveStream[];
  featuredVideos: ChannelVideo[];
  recentVideos: ChannelVideo[];
  shows: Show[];
  timeBlocks: TimeBlock[];
  liveSchedule: ScheduledBroadcast[];
  ads: VideoAd[];
  canStream: boolean;
  userId: string | null;
  isVerified: boolean;
  followedChannelIds: string[];
  purchasedVideoIds: string[];
  relatedToLive?: RelatedToLiveData | null;
  /** Category rails — each renders as a vertical-poster strip with
   *  a kicker + stamped title. Optional; rail hides when empty. */
  familyVideos?: ChannelVideo[];
  cartoonVideos?: ChannelVideo[];
  docVideos?: ChannelVideo[];
}

export default function CultureTV({
  channels: allChannels,
  streams,
  featuredVideos: allFeaturedVideos,
  recentVideos: allRecentVideos,
  shows,
  timeBlocks: allTimeBlocks,
  liveSchedule,
  ads,
  canStream,
  userId,
  isVerified,
  followedChannelIds: initialFollowed,
  purchasedVideoIds,
  relatedToLive = null,
  familyVideos = [],
  cartoonVideos = [],
  docVideos = [],
}: CultureTVProps) {
  // ── Scope gating: hide local channels/videos unless address-verified ──
  const visible = <T extends { type?: ChannelType; scope?: "national" | "local" }>(c: T) => {
    if (!c) return false;
    // Culture TV Live is always visible (even though scope=national, it's our flagship)
    if ((c as unknown as { slug?: string }).slug === "knect-tv-live") return true;
    if (c.scope === "national") return true;
    if (c.scope === "local") return isVerified;
    // Legacy rows with no scope: treat by type
    if (c.type && LOCAL_CHANNEL_TYPES.includes(c.type)) return isVerified;
    return true;
  };
  const channels = allChannels.filter((c) => c.slug !== "knect-tv-live" && visible(c));
  const localChannels = allChannels.filter(
    (c) => c.scope === "local" || (c.type && LOCAL_CHANNEL_TYPES.includes(c.type))
  );
  const featuredVideos = allFeaturedVideos.filter((v) => !v.channel || visible(v.channel));
  const recentVideos = allRecentVideos.filter((v) => !v.channel || visible(v.channel));
  const timeBlocks = allTimeBlocks.filter((tb) => !tb.channel || visible(tb.channel));
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("home");
  // What video LiveSimulatedPlayer is currently on-air with. Null while
  // an ad is playing or before the player has reported in. The initial
  // value comes from the server's `relatedToLive` computation so the
  // rail never flickers on first paint.
  const [activeLiveVideoId, setActiveLiveVideoId] = useState<string | null>(
    relatedToLive?.videoId ?? null
  );
  const [channelFilter, setChannelFilter] = useState<ChannelType | "all">("all");
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set(initialFollowed));
  const [createOpen, setCreateOpen] = useState(false);
  const [watchingStream, setWatchingStream] = useState<LiveStream | null>(null);
  const [playingVideo, setPlayingVideo] = useState<ChannelVideo | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const heroTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [preRollAd, setPreRollAd] = useState<VideoAd | null>(null);
  const [pendingVideo, setPendingVideo] = useState<ChannelVideo | null>(null);
  const [pendingStream, setPendingStream] = useState<LiveStream | null>(null);

  // Build hero videos from real data (featured first, then recent with playback IDs)
  const heroVideos = [
    ...featuredVideos.filter((v) => v.mux_playback_id),
    ...recentVideos.filter((v) => v.mux_playback_id && !featuredVideos.some((f) => f.id === v.id)),
  ].slice(0, 9);

  // Auto-rotate hero every 6 seconds
  useEffect(() => {
    if (heroVideos.length === 0) return;
    heroTimerRef.current = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroVideos.length);
    }, 6000);
    return () => { if (heroTimerRef.current) clearInterval(heroTimerRef.current); };
  }, [heroVideos.length]);

  const activeStreams = streams.filter((s) => s.status === "active");
  const upcomingStreams = streams.filter((s) => s.status === "idle");

  const filteredChannels =
    channelFilter === "all" ? channels : channels.filter((c) => c.type === channelFilter);

  const today = new Date().getDay();
  const tomorrow = (today + 1) % 7;
  const todayBlocks = timeBlocks.filter((tb) => tb.day_of_week === today);
  const tomorrowBlocks = timeBlocks.filter((tb) => tb.day_of_week === tomorrow);

  // Categorize videos
  const originals = recentVideos.filter((v) => v.video_type === "original");
  const cityHall = recentVideos.filter((v) => v.video_type === "city_hall");
  const sportsVideos = recentVideos.filter((v) => v.video_type === "featured" || v.channel?.type === "community");
  const trendingVideos = [...recentVideos].sort((a, b) => b.view_count - a.view_count).slice(0, 8);

  const handleFollow = useCallback(
    async (channelId: string) => {
      if (!userId) return;
      const wasFollowing = followedIds.has(channelId);
      setFollowedIds((prev) => {
        const next = new Set(prev);
        if (wasFollowing) next.delete(channelId);
        else next.add(channelId);
        return next;
      });
      try {
        await fetch(`/api/channels/${channelId}/follow`, { method: "POST" });
      } catch {
        setFollowedIds((prev) => {
          const next = new Set(prev);
          if (wasFollowing) next.add(channelId);
          else next.delete(channelId);
          return next;
        });
      }
    },
    [userId, followedIds]
  );

  const fetchPreRollAd = useCallback(async (): Promise<VideoAd | null> => {
    try {
      const res = await fetch("/api/ads/pre-roll");
      const data = await res.json();
      return data.ad || null;
    } catch {
      return null;
    }
  }, []);

  const playVideo = useCallback(async (video: ChannelVideo) => {
    if (!video.mux_playback_id) {
      router.push(`/live/watch/${video.id}`);
      return;
    }
    const ad = await fetchPreRollAd();
    if (ad) {
      setPreRollAd(ad);
      setPendingVideo(video);
      setPendingStream(null);
    } else {
      setPlayingVideo(video);
    }
  }, [fetchPreRollAd, router]);

  const watchStream = useCallback(async (stream: LiveStream) => {
    if (!stream.mux_playback_id) return;
    const ad = await fetchPreRollAd();
    if (ad) {
      setPreRollAd(ad);
      setPendingStream(stream);
      setPendingVideo(null);
    } else {
      setWatchingStream(stream);
    }
  }, [fetchPreRollAd]);

  const handleAdComplete = useCallback(() => {
    setPreRollAd(null);
    if (pendingVideo) {
      setPlayingVideo(pendingVideo);
      setPendingVideo(null);
    } else if (pendingStream) {
      setWatchingStream(pendingStream);
      setPendingStream(null);
    }
  }, [pendingVideo, pendingStream]);

  const currentHero = heroVideos[heroIndex] || null;
  const heroAccent = HERO_ACCENTS[heroIndex % HERO_ACCENTS.length];

  // ── Pre-Roll Ad ─────────────────────────────────────────
  if (preRollAd && preRollAd.mux_playback_id) {
    return (
      <PreRollAd
        playbackId={preRollAd.mux_playback_id}
        ctaText={preRollAd.cta_text || "Shop Now"}
        ctaUrl={preRollAd.cta_url || "#"}
        businessName={preRollAd.title}
        adId={preRollAd.id}
        onComplete={handleAdComplete}
        onSkip={handleAdComplete}
      />
    );
  }

  // ── Inline Video Player — editorial Hub City styling ────────
  if (playingVideo && playingVideo.mux_playback_id) {
    return (
      <div className="animate-fade-in">
        {/* Sticky black/gold back header — matches /live/watch */}
        <div
          className="sticky top-0 z-30 flex items-center gap-3 px-4 py-2.5"
          style={{
            background: "var(--ink-strong)",
            borderBottom: "2px solid var(--gold-c)",
            color: "var(--paper)",
          }}
        >
          <button
            onClick={() => setPlayingVideo(null)}
            className="w-9 h-9 flex items-center justify-center press shrink-0"
            style={{
              background: "var(--gold-c)",
              border: "2px solid var(--paper)",
              color: "var(--ink-strong)",
            }}
            aria-label="Back"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div
            className="c-kicker"
            style={{ fontSize: 10, color: "var(--gold-c)", letterSpacing: "0.18em" }}
          >
            § ON AIR · WATCH
          </div>
        </div>

        {/* Full-bleed player */}
        <div
          className="overflow-hidden"
          style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
        >
          <MuxPlayer
            playbackId={playingVideo.mux_playback_id}
            streamType="on-demand"
            autoPlay
            accentColor="#F2A900"
            style={{ aspectRatio: "16/9", width: "100%" }}
            metadata={{
              video_title: playingVideo.title,
              viewer_user_id: userId || "anon",
            }}
          />
        </div>

        {/* Title + meta — paper-warm slab */}
        <div
          style={{
            padding: "14px 18px",
            background: "var(--paper-warm)",
            borderBottom: "2px solid var(--rule-strong-c)",
          }}
        >
          <h2
            className="c-card-t mb-2"
            style={{ fontSize: 17, lineHeight: 1.15, color: "var(--ink-strong)" }}
          >
            {playingVideo.title}
          </h2>
          <div className="flex items-center gap-2">
            <span className="c-meta" style={{ fontSize: 11 }}>
              {formatViews(playingVideo.view_count)} views
            </span>
            {playingVideo.published_at && (
              <>
                <span className="c-meta" style={{ opacity: 0.4 }}>·</span>
                <span className="c-meta" style={{ fontSize: 11 }}>
                  {timeAgo(playingVideo.published_at)}
                </span>
              </>
            )}
            {playingVideo.duration && (
              <>
                <span className="c-meta" style={{ opacity: 0.4 }}>·</span>
                <span className="c-meta" style={{ fontSize: 11 }}>
                  {formatDuration(playingVideo.duration)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Channel + description */}
        <div className="px-[18px] py-4 space-y-4">
          {playingVideo.channel && (
            <Link
              href={`/live/channel/${playingVideo.channel.id}`}
              className="flex items-center gap-3 press"
              style={{
                padding: "10px 12px",
                background: "var(--paper-warm)",
                border: "2px solid var(--rule-strong-c)",
              }}
            >
              <div
                className="w-10 h-10 overflow-hidden flex items-center justify-center shrink-0"
                style={{
                  background: "var(--ink-strong)",
                  border: "2px solid var(--rule-strong-c)",
                  color: "var(--gold-c)",
                  fontFamily: "var(--font-archivo), Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: 11,
                }}
              >
                {playingVideo.channel.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={playingVideo.channel.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  channelInitials(playingVideo.channel.name)
                )}
              </div>
              <div className="min-w-0">
                <p
                  className="c-kicker"
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.16em",
                    color: "var(--ink-strong)",
                    opacity: 0.65,
                  }}
                >
                  CHANNEL
                </p>
                <p
                  className="c-card-t truncate"
                  style={{ fontSize: 14, color: "var(--ink-strong)", marginTop: 2 }}
                >
                  {playingVideo.channel.name}
                </p>
              </div>
              <span
                className="ml-auto c-kicker"
                style={{
                  fontSize: 10,
                  color: "var(--gold-c)",
                  letterSpacing: "0.16em",
                }}
              >
                VISIT →
              </span>
            </Link>
          )}

          {playingVideo.description && (
            <p
              className="c-body"
              style={{
                fontSize: 14,
                lineHeight: 1.55,
                color: "var(--ink-strong)",
                opacity: 0.85,
              }}
            >
              {playingVideo.description}
            </p>
          )}
        </div>

        {/* Up Next — editorial kicker + numbered rows */}
        {recentVideos.length > 1 && (
          <div className="px-[18px] pt-4 pb-8">
            <div className="flex items-baseline gap-3 mb-3">
              <span
                className="c-kicker"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  color: "var(--ink-strong)",
                  opacity: 0.7,
                }}
              >
                § UP NEXT
              </span>
              <span className="ml-auto rule-hairline flex-1 self-center" />
            </div>
            <div className="space-y-3">
              {recentVideos
                .filter((v) => v.id !== playingVideo.id)
                .slice(0, 5)
                .map((video) => (
                  <VideoCardRow
                    key={video.id}
                    video={video}
                    onPlay={() => playVideo(video)}
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Watching Live Stream — editorial Hub City styling ───────
  if (watchingStream && watchingStream.mux_playback_id) {
    return (
      <div className="animate-fade-in">
        {/* Sticky black/gold back header */}
        <div
          className="sticky top-0 z-30 flex items-center gap-3 px-4 py-2.5"
          style={{
            background: "var(--ink-strong)",
            borderBottom: "2px solid var(--gold-c)",
            color: "var(--paper)",
          }}
        >
          <button
            onClick={() => setWatchingStream(null)}
            className="w-9 h-9 flex items-center justify-center press shrink-0"
            style={{
              background: "var(--gold-c)",
              border: "2px solid var(--paper)",
              color: "var(--ink-strong)",
            }}
            aria-label="Back"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div
            className="c-kicker flex-1"
            style={{ fontSize: 10, color: "var(--gold-c)", letterSpacing: "0.18em" }}
          >
            § ON AIR · LIVE
          </div>
          {watchingStream.status === "active" && (
            <span
              className="c-badge c-badge-live inline-flex items-center gap-1.5"
            >
              <span
                className="inline-block animate-pulse"
                style={{ width: 6, height: 6, background: "#fff" }}
              />
              LIVE
            </span>
          )}
        </div>

        {/* Full-bleed player */}
        <div
          className="overflow-hidden"
          style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
        >
          <MuxPlayer
            playbackId={watchingStream.mux_playback_id}
            streamType={watchingStream.status === "active" ? "live" : "on-demand"}
            autoPlay
            accentColor="#F2A900"
            style={{ aspectRatio: "16/9", width: "100%" }}
            metadata={{
              video_title: watchingStream.title,
              viewer_user_id: userId || "anon",
            }}
          />
        </div>

        {/* Title + viewer count — paper-warm slab */}
        <div
          style={{
            padding: "14px 18px",
            background: "var(--paper-warm)",
            borderBottom: "2px solid var(--rule-strong-c)",
          }}
        >
          <h2
            className="c-card-t mb-2"
            style={{ fontSize: 17, lineHeight: 1.15, color: "var(--ink-strong)" }}
          >
            {watchingStream.title}
          </h2>
          {watchingStream.viewer_count > 0 && (
            <p
              className="c-meta"
              style={{
                fontSize: 11,
                color: "var(--ink-strong)",
                opacity: 0.75,
              }}
            >
              <span style={{ color: "var(--red-c, #c0392b)", fontWeight: 800 }}>
                {watchingStream.viewer_count}
              </span>{" "}
              {watchingStream.viewer_count === 1 ? "viewer" : "viewers"} tuned in
            </p>
          )}
        </div>

        {/* Creator + description */}
        <div className="px-[18px] py-4 space-y-4">
          {watchingStream.creator && (
            <div
              className="flex items-center gap-3"
              style={{
                padding: "10px 12px",
                background: "var(--paper-warm)",
                border: "2px solid var(--rule-strong-c)",
              }}
            >
              <div
                className="w-10 h-10 overflow-hidden flex items-center justify-center shrink-0"
                style={{
                  background: "var(--ink-strong)",
                  border: "2px solid var(--rule-strong-c)",
                  color: "var(--gold-c)",
                  fontFamily: "var(--font-archivo), Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: 13,
                }}
              >
                {watchingStream.creator.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={watchingStream.creator.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  watchingStream.creator.display_name?.[0]?.toUpperCase() || "?"
                )}
              </div>
              <div className="min-w-0">
                <p
                  className="c-kicker"
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.16em",
                    color: "var(--ink-strong)",
                    opacity: 0.65,
                  }}
                >
                  STREAMING NOW
                </p>
                <p
                  className="c-card-t truncate"
                  style={{ fontSize: 14, color: "var(--ink-strong)", marginTop: 2 }}
                >
                  {watchingStream.creator.display_name}
                </p>
              </div>
            </div>
          )}

          {watchingStream.description && (
            <p
              className="c-body"
              style={{
                fontSize: 14,
                lineHeight: 1.55,
                color: "var(--ink-strong)",
                opacity: 0.85,
              }}
            >
              {watchingStream.description}
            </p>
          )}
          {watchingStream.status === "active" && (
            <div
              className="p-4 flex items-center gap-3"
              style={{
                background: "var(--ink-strong)",
                border: "2px solid var(--rule-strong-c)",
                color: "var(--gold-c)",
              }}
            >
              <div
                className="animate-pulse shrink-0"
                style={{ width: 10, height: 10, background: "var(--gold-c)" }}
              />
              <div>
                <p
                  className="c-kicker"
                  style={{ fontSize: 12, color: "var(--gold-c)", letterSpacing: "0.16em" }}
                >
                  BROADCASTING LIVE
                </p>
                <p
                  style={{ fontSize: 11, color: "var(--paper)", opacity: 0.7, marginTop: 2 }}
                >
                  {watchingStream.viewer_count || 0} viewers tuned in
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* ══════════════════════════════════════════════════════
          HERO BANNER — cinematic full-bleed header
          ══════════════════════════════════════════════════════ */}
      <div className="relative">
        {/* Background video poster */}
        <div className="absolute inset-0 overflow-hidden">
          {currentHero?.mux_playback_id && (
            <img
              src={`https://image.mux.com/${currentHero.mux_playback_id}/thumbnail.webp?width=960&height=540&time=8`}
              alt=""
              className="w-full h-full object-cover transition-opacity duration-700"
            />
          )}
        </div>
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-midnight)] via-[var(--color-midnight)]/70 to-[var(--color-midnight)]/40" />
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 20% 50%, ${heroAccent}20 0%, transparent 60%)` }} />

        <div className="relative z-10 px-5 pt-6 pb-8">
          {/* Brand tag */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 mb-5"
            style={{ background: "var(--gold-c)", color: "var(--ink-strong)", border: "2px solid var(--ink-strong)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#E84855" }} />
            <span className="c-kicker" style={{ fontSize: 10 }}>HUB CITY TV</span>
          </div>

          {/* Live count indicator */}
          {activeStreams.length > 0 && (
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 ml-2"
              style={{ background: "#E84855", color: "#fff", border: "2px solid var(--paper)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="c-kicker" style={{ fontSize: 10 }}>{activeStreams.length} LIVE NOW</span>
            </div>
          )}

          {currentHero ? (
            <>
              <h1 className="font-heading text-[36px] font-bold leading-[0.95] tracking-tight mb-3">
                {currentHero.title}
              </h1>
              {currentHero.description && (
                <p className="font-display italic text-[16px] text-warm-gray leading-relaxed max-w-[300px] mb-2">
                  {currentHero.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-[12px] text-txt-secondary mb-1">
                <span>{VIDEO_TYPE_LABEL[currentHero.video_type] || currentHero.video_type}</span>
                {currentHero.duration && <><span>·</span><span>{formatDuration(currentHero.duration)}</span></>}
                {currentHero.view_count > 0 && <><span>·</span><span>{formatViews(currentHero.view_count)} views</span></>}
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => playVideo(currentHero)}
                  className="c-btn c-btn-accent flex items-center gap-2 press"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  WATCH NOW
                </button>
                <button
                  className="c-btn c-btn-outline flex items-center gap-2 press"
                  style={{ color: "var(--paper)", borderColor: "var(--paper)" }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
                  MY LIST
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="font-heading text-[36px] font-bold leading-[0.95] tracking-tight mb-3">
                Culture <span className="text-gold">TV</span>
              </h1>
              <p className="font-display italic text-[16px] text-warm-gray leading-relaxed max-w-[300px] mb-2">
                Compton&apos;s community television. Free. Local. Always on.
              </p>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setActiveTab("channels")}
                  className="c-btn c-btn-accent flex items-center gap-2 press"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  START WATCHING
                </button>
              </div>
            </>
          )}

          {/* Hero pagination dots */}
          {heroVideos.length > 1 && (
            <div className="flex gap-2 mt-6">
              {heroVideos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setHeroIndex(i); if (heroTimerRef.current) clearInterval(heroTimerRef.current); }}
                  className={`h-[3px] rounded-full transition-all duration-500 ${
                    i === heroIndex ? "w-8 bg-gold" : "w-3 bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB NAVIGATION
          ══════════════════════════════════════════════════════ */}
      <div
        className="flex gap-0 px-5 mb-6 overflow-x-auto scrollbar-hide pb-1 pt-4"
        style={{ background: "var(--paper)" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2 c-card-t whitespace-nowrap press shrink-0"
            style={
              activeTab === tab.id
                ? {
                    background: "var(--ink-strong)",
                    color: "var(--gold-c)",
                    border: "2px solid var(--ink-strong)",
                    fontSize: 11,
                    marginRight: -2,
                  }
                : {
                    background: "transparent",
                    color: "var(--ink-strong)",
                    border: "2px solid var(--rule-strong-c)",
                    fontSize: 11,
                    marginRight: -2,
                  }
            }
          >
            {tab.id === "live" && activeStreams.length > 0 && (
              <span className="inline-block w-2 h-2 rounded-full mr-1.5 animate-pulse" style={{ background: "#E84855" }} />
            )}
            {tab.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          HOME TAB
          ══════════════════════════════════════════════════════ */}
      {activeTab === "home" && (
        <div className="animate-fade-in">
          {/* ── Culture TV Live (simulated linear channel) ── */}
          <LiveSimulatedPlayer
            schedule={liveSchedule}
            ads={ads}
            userId={userId}
            onVideoChange={setActiveLiveVideoId}
          />

          {/* ── Related to what's playing (events, resources, deals) ── */}
          <RelatedToLive
            initialData={relatedToLive}
            videoId={activeLiveVideoId}
          />

          {/* ── Live Now (real live streams) ── */}
          {activeStreams.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-2 px-5 mb-3">
                <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "#E84855" }} />
                <h2 className="c-hero" style={{ fontSize: 22, color: "var(--ink-strong)" }}>LIVE NOW</h2>
                <span className="c-badge-live" style={{ fontSize: 9 }}>{activeStreams.length} LIVE</span>
              </div>
              <div className="px-5 space-y-3">
                {activeStreams.map((stream) => (
                  <StreamCard key={stream.id} stream={stream} isLive onWatch={() => watchStream(stream)} />
                ))}
              </div>
            </section>
          )}

          {/* ── Trending on Culture TV ── */}
          {trendingVideos.length > 0 && (
            <section className="mb-8">
              <div className="px-5 mb-3">
                <div
                  className="flex items-baseline gap-3 pb-2"
                  style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
                >
                  <span
                    className="c-kicker"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.18em",
                      color: "var(--ink-strong)",
                      opacity: 0.7,
                    }}
                  >
                    § TRENDING
                  </span>
                  <span
                    className="c-badge c-badge-gold tabular-nums ml-auto"
                    style={{ fontSize: 9 }}
                  >
                    HOT NOW
                  </span>
                </div>
              </div>
              <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
                {trendingVideos.map((video, i) => (
                  <button key={video.id} onClick={() => playVideo(video)} className="shrink-0 w-[200px] text-left press group">
                    <div
                      className="relative overflow-hidden mb-2"
                      style={{ border: "2px solid var(--rule-strong-c)" }}
                    >
                      <div className="aspect-video flex items-center justify-center" style={{ background: "var(--ink-strong)" }}>
                        {video.thumbnail_url ? (
                          <img src={video.thumbnail_url} alt={video.title} className="absolute inset-0 w-full h-full object-cover" />
                        ) : video.mux_playback_id ? (
                          <img src={`https://image.mux.com/${video.mux_playback_id}/thumbnail.webp?width=400&height=225&fit_mode=smartcrop`} alt={video.title} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--gold-c)", opacity: 0.4 }}><polygon points="5 3 19 12 5 21 5 3" /></svg>
                        )}
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "var(--gold-c)", border: "2px solid var(--ink-strong)" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5" style={{ color: "var(--ink-strong)" }}><polygon points="5 3 19 12 5 21 5 3" /></svg>
                          </div>
                        </div>
                        {/* Rank badge — editorial */}
                        <div
                          className="absolute top-2 left-2 px-1.5 py-0.5 c-kicker tabular-nums"
                          style={{
                            background: "var(--gold-c)",
                            color: "var(--ink-strong)",
                            border: "2px solid var(--ink-strong)",
                            fontSize: 10,
                            letterSpacing: "0.06em",
                          }}
                        >
                          № {String(i + 1).padStart(2, "0")}
                        </div>
                        {video.duration && (
                          <div
                            className="absolute bottom-1.5 right-1.5 px-1 py-0.5 c-kicker"
                            style={{
                              background: "var(--paper)",
                              color: "var(--ink-strong)",
                              border: "1.5px solid var(--rule-strong-c)",
                              fontSize: 9,
                            }}
                          >
                            {formatDuration(video.duration)}
                          </div>
                        )}
                      </div>
                    </div>
                    <h3
                      className="c-card-t line-clamp-2 mb-0.5"
                      style={{
                        fontSize: 12,
                        lineHeight: 1.2,
                        color: "var(--ink-strong)",
                        minHeight: "2.4em",
                      }}
                    >
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      {video.channel && <p className="c-meta truncate">{video.channel.name}</p>}
                      <span className="c-meta">· {formatViews(video.view_count)} VIEWS</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── Family rail (vertical posters) ── */}
          {familyVideos.length > 0 && (
            <VerticalPosterRail
              kicker="§ FAMILY"
              title="Family Picks"
              accent="Watch with the whole house."
              videos={familyVideos}
              onPlay={playVideo}
            />
          )}

          {/* ── Cartoons rail (vertical posters) ── */}
          {cartoonVideos.length > 0 && (
            <VerticalPosterRail
              kicker="§ CARTOONS"
              title="Cartoons & Kids"
              accent="Saturday-morning energy, all week."
              videos={cartoonVideos}
              onPlay={playVideo}
            />
          )}

          {/* ── Documentaries rail (vertical posters) ── */}
          {docVideos.length > 0 && (
            <VerticalPosterRail
              kicker="§ DOCS"
              title="Documentaries"
              accent="The real story, fully sourced."
              videos={docVideos}
              onPlay={playVideo}
            />
          )}

          {/* ── Culture Originals ── */}
          {originals.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between px-5 mb-3">
                <h2 className="c-hero" style={{ fontSize: 22, color: "var(--ink-strong)" }}>
                  CULTURE <span style={{ color: "var(--gold-c)" }}>ORIGINALS</span>
                </h2>
                <button
                  onClick={() => setActiveTab("originals")}
                  className="c-meta press"
                  style={{ color: "var(--ink-strong)" }}
                >SEE ALL →</button>
              </div>
              <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
                {originals.map((video, i) => {
                  const accent = HERO_ACCENTS[i % HERO_ACCENTS.length];
                  return (
                    <button key={video.id} className="shrink-0 w-[140px] text-left press group" onClick={() => playVideo(video)}>
                      <div
                        className="relative overflow-hidden mb-2.5 aspect-[3/4]"
                        style={{
                          background: `linear-gradient(180deg, ${accent}20 0%, var(--color-midnight) 100%)`,
                          border: "2px solid var(--rule-strong-c)",
                        }}
                      >
                        {video.mux_playback_id ? (
                          <img
                            src={`https://image.mux.com/${video.mux_playback_id}/thumbnail.webp?width=280&height=373&time=5`}
                            alt={video.title}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : video.thumbnail_url ? (
                          <img src={video.thumbnail_url} alt={video.title} className="absolute inset-0 w-full h-full object-cover" />
                        ) : null}
                        <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-midnight to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 rounded-full bg-gold/90 flex items-center justify-center shadow-lg">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--color-midnight)" className="ml-0.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                          </div>
                        </div>
                        <div className="absolute top-2.5 left-2.5">
                          <span className="px-2 py-0.5 rounded-md text-[8px] font-bold tracking-wider uppercase text-white" style={{ background: `${accent}CC` }}>Original</span>
                        </div>
                        <div className="absolute bottom-2.5 left-2.5 right-2.5">
                          <h3 className="font-heading font-bold text-[14px] leading-tight text-white drop-shadow-lg">{video.title}</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-warm-gray">
                        {video.duration && <span>{formatDuration(video.duration)}</span>}
                        {video.duration && video.view_count > 0 && <span>·</span>}
                        {video.view_count > 0 && <span>{formatViews(video.view_count)} views</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Shows (on-demand poster grid) ── */}
          {shows.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between px-5 mb-3">
                <h2 className="c-hero" style={{ fontSize: 22, color: "var(--ink-strong)" }}>
                  <span style={{ color: "var(--gold-c)" }}>SHOWS</span> ON DEMAND
                </h2>
                <Link
                  href="/live/submit-show"
                  className="c-meta press"
                  style={{ color: "var(--ink-strong)" }}
                >
                  PITCH A SHOW →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 px-5">
                {shows.map((show) => (
                  <Link
                    key={show.id}
                    href={`/live/shows/${show.slug}`}
                    className="press group"
                  >
                    <div className="aspect-[2/3] overflow-hidden mb-2 relative" style={{ background: "var(--ink-strong)", border: "2px solid var(--rule-strong-c)" }}>
                      {show.poster_url ? (
                        <img
                          src={show.poster_url}
                          alt={show.title}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gold/30">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-[10px] uppercase tracking-wider text-gold font-semibold">
                          {show.channel?.name}
                        </p>
                      </div>
                    </div>
                    <p className="font-heading font-bold text-[13px] truncate">{show.title}</p>
                    {show.tagline && (
                      <p className="text-[11px] text-txt-secondary truncate">{show.tagline}</p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Compton Local (verified-address only) ── */}
          {isVerified && localChannels.length > 0 && (
            <section className="mb-8">
              <div className="px-5 mb-3">
                <h2 className="c-hero" style={{ fontSize: 22, color: "var(--ink-strong)" }}>
                  🌉 COMPTON <span style={{ color: "var(--gold-c)" }}>LOCAL</span>
                </h2>
                <p className="c-serif-it mt-0.5" style={{ fontSize: 13 }}>
                  Channels for verified Compton members
                </p>
              </div>
              <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-1">
                {localChannels.map((ch) => (
                  <ChannelBubble key={ch.id} channel={ch} />
                ))}
              </div>
            </section>
          )}
          {!isVerified && (
            <section className="mb-8 px-5">
              <Link
                href="/profile"
                className="block p-5 press transition-colors"
                style={{
                  background: "var(--paper)",
                  border: "2px solid var(--rule-strong-c)",
                  color: "var(--ink-strong)",
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🌉</span>
                  <div className="flex-1">
                    <h3 className="c-card-t mb-1" style={{ fontSize: 14 }}>
                      COMPTON LOCAL — LOCKED
                    </h3>
                    <p className="c-body-sm">
                      Verify your Compton address to unlock school, city, and local scene channels
                      made for members.
                    </p>
                    <p className="mt-2 c-kicker" style={{ fontSize: 10, color: "var(--gold-c)" }}>VERIFY ADDRESS →</p>
                  </div>
                </div>
              </Link>
            </section>
          )}

          {/* ── Featured Videos ── */}
          {featuredVideos.length > 0 && (
            <section className="mb-8">
              <div className="px-5 mb-3">
                <div
                  className="flex items-baseline gap-3 pb-2"
                  style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
                >
                  <span
                    className="c-kicker"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.18em",
                      color: "var(--ink-strong)",
                      opacity: 0.7,
                    }}
                  >
                    § FEATURED
                  </span>
                  <span
                    className="c-badge c-badge-gold tabular-nums ml-auto"
                    style={{ fontSize: 9 }}
                  >
                    {featuredVideos.length} {featuredVideos.length === 1 ? "VIDEO" : "VIDEOS"}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
                {featuredVideos.map((video) => (
                  <VideoCardLarge key={video.id} video={video} onPlay={() => playVideo(video)} />
                ))}
              </div>
            </section>
          )}

          {/* ── City Hall ── */}
          {cityHall.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between px-5 mb-3">
                <h2 className="c-hero flex items-center gap-2" style={{ fontSize: 22, color: "var(--ink-strong)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "#06B6D4" }}>
                    <path d="M3 21h18M3 7v14M21 7v14M6 7V4l6-2 6 2v3M9 21v-4h6v4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  CITY HALL
                </h2>
                <span className="c-meta">{cityHall.length} VIDEOS</span>
              </div>
              <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
                {cityHall.map((video) => (
                  <VideoCardSmall key={video.id} video={video} onPlay={() => playVideo(video)} badgeLabel="City Hall" badgeVariant="cyan" />
                ))}
              </div>
            </section>
          )}

          {/* ── Channels scroller ── */}
          <section className="mb-8">
            <div className="px-5 mb-3">
              <div
                className="flex items-baseline gap-3 pb-2"
                style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
              >
                <span
                  className="c-kicker"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    color: "var(--ink-strong)",
                    opacity: 0.7,
                  }}
                >
                  § CHANNELS
                </span>
                <span
                  className="c-badge c-badge-gold tabular-nums ml-auto"
                  style={{ fontSize: 9 }}
                >
                  {channels.length} ON AIR
                </span>
              </div>
            </div>
            <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-1">
              {channels.map((ch) => (
                <ChannelTile key={ch.id} channel={ch} />
              ))}
            </div>
          </section>

          {/* ── Recently Added ── */}
          {recentVideos.length > 0 && (
            <section className="mb-8">
              <div className="px-5 mb-3">
                <div
                  className="flex items-baseline gap-3 pb-2"
                  style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
                >
                  <span
                    className="c-kicker"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.18em",
                      color: "var(--ink-strong)",
                      opacity: 0.7,
                    }}
                  >
                    § RECENTLY ADDED
                  </span>
                  <span
                    className="c-badge c-badge-ink tabular-nums ml-auto"
                    style={{ fontSize: 9 }}
                  >
                    {Math.min(10, recentVideos.length)} OF {recentVideos.length}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
                {recentVideos.slice(0, 10).map((video) => (
                  <VideoCardSmall key={video.id} video={video} onPlay={() => playVideo(video)} />
                ))}
              </div>
            </section>
          )}

          {/* ── Get Your Content On The Air CTA ── */}
          <section className="mb-8 px-5">
            <div
              className="relative overflow-hidden"
              style={{
                background: "var(--paper)",
                border: "2px solid var(--rule-strong-c)",
                color: "var(--ink-strong)",
              }}
            >
              <div style={{ height: 4, background: "var(--gold-c)" }} />
              <div className="relative z-10 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 flex items-center justify-center" style={{ background: "var(--gold-c)", border: "2px solid var(--rule-strong-c)" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--ink-strong)" }}>
                      <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="c-hero" style={{ fontSize: 18 }}>GET ON THE AIR</h3>
                    <p className="c-serif-it" style={{ fontSize: 12, color: "var(--gold-c)" }}>Your scene. Your story. Your channel.</p>
                  </div>
                </div>
                <p className="c-body-sm mb-4">
                  Got a podcast, cooking show, or community event? On Air puts Compton creators front and center. Apply for your own channel and start streaming to the city.
                </p>
                <div className="flex gap-2">
                  <Link href="/profile/settings" className="c-btn c-btn-accent flex items-center gap-2 press">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
                    APPLY NOW
                  </Link>
                  <button onClick={() => setActiveTab("channels")} className="c-btn c-btn-outline press">
                    BROWSE CHANNELS
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ── Community Stats Bar ── */}
          <section className="mb-8 px-5">
            <div className="flex gap-2">
              <div
                className="flex-1 p-3 text-center"
                style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
              >
                <p className="c-hero" style={{ fontSize: 22, color: "var(--gold-c)" }}>{channels.length}</p>
                <p className="c-kicker" style={{ fontSize: 10 }}>CHANNELS</p>
              </div>
              <div
                className="flex-1 p-3 text-center"
                style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
              >
                <p className="c-hero" style={{ fontSize: 22, color: "#E84855" }}>{recentVideos.length + featuredVideos.length}</p>
                <p className="c-kicker" style={{ fontSize: 10 }}>VIDEOS</p>
              </div>
              <div
                className="flex-1 p-3 text-center"
                style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
              >
                <p className="c-hero" style={{ fontSize: 22, color: "#22C55E" }}>FREE</p>
                <p className="c-kicker" style={{ fontSize: 10 }}>ALWAYS</p>
              </div>
            </div>
          </section>

          {/* ── Browse by Category ── */}
          <section className="mb-8 px-5">
            <div
              className="flex items-baseline gap-3 pb-2 mb-3"
              style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
            >
              <span
                className="c-kicker"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  color: "var(--ink-strong)",
                  opacity: 0.7,
                }}
              >
                § BROWSE BY CATEGORY
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: "Sports", icon: "trophy", color: "#3B82F6", href: "/live?type=sports" },
                { label: "Music", icon: "music", color: "#8B5CF6", href: "/frequency" },
                { label: "News", icon: "megaphone", color: "#06B6D4", href: "/live?type=news" },
                { label: "Culture", icon: "theater", color: "#EF4444", href: "/culture" },
                { label: "Podcasts", icon: "music", color: "#FF6B6B", href: "/podcasts" },
                { label: "Education", icon: "book", color: "#22C55E", href: "/live?type=education" },
              ].map((cat, i) => (
                <Link
                  key={i}
                  href={cat.href}
                  className="relative overflow-hidden p-3 text-left press group"
                  style={{
                    background: "var(--paper)",
                    border: "2px solid var(--rule-strong-c)",
                    color: "var(--ink-strong)",
                  }}
                >
                  <div className="absolute top-0 left-0 right-0" style={{ height: 3, background: cat.color }} />
                  <span className="block mb-1.5 mt-1"><Icon name={cat.icon as IconName} size={22} style={{ color: cat.color }} /></span>
                  <span className="c-card-t" style={{ fontSize: 12 }}>{cat.label.toUpperCase()}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* ── Today on Culture TV ── */}
          {todayBlocks.length > 0 && (
            <section className="mb-8 px-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="c-hero flex items-center gap-2" style={{ fontSize: 22, color: "var(--ink-strong)" }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: "var(--gold-c)" }} />
                  TODAY ON AIR
                </h2>
                <button
                  onClick={() => setActiveTab("schedule")}
                  className="c-meta press"
                  style={{ color: "var(--ink-strong)" }}
                >FULL SCHEDULE →</button>
              </div>
              <div className="space-y-2">
                {todayBlocks.slice(0, 4).map((tb) => <TimeBlockCard key={tb.id} block={tb} />)}
              </div>
            </section>
          )}

          {/* ── Creator Spotlight CTA ── */}
          <section className="mb-8 px-5">
            <div
              className="relative overflow-hidden p-5"
              style={{
                background: "var(--paper)",
                border: "2px solid var(--rule-strong-c)",
                color: "var(--ink-strong)",
              }}
            >
              <div style={{ height: 3, background: "#E84855", marginTop: -20, marginLeft: -20, marginRight: -20, marginBottom: 16 }} />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#E84855" }}>
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                  <h3 className="c-card-t" style={{ fontSize: 14 }}>GOT A PODCAST?</h3>
                </div>
                <p className="c-body-sm mb-3">
                  Record it. Upload it. Compton listens. On Air hosts local podcasts, talk shows, and audio content from the community.
                </p>
                <Link
                  href="/podcasts"
                  className="inline-flex items-center gap-1.5 c-kicker press"
                  style={{ fontSize: 11, color: "var(--ink-strong)" }}
                >
                  EXPLORE PODCASTS
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
              </div>
            </div>
          </section>

          {/* ── Why Culture TV ── */}
          <section className="mb-8 px-5">
            <h2 className="c-hero mb-4" style={{ fontSize: 22, color: "var(--ink-strong)" }}>WHY <span style={{ color: "var(--gold-c)" }}>ON AIR</span>?</h2>
            <div className="space-y-3">
              {[
                { emoji: "1", title: "100% Free", desc: "No subscriptions, no ads for viewers, no paywall. Just Compton.", color: "#22C55E" },
                { emoji: "2", title: "By Compton, For Compton", desc: "Every channel is locally owned. Every show tells our story.", color: "#F2A900" },
                { emoji: "3", title: "Go Live Anytime", desc: "Schools, churches, businesses — anyone can broadcast to the city.", color: "#3B82F6" },
                { emoji: "4", title: "On Demand", desc: "Missed it live? Watch replays of city meetings, games, and more.", color: "#8B5CF6" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3.5">
                  <div
                    className="w-8 h-8 flex items-center justify-center shrink-0 c-card-t"
                    style={{ background: item.color, color: "var(--ink-strong)", border: "2px solid var(--rule-strong-c)", fontSize: 14 }}
                  >
                    {item.emoji}
                  </div>
                  <div>
                    <p className="c-card-t mb-0.5" style={{ fontSize: 13, color: "var(--ink-strong)" }}>{item.title.toUpperCase()}</p>
                    <p className="c-body-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          LIVE TAB
          ══════════════════════════════════════════════════════ */}
      {activeTab === "live" && (
        <div className="animate-fade-in">
          {/* Stats bar — shared paper+ink strip, gold numerals */}
          <div className="px-5 mb-5">
            <div
              className="flex"
              style={{
                background: "var(--paper)",
                border: "2px solid var(--rule-strong-c)",
              }}
            >
              <div className="flex-1 p-3 text-center" style={{ borderRight: "2px solid var(--rule-strong-c)" }}>
                <p
                  className="c-hero tabular-nums"
                  style={{ fontSize: 22, color: "var(--ink-strong)", lineHeight: 1 }}
                >
                  {activeStreams.length}
                </p>
                <p
                  className="c-kicker mt-1"
                  style={{ fontSize: 9, color: "var(--ink-strong)", opacity: 0.6, letterSpacing: "0.14em" }}
                >
                  LIVE NOW
                </p>
              </div>
              <div className="flex-1 p-3 text-center" style={{ borderRight: "2px solid var(--rule-strong-c)", background: "var(--gold-c)" }}>
                <p
                  className="c-hero tabular-nums"
                  style={{ fontSize: 22, color: "var(--ink-strong)", lineHeight: 1 }}
                >
                  {upcomingStreams.length}
                </p>
                <p
                  className="c-kicker mt-1"
                  style={{ fontSize: 9, color: "var(--ink-strong)", opacity: 0.75, letterSpacing: "0.14em" }}
                >
                  UPCOMING
                </p>
              </div>
              <div className="flex-1 p-3 text-center">
                <p
                  className="c-hero tabular-nums"
                  style={{ fontSize: 22, color: "var(--ink-strong)", lineHeight: 1 }}
                >
                  {channels.length}
                </p>
                <p
                  className="c-kicker mt-1"
                  style={{ fontSize: 9, color: "var(--ink-strong)", opacity: 0.6, letterSpacing: "0.14em" }}
                >
                  CHANNELS
                </p>
              </div>
            </div>
          </div>

          {activeStreams.length > 0 && (
            <div className="px-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="c-card-t" style={{ fontSize: 15 }}>LIVE NOW</h2>
                <div className="w-2 h-2 animate-pulse" style={{ background: "#E84855" }} />
              </div>
              <div className="space-y-3">
                {activeStreams.map((stream) => (
                  <StreamCard key={stream.id} stream={stream} isLive onWatch={() => watchStream(stream)} />
                ))}
              </div>
            </div>
          )}

          <div className="px-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="c-card-t" style={{ fontSize: 15 }}>UPCOMING STREAMS</h2>
              <span className="c-meta" style={{ color: "var(--ink-strong)", opacity: 0.6 }}>{upcomingStreams.length} scheduled</span>
            </div>
            {upcomingStreams.length === 0 ? (
              <div className="text-center py-10">
                <div
                  className="w-16 h-16 flex items-center justify-center mx-auto mb-3"
                  style={{
                    background: "var(--paper)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--ink-strong)" strokeOpacity="0.55" strokeWidth="1.5" strokeLinecap="round">
                    <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </div>
                <p
                  className="c-serif-it mb-1"
                  style={{ fontSize: 14, color: "var(--ink-strong)", opacity: 0.8 }}
                >
                  No streams scheduled yet
                </p>
                {canStream && (
                  <p
                    className="c-kicker"
                    style={{ fontSize: 10, color: "var(--ink-strong)", letterSpacing: "0.14em" }}
                  >
                    APPLY FOR A CHANNEL TO START STREAMING
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingStreams.map((stream) => (
                  <StreamCard key={stream.id} stream={stream} onWatch={() => { if (stream.mux_playback_id) watchStream(stream); }} />
                ))}
              </div>
            )}
          </div>

          {/* Recent live replays */}
          {recentVideos.length > 0 && (
            <div className="px-5 mb-6">
              <h2 className="c-card-t mb-3" style={{ fontSize: 15 }}>RECENT REPLAYS</h2>
              <div className="space-y-3">
                {recentVideos.slice(0, 6).map((video) => (
                  <VideoCardRow key={video.id} video={video} onPlay={() => playVideo(video)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          ORIGINALS TAB
          ══════════════════════════════════════════════════════ */}
      {activeTab === "originals" && (
        <div className="animate-fade-in">
          <div className="px-5 mb-6">
            <h2 className="c-hero mb-1" style={{ fontSize: 22, color: "var(--ink-strong)" }}>
              <span style={{ color: "var(--gold-c)" }}>CULTURE</span> ORIGINALS
            </h2>
            <p className="c-serif-it" style={{ fontSize: 14 }}>
              Premium content. Made in Compton. Streaming to the world.
            </p>
          </div>

          {/* Originals grid */}
          <div className="px-5 space-y-4 mb-8">
            {originals.length > 0 ? originals.map((video, i) => {
              const accent = HERO_ACCENTS[i % HERO_ACCENTS.length];
              return (
                <button key={video.id} className="w-full text-left press group" onClick={() => playVideo(video)}>
                  <div
                    className="relative overflow-hidden"
                    style={{ border: "2px solid var(--rule-strong-c)" }}
                  >
                    <div className="h-[200px] relative overflow-hidden">
                      {video.mux_playback_id ? (
                        <img
                          src={`https://image.mux.com/${video.mux_playback_id}/thumbnail.webp?width=800&height=400&time=10`}
                          alt={video.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : video.thumbnail_url ? (
                        <img src={video.thumbnail_url} alt={video.title} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-midnight to-deep" />
                      )}
                      <div className="absolute inset-0" style={{
                        background: `linear-gradient(180deg, transparent 0%, ${accent}15 60%, var(--color-card) 100%)`,
                      }} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity" style={{ background: "var(--gold-c)", border: "2px solid var(--rule-strong-c)" }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--ink-strong)" className="ml-1"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                        </div>
                      </div>
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 text-[9px] font-bold tracking-wider uppercase" style={{ background: `${accent}CC`, color: "#fff" }}>Culture Original</span>
                      </div>
                      {video.duration && (
                        <div className="absolute bottom-3 right-3 px-1.5 py-0.5 text-[10px] font-mono" style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}>
                          {formatDuration(video.duration)}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="c-card-t mb-1" style={{ fontSize: 18 }}>{video.title}</h3>
                      {video.description && <p className="c-body-sm leading-relaxed mb-2" style={{ opacity: 0.72 }}>{video.description}</p>}
                      <div className="c-meta flex items-center gap-2" style={{ fontSize: 11, color: "var(--ink-strong)", opacity: 0.55 }}>
                        <span>{VIDEO_TYPE_LABEL[video.video_type] || video.video_type}</span>
                        {video.view_count > 0 && <><span>·</span><span>{formatViews(video.view_count)} views</span></>}
                        {video.published_at && <><span>·</span><span>{timeAgo(video.published_at)}</span></>}
                      </div>
                    </div>
                  </div>
                </button>
              );
            }) : (
              <div className="text-center py-12">
                <p className="c-body-sm" style={{ opacity: 0.55 }}>No original content yet</p>
              </div>
            )}
          </div>

          {/* Non-original recent videos */}
          {recentVideos.filter((v) => v.video_type !== "original").length > 0 && (
            <section className="mb-8">
              <div className="px-5 mb-3">
                <h2 className="c-card-t mb-0.5" style={{ fontSize: 15 }}>ALL VIDEOS</h2>
                <p className="c-serif-it" style={{ fontSize: 12 }}>Latest from On Air</p>
              </div>
              <div className="px-5 space-y-3">
                {recentVideos.filter((v) => v.video_type !== "original").map((video) => (
                  <VideoCardRow key={video.id} video={video} onPlay={() => playVideo(video)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          CHANNELS TAB
          ══════════════════════════════════════════════════════ */}
      {activeTab === "channels" && (
        <div className="animate-fade-in">
          {/* Channel story bubbles */}
          <div className="flex gap-3 px-5 mb-5 overflow-x-auto scrollbar-hide pb-1">
            {channels.slice(0, 15).map((ch) => (
              <ChannelBubble key={ch.id} channel={ch} />
            ))}
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 px-5 mb-4 overflow-x-auto scrollbar-hide pb-1">
            {NATIONAL_CHANNEL_FILTERS.map((f) => {
              const active = channelFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setChannelFilter(f.value)}
                  className="shrink-0 px-3 py-1.5 press transition-colors"
                  style={{
                    background: active ? "var(--gold-c)" : "var(--paper)",
                    border: "2px solid var(--rule-strong-c)",
                    color: "var(--ink-strong)",
                    fontFamily: "var(--font-archivo-narrow), sans-serif",
                    fontSize: 11,
                    fontWeight: active ? 800 : 600,
                    letterSpacing: "0.06em",
                  }}
                >
                  {f.label.toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* Channel count */}
          <div className="px-5 mb-3">
            <p className="c-meta" style={{ fontSize: 12 }}>{filteredChannels.length} channels{channelFilter !== "all" ? ` in ${channelFilter}` : ""}</p>
          </div>

          <div className="px-5 space-y-3">
            {filteredChannels.length === 0 ? (
              <div className="text-center py-10"><p className="c-body-sm" style={{ opacity: 0.55 }}>No channels in this category</p></div>
            ) : (
              filteredChannels.map((ch) => {
                const badge = TYPE_BADGE[ch.type] || TYPE_BADGE.community;
                return (
                  <div
                    key={ch.id}
                    className="relative"
                    style={{
                      background: "var(--paper)",
                      border: "2px solid var(--rule-strong-c)",
                      padding: 12,
                    }}
                  >
                    <div className="flex gap-3">
                      <Link href={`/live/channel/${ch.id}`} className="shrink-0">
                        <div
                          className="w-14 h-14 flex items-center justify-center overflow-hidden"
                          style={{
                            background: "var(--gold-c)",
                            border: "2px solid var(--rule-strong-c)",
                            color: "var(--ink-strong)",
                          }}
                        >
                          {ch.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={ch.avatar_url} alt={ch.name} className="w-full h-full object-cover" />
                          ) : (
                            <span
                              className="c-hero"
                              style={{ fontSize: 16, color: "var(--ink-strong)" }}
                            >
                              {channelInitials(ch.name)}
                            </span>
                          )}
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/live/channel/${ch.id}`}>
                          <h3 className="c-card-t mb-1 flex items-center gap-1.5" style={{ fontSize: 13 }}>
                            {ch.name}
                            {ch.is_verified && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0" style={{ color: "var(--gold-c)" }}>
                                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                              </svg>
                            )}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge label={badge.label} variant={badge.variant} />
                          <span className="c-meta" style={{ fontSize: 10, color: "var(--ink-strong)", opacity: 0.6 }}>{ch.follower_count.toLocaleString()} followers</span>
                        </div>
                        {ch.description && (
                          <p className="c-body-sm line-clamp-1" style={{ opacity: 0.7 }}>{ch.description}</p>
                        )}
                      </div>
                      {userId && (
                        <button
                          onClick={() => handleFollow(ch.id)}
                          className="self-center press shrink-0"
                          style={{
                            padding: "6px 12px",
                            fontSize: 11,
                            fontWeight: 700,
                            fontFamily: "var(--font-archivo-narrow), sans-serif",
                            letterSpacing: "0.04em",
                            background: followedIds.has(ch.id) ? "var(--gold-c)" : "var(--paper)",
                            border: "2px solid var(--rule-strong-c)",
                            color: "var(--ink-strong)",
                          }}
                        >
                          {followedIds.has(ch.id) ? "FOLLOWING" : "FOLLOW"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          SCHEDULE TAB
          ══════════════════════════════════════════════════════ */}
      {activeTab === "schedule" && (
        <div className="animate-fade-in px-5">
          {/* Week overview */}
          <div className="flex gap-1.5 mb-6 overflow-x-auto scrollbar-hide pb-1">
            {DAY_NAMES.map((day, i) => {
              const blockCount = timeBlocks.filter((tb) => tb.day_of_week === i).length;
              const isToday = i === today;
              return (
                <div
                  key={i}
                  className="shrink-0 w-[52px] p-2 text-center"
                  style={{
                    background: isToday ? "var(--gold-c)" : "var(--paper)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  <p
                    className="c-kicker"
                    style={{ fontSize: 9, color: "var(--ink-strong)", opacity: isToday ? 0.8 : 0.6, letterSpacing: "0.1em" }}
                  >
                    {DAY_NAMES_SHORT[i]}
                  </p>
                  <p
                    className="c-hero tabular-nums"
                    style={{ fontSize: 18, color: "var(--ink-strong)", lineHeight: 1 }}
                  >
                    {blockCount}
                  </p>
                  <p
                    className="c-kicker"
                    style={{ fontSize: 8, color: "var(--ink-strong)", opacity: 0.55, letterSpacing: "0.1em" }}
                  >
                    SHOWS
                  </p>
                </div>
              );
            })}
          </div>

          {/* Today */}
          <div className="mb-6">
            <h2 className="c-card-t mb-3 flex items-center gap-2" style={{ fontSize: 15 }}>
              <span className="w-2 h-2 animate-pulse" style={{ background: "var(--gold-c)" }} />
              TODAY — {DAY_NAMES[today].toUpperCase()}
            </h2>
            {todayBlocks.length === 0 ? (
              <div style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)", padding: "16px" }}>
                <p className="c-body-sm text-center" style={{ opacity: 0.55 }}>No broadcasts scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-2">{todayBlocks.map((tb) => <TimeBlockCard key={tb.id} block={tb} />)}</div>
            )}
          </div>

          {/* Tomorrow */}
          <div className="mb-6">
            <h2 className="c-card-t mb-3" style={{ fontSize: 15 }}>TOMORROW — {DAY_NAMES[tomorrow].toUpperCase()}</h2>
            {tomorrowBlocks.length === 0 ? (
              <div style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)", padding: "16px" }}>
                <p className="c-body-sm text-center" style={{ opacity: 0.55 }}>No broadcasts scheduled for tomorrow</p>
              </div>
            ) : (
              <div className="space-y-2">{tomorrowBlocks.map((tb) => <TimeBlockCard key={tb.id} block={tb} />)}</div>
            )}
          </div>

          {/* Full week */}
          {DAY_NAMES.map((day, i) => {
            if (i === today || i === tomorrow) return null;
            const blocks = timeBlocks.filter((tb) => tb.day_of_week === i);
            if (blocks.length === 0) return null;
            return (
              <div key={i} className="mb-6">
                <h2 className="c-card-t mb-3" style={{ fontSize: 15 }}>{day.toUpperCase()}</h2>
                <div className="space-y-2">{blocks.map((tb) => <TimeBlockCard key={tb.id} block={tb} />)}</div>
              </div>
            );
          })}
        </div>
      )}

      {canStream && <CreateStreamModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────

function ChannelBubble({ channel: ch }: { channel: Channel }) {
  return (
    <Link href={`/live/channel/${ch.id}`} className="flex flex-col items-center gap-1.5 shrink-0 press">
      <div
        className="w-16 h-16 rounded-full p-[2px]"
        style={{ background: "var(--gold-c)" }}
      >
        <div
          className="w-full h-full rounded-full flex items-center justify-center overflow-hidden"
          style={{ background: "var(--ink-strong)", border: "2px solid var(--ink-strong)" }}
        >
          {ch.avatar_url ? (
            <img src={ch.avatar_url} alt={ch.name} className="w-full h-full object-cover" />
          ) : (
            <span className="c-card-t" style={{ color: "var(--gold-c)", fontSize: 14 }}>{channelInitials(ch.name)}</span>
          )}
        </div>
      </div>
      <span className="c-meta text-center w-16 truncate" style={{ color: "var(--ink-strong)" }}>{ch.name}</span>
    </Link>
  );
}

/**
 * Editorial Hub City channel tile — square ink frame with gold §
 * banner footer. Replaces the legacy circle avatars in the /live
 * Channels rail so the rail reads as a row of mini magazine covers
 * instead of profile bubbles.
 */
function ChannelTile({ channel: ch }: { channel: Channel }) {
  return (
    <Link
      href={`/live/channel/${ch.id}`}
      className="shrink-0 press"
      style={{ width: 124 }}
    >
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: "1 / 1",
          background: "var(--ink-strong)",
          border: "2px solid var(--rule-strong-c)",
        }}
      >
        {ch.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ch.avatar_url}
            alt={ch.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              color: "var(--gold-c)",
              fontFamily: "var(--font-anton), Anton, sans-serif",
              fontSize: 44,
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            {channelInitials(ch.name)}
          </div>
        )}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, transparent 55%, rgba(26,21,18,0.92) 100%)",
          }}
        />
        {ch.is_live_simulated && (
          <span
            className="absolute top-1.5 left-1.5 c-badge-live"
            style={{ fontSize: 8 }}
          >
            ON AIR
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 px-2 py-1.5">
          <p
            className="c-card-t line-clamp-1"
            style={{
              fontSize: 11,
              lineHeight: 1.15,
              color: "var(--paper)",
            }}
          >
            {ch.name}
          </p>
        </div>
      </div>
      <p
        className="c-kicker mt-1.5 truncate"
        style={{
          fontSize: 9,
          letterSpacing: "0.16em",
          color: "var(--ink-strong)",
          opacity: 0.6,
        }}
      >
        {(ch.type ?? "channel").toString().toUpperCase()}
      </p>
    </Link>
  );
}

function VideoCardLarge({ video, onPlay }: { video: ChannelVideo; onPlay: () => void }) {
  return (
    <button onClick={onPlay} className="shrink-0 w-[260px] text-left press group">
      {/* Thumbnail canvas stays dark — video preview surface */}
      <div
        className="relative overflow-hidden mb-2"
        style={{ border: "2px solid var(--rule-strong-c)" }}
      >
        <div className="aspect-video flex items-center justify-center" style={{ background: "var(--ink-strong)" }}>
          {video.thumbnail_url ? (
            <img src={video.thumbnail_url} alt={video.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : video.mux_playback_id ? (
            <img src={`https://image.mux.com/${video.mux_playback_id}/thumbnail.webp?width=520&height=292&fit_mode=smartcrop`} alt={video.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: "var(--gold-c)", opacity: 0.4 }}><polygon points="5 3 19 12 5 21 5 3" /></svg>
          )}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "var(--gold-c)", border: "2px solid var(--ink-strong)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="ml-0.5" style={{ color: "var(--ink-strong)" }}><polygon points="5 3 19 12 5 21 5 3" fill="currentColor" /></svg>
            </div>
          </div>
          {video.duration && <div className="absolute bottom-2 right-2 px-1.5 py-0.5 c-kicker" style={{ fontSize: 10, background: "var(--paper)", color: "var(--ink-strong)", border: "1.5px solid var(--rule-strong-c)" }}>{formatDuration(video.duration)}</div>}
          <div className="absolute top-2 left-2"><span className="c-badge-gold" style={{ fontSize: 9 }}>FEATURED</span></div>
        </div>
      </div>
      <h3
        className="c-card-t line-clamp-2 mb-1"
        style={{
          fontSize: 13,
          lineHeight: 1.2,
          color: "var(--ink-strong)",
          minHeight: "2.4em",
        }}
      >
        {video.title}
      </h3>
      <div className="flex items-center gap-1.5">
        {video.channel && <p className="c-meta truncate">{video.channel.name}</p>}
        <span className="c-meta">· {formatViews(video.view_count)} VIEWS</span>
      </div>
    </button>
  );
}

function VideoCardSmall({ video, onPlay, badgeLabel }: { video: ChannelVideo; onPlay: () => void; badgeLabel?: string; badgeVariant?: "gold" | "blue" | "coral" | "emerald" | "cyan" | "purple" | "pink" }) {
  return (
    <button onClick={onPlay} className="shrink-0 w-[180px] text-left press group">
      {/* Thumbnail canvas stays dark — video preview surface */}
      <div
        className="relative overflow-hidden mb-2"
        style={{ border: "2px solid var(--rule-strong-c)" }}
      >
        <div className="aspect-video flex items-center justify-center" style={{ background: "var(--ink-strong)" }}>
          {video.thumbnail_url ? (
            <img src={video.thumbnail_url} alt={video.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : video.mux_playback_id ? (
            <img src={`https://image.mux.com/${video.mux_playback_id}/thumbnail.webp?width=360&height=202&fit_mode=smartcrop`} alt={video.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: "var(--gold-c)", opacity: 0.35 }}><polygon points="5 3 19 12 5 21 5 3" /></svg>
          )}
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "var(--gold-c)", border: "2px solid var(--ink-strong)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="ml-0.5" style={{ color: "var(--ink-strong)" }}><polygon points="5 3 19 12 5 21 5 3" fill="currentColor" /></svg>
            </div>
          </div>
          {video.duration && <div className="absolute bottom-1.5 right-1.5 px-1 py-0.5 c-kicker" style={{ fontSize: 9, background: "var(--paper)", color: "var(--ink-strong)", border: "1.5px solid var(--rule-strong-c)" }}>{formatDuration(video.duration)}</div>}
          {badgeLabel && <div className="absolute top-1.5 left-1.5"><span className="c-badge-ink" style={{ fontSize: 9 }}>{badgeLabel.toUpperCase()}</span></div>}
        </div>
      </div>
      <h3
        className="c-card-t line-clamp-2"
        style={{
          fontSize: 12,
          lineHeight: 1.2,
          color: "var(--ink-strong)",
          minHeight: "2.4em",
        }}
      >
        {video.title}
      </h3>
      <div className="flex items-center gap-1 mt-0.5">
        {video.channel && <p className="c-meta truncate">{video.channel.name}</p>}
        {video.published_at && <span className="c-meta">· {timeAgo(video.published_at)}</span>}
      </div>
    </button>
  );
}

function VideoCardRow({ video, onPlay }: { video: ChannelVideo; onPlay: () => void }) {
  return (
    <button
      onClick={onPlay}
      className="w-full text-left press"
      style={{
        background: "var(--paper)",
        border: "2px solid var(--rule-strong-c)",
        color: "var(--ink-strong)",
      }}
    >
      <div className="flex gap-3 p-3">
        {/* Thumbnail canvas stays dark — video preview surface */}
        <div
          className="w-28 h-[72px] overflow-hidden shrink-0 relative flex items-center justify-center group"
          style={{ background: "var(--ink-strong)", border: "2px solid var(--rule-strong-c)" }}
        >
          {video.mux_playback_id ? (
            <img src={`https://image.mux.com/${video.mux_playback_id}/thumbnail.webp?width=224&height=144&time=5`} alt={video.title} className="w-full h-full object-cover" />
          ) : video.thumbnail_url ? (
            <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: "var(--paper)", opacity: 0.3 }}><polygon points="5 3 19 12 5 21 5 3" /></svg>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "var(--gold-c)", border: "1.5px solid var(--ink-strong)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5" style={{ color: "var(--ink-strong)" }}><polygon points="5 3 19 12 5 21 5 3" /></svg>
            </div>
          </div>
          {video.duration && <div className="absolute bottom-1 right-1 px-1 py-0.5 c-kicker" style={{ fontSize: 9, background: "var(--paper)", color: "var(--ink-strong)", border: "1.5px solid var(--rule-strong-c)" }}>{formatDuration(video.duration)}</div>}
        </div>
        <div className="flex-1 min-w-0 py-0.5">
          <h3 className="c-card-t line-clamp-2 mb-1" style={{ fontSize: 13 }}>{video.title}</h3>
          {video.channel && <p className="c-meta truncate mb-0.5">{video.channel.name}</p>}
          <div className="flex items-center gap-2 c-meta">
            <span>{formatViews(video.view_count)} VIEWS</span>
            {video.published_at && (
              <>
                <span>·</span>
                <span>{timeAgo(video.published_at).toUpperCase()}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function TimeBlockCard({ block }: { block: TimeBlock }) {
  const badge = block.channel ? TYPE_BADGE[block.channel.type as ChannelType] || TYPE_BADGE.community : TYPE_BADGE.community;
  return (
    <div
      className="p-3"
      style={{
        background: "var(--paper)",
        border: "2px solid var(--rule-strong-c)",
        color: "var(--ink-strong)",
      }}
    >
      <div className="flex gap-3 items-center">
        <div className="w-14 text-center shrink-0">
          <p className="c-card-t" style={{ fontSize: 11, color: "var(--gold-c)" }}>{formatTimeBlock(block.start_time)}</p>
          <p className="c-meta" style={{ fontSize: 9 }}>{formatTimeBlock(block.end_time)}</p>
        </div>
        <div className="w-px h-8" style={{ background: "var(--rule-strong-c)", opacity: 0.3 }} />
        <div className="flex-1 min-w-0">
          <h3 className="c-card-t truncate" style={{ fontSize: 13 }}>{block.title || (block.channel ? block.channel.name : "Broadcast")}</h3>
          <div className="flex items-center gap-2">
            {block.channel && (
              <>
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center overflow-hidden"
                  style={{ background: "var(--gold-c)", border: "1px solid var(--rule-strong-c)" }}
                >
                  {block.channel.avatar_url ? (
                    <img src={block.channel.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="c-card-t" style={{ fontSize: 6, color: "var(--ink-strong)" }}>{channelInitials(block.channel.name)}</span>
                  )}
                </div>
                <span className="c-meta truncate">{block.channel.name}</span>
                <Badge label={badge.label} variant={badge.variant} />
              </>
            )}
            {block.is_recurring && <span className="c-meta" style={{ fontSize: 9 }}>WEEKLY</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// VerticalPosterRail — drop-in section for category-specific
// rails (Family, Cartoons, Documentaries). Renders 2:3 movie-poster
// tiles in a horizontal scroll-snap strip with a stamped editorial
// header. Tapping a tile fires the same `playVideo` callback the
// rest of the page uses.
// ─────────────────────────────────────────────────────────────────
function VerticalPosterRail({
  kicker,
  title,
  accent,
  videos,
  onPlay,
}: {
  kicker: string;
  title: string;
  accent: string;
  videos: ChannelVideo[];
  onPlay: (v: ChannelVideo) => void;
}) {
  return (
    <section className="mb-8">
      <div className="px-5 mb-3">
        <div
          className="flex items-baseline gap-3 pb-2"
          style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
        >
          <span
            className="c-display c-tabnum"
            style={{
              fontSize: 22,
              color: "var(--gold-c)",
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            §
          </span>
          <div className="flex flex-col">
            <span
              className="c-kicker"
              style={{ fontSize: 10, letterSpacing: "0.18em" }}
            >
              {kicker}
            </span>
            <span
              className="c-hero"
              style={{
                fontSize: 22,
                color: "var(--ink-strong)",
                lineHeight: 1,
                letterSpacing: "-0.01em",
              }}
            >
              {title}
            </span>
          </div>
          <span
            className="ml-auto c-serif-it tabular-nums"
            style={{ fontSize: 11, color: "var(--ink-strong)", opacity: 0.55 }}
          >
            {accent}
          </span>
        </div>
      </div>
      <div className="overflow-x-auto scrollbar-hide pb-2">
        <div className="flex gap-3 px-5">
          {videos.map((v) => {
            const poster =
              v.thumbnail_url ??
              (v.mux_playback_id
                ? `https://image.mux.com/${v.mux_playback_id}/thumbnail.webp?width=400&height=600&time=5&fit_mode=smartcrop`
                : null);
            return (
              <button
                key={v.id}
                onClick={() => onPlay(v)}
                className="shrink-0 press text-left"
                style={{ width: 132 }}
                aria-label={`Play ${v.title}`}
              >
                <div
                  className="relative overflow-hidden"
                  style={{
                    aspectRatio: "2/3",
                    background: "var(--ink-strong)",
                    border: "2px solid var(--rule-strong-c)",
                    boxShadow: "3px 3px 0 var(--rule-strong-c)",
                  }}
                >
                  {poster ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={poster}
                      alt={v.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : null}
                  {/* Subtle bottom gradient so the play affordance sits
                      legibly even on bright posters. */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(180deg, transparent 55%, rgba(26,21,18,0.55) 100%)",
                    }}
                  />
                  <div
                    className="absolute"
                    style={{
                      bottom: 6,
                      right: 6,
                      width: 26,
                      height: 26,
                      background: "var(--gold-c)",
                      border: "2px solid var(--paper)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "2px 2px 0 rgba(0,0,0,0.45)",
                    }}
                  >
                    <svg
                      width="11"
                      height="11"
                      fill="var(--ink-strong)"
                      viewBox="0 0 10 10"
                    >
                      <polygon points="3,1.5 9,5 3,8.5" />
                    </svg>
                  </div>
                </div>
                <p
                  className="c-card-t mt-2 line-clamp-2"
                  style={{
                    fontSize: 11,
                    color: "var(--ink-strong)",
                    lineHeight: 1.2,
                  }}
                >
                  {v.title}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
