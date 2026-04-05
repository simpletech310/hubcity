"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Chip from "@/components/ui/Chip";
import StreamCard from "./StreamCard";
import CreateStreamModal from "./CreateStreamModal";
import type {
  Channel,
  ChannelVideo,
  LiveStream,
  TimeBlock,
  ChannelType,
} from "@/types/database";

const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), {
  ssr: false,
});

// ── Types & Constants ──────────────────────────────────────
type TabId = "home" | "live" | "originals" | "channels" | "schedule";

const TABS: { id: TabId; label: string; icon?: string }[] = [
  { id: "home", label: "Home" },
  { id: "live", label: "Live", icon: "🔴" },
  { id: "originals", label: "Originals" },
  { id: "channels", label: "Channels" },
  { id: "schedule", label: "Schedule" },
];

const CHANNEL_FILTERS: { label: string; value: ChannelType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Schools", value: "school" },
  { label: "City", value: "city" },
  { label: "Organizations", value: "organization" },
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

// ── Mux Demo Playback IDs (real videos in the account) ────
const DEMO_PLAYBACK_IDS = [
  "gz2zqxILC0002QEg8p9YBCrlfHIgi5yIXK009ep02Nngpbc", // 669s 1080p 16:9
  "201pH01yrmEaWSDwxS003lXyqTUYXS9S6QgHvj66Oda2m8", // 645s 1080p 16:9
  "fRGWXPRIebDIEe01hIkiPzPlEcgYsEZL9dGVm8nOYYGk",   // 272s 1080p 16:9
  "VNSRVl9AwnEcIGVwuQAgRBUoCGs3TbYE900ywl01nUXzs",   // 270s 720p  16:9
  "DvUNmWbAG0100yvsdMvVzTod00dPKsJrL00xu1lG5MmsKIA",  // 94s  1080p 16:9
  "CV00L4KqMbBxeyXz9EfyrHiH017q76WVaNEhhQNr4FBNo",   // 15s  1080p 16:9
  "3w9WlvYAhCZSPnUgrfnwK1mlP0087Kgp802tmOQowAaDU",   // 40s  720p  1:1
];

function demoId(index: number) {
  return DEMO_PLAYBACK_IDS[index % DEMO_PLAYBACK_IDS.length];
}

// ── Demo video data used when DB is empty ─────────────────
type DemoChannel = { id: string; name: string; slug: string; avatar_url: string | null; type: ChannelType };
const DEMO_CHANNELS: DemoChannel[] = [
  { id: "demo-ch-1", name: "Hub City News", slug: "hub-city-news", avatar_url: null, type: "city" },
  { id: "demo-ch-2", name: "Compton Sports", slug: "compton-sports", avatar_url: null, type: "community" },
  { id: "demo-ch-3", name: "Centennial HS", slug: "centennial-hs", avatar_url: null, type: "school" },
  { id: "demo-ch-4", name: "Culture Hub", slug: "culture-hub", avatar_url: null, type: "media" },
  { id: "demo-ch-5", name: "City Council", slug: "city-council", avatar_url: null, type: "city" },
  { id: "demo-ch-6", name: "Block Beats Radio", slug: "block-beats", avatar_url: null, type: "media" },
];

const DEMO_FEATURED_VIDEOS = [
  { id: "demo-fv-1", channel_id: "demo-ch-1", title: "Compton City Council - April Session", description: "Full city council meeting coverage with public comment period.", mux_playback_id: demoId(0), mux_asset_id: null, mux_upload_id: null, thumbnail_url: null, video_type: "city_hall", duration: 669, view_count: 2340, is_published: true, is_featured: true, status: "ready", published_at: "2026-04-01T18:00:00Z", created_at: "2026-04-01T17:00:00Z", channel: DEMO_CHANNELS[0] },
  { id: "demo-fv-2", channel_id: "demo-ch-2", title: "Friday Night Lights: Centennial vs Dominguez", description: "High school football rivalry game under the lights.", mux_playback_id: demoId(1), mux_asset_id: null, mux_upload_id: null, thumbnail_url: null, video_type: "original", duration: 645, view_count: 4120, is_published: true, is_featured: true, status: "ready", published_at: "2026-04-03T02:00:00Z", created_at: "2026-04-03T01:00:00Z", channel: DEMO_CHANNELS[1] },
  { id: "demo-fv-3", channel_id: "demo-ch-4", title: "The Real Compton: Episode 1 - Richland Farms", description: "Exploring the hidden gem neighborhood where horses roam.", mux_playback_id: demoId(2), mux_asset_id: null, mux_upload_id: null, thumbnail_url: null, video_type: "original", duration: 272, view_count: 1850, is_published: true, is_featured: true, status: "ready", published_at: "2026-03-28T20:00:00Z", created_at: "2026-03-28T19:00:00Z", channel: DEMO_CHANNELS[3] },
  { id: "demo-fv-4", channel_id: "demo-ch-6", title: "Block Beats: West Coast Classics Remix Session", description: "Live DJ session remixing classic Compton hits.", mux_playback_id: demoId(3), mux_asset_id: null, mux_upload_id: null, thumbnail_url: null, video_type: "original", duration: 270, view_count: 3200, is_published: true, is_featured: true, status: "ready", published_at: "2026-03-30T22:00:00Z", created_at: "2026-03-30T21:00:00Z", channel: DEMO_CHANNELS[5] },
  { id: "demo-fv-5", channel_id: "demo-ch-5", title: "Budget Town Hall - Community Q&A", description: "Residents ask questions about the 2026-27 city budget.", mux_playback_id: demoId(4), mux_asset_id: null, mux_upload_id: null, thumbnail_url: null, video_type: "city_hall", duration: 94, view_count: 890, is_published: true, is_featured: true, status: "ready", published_at: "2026-03-25T18:30:00Z", created_at: "2026-03-25T18:00:00Z", channel: DEMO_CHANNELS[4] },
] as unknown as ChannelVideo[];

const DEMO_RECENT_VIDEOS = [
  { id: "demo-rv-1", channel_id: "demo-ch-1", title: "Morning Report: What's New in Compton", description: "Daily news roundup.", mux_playback_id: demoId(5), mux_asset_id: null, mux_upload_id: null, thumbnail_url: null, video_type: "original", duration: 15, view_count: 560, is_published: true, is_featured: false, status: "ready", published_at: "2026-04-05T12:00:00Z", created_at: "2026-04-05T11:00:00Z", channel: DEMO_CHANNELS[0] },
  { id: "demo-rv-2", channel_id: "demo-ch-3", title: "Centennial Graduation Highlights 2026", description: "Best moments from this year's graduation ceremony.", mux_playback_id: demoId(6), mux_asset_id: null, mux_upload_id: null, thumbnail_url: null, video_type: "original", duration: 40, view_count: 1200, is_published: true, is_featured: false, status: "ready", published_at: "2026-04-04T20:00:00Z", created_at: "2026-04-04T19:00:00Z", channel: DEMO_CHANNELS[2] },
  { id: "demo-rv-3", channel_id: "demo-ch-4", title: "Mural Walk: Downtown Compton Art Tour", description: "A walking tour of Compton's best public art.", mux_playback_id: demoId(2), mux_asset_id: null, mux_upload_id: null, thumbnail_url: null, video_type: "original", duration: 272, view_count: 780, is_published: true, is_featured: false, status: "ready", published_at: "2026-04-03T16:00:00Z", created_at: "2026-04-03T15:00:00Z", channel: DEMO_CHANNELS[3] },
  { id: "demo-rv-4", channel_id: "demo-ch-2", title: "Youth Basketball League Finals Recap", description: "Highlights from the championship game at Lueders Park.", mux_playback_id: demoId(1), mux_asset_id: null, mux_upload_id: null, thumbnail_url: null, video_type: "original", duration: 645, view_count: 2100, is_published: true, is_featured: false, status: "ready", published_at: "2026-04-02T21:00:00Z", created_at: "2026-04-02T20:00:00Z", channel: DEMO_CHANNELS[1] },
  { id: "demo-rv-5", channel_id: "demo-ch-6", title: "Compton Cooks: Abuela's Kitchen Episode 3", description: "Traditional Mexican recipes from Compton's own grandmothers.", mux_playback_id: demoId(0), mux_asset_id: null, mux_upload_id: null, thumbnail_url: null, video_type: "original", duration: 669, view_count: 3450, is_published: true, is_featured: false, status: "ready", published_at: "2026-04-01T19:00:00Z", created_at: "2026-04-01T18:00:00Z", channel: DEMO_CHANNELS[5] },
  { id: "demo-rv-6", channel_id: "demo-ch-5", title: "Parks & Rec Committee Meeting", description: "Monthly meeting on park improvements and youth programs.", mux_playback_id: demoId(4), mux_asset_id: null, mux_upload_id: null, thumbnail_url: null, video_type: "city_hall", duration: 94, view_count: 430, is_published: true, is_featured: false, status: "ready", published_at: "2026-03-31T18:00:00Z", created_at: "2026-03-31T17:00:00Z", channel: DEMO_CHANNELS[4] },
  { id: "demo-rv-7", channel_id: "demo-ch-1", title: "Community Spotlight: Compton Cowboys", description: "Meet the urban horseback riders keeping tradition alive.", mux_playback_id: demoId(3), mux_asset_id: null, mux_upload_id: null, thumbnail_url: null, video_type: "original", duration: 270, view_count: 5600, is_published: true, is_featured: false, status: "ready", published_at: "2026-03-29T20:00:00Z", created_at: "2026-03-29T19:00:00Z", channel: DEMO_CHANNELS[0] },
  { id: "demo-rv-8", channel_id: "demo-ch-3", title: "Centennial Band: Battle of the Bands", description: "Centennial High marching band performance.", mux_playback_id: demoId(6), mux_asset_id: null, mux_upload_id: null, thumbnail_url: null, video_type: "original", duration: 40, view_count: 890, is_published: true, is_featured: false, status: "ready", published_at: "2026-03-28T22:00:00Z", created_at: "2026-03-28T21:00:00Z", channel: DEMO_CHANNELS[2] },
  { id: "demo-rv-9", channel_id: "demo-ch-4", title: "Compton Rising: Ep 1 - The Visionaries", description: "Five young creators building the future of Compton.", mux_playback_id: demoId(0), mux_asset_id: null, mux_upload_id: null, thumbnail_url: null, video_type: "original", duration: 669, view_count: 7200, is_published: true, is_featured: false, status: "ready", published_at: "2026-03-27T20:00:00Z", created_at: "2026-03-27T19:00:00Z", channel: DEMO_CHANNELS[3] },
  { id: "demo-rv-10", channel_id: "demo-ch-6", title: "Late Night Vibes: Lo-Fi Compton Mix", description: "Chill beats for studying and relaxation.", mux_playback_id: demoId(3), mux_asset_id: null, mux_upload_id: null, thumbnail_url: null, video_type: "podcast", duration: 270, view_count: 4300, is_published: true, is_featured: false, status: "ready", published_at: "2026-03-26T23:00:00Z", created_at: "2026-03-26T22:00:00Z", channel: DEMO_CHANNELS[5] },
] as unknown as ChannelVideo[];

// ── Hub City Originals (curated showcase content) ──────────
const ORIGINALS = [
  {
    title: "Compton Rising",
    desc: "Five young creators. One city. Unlimited potential.",
    genre: "Documentary Series",
    gradient: "from-compton-red/80 via-compton-red/30 to-transparent",
    accent: "#EF4444",
    playbackId: demoId(0),
  },
  {
    title: "Block Beats",
    desc: "The sounds that shaped a city. Music, culture, legacy.",
    genre: "Music · Culture",
    gradient: "from-hc-purple/80 via-hc-purple/30 to-transparent",
    accent: "#8B5CF6",
    playbackId: demoId(3),
  },
  {
    title: "Friday Night Lights",
    desc: "High school football in Compton. Under the lights, everything matters.",
    genre: "Live Sports",
    gradient: "from-emerald/80 via-emerald/30 to-transparent",
    accent: "#22C55E",
    playbackId: demoId(1),
  },
  {
    title: "The Real Compton",
    desc: "Stories from the streets. Unscripted. Unfiltered. Real.",
    genre: "Talk Show",
    gradient: "from-gold/80 via-gold/30 to-transparent",
    accent: "#F2A900",
    playbackId: demoId(2),
  },
  {
    title: "Compton Cooks",
    desc: "Local chefs, legendary recipes, and the food that built us.",
    genre: "Food · Lifestyle",
    gradient: "from-coral/80 via-coral/30 to-transparent",
    accent: "#FF6B6B",
    playbackId: demoId(4),
  },
];

// ── Compton Stars ──────────────────────────────────────────
const COMPTON_STARS = [
  { name: "Kendrick Lamar", title: "Pulitzer Prize Winner", icon: "🎤" },
  { name: "Serena Williams", title: "Tennis Legend", icon: "🎾" },
  { name: "Venus Williams", title: "Tennis Champion", icon: "🏆" },
  { name: "Dr. Dre", title: "Music Mogul", icon: "🎧" },
  { name: "Ice Cube", title: "Entertainment Icon", icon: "🎬" },
  { name: "The Game", title: "West Coast Legend", icon: "🎵" },
  { name: "Coolio", title: "Grammy Winner", icon: "🏅" },
  { name: "Aja Wilson", title: "WNBA MVP", icon: "🏀" },
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

  // Merge demo data when DB is empty so the page is always populated
  const allFeatured = featuredVideos.length > 0 ? featuredVideos : DEMO_FEATURED_VIDEOS;
  const allRecent = recentVideos.length > 0 ? recentVideos : DEMO_RECENT_VIDEOS;
  const allChannels = channels.length > 0 ? channels : (DEMO_CHANNELS as unknown as Channel[]);

  const rawActiveStreams = streams.filter((s) => s.status === "active");
  const rawUpcomingStreams = streams.filter((s) => s.status === "idle");

  // Demo streams when DB is empty
  const DEMO_STREAMS = (rawActiveStreams.length === 0 && rawUpcomingStreams.length === 0 ? [
    {
      id: "demo-stream-1",
      title: "City Council Live: April Budget Review",
      description: "Live coverage of the April city council budget review session.",
      status: "active" as const,
      category: "government",
      mux_playback_id: demoId(0),
      mux_stream_id: null, mux_stream_key: null,
      rtmp_url: "rtmps://global-live.mux.com:443/app",
      creator_id: "demo-creator-1",
      channel_id: "demo-ch-5",
      viewer_count: 127,
      scheduled_at: new Date().toISOString(),
      ended_at: null, created_at: new Date().toISOString(),
      creator: { id: "demo-creator-1", display_name: "City Clerk Office", avatar_url: null, role: "city_official", verification_status: "verified" },
      channel: DEMO_CHANNELS[4],
    },
    {
      id: "demo-stream-2",
      title: "Friday Night Lights: Compton vs Lynwood",
      description: "High school football — live from the field.",
      status: "active" as const,
      category: "sports",
      mux_playback_id: demoId(1),
      mux_stream_id: null, mux_stream_key: null,
      rtmp_url: "rtmps://global-live.mux.com:443/app",
      creator_id: "demo-creator-2",
      channel_id: "demo-ch-2",
      viewer_count: 342,
      scheduled_at: new Date().toISOString(),
      ended_at: null, created_at: new Date().toISOString(),
      creator: { id: "demo-creator-2", display_name: "Compton Sports Network", avatar_url: null, role: "admin", verification_status: "verified" },
      channel: DEMO_CHANNELS[1],
    },
    {
      id: "demo-stream-3",
      title: "Late Night Vibes: Chill Beats from Compton",
      description: "Lo-fi music stream with city visuals.",
      status: "idle" as const,
      category: "entertainment",
      mux_playback_id: demoId(3),
      mux_stream_id: null, mux_stream_key: null,
      rtmp_url: "rtmps://global-live.mux.com:443/app",
      creator_id: "demo-creator-3",
      channel_id: "demo-ch-6",
      viewer_count: 0,
      scheduled_at: new Date(Date.now() + 3600000 * 2).toISOString(),
      ended_at: null, created_at: new Date().toISOString(),
      creator: { id: "demo-creator-3", display_name: "Block Beats Radio", avatar_url: null, role: "admin", verification_status: "verified" },
      channel: DEMO_CHANNELS[5],
    },
    {
      id: "demo-stream-4",
      title: "Compton Rising: Behind the Scenes",
      description: "Exclusive look at the making of the documentary series.",
      status: "idle" as const,
      category: "entertainment",
      mux_playback_id: demoId(2),
      mux_stream_id: null, mux_stream_key: null,
      rtmp_url: "rtmps://global-live.mux.com:443/app",
      creator_id: "demo-creator-4",
      channel_id: "demo-ch-4",
      viewer_count: 0,
      scheduled_at: new Date(Date.now() + 3600000 * 5).toISOString(),
      ended_at: null, created_at: new Date().toISOString(),
      creator: { id: "demo-creator-4", display_name: "Culture Hub TV", avatar_url: null, role: "admin", verification_status: "verified" },
      channel: DEMO_CHANNELS[3],
    },
  ] : []) as unknown as LiveStream[];

  const activeStreams = rawActiveStreams.length > 0 ? rawActiveStreams : DEMO_STREAMS.filter((s) => s.status === "active");
  const upcomingStreams = rawUpcomingStreams.length > 0 ? rawUpcomingStreams : DEMO_STREAMS.filter((s) => s.status === "idle");

  const filteredChannels =
    channelFilter === "all" ? allChannels : allChannels.filter((c) => c.type === channelFilter);

  const today = new Date().getDay();
  const tomorrow = (today + 1) % 7;
  const todayBlocks = timeBlocks.filter((tb) => tb.day_of_week === today);
  const tomorrowBlocks = timeBlocks.filter((tb) => tb.day_of_week === tomorrow);

  const originals = allRecent.filter((v) => v.video_type === "original");
  const podcasts = allRecent.filter((v) => v.video_type === "podcast");
  const cityHall = allRecent.filter((v) => v.video_type === "city_hall");

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

  const currentHero = ORIGINALS[heroIndex];

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
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-royal to-hc-purple flex items-center justify-center text-gold font-heading text-[10px] font-bold">{channelInitials(playingVideo.channel.name)}</div>
              <span className="text-sm text-txt-secondary">{playingVideo.channel.name}</span>
            </Link>
          )}
          <div className="flex items-center gap-3 text-[11px] text-txt-secondary">
            <span>{formatViews(playingVideo.view_count)} views</span>
            {playingVideo.published_at && <span>{new Date(playingVideo.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
          </div>
          {playingVideo.description && <p className="text-sm text-txt-secondary leading-relaxed">{playingVideo.description}</p>}
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
          {watchingStream.description && <p className="text-sm text-txt-secondary">{watchingStream.description}</p>}
          {watchingStream.status === "active" && (
            <div className="rounded-xl bg-coral/10 border border-coral/20 p-4 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-coral animate-pulse shrink-0" />
              <div>
                <p className="text-sm font-semibold text-coral">Broadcasting Live</p>
                <p className="text-[11px] text-txt-secondary">Stream is active</p>
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
          <MuxPlayer
            playbackId={currentHero.playbackId}
            streamType="on-demand"
            autoPlay="muted"
            loop
            muted
            nohotkeys
            poster={`https://image.mux.com/${currentHero.playbackId}/thumbnail.webp?width=960&height=540&time=8`}
            accentColor={currentHero.accent}
            style={{ width: "100%", height: "100%", objectFit: "cover", aspectRatio: "unset", ["--controls" as string]: "none", ["--media-object-fit" as string]: "cover" }}
            className="pointer-events-none"
          />
        </div>
        {/* Gradient overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-midnight)] via-[var(--color-midnight)]/70 to-[var(--color-midnight)]/40" />
        <div className="absolute inset-0" style={{
          background: `radial-gradient(ellipse at 20% 50%, ${currentHero.accent}20 0%, transparent 60%)`,
        }} />

        <div className="relative z-10 px-5 pt-6 pb-8">
          {/* Brand tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-compton-red/15 border border-compton-red/30 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-compton-red animate-pulse" />
            <span className="font-heading text-[10px] font-bold text-compton-red tracking-[0.1em]">
              HUB CITY ORIGINALS
            </span>
          </div>

          {/* Title */}
          <h1 className="font-heading text-[36px] font-bold leading-[0.95] tracking-tight mb-3">
            {currentHero.title}
          </h1>

          {/* Description */}
          <p className="font-display italic text-[16px] text-warm-gray leading-relaxed max-w-[300px] mb-2">
            {currentHero.desc}
          </p>

          {/* Genre tag */}
          <p className="text-[12px] text-txt-secondary mb-6">{currentHero.genre}</p>

          {/* CTA Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                const demoVideo: ChannelVideo = {
                  id: `original-hero-${heroIndex}`,
                  channel_id: DEMO_CHANNELS[heroIndex % DEMO_CHANNELS.length].id,
                  title: currentHero.title,
                  description: currentHero.desc,
                  mux_playback_id: currentHero.playbackId,
                  mux_asset_id: null,
                  mux_upload_id: null,
                  thumbnail_url: null,
                  video_type: "original",
                  duration: 300,
                  view_count: 5000 + heroIndex * 1200,
                  is_published: true,
                  is_featured: true,
                  status: "ready",
                  published_at: new Date().toISOString(),
                  created_at: new Date().toISOString(),
                  channel: DEMO_CHANNELS[heroIndex % DEMO_CHANNELS.length],
                } as unknown as ChannelVideo;
                setPlayingVideo(demoVideo);
              }}
              className="flex items-center gap-2 bg-gold text-midnight px-6 py-3 rounded-xl font-heading text-[14px] font-bold press hover:bg-gold-light transition-colors shadow-lg shadow-gold/20"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
              Watch Now
            </button>
            <button className="flex items-center gap-2 bg-white/[0.08] border border-white/[0.15] text-white px-5 py-3 rounded-xl text-[14px] font-medium press hover:bg-white/[0.12] transition-colors backdrop-blur-sm">
              + My List
            </button>
          </div>

          {/* Hero pagination dots */}
          <div className="flex gap-2 mt-6">
            {ORIGINALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroIndex(i)}
                className={`h-[3px] rounded-full transition-all duration-300 ${
                  i === heroIndex ? "w-8 bg-gold" : "w-3 bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB NAVIGATION — Netflix top nav style
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
          HOME TAB — Netflix-style content rows
          ══════════════════════════════════════════════════════ */}
      {activeTab === "home" && (
        <div className="animate-fade-in">
          {/* Live Now — if active streams */}
          {activeStreams.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-2 px-5 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-coral animate-pulse" />
                <h2 className="font-heading font-bold text-[18px]">Live Now</h2>
                <Badge label={`${activeStreams.length} LIVE`} variant="coral" shine />
              </div>
              <div className="px-5 space-y-3">
                {activeStreams.map((stream) => (
                  <StreamCard key={stream.id} stream={stream} isLive onWatch={() => setWatchingStream(stream)} />
                ))}
              </div>
            </section>
          )}

          {/* Hub City Originals row */}
          <section className="mb-8">
            <div className="flex items-center justify-between px-5 mb-3">
              <h2 className="font-heading font-bold text-[18px]">
                <span className="text-gold">Hub City</span> Originals
              </h2>
              <button onClick={() => setActiveTab("originals")} className="text-[12px] text-gold font-semibold press">
                See All →
              </button>
            </div>
            <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
              {ORIGINALS.map((show, i) => (
                <button key={i} className="shrink-0 w-[160px] text-left press group" onClick={() => {
                  setPlayingVideo({
                    id: `original-card-${i}`,
                    channel_id: DEMO_CHANNELS[i % DEMO_CHANNELS.length].id,
                    title: show.title,
                    description: show.desc,
                    mux_playback_id: show.playbackId,
                    mux_asset_id: null, mux_upload_id: null, thumbnail_url: null,
                    video_type: "original", duration: 300, view_count: 3000 + i * 800,
                    is_published: true, is_featured: true, status: "ready",
                    published_at: new Date().toISOString(), created_at: new Date().toISOString(),
                    channel: DEMO_CHANNELS[i % DEMO_CHANNELS.length],
                  } as unknown as ChannelVideo);
                }}>
                  <div className="relative rounded-2xl overflow-hidden mb-2.5 aspect-[3/4]"
                    style={{ background: `linear-gradient(180deg, ${show.accent}20 0%, var(--color-midnight) 100%)` }}>
                    {/* Auto-playing muted video preview */}
                    <div className="absolute inset-0 pointer-events-none">
                      <MuxPlayer
                        playbackId={show.playbackId}
                        streamType="on-demand"
                        autoPlay="muted"
                        loop
                        muted
                        nohotkeys
                        poster={`https://image.mux.com/${show.playbackId}/thumbnail.webp?width=320&height=427&time=5`}
                        style={{ width: "100%", height: "100%", objectFit: "cover", aspectRatio: "unset", ["--controls" as string]: "none", ["--media-object-fit" as string]: "cover" }}
                      />
                    </div>
                    {/* Color overlay */}
                    <div className="absolute inset-0" style={{
                      background: `linear-gradient(180deg, ${show.accent}30 0%, transparent 30%, transparent 50%, ${show.accent}15 100%)`,
                    }} />
                    <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-midnight to-transparent" />

                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-gold/90 flex items-center justify-center shadow-lg">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--color-midnight)" className="ml-0.5">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </div>
                    </div>

                    {/* Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded-md text-[8px] font-bold tracking-wider uppercase text-white" style={{ background: `${show.accent}CC` }}>
                        Original
                      </span>
                    </div>
                  </div>
                  <h3 className="font-heading font-bold text-[13px] mb-0.5">{show.title}</h3>
                  <p className="text-[10px] text-warm-gray">{show.genre}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Compton Stars — horizontal scroll */}
          <section className="mb-8">
            <div className="px-5 mb-3">
              <h2 className="font-heading font-bold text-[18px]">
                Compton <span className="text-gold">Stars</span>
              </h2>
              <p className="text-[12px] text-warm-gray mt-0.5">Legends who started here</p>
            </div>
            <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
              {COMPTON_STARS.map((star, i) => (
                <div key={i} className="shrink-0 flex flex-col items-center gap-2 w-[80px] press">
                  <div className="w-[64px] h-[64px] rounded-full bg-gradient-to-br from-gold/20 via-royal to-hc-purple/20 p-[2px]">
                    <div className="w-full h-full rounded-full bg-midnight flex items-center justify-center text-[24px]">
                      {star.icon}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-semibold leading-tight">{star.name}</p>
                    <p className="text-[9px] text-warm-gray">{star.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Featured Videos */}
          {allFeatured.length > 0 && (
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
                {allFeatured.map((video) => (
                  <VideoCardLarge key={video.id} video={video} onPlay={() => video.mux_playback_id ? setPlayingVideo(video) : router.push(`/live/watch/${video.id}`)} />
                ))}
              </div>
            </section>
          )}

          {/* Channel Stories scroller */}
          <section className="mb-8">
            <div className="flex items-center justify-between px-5 mb-3">
              <h2 className="font-heading font-bold text-[18px]">Channels</h2>
              <button onClick={() => setActiveTab("channels")} className="text-[12px] text-gold font-semibold press">
                See All →
              </button>
            </div>
            <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-1">
              {allChannels.slice(0, 15).map((ch) => (
                <Link key={ch.id} href={`/live/channel/${ch.id}`} className="flex flex-col items-center gap-1.5 shrink-0 press">
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
              ))}
            </div>
          </section>

          {/* Recent Uploads */}
          {allRecent.length > 0 && (
            <section className="mb-8">
              <div className="px-5 mb-3">
                <h2 className="font-heading font-bold text-[18px]">Recently Added</h2>
              </div>
              <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
                {allRecent.slice(0, 10).map((video) => (
                  <VideoCardSmall key={video.id} video={video} onPlay={() => video.mux_playback_id ? setPlayingVideo(video) : router.push(`/live/watch/${video.id}`)} />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming Streams */}
          {upcomingStreams.length > 0 && (
            <section className="mb-8">
              <div className="px-5 mb-3">
                <h2 className="font-heading font-bold text-[18px]">Coming Up Next</h2>
                <p className="text-[12px] text-warm-gray mt-0.5">{upcomingStreams.length} scheduled streams</p>
              </div>
              <div className="px-5 space-y-3">
                {upcomingStreams.slice(0, 5).map((stream) => (
                  <StreamCard key={stream.id} stream={stream} onWatch={() => { if (stream.mux_playback_id) setWatchingStream(stream); }} />
                ))}
              </div>
            </section>
          )}

          {/* Entertainment categories preview */}
          <section className="mb-8 px-5">
            <h2 className="font-heading font-bold text-[18px] mb-3">Browse by Category</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: "Sports", icon: "🏈", color: "#3B82F6", gradient: "from-hc-blue/30 to-hc-blue/5" },
                { label: "Music", icon: "🎵", color: "#8B5CF6", gradient: "from-hc-purple/30 to-hc-purple/5" },
                { label: "News", icon: "📰", color: "#06B6D4", gradient: "from-cyan/30 to-cyan/5" },
                { label: "Culture", icon: "🎭", color: "#EF4444", gradient: "from-compton-red/30 to-compton-red/5" },
                { label: "Podcasts", icon: "🎙️", color: "#FF6B6B", gradient: "from-coral/30 to-coral/5" },
                { label: "Education", icon: "📚", color: "#22C55E", gradient: "from-emerald/30 to-emerald/5" },
              ].map((cat, i) => (
                <button key={i} className={`relative overflow-hidden bg-gradient-to-br ${cat.gradient} rounded-2xl border border-border-subtle p-4 text-left press group`}>
                  <div className="absolute top-0 left-0 right-0 h-[2px] opacity-50" style={{ background: `linear-gradient(90deg, transparent, ${cat.color}, transparent)` }} />
                  <span className="text-[28px] block mb-2">{cat.icon}</span>
                  <span className="font-heading text-[14px] font-bold">{cat.label}</span>
                </button>
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
          {activeStreams.length > 0 && (
            <div className="px-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-heading font-bold text-base">Live Now</h2>
                <div className="w-2 h-2 rounded-full bg-coral animate-pulse" />
              </div>
              <div className="space-y-3 stagger">
                {activeStreams.map((stream) => (
                  <StreamCard key={stream.id} stream={stream} isLive onWatch={() => setWatchingStream(stream)} />
                ))}
              </div>
            </div>
          )}
          <div className="px-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-bold text-base">
                {upcomingStreams.length > 0 ? "Upcoming Streams" : "Scheduled"}
              </h2>
              <span className="text-[11px] text-txt-secondary">{upcomingStreams.length} scheduled</span>
            </div>
            {upcomingStreams.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-txt-secondary">
                    <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </div>
                <p className="text-sm text-txt-secondary">No streams scheduled</p>
              </div>
            ) : (
              <div className="space-y-3 stagger">
                {upcomingStreams.map((stream) => (
                  <StreamCard key={stream.id} stream={stream} onWatch={() => { if (stream.mux_playback_id) setWatchingStream(stream); }} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          ORIGINALS TAB — Full showcase
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
            {ORIGINALS.map((show, i) => (
              <button key={i} className="w-full text-left press group" onClick={() => {
                setPlayingVideo({
                  id: `original-full-${i}`,
                  channel_id: DEMO_CHANNELS[i % DEMO_CHANNELS.length].id,
                  title: show.title,
                  description: show.desc,
                  mux_playback_id: show.playbackId,
                  mux_asset_id: null, mux_upload_id: null, thumbnail_url: null,
                  video_type: "original", duration: 300, view_count: 3000 + i * 800,
                  is_published: true, is_featured: true, status: "ready",
                  published_at: new Date().toISOString(), created_at: new Date().toISOString(),
                  channel: DEMO_CHANNELS[i % DEMO_CHANNELS.length],
                } as unknown as ChannelVideo);
              }}>
                <div className="relative rounded-2xl overflow-hidden border border-border-subtle">
                  {/* Video preview with poster */}
                  <div className="h-[220px] relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none">
                      <MuxPlayer
                        playbackId={show.playbackId}
                        streamType="on-demand"
                        autoPlay="muted"
                        loop
                        muted
                        nohotkeys
                        poster={`https://image.mux.com/${show.playbackId}/thumbnail.webp?width=800&height=440&time=10`}
                        style={{ width: "100%", height: "100%", objectFit: "cover", aspectRatio: "unset", ["--controls" as string]: "none", ["--media-object-fit" as string]: "cover" }}
                      />
                    </div>
                    <div className="absolute inset-0" style={{
                      background: `linear-gradient(180deg, transparent 0%, ${show.accent}15 60%, var(--color-card) 100%)`,
                    }} />

                    {/* Play button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-gold/90 flex items-center justify-center shadow-lg opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--color-midnight)" className="ml-1">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </div>
                    </div>

                    {/* Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-lg text-[9px] font-bold tracking-wider uppercase text-white" style={{ background: `${show.accent}CC` }}>
                        Hub City Original
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-heading text-[18px] font-bold mb-1">{show.title}</h3>
                    <p className="text-[13px] text-warm-gray leading-relaxed mb-2">{show.desc}</p>
                    <p className="text-[11px] text-txt-secondary">{show.genre}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Originals tab also shows real original videos */}
          {originals.length > 0 && (
            <section className="mb-8">
              <div className="px-5 mb-3">
                <h2 className="font-heading font-bold text-base">Episodes</h2>
              </div>
              <div className="px-5 space-y-3">
                {originals.map((video) => (
                  <VideoCardRow key={video.id} video={video} onPlay={() => video.mux_playback_id ? setPlayingVideo(video) : router.push(`/live/watch/${video.id}`)} />
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
          <div className="flex gap-3 px-5 mb-5 overflow-x-auto scrollbar-hide pb-1">
            {allChannels.slice(0, 15).map((ch) => (
              <Link key={ch.id} href={`/live/channel/${ch.id}`} className="flex flex-col items-center gap-1.5 shrink-0 press">
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
            ))}
          </div>
          <div className="flex gap-2 px-5 mb-4 overflow-x-auto scrollbar-hide pb-1">
            {CHANNEL_FILTERS.map((f) => (
              <Chip key={f.value} label={f.label} active={channelFilter === f.value} onClick={() => setChannelFilter(f.value)} />
            ))}
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
                          <span className="text-[10px] text-txt-secondary">{ch.follower_count} followers</span>
                        </div>
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
          <div className="mb-6">
            <h2 className="font-heading font-bold text-base mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gold" />
              Today &mdash; {DAY_NAMES[today]}
            </h2>
            {todayBlocks.length === 0 ? (
              <Card className="bg-white/[0.02]"><p className="text-sm text-txt-secondary text-center py-4">No broadcasts scheduled for today</p></Card>
            ) : (
              <div className="space-y-2">{todayBlocks.map((tb) => <TimeBlockCard key={tb.id} block={tb} />)}</div>
            )}
          </div>
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

function VideoCardLarge({ video, onPlay }: { video: ChannelVideo; onPlay: () => void }) {
  return (
    <button onClick={onPlay} className="shrink-0 w-[260px] text-left press group">
      <div className="relative rounded-xl overflow-hidden mb-2">
        <div className="aspect-video bg-gradient-to-br from-gold/20 via-midnight to-hc-purple/20 flex items-center justify-center">
          {video.thumbnail_url ? (
            <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
          ) : video.mux_playback_id ? (
            <img src={`https://image.mux.com/${video.mux_playback_id}/thumbnail.webp?width=520&height=292&time=5`} alt={video.title} className="w-full h-full object-cover" />
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
      {video.channel && <p className="text-[10px] text-txt-secondary truncate">{video.channel.name}</p>}
      <span className="text-[10px] text-txt-secondary">{formatViews(video.view_count)} views</span>
    </button>
  );
}

function VideoCardSmall({ video, onPlay }: { video: ChannelVideo; onPlay: () => void }) {
  return (
    <button onClick={onPlay} className="shrink-0 w-[180px] text-left press group">
      <div className="relative rounded-xl overflow-hidden mb-2">
        <div className="aspect-video bg-gradient-to-br from-gold/15 via-midnight to-coral/15 flex items-center justify-center">
          {video.thumbnail_url ? (
            <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
          ) : video.mux_playback_id ? (
            <img src={`https://image.mux.com/${video.mux_playback_id}/thumbnail.webp?width=360&height=202&time=5`} alt={video.title} className="w-full h-full object-cover" />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-gold/30"><polygon points="5 3 19 12 5 21 5 3" /></svg>
          )}
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-gold/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-midnight ml-0.5"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor" /></svg>
            </div>
          </div>
          {video.duration && <div className="absolute bottom-1.5 right-1.5 bg-black/70 rounded px-1 py-0.5 text-[9px] font-mono text-white">{formatDuration(video.duration)}</div>}
        </div>
      </div>
      <h3 className="font-heading font-bold text-[12px] line-clamp-2">{video.title}</h3>
      {video.channel && <p className="text-[10px] text-txt-secondary truncate mt-0.5">{video.channel.name}</p>}
    </button>
  );
}

function VideoCardRow({ video, onPlay }: { video: ChannelVideo; onPlay: () => void }) {
  return (
    <Card hover onClick={onPlay} className="cursor-pointer">
      <div className="flex gap-3">
        <div className="w-28 h-[72px] rounded-xl overflow-hidden shrink-0 relative bg-gradient-to-br from-midnight to-deep flex items-center justify-center group">
          {video.thumbnail_url ? (
            <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
          ) : video.mux_playback_id ? (
            <img src={`https://image.mux.com/${video.mux_playback_id}/thumbnail.webp?width=224&height=144&time=5`} alt={video.title} className="w-full h-full object-cover" />
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
                <span>&middot;</span>
                <span>{new Date(video.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
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
            {block.is_recurring && <span className="text-[9px] text-txt-secondary">Recurring</span>}
          </div>
        </div>
      </div>
    </Card>
  );
}
