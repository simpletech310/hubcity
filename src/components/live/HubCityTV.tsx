"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Chip from "@/components/ui/Chip";
import StreamCard from "./StreamCard";
import CreateStreamModal from "./CreateStreamModal";
import PreRollAd from "./PreRollAd";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import type {
  Channel,
  ChannelVideo,
  LiveStream,
  TimeBlock,
  ChannelType,
  VideoAd,
} from "@/types/database";

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

const CHANNEL_FILTERS: { label: string; value: ChannelType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Schools", value: "school" },
  { label: "City", value: "city" },
  { label: "Community", value: "community" },
  { label: "Media", value: "media" },
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

// ── Compton Stars ──────────────────────────────────────────
const COMPTON_STARS = [
  { name: "Kendrick Lamar", title: "Pulitzer Prize Winner", icon: "music" },
  { name: "Serena Williams", title: "Tennis Legend", icon: "trophy" },
  { name: "Venus Williams", title: "Tennis Champion", icon: "trophy" },
  { name: "Dr. Dre", title: "Music Mogul", icon: "music" },
  { name: "Ice Cube", title: "Entertainment Icon", icon: "film" },
  { name: "The Game", title: "West Coast Legend", icon: "music" },
  { name: "A'ja Wilson", title: "WNBA MVP", icon: "trophy" },
  { name: "Coolio", title: "Grammy Winner", icon: "music" },
];

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

function timeUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff < 0) return "Now";
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) {
    const mins = Math.floor(diff / 60000);
    return `${mins}m`;
  }
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

// ── Props ──────────────────────────────────────────────────
interface HubCityTVProps {
  channels: Channel[];
  streams: LiveStream[];
  featuredVideos: ChannelVideo[];
  recentVideos: ChannelVideo[];
  timeBlocks: TimeBlock[];
  canStream: boolean;
  userId: string | null;
  followedChannelIds: string[];
}

export default function HubCityTV({
  channels,
  streams,
  featuredVideos,
  recentVideos,
  timeBlocks,
  canStream,
  userId,
  followedChannelIds: initialFollowed,
}: HubCityTVProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("home");
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

  // ── Inline Video Player ──────────────────────────────────
  if (playingVideo && playingVideo.mux_playback_id) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 px-5 pt-4 mb-4">
          <button onClick={() => setPlayingVideo(null)} className="w-9 h-9 rounded-full bg-white/[0.06] border border-border-subtle flex items-center justify-center text-txt-secondary press hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-heading font-bold text-base truncate">{playingVideo.title}</h1>
          </div>
        </div>
        <div className="px-5 mb-4">
          <div className="rounded-2xl overflow-hidden border border-border-subtle shadow-lg shadow-black/40">
            <MuxPlayer playbackId={playingVideo.mux_playback_id} streamType="on-demand" autoPlay="muted" accentColor="#F2A900" style={{ aspectRatio: "16/9", width: "100%" }} metadata={{ video_title: playingVideo.title, viewer_user_id: userId || "anon" }} />
          </div>
        </div>
        <div className="px-5 space-y-3">
          <h2 className="font-heading font-bold text-lg">{playingVideo.title}</h2>
          {playingVideo.channel && (
            <Link href={`/live/channel/${playingVideo.channel.id}`} className="flex items-center gap-2 press">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-royal to-hc-purple flex items-center justify-center text-gold font-heading text-[10px] font-bold overflow-hidden">
                {playingVideo.channel.avatar_url ? (
                  <img src={playingVideo.channel.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : channelInitials(playingVideo.channel.name)}
              </div>
              <span className="text-sm text-txt-secondary">{playingVideo.channel.name}</span>
            </Link>
          )}
          <div className="flex items-center gap-3 text-[11px] text-txt-secondary">
            <span>{formatViews(playingVideo.view_count)} views</span>
            {playingVideo.published_at && <span>· {timeAgo(playingVideo.published_at)}</span>}
            {playingVideo.duration && <span>· {formatDuration(playingVideo.duration)}</span>}
          </div>
          {playingVideo.description && <p className="text-sm text-txt-secondary leading-relaxed">{playingVideo.description}</p>}

          {/* Up Next */}
          {recentVideos.length > 1 && (
            <div className="pt-4 border-t border-border-subtle">
              <h3 className="font-heading font-bold text-sm mb-3">Up Next</h3>
              <div className="space-y-3">
                {recentVideos.filter(v => v.id !== playingVideo.id).slice(0, 5).map((video) => (
                  <VideoCardRow key={video.id} video={video} onPlay={() => playVideo(video)} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Watching Live Stream ─────────────────────────────────
  if (watchingStream && watchingStream.mux_playback_id) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 px-5 pt-4 mb-4">
          <button onClick={() => setWatchingStream(null)} className="w-9 h-9 rounded-full bg-white/[0.06] border border-border-subtle flex items-center justify-center text-txt-secondary press hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-heading font-bold text-base truncate">{watchingStream.title}</h1>
          </div>
          {watchingStream.status === "active" && <Badge label="LIVE" variant="coral" shine />}
        </div>
        <div className="px-5 mb-4">
          <div className="rounded-2xl overflow-hidden border border-border-subtle shadow-lg shadow-black/40">
            <MuxPlayer playbackId={watchingStream.mux_playback_id} streamType={watchingStream.status === "active" ? "live" : "on-demand"} autoPlay="muted" accentColor="#F2A900" style={{ aspectRatio: "16/9", width: "100%" }} metadata={{ video_title: watchingStream.title, viewer_user_id: userId || "anon" }} />
          </div>
        </div>
        <div className="px-5 space-y-3">
          <h2 className="font-heading font-bold text-lg">{watchingStream.title}</h2>
          {watchingStream.creator && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-coral to-compton-red flex items-center justify-center text-[10px] font-bold text-white overflow-hidden">
                {watchingStream.creator.avatar_url ? (
                  <img src={watchingStream.creator.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : watchingStream.creator.display_name?.[0]?.toUpperCase() || "?"}
              </div>
              <span className="text-sm text-txt-secondary">{watchingStream.creator.display_name}</span>
              {watchingStream.viewer_count > 0 && (
                <span className="text-[11px] text-txt-secondary ml-auto">
                  <span className="text-coral font-bold">{watchingStream.viewer_count}</span> watching
                </span>
              )}
            </div>
          )}
          {watchingStream.description && <p className="text-sm text-txt-secondary">{watchingStream.description}</p>}
          {watchingStream.status === "active" && (
            <div className="rounded-xl bg-coral/10 border border-coral/20 p-4 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-coral animate-pulse shrink-0" />
              <div>
                <p className="text-sm font-semibold text-coral">Broadcasting Live</p>
                <p className="text-[11px] text-txt-secondary">{watchingStream.viewer_count || 0} viewers tuned in</p>
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
          HERO BANNER — Netflix-style cinematic header
          ══════════════════════════════════════════════════════ */}
      <div className="relative -mt-[72px] pt-[72px]">
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-compton-red/15 border border-compton-red/30 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-compton-red animate-pulse" />
            <span className="font-heading text-[10px] font-bold text-compton-red tracking-[0.1em]">HUB CITY TV</span>
          </div>

          {/* Live count indicator */}
          {activeStreams.length > 0 && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-coral/15 border border-coral/30 mb-4 ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
              <span className="font-heading text-[10px] font-bold text-coral tracking-wider">{activeStreams.length} LIVE NOW</span>
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
                  className="flex items-center gap-2 bg-gold text-midnight px-6 py-3 rounded-xl font-heading text-[14px] font-bold press hover:bg-gold-light transition-colors shadow-lg shadow-gold/20"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  Watch Now
                </button>
                <button className="flex items-center gap-2 bg-white/[0.08] border border-white/[0.15] text-white px-5 py-3 rounded-xl text-[14px] font-medium press hover:bg-white/[0.12] transition-colors backdrop-blur-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
                  My List
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="font-heading text-[36px] font-bold leading-[0.95] tracking-tight mb-3">
                Hub City TV
              </h1>
              <p className="font-display italic text-[16px] text-warm-gray leading-relaxed max-w-[300px] mb-2">
                Compton&apos;s community television
              </p>
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
      <div className="flex gap-1 px-5 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all duration-300 press shrink-0 ${
              activeTab === tab.id
                ? "bg-gold text-midnight shadow-lg shadow-gold/20"
                : "bg-white/[0.06] text-txt-secondary hover:text-white hover:bg-white/[0.1] border border-border-subtle"
            }`}
          >
            {tab.id === "live" && activeStreams.length > 0 && (
              <span className="inline-block w-2 h-2 rounded-full bg-coral mr-1.5 animate-pulse" />
            )}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          HOME TAB
          ══════════════════════════════════════════════════════ */}
      {activeTab === "home" && (
        <div className="animate-fade-in">
          {/* ── Live Now ── */}
          {activeStreams.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-2 px-5 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-coral animate-pulse" />
                <h2 className="font-heading font-bold text-[18px]">Live Now</h2>
                <Badge label={`${activeStreams.length} LIVE`} variant="coral" shine />
              </div>
              <div className="px-5 space-y-3">
                {activeStreams.map((stream) => (
                  <StreamCard key={stream.id} stream={stream} isLive onWatch={() => watchStream(stream)} />
                ))}
              </div>
            </section>
          )}

          {/* ── Trending on Hub City TV ── */}
          {trendingVideos.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between px-5 mb-3">
                <h2 className="font-heading font-bold text-[18px] flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-coral">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Trending
                </h2>
              </div>
              <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
                {trendingVideos.map((video, i) => (
                  <button key={video.id} onClick={() => playVideo(video)} className="shrink-0 w-[200px] text-left press group">
                    <div className="relative rounded-xl overflow-hidden mb-2">
                      <div className="aspect-video bg-gradient-to-br from-coral/15 via-midnight to-gold/10 flex items-center justify-center">
                        {video.mux_playback_id ? (
                          <img src={`https://image.mux.com/${video.mux_playback_id}/thumbnail.webp?width=400&height=225&time=5`} alt={video.title} className="w-full h-full object-cover" />
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gold/30"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                        )}
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-gold/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-midnight)" className="ml-0.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                          </div>
                        </div>
                        {/* Rank badge */}
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-md bg-coral/90 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white">{i + 1}</span>
                        </div>
                        {video.duration && <div className="absolute bottom-1.5 right-1.5 bg-black/70 rounded px-1 py-0.5 text-[9px] font-mono text-white">{formatDuration(video.duration)}</div>}
                      </div>
                    </div>
                    <h3 className="font-heading font-bold text-[12px] line-clamp-2 mb-0.5">{video.title}</h3>
                    <div className="flex items-center gap-1.5">
                      {video.channel && <p className="text-[10px] text-txt-secondary truncate">{video.channel.name}</p>}
                      <span className="text-[10px] text-txt-secondary">· {formatViews(video.view_count)} views</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── Hub City Originals ── */}
          {originals.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between px-5 mb-3">
                <h2 className="font-heading font-bold text-[18px]">
                  <span className="text-gold">Hub City</span> Originals
                </h2>
                <button onClick={() => setActiveTab("originals")} className="text-[12px] text-gold font-semibold press">See All →</button>
              </div>
              <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
                {originals.map((video, i) => {
                  const accent = HERO_ACCENTS[i % HERO_ACCENTS.length];
                  return (
                    <button key={video.id} className="shrink-0 w-[140px] text-left press group" onClick={() => playVideo(video)}>
                      <div className="relative rounded-2xl overflow-hidden mb-2.5 aspect-[3/4]"
                        style={{ background: `linear-gradient(180deg, ${accent}20 0%, var(--color-midnight) 100%)` }}>
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

          {/* ── Compton Stars ── */}
          <section className="mb-8">
            <div className="px-5 mb-3">
              <h2 className="font-heading font-bold text-[18px]">Compton <span className="text-gold">Stars</span></h2>
              <p className="text-[12px] text-warm-gray mt-0.5">Legends who started here</p>
            </div>
            <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
              {COMPTON_STARS.map((star, i) => (
                <div key={i} className="shrink-0 flex flex-col items-center gap-2 w-[80px] press">
                  <div className="w-[64px] h-[64px] rounded-full bg-gradient-to-br from-gold/20 via-royal to-hc-purple/20 p-[2px]">
                    <div className="w-full h-full rounded-full bg-midnight flex items-center justify-center text-[24px]">{star.icon}</div>
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-semibold leading-tight">{star.name}</p>
                    <p className="text-[9px] text-warm-gray">{star.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Featured Videos ── */}
          {featuredVideos.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between px-5 mb-3">
                <h2 className="font-heading font-bold text-[18px] flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gold">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  Featured
                </h2>
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
                <h2 className="font-heading font-bold text-[18px] flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan">
                    <path d="M3 21h18M3 7v14M21 7v14M6 7V4l6-2 6 2v3M9 21v-4h6v4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  City Hall
                </h2>
                <span className="text-[11px] text-txt-secondary">{cityHall.length} videos</span>
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
            <div className="flex items-center justify-between px-5 mb-3">
              <h2 className="font-heading font-bold text-[18px]">Channels</h2>
              <button onClick={() => setActiveTab("channels")} className="text-[12px] text-gold font-semibold press">See All →</button>
            </div>
            <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-1">
              {channels.slice(0, 15).map((ch) => (
                <ChannelBubble key={ch.id} channel={ch} />
              ))}
            </div>
          </section>

          {/* ── Recently Added ── */}
          {recentVideos.length > 0 && (
            <section className="mb-8">
              <div className="px-5 mb-3">
                <h2 className="font-heading font-bold text-[18px]">Recently Added</h2>
              </div>
              <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
                {recentVideos.slice(0, 10).map((video) => (
                  <VideoCardSmall key={video.id} video={video} onPlay={() => playVideo(video)} />
                ))}
              </div>
            </section>
          )}

          {/* ── Coming Up Next ── */}
          {upcomingStreams.length > 0 && (
            <section className="mb-8">
              <div className="px-5 mb-3">
                <h2 className="font-heading font-bold text-[18px]">Coming Up Next</h2>
                <p className="text-[12px] text-warm-gray mt-0.5">{upcomingStreams.length} scheduled streams</p>
              </div>
              <div className="px-5 space-y-3">
                {upcomingStreams.map((stream) => (
                  <div key={stream.id} className="relative">
                    {stream.scheduled_at && (
                      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center z-10">
                        <span className="text-[9px] font-bold text-gold">{timeUntil(stream.scheduled_at)}</span>
                      </div>
                    )}
                    <div className="ml-8">
                      <StreamCard stream={stream} onWatch={() => { if (stream.mux_playback_id) watchStream(stream); }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Browse by Category ── */}
          <section className="mb-8 px-5">
            <h2 className="font-heading font-bold text-[18px] mb-3">Browse by Category</h2>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: "Sports", icon: "trophy", color: "#3B82F6", gradient: "from-hc-blue/30 to-hc-blue/5" },
                { label: "Music", icon: "music", color: "#8B5CF6", gradient: "from-hc-purple/30 to-hc-purple/5" },
                { label: "News", icon: "megaphone", color: "#06B6D4", gradient: "from-cyan/30 to-cyan/5" },
                { label: "Culture", icon: "theater", color: "#EF4444", gradient: "from-compton-red/30 to-compton-red/5" },
                { label: "Podcasts", icon: "music", color: "#FF6B6B", gradient: "from-coral/30 to-coral/5" },
                { label: "Education", icon: "book", color: "#22C55E", gradient: "from-emerald/30 to-emerald/5" },
              ].map((cat, i) => (
                <button key={i} className={`relative overflow-hidden bg-gradient-to-br ${cat.gradient} rounded-2xl border border-border-subtle p-3 text-left press group`}>
                  <div className="absolute top-0 left-0 right-0 h-[2px] opacity-50" style={{ background: `linear-gradient(90deg, transparent, ${cat.color}, transparent)` }} />
                  <span className="block mb-1.5"><Icon name={cat.icon as IconName} size={22} /></span>
                  <span className="font-heading text-[12px] font-bold">{cat.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* ── Today on Hub City TV ── */}
          {todayBlocks.length > 0 && (
            <section className="mb-8 px-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-heading font-bold text-[18px] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gold" />
                  Today on HubTV
                </h2>
                <button onClick={() => setActiveTab("schedule")} className="text-[12px] text-gold font-semibold press">Full Schedule →</button>
              </div>
              <div className="space-y-2">
                {todayBlocks.slice(0, 4).map((tb) => <TimeBlockCard key={tb.id} block={tb} />)}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          LIVE TAB
          ══════════════════════════════════════════════════════ */}
      {activeTab === "live" && (
        <div className="animate-fade-in">
          {/* Stats bar */}
          <div className="px-5 mb-5">
            <div className="flex gap-3">
              <div className="flex-1 rounded-xl bg-coral/10 border border-coral/20 p-3 text-center">
                <p className="text-[22px] font-heading font-bold text-coral">{activeStreams.length}</p>
                <p className="text-[10px] text-txt-secondary">Live Now</p>
              </div>
              <div className="flex-1 rounded-xl bg-gold/10 border border-gold/20 p-3 text-center">
                <p className="text-[22px] font-heading font-bold text-gold">{upcomingStreams.length}</p>
                <p className="text-[10px] text-txt-secondary">Upcoming</p>
              </div>
              <div className="flex-1 rounded-xl bg-cyan/10 border border-cyan/20 p-3 text-center">
                <p className="text-[22px] font-heading font-bold text-cyan">{channels.length}</p>
                <p className="text-[10px] text-txt-secondary">Channels</p>
              </div>
            </div>
          </div>

          {activeStreams.length > 0 && (
            <div className="px-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-heading font-bold text-base">Live Now</h2>
                <div className="w-2 h-2 rounded-full bg-coral animate-pulse" />
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
              <h2 className="font-heading font-bold text-base">Upcoming Streams</h2>
              <span className="text-[11px] text-txt-secondary">{upcomingStreams.length} scheduled</span>
            </div>
            {upcomingStreams.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-txt-secondary">
                    <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </div>
                <p className="text-sm text-txt-secondary mb-1">No streams scheduled yet</p>
                {canStream && <p className="text-[12px] text-gold">Tap the camera button to go live</p>}
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
              <h2 className="font-heading font-bold text-base mb-3">Recent Replays</h2>
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
            <h2 className="font-heading font-bold text-[22px] mb-1">
              <span className="text-gold">Hub City</span> Originals
            </h2>
            <p className="font-display italic text-[14px] text-warm-gray">
              Premium content. Made in Compton. Streaming to the world.
            </p>
          </div>

          {/* Originals grid */}
          <div className="px-5 space-y-4 mb-8">
            {originals.length > 0 ? originals.map((video, i) => {
              const accent = HERO_ACCENTS[i % HERO_ACCENTS.length];
              return (
                <button key={video.id} className="w-full text-left press group" onClick={() => playVideo(video)}>
                  <div className="relative rounded-2xl overflow-hidden border border-border-subtle">
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
                        <div className="w-14 h-14 rounded-full bg-gold/90 flex items-center justify-center shadow-lg opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--color-midnight)" className="ml-1"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                        </div>
                      </div>
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-lg text-[9px] font-bold tracking-wider uppercase text-white" style={{ background: `${accent}CC` }}>Hub City Original</span>
                      </div>
                      {video.duration && (
                        <div className="absolute bottom-3 right-3 bg-black/70 rounded px-1.5 py-0.5 text-[10px] font-mono text-white">
                          {formatDuration(video.duration)}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-heading text-[18px] font-bold mb-1">{video.title}</h3>
                      {video.description && <p className="text-[13px] text-warm-gray leading-relaxed mb-2">{video.description}</p>}
                      <div className="flex items-center gap-2 text-[11px] text-txt-secondary">
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
                <p className="text-txt-secondary text-sm">No original content yet</p>
              </div>
            )}
          </div>

          {/* Non-original recent videos */}
          {recentVideos.filter((v) => v.video_type !== "original").length > 0 && (
            <section className="mb-8">
              <div className="px-5 mb-3">
                <h2 className="font-heading font-bold text-base">All Videos</h2>
                <p className="text-[12px] text-warm-gray mt-0.5">Latest from Hub City TV</p>
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
            {CHANNEL_FILTERS.map((f) => (
              <Chip key={f.value} label={f.label} active={channelFilter === f.value} onClick={() => setChannelFilter(f.value)} />
            ))}
          </div>

          {/* Channel count */}
          <div className="px-5 mb-3">
            <p className="text-[12px] text-txt-secondary">{filteredChannels.length} channels{channelFilter !== "all" ? ` in ${channelFilter}` : ""}</p>
          </div>

          <div className="px-5 space-y-3">
            {filteredChannels.length === 0 ? (
              <div className="text-center py-10"><p className="text-sm text-txt-secondary">No channels in this category</p></div>
            ) : (
              filteredChannels.map((ch) => {
                const badge = TYPE_BADGE[ch.type] || TYPE_BADGE.community;
                return (
                  <Card key={ch.id} hover className="relative">
                    <div className="flex gap-3">
                      <Link href={`/live/channel/${ch.id}`} className="shrink-0">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-royal to-hc-purple flex items-center justify-center overflow-hidden">
                          {ch.avatar_url ? (
                            <img src={ch.avatar_url} alt={ch.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-gold font-heading font-bold text-base">{channelInitials(ch.name)}</span>
                          )}
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/live/channel/${ch.id}`}>
                          <h3 className="font-heading font-bold text-[13px] mb-1 flex items-center gap-1.5">
                            {ch.name}
                            {ch.is_verified && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-cyan shrink-0">
                                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                              </svg>
                            )}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge label={badge.label} variant={badge.variant} />
                          <span className="text-[10px] text-txt-secondary">{ch.follower_count.toLocaleString()} followers</span>
                        </div>
                        {ch.description && (
                          <p className="text-[11px] text-txt-secondary line-clamp-1">{ch.description}</p>
                        )}
                      </div>
                      {userId && (
                        <button
                          onClick={() => handleFollow(ch.id)}
                          className={`self-center px-3 py-1.5 rounded-full text-[11px] font-bold press transition-all shrink-0 ${
                            followedIds.has(ch.id)
                              ? "bg-gold/20 text-gold border border-gold/30"
                              : "bg-white/[0.06] text-txt-secondary border border-border-subtle hover:text-white"
                          }`}
                        >
                          {followedIds.has(ch.id) ? "Following" : "Follow"}
                        </button>
                      )}
                    </div>
                  </Card>
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
                <div key={i} className={`shrink-0 w-[52px] rounded-xl p-2 text-center ${isToday ? "bg-gold/15 border border-gold/30" : "bg-white/[0.04] border border-border-subtle"}`}>
                  <p className={`text-[10px] font-bold ${isToday ? "text-gold" : "text-txt-secondary"}`}>{DAY_NAMES_SHORT[i]}</p>
                  <p className={`text-[16px] font-heading font-bold ${isToday ? "text-gold" : "text-white"}`}>{blockCount}</p>
                  <p className="text-[8px] text-txt-secondary">shows</p>
                </div>
              );
            })}
          </div>

          {/* Today */}
          <div className="mb-6">
            <h2 className="font-heading font-bold text-base mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
              Today &mdash; {DAY_NAMES[today]}
            </h2>
            {todayBlocks.length === 0 ? (
              <Card className="bg-white/[0.02]"><p className="text-sm text-txt-secondary text-center py-4">No broadcasts scheduled for today</p></Card>
            ) : (
              <div className="space-y-2">{todayBlocks.map((tb) => <TimeBlockCard key={tb.id} block={tb} />)}</div>
            )}
          </div>

          {/* Tomorrow */}
          <div className="mb-6">
            <h2 className="font-heading font-bold text-base mb-3 flex items-center gap-2">
              Tomorrow &mdash; {DAY_NAMES[tomorrow]}
            </h2>
            {tomorrowBlocks.length === 0 ? (
              <Card className="bg-white/[0.02]"><p className="text-sm text-txt-secondary text-center py-4">No broadcasts scheduled for tomorrow</p></Card>
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
                <h2 className="font-heading font-bold text-base mb-3">{day}</h2>
                <div className="space-y-2">{blocks.map((tb) => <TimeBlockCard key={tb.id} block={tb} />)}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── FAB - Create Stream ─────────────────────────── */}
      {canStream && (
        <button
          onClick={() => setCreateOpen(true)}
          className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-coral to-pink shadow-lg shadow-coral/30 flex items-center justify-center text-white press z-40 hover:scale-105 transition-transform"
          style={{ maxWidth: "calc((430px - 2rem) + 2rem)", right: "max(1rem, calc((100vw - 430px) / 2 + 1rem))" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        </button>
      )}
      {canStream && <CreateStreamModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────

function ChannelBubble({ channel: ch }: { channel: Channel }) {
  return (
    <Link href={`/live/channel/${ch.id}`} className="flex flex-col items-center gap-1.5 shrink-0 press">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold/30 via-coral/20 to-hc-purple/30 p-[2px]">
        <div className="w-full h-full rounded-full bg-midnight flex items-center justify-center overflow-hidden">
          {ch.avatar_url ? (
            <img src={ch.avatar_url} alt={ch.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gold font-heading font-bold text-sm">{channelInitials(ch.name)}</span>
          )}
        </div>
      </div>
      <span className="text-[10px] text-txt-secondary text-center w-16 truncate">{ch.name}</span>
    </Link>
  );
}

function VideoCardLarge({ video, onPlay }: { video: ChannelVideo; onPlay: () => void }) {
  return (
    <button onClick={onPlay} className="shrink-0 w-[260px] text-left press group">
      <div className="relative rounded-xl overflow-hidden mb-2">
        <div className="aspect-video bg-gradient-to-br from-gold/20 via-midnight to-hc-purple/20 flex items-center justify-center">
          {video.mux_playback_id ? (
            <img src={`https://image.mux.com/${video.mux_playback_id}/thumbnail.webp?width=520&height=292&time=5`} alt={video.title} className="w-full h-full object-cover" />
          ) : video.thumbnail_url ? (
            <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-gold/40"><polygon points="5 3 19 12 5 21 5 3" /></svg>
          )}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-gold/90 flex items-center justify-center shadow-lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-midnight ml-0.5"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor" /></svg>
            </div>
          </div>
          {video.duration && <div className="absolute bottom-2 right-2 bg-black/70 rounded px-1.5 py-0.5 text-[10px] font-mono text-white">{formatDuration(video.duration)}</div>}
          <div className="absolute top-2 left-2"><Badge label="Featured" variant="gold" /></div>
        </div>
      </div>
      <h3 className="font-heading font-bold text-[13px] line-clamp-2 mb-1">{video.title}</h3>
      <div className="flex items-center gap-1.5">
        {video.channel && <p className="text-[10px] text-txt-secondary truncate">{video.channel.name}</p>}
        <span className="text-[10px] text-txt-secondary">· {formatViews(video.view_count)} views</span>
      </div>
    </button>
  );
}

function VideoCardSmall({ video, onPlay, badgeLabel, badgeVariant }: { video: ChannelVideo; onPlay: () => void; badgeLabel?: string; badgeVariant?: "gold" | "blue" | "coral" | "emerald" | "cyan" | "purple" | "pink" }) {
  return (
    <button onClick={onPlay} className="shrink-0 w-[180px] text-left press group">
      <div className="relative rounded-xl overflow-hidden mb-2">
        <div className="aspect-video bg-gradient-to-br from-gold/15 via-midnight to-coral/15 flex items-center justify-center">
          {video.mux_playback_id ? (
            <img src={`https://image.mux.com/${video.mux_playback_id}/thumbnail.webp?width=360&height=202&time=5`} alt={video.title} className="w-full h-full object-cover" />
          ) : video.thumbnail_url ? (
            <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-gold/30"><polygon points="5 3 19 12 5 21 5 3" /></svg>
          )}
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-gold/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-midnight ml-0.5"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor" /></svg>
            </div>
          </div>
          {video.duration && <div className="absolute bottom-1.5 right-1.5 bg-black/70 rounded px-1 py-0.5 text-[9px] font-mono text-white">{formatDuration(video.duration)}</div>}
          {badgeLabel && <div className="absolute top-1.5 left-1.5"><Badge label={badgeLabel} variant={badgeVariant || "gold"} /></div>}
        </div>
      </div>
      <h3 className="font-heading font-bold text-[12px] line-clamp-2">{video.title}</h3>
      <div className="flex items-center gap-1 mt-0.5">
        {video.channel && <p className="text-[10px] text-txt-secondary truncate">{video.channel.name}</p>}
        {video.published_at && <span className="text-[10px] text-txt-secondary">· {timeAgo(video.published_at)}</span>}
      </div>
    </button>
  );
}

function VideoCardRow({ video, onPlay }: { video: ChannelVideo; onPlay: () => void }) {
  return (
    <Card hover onClick={onPlay} className="cursor-pointer">
      <div className="flex gap-3">
        <div className="w-28 h-[72px] rounded-xl overflow-hidden shrink-0 relative bg-gradient-to-br from-midnight to-deep flex items-center justify-center group">
          {video.mux_playback_id ? (
            <img src={`https://image.mux.com/${video.mux_playback_id}/thumbnail.webp?width=224&height=144&time=5`} alt={video.title} className="w-full h-full object-cover" />
          ) : video.thumbnail_url ? (
            <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-white/20"><polygon points="5 3 19 12 5 21 5 3" /></svg>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white" className="ml-0.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            </div>
          </div>
          {video.duration && <div className="absolute bottom-1 right-1 bg-black/70 rounded px-1 py-0.5 text-[9px] font-mono text-white">{formatDuration(video.duration)}</div>}
        </div>
        <div className="flex-1 min-w-0 py-0.5">
          <h3 className="font-heading font-bold text-[13px] line-clamp-2 mb-1">{video.title}</h3>
          {video.channel && <p className="text-[10px] text-txt-secondary truncate mb-0.5">{video.channel.name}</p>}
          <div className="flex items-center gap-2 text-[10px] text-txt-secondary">
            <span>{formatViews(video.view_count)} views</span>
            {video.published_at && (
              <>
                <span>·</span>
                <span>{timeAgo(video.published_at)}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function TimeBlockCard({ block }: { block: TimeBlock }) {
  const badge = block.channel ? TYPE_BADGE[block.channel.type as ChannelType] || TYPE_BADGE.community : TYPE_BADGE.community;
  return (
    <Card className="border-gold/10">
      <div className="flex gap-3 items-center">
        <div className="w-14 text-center shrink-0">
          <p className="text-[11px] text-gold font-bold">{formatTimeBlock(block.start_time)}</p>
          <p className="text-[9px] text-txt-secondary">{formatTimeBlock(block.end_time)}</p>
        </div>
        <div className="w-px h-8 bg-border-subtle" />
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-[13px] truncate">{block.title || (block.channel ? block.channel.name : "Broadcast")}</h3>
          <div className="flex items-center gap-2">
            {block.channel && (
              <>
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-royal to-hc-purple flex items-center justify-center overflow-hidden">
                  {block.channel.avatar_url ? (
                    <img src={block.channel.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[6px] text-gold font-bold">{channelInitials(block.channel.name)}</span>
                  )}
                </div>
                <span className="text-[10px] text-txt-secondary truncate">{block.channel.name}</span>
                <Badge label={badge.label} variant={badge.variant} />
              </>
            )}
            {block.is_recurring && <span className="text-[9px] text-txt-secondary">Weekly</span>}
          </div>
        </div>
      </div>
    </Card>
  );
}
