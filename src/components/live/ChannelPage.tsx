"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import StreamCard from "./StreamCard";
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
}

export default function ChannelPage({
  channel,
  videos,
  streams,
  timeBlocks,
  isFollowing: initialFollowing,
  userId,
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

  return (
    <div className="animate-fade-in">
      {/* ── Banner ──────────────────────────────────────── */}
      <div className="relative h-44 overflow-hidden">
        {channel.banner_url ? (
          <img
            src={channel.banner_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-royal via-hc-purple/40 to-midnight" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/40 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white press hover:bg-black/60 transition-colors z-10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* ── Channel Info ────────────────────────────────── */}
      <div className="px-5 -mt-10 relative z-10 mb-5">
        <div className="flex items-end gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-royal to-hc-purple flex items-center justify-center overflow-hidden border-4 border-midnight shadow-lg shrink-0">
            {channel.avatar_url ? (
              <img
                src={channel.avatar_url}
                alt={channel.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gold font-heading font-bold text-2xl">
                {channelInitials(channel.name)}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0 pb-1">
            <h1 className="font-heading font-bold text-xl flex items-center gap-2">
              <span className="truncate">{channel.name}</span>
              {channel.is_verified && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-cyan shrink-0">
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                </svg>
              )}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge label={badge.label} variant={badge.variant} />
              <span className="text-[11px] text-txt-secondary">
                {followerCount} followers
              </span>
            </div>
            {channel.description && (
              <p className="text-[11px] text-white/40 line-clamp-2 mt-1.5">{channel.description}</p>
            )}
          </div>
        </div>

        {/* Follow button */}
        {userId && (
          <button
            onClick={handleFollow}
            className={`mt-3 w-full py-2.5 rounded-xl text-sm font-bold press transition-all ${
              following
                ? "bg-gold/15 text-gold border border-gold/30"
                : "bg-gradient-to-r from-gold to-gold-light text-midnight"
            }`}
          >
            {following ? "Following" : "Follow"}
          </button>
        )}
      </div>

      {/* ── Live indicator ──────────────────────────────── */}
      {activeStreams.length > 0 && (
        <div className="px-5 mb-4">
          <Card className="bg-gradient-to-r from-coral/15 to-pink/10 border-coral/30 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-coral via-pink to-transparent" />
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-coral animate-pulse shrink-0" />
              <p className="text-sm font-bold text-coral">Live Now</p>
              <Badge label="LIVE" variant="coral" shine />
            </div>
          </Card>
        </div>
      )}

      {/* ── Tab Navigation ──────────────────────────────── */}
      <div className="flex gap-1 px-5 mb-5 border-b border-border-subtle pb-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-center rounded-xl text-[13px] font-semibold transition-all press ${
              activeTab === tab.id
                ? "bg-gold/15 text-gold border border-gold/25"
                : "text-txt-secondary hover:text-white border border-transparent"
            }`}
          >
            {tab.label}
            {tab.id === "videos" && videos.length > 0 && (
              <span className="ml-1 text-[10px] opacity-60">{videos.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Videos Tab ──────────────────────────────────── */}
      {activeTab === "videos" && (
        <div className="animate-fade-in px-5">
          {videos.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-txt-secondary">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <p className="text-sm text-txt-secondary">No videos yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {videos.map((video) => (
                <Link
                  key={video.id}
                  href={`/live/watch/${video.id}`}
                  className="press group"
                >
                  <div className="relative rounded-xl overflow-hidden mb-2">
                    <div className="aspect-video bg-gradient-to-br from-midnight to-deep flex items-center justify-center">
                      {video.thumbnail_url ? (
                        <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                      ) : video.mux_playback_id ? (
                        <img
                          src={`https://image.mux.com/${video.mux_playback_id}/thumbnail.webp?width=360&height=202&time=5`}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-white/20">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      )}
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="white" className="ml-0.5">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </div>
                      </div>
                      {video.duration && (
                        <div className="absolute bottom-1 right-1 bg-black/70 rounded px-1 py-0.5 text-[9px] font-mono text-white">
                          {formatDuration(video.duration)}
                        </div>
                      )}
                      {video.is_featured && (
                        <div className="absolute top-1 left-1">
                          <Badge label="Featured" variant="gold" />
                        </div>
                      )}
                    </div>
                  </div>
                  <h3 className="font-heading font-bold text-[11px] line-clamp-2 mb-0.5">{video.title}</h3>
                  <p className="text-[9px] text-txt-secondary">
                    {formatViews(video.view_count)} views
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Live Tab ────────────────────────────────────── */}
      {activeTab === "live" && (
        <div className="animate-fade-in px-5">
          {activeStreams.length > 0 && (
            <div className="mb-6">
              <h3 className="font-heading font-bold text-base mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-coral animate-pulse" />
                Live Now
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
              <h3 className="font-heading font-bold text-base mb-3">Upcoming</h3>
              <div className="space-y-3">
                {upcomingStreams.map((stream) => (
                  <StreamCard key={stream.id} stream={stream} />
                ))}
              </div>
            </div>
          ) : activeStreams.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-txt-secondary">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <p className="text-sm text-txt-secondary">No streams scheduled</p>
            </div>
          ) : null}
        </div>
      )}

      {/* ── About Tab ───────────────────────────────────── */}
      {activeTab === "about" && (
        <div className="animate-fade-in px-5 space-y-5">
          {/* Description */}
          {channel.description && (
            <Card variant="glass">
              <h3 className="font-heading font-bold text-sm mb-2 text-txt-secondary uppercase tracking-wider">
                About
              </h3>
              <p className="text-sm leading-relaxed">{channel.description}</p>
            </Card>
          )}

          {/* Schedule */}
          {timeBlocks.length > 0 && (
            <div>
              <h3 className="font-heading font-bold text-sm mb-3 text-txt-secondary uppercase tracking-wider">
                Broadcast Schedule
              </h3>
              <div className="space-y-2">
                {timeBlocks.map((tb) => (
                  <Card key={tb.id} className="border-gold/10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 text-center shrink-0">
                        <p className="text-[11px] text-gold font-bold">
                          {DAY_NAMES[tb.day_of_week]}
                        </p>
                      </div>
                      <div className="w-px h-6 bg-border-subtle" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold truncate">
                          {tb.title || "Scheduled Broadcast"}
                        </p>
                        <p className="text-[10px] text-txt-secondary">
                          {formatTimeBlock(tb.start_time)} &ndash; {formatTimeBlock(tb.end_time)}
                        </p>
                      </div>
                      {tb.is_recurring && (
                        <span className="text-[9px] text-txt-secondary bg-white/[0.04] px-2 py-0.5 rounded-full">
                          Weekly
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Channel info */}
          <Card variant="glass">
            <h3 className="font-heading font-bold text-sm mb-2 text-txt-secondary uppercase tracking-wider">
              Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-txt-secondary">Type</span>
                <Badge label={badge.label} variant={badge.variant} />
              </div>
              <div className="flex justify-between">
                <span className="text-txt-secondary">Followers</span>
                <span className="tabular-nums">{followerCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-txt-secondary">Videos</span>
                <span className="tabular-nums">{videos.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-txt-secondary">Joined</span>
                <span>
                  {new Date(channel.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
