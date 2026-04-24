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

  return (
    <div className="culture-surface min-h-dvh animate-fade-in">
      {/* ── Banner ──────────────────────────────────────── */}
      <div className="relative h-44 overflow-hidden" style={{ background: "var(--ink-strong)" }}>
        {channel.banner_url ? (
          <img
            src={channel.banner_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full" style={{ background: "var(--ink-strong)" }} />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(26,21,18,0.45) 70%, var(--paper) 100%)",
          }}
        />

        {/* Back button — paper chip */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 flex items-center justify-center press z-10"
          style={{
            width: 36,
            height: 36,
            background: "var(--paper)",
            border: "2px solid var(--rule-strong-c)",
            color: "var(--ink-strong)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* ── Channel Info ────────────────────────────────── */}
      <div className="px-5 -mt-10 relative z-10 mb-5">
        <div className="flex items-end gap-4">
          {/* Avatar — c-frame-strong on paper */}
          <div
            className="w-20 h-20 flex items-center justify-center overflow-hidden shrink-0"
            style={{
              background: "var(--gold-c)",
              border: "3px solid var(--rule-strong-c)",
            }}
          >
            {channel.avatar_url ? (
              <img
                src={channel.avatar_url}
                alt={channel.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span
                className="c-hero"
                style={{ fontSize: 28, lineHeight: 1, color: "var(--ink-strong)" }}
              >
                {channelInitials(channel.name)}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0 pb-1">
            <h1 className="c-hero flex items-center gap-2" style={{ fontSize: 26, lineHeight: 0.95 }}>
              <span className="truncate">{channel.name}</span>
              {channel.is_verified && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: "var(--gold-c)" }} className="shrink-0">
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                </svg>
              )}
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge label={badge.label} variant={badge.variant} />
              <span className="c-kicker" style={{ fontSize: 10, opacity: 0.65 }}>
                {followerCount} FOLLOWERS
              </span>
            </div>
            {channel.owner?.verification_status === "verified" && (
              <span
                className="c-kicker inline-flex items-center gap-1 mt-1"
                style={{ fontSize: 9, color: "var(--gold-c)" }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="shrink-0">
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                </svg>
                VERIFIED CREATOR
              </span>
            )}
            {channel.description && (
              <p
                className="c-serif-it mt-2 line-clamp-2"
                style={{ fontSize: 13, color: "var(--ink-strong)", opacity: 0.85 }}
              >
                {channel.description}
              </p>
            )}
          </div>
        </div>

        {/* Follow + Subscribe buttons */}
        {userId && (
          <div className="mt-3 flex flex-col gap-2">
            <button
              onClick={handleFollow}
              className={following ? "c-btn c-btn-outline w-full press" : "c-btn c-btn-primary w-full press"}
            >
              {following ? "FOLLOWING" : "FOLLOW"}
            </button>
            <ChannelSubscribeButton channel={channel} userId={userId} />
          </div>
        )}

        {/* Tip Jar */}
        {stripeAccountId && (
          <div className="mt-3">
            <TipJar
              channelId={channel.id}
              channelName={channel.name}
              stripeAccountId={stripeAccountId}
            />
          </div>
        )}
      </div>

      {/* ── Live indicator ──────────────────────────────── */}
      {activeStreams.length > 0 && (
        <div className="px-5 mb-4">
          <div
            className="relative overflow-hidden p-4"
            style={{
              background: "var(--paper)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--ink-strong)",
            }}
          >
            <div style={{ height: 3, background: "#E84855", marginTop: -16, marginLeft: -16, marginRight: -16, marginBottom: 12 }} />
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full animate-pulse shrink-0" style={{ background: "#E84855" }} />
              <p className="c-card-t" style={{ fontSize: 13, color: "#E84855" }}>LIVE NOW</p>
              <span className="c-badge-live" style={{ fontSize: 9 }}>LIVE</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab Navigation ──────────────────────────────── */}
      <div
        className="flex gap-0 px-5 mb-5 pb-3"
        style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 py-2 text-center c-card-t press"
            style={
              activeTab === tab.id
                ? { background: "var(--ink-strong)", color: "var(--gold-c)", border: "2px solid var(--ink-strong)", fontSize: 11, marginRight: -2 }
                : { background: "transparent", color: "var(--ink-strong)", border: "2px solid var(--rule-strong-c)", fontSize: 11, marginRight: -2 }
            }
          >
            {tab.label.toUpperCase()}
            {tab.id === "videos" && videos.length > 0 && (
              <span className="ml-1" style={{ fontSize: 10, opacity: 0.6 }}>{videos.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Videos Tab ──────────────────────────────────── */}
      {activeTab === "videos" && (
        <div className="animate-fade-in px-5">
          {videos.length === 0 ? (
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
              <p className="c-body">No videos yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {videos.map((video) => (
                <Link
                  key={video.id}
                  href={`/live/watch/${video.id}`}
                  className="press group"
                >
                  {/* Thumbnail canvas stays dark — video preview surface */}
                  <div
                    className="relative overflow-hidden mb-2"
                    style={{ border: "2px solid var(--rule-strong-c)" }}
                  >
                    <div className="aspect-video flex items-center justify-center" style={{ background: "var(--ink-strong)" }}>
                      {video.thumbnail_url ? (
                        <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                      ) : video.mux_playback_id ? (
                        <img
                          src={`https://image.mux.com/${video.mux_playback_id}/thumbnail.webp?width=360&height=202&time=5`}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: "var(--paper)", opacity: 0.3 }}>
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      )}
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: "var(--gold-c)", border: "2px solid var(--ink-strong)" }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5" style={{ color: "var(--ink-strong)" }}>
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </div>
                      </div>
                      {video.duration && (
                        <div className="absolute bottom-1 right-1 px-1 py-0.5 c-kicker" style={{ fontSize: 9, background: "var(--paper)", color: "var(--ink-strong)", border: "1.5px solid var(--rule-strong-c)" }}>
                          {formatDuration(video.duration)}
                        </div>
                      )}
                      {video.is_featured && (
                        <div className="absolute top-1 left-1">
                          <span className="c-badge-gold" style={{ fontSize: 9 }}>FEATURED</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <h3 className="c-card-t line-clamp-2 mb-0.5" style={{ fontSize: 11, color: "var(--ink-strong)" }}>{video.title}</h3>
                  <p className="c-meta" style={{ fontSize: 9 }}>
                    {formatViews(video.view_count)} VIEWS
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
