"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import Badge from "@/components/ui/Badge";
import VideoAdOverlay from "@/components/ads/VideoAdOverlay";
import PaywallOverlay from "@/components/live/PaywallOverlay";
import type { ChannelVideo, ChannelType } from "@/types/database";

interface PaywallData {
  channel_id: string;
  ppv_price_cents: number | null;
  subscription_price_cents: number | null;
  currency: string;
  preview_seconds: number | null;
}

const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), {
  ssr: false,
});

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

interface WatchPageProps {
  video: ChannelVideo;
  moreVideos: ChannelVideo[];
  userId: string | null;
}

export default function WatchPage({ video, moreVideos, userId }: WatchPageProps) {
  const router = useRouter();
  const [adComplete, setAdComplete] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [paywall, setPaywall] = useState<PaywallData | null>(null);
  const [paywallReason, setPaywallReason] = useState<
    "ppv_required" | "subscription_required" | "auth_required" | null
  >(null);
  const viewCounted = useRef(false);
  const channel = video.channel;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/videos/${video.id}/playback`)
      .then(async (r) => {
        if (cancelled) return;
        if (r.status === 402) {
          const data = await r.json();
          setPaywall(data.paywall as PaywallData);
          setPaywallReason(data.reason);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setAccessChecked(true);
      });
    return () => { cancelled = true; };
  }, [video.id]);

  useEffect(() => {
    if (adComplete && !paywall && !viewCounted.current) {
      viewCounted.current = true;
      fetch(`/api/channels/${video.channel?.id}/videos/${video.id}/view`, {
        method: "POST",
      }).catch(() => {});
    }
  }, [adComplete, paywall, video.id, video.channel?.id]);

  const badge = channel
    ? TYPE_BADGE[channel.type as ChannelType] || TYPE_BADGE.community
    : null;

  return (
    <div className="animate-fade-in">

      {/* ── Back Header ─────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: "2px solid var(--rule-strong-c)", background: "var(--paper-warm)" }}
      >
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center press transition-colors shrink-0"
          style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)", color: "var(--ink-strong)" }}
          aria-label="Go back"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1
          className="c-card-t text-[14px] truncate flex-1"
          style={{ color: "var(--ink-strong)" }}
        >
          {video.title}
        </h1>
      </div>

      {/* ── Player / Paywall ────────────────────────────── */}
      <div
        className="overflow-hidden relative"
        style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
      >
        {paywall && paywallReason ? (
          <PaywallOverlay
            videoId={video.id}
            channelId={paywall.channel_id}
            thumbnailUrl={
              video.thumbnail_url ||
              (video.mux_playback_id
                ? `https://image.mux.com/${video.mux_playback_id}/thumbnail.webp?width=800&height=450&time=5`
                : null)
            }
            ppvPriceCents={paywall.ppv_price_cents}
            subscriptionPriceCents={paywall.subscription_price_cents}
            currency={paywall.currency}
            reason={paywallReason}
          />
        ) : (
          <div className="relative">
            {/* Pre-roll ad overlay */}
            {!adComplete && accessChecked && (
              <VideoAdOverlay
                contentId={video.id}
                onAdComplete={() => setAdComplete(true)}
                zone="video_preroll"
              />
            )}

            {video.mux_playback_id ? (
              <MuxPlayer
                playbackId={video.mux_playback_id}
                streamType="on-demand"
                autoPlay={adComplete ? true : false}
                muted={false}
                accentColor="#F2A900"
                style={{ aspectRatio: "16/9", width: "100%" }}
                metadata={{
                  video_title: video.title,
                  viewer_user_id: userId || "anon",
                }}
              />
            ) : (
              <div
                className="aspect-video flex items-center justify-center"
                style={{ background: "var(--ink-strong)" }}
              >
                <div className="text-center">
                  <div
                    className="w-10 h-10 border-2 border-t-gold animate-spin mx-auto mb-3"
                    style={{ borderColor: "rgba(242,169,0,0.3)", borderTopColor: "#F2A900" }}
                  />
                  <p className="c-kicker text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                    PROCESSING VIDEO…
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Video Info ──────────────────────────────────── */}
      <div style={{ borderBottom: "2px solid var(--rule-strong-c)" }}>

        {/* Title + meta */}
        <div style={{ padding: "14px 16px 14px", borderBottom: "2px solid var(--rule-strong-c)", background: "var(--paper-warm)" }}>
          <h2
            className="c-card-t text-[17px] leading-tight mb-2"
            style={{ color: "var(--ink-strong)" }}
          >
            {video.title}
          </h2>
          <div className="flex items-center gap-2.5">
            <span className="c-meta text-[11px]">{formatViews(video.view_count)} views</span>
            {video.published_at && (
              <>
                <span className="c-meta" style={{ opacity: 0.4 }}>·</span>
                <span className="c-meta text-[11px]">
                  {new Date(video.published_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </>
            )}
            {video.duration && (
              <>
                <span className="c-meta" style={{ opacity: 0.4 }}>·</span>
                <span className="c-meta text-[11px]">{formatDuration(video.duration)}</span>
              </>
            )}
            {/* Video type badge */}
            {video.video_type !== "on_demand" && (
              <Badge
                label={video.video_type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                variant={
                  video.video_type === "featured" || video.video_type === "original"
                    ? "gold"
                    : video.video_type === "podcast"
                    ? "purple"
                    : video.video_type === "city_hall"
                    ? "cyan"
                    : "blue"
                }
              />
            )}
          </div>
        </div>

        {/* Channel info */}
        {channel && (
          <Link
            href={`/live/channel/${channel.id}`}
            className="flex items-center gap-3 press"
            style={{ padding: "12px 16px", borderBottom: "2px solid var(--rule-strong-c)" }}
          >
            <div
              className="w-11 h-11 flex items-center justify-center overflow-hidden shrink-0"
              style={{
                background: channel.avatar_url ? "transparent" : "var(--gold-c)",
                border: "2px solid var(--rule-strong-c)",
              }}
            >
              {channel.avatar_url ? (
                <img
                  src={channel.avatar_url}
                  alt={channel.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="c-card-t text-[12px]" style={{ color: "var(--ink-strong)" }}>
                  {channelInitials(channel.name)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span
                  className="c-card-t text-[13px] truncate"
                  style={{ color: "var(--ink-strong)" }}
                >
                  {channel.name}
                </span>
                {Boolean((channel as unknown as Record<string, unknown>).is_verified) && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0" style={{ color: "var(--gold-c)" }}>
                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )}
              </div>
              <div className="flex items-center gap-2">
                {badge && <Badge label={badge.label} variant={badge.variant} />}
                <span className="c-meta text-[10px]">
                  {(channel as unknown as Record<string, unknown>).follower_count as number || 0} followers
                </span>
              </div>
            </div>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              style={{ color: "var(--ink-strong)", opacity: 0.35, flexShrink: 0 }}
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        )}

        {/* Description */}
        {video.description && (
          <div style={{ padding: "12px 16px" }}>
            <div style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)", padding: "12px 14px" }}>
              <p
                className="c-body text-[13px] leading-relaxed"
                style={{ color: "var(--ink-strong)" }}
              >
                {video.description}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── More From This Channel ──────────────────────── */}
      {moreVideos.length > 0 && (
        <div style={{ padding: "16px 16px 32px" }}>
          <h3
            className="c-card-t text-[12px] mb-3"
            style={{ color: "var(--ink-strong)" }}
          >
            MORE FROM {channel?.name?.toUpperCase() || "THIS CHANNEL"}
          </h3>
          <div className="space-y-3">
            {moreVideos.map((v) => (
              <div
                key={v.id}
                onClick={() => router.push(`/live/watch/${v.id}`)}
                className="flex gap-3 cursor-pointer press"
                style={{
                  background: "var(--paper-warm)",
                  border: "2px solid var(--rule-strong-c)",
                  boxShadow: "3px 3px 0 rgba(26,21,18,0.12)",
                  padding: "10px",
                }}
              >
                {/* Thumbnail */}
                <div
                  className="shrink-0 overflow-hidden relative"
                  style={{
                    width: 112,
                    height: 72,
                    background: "#0A0A0A",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  {v.thumbnail_url ? (
                    <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                  ) : v.mux_playback_id ? (
                    <img
                      src={`https://image.mux.com/${v.mux_playback_id}/thumbnail.webp?width=224&height=144&time=5`}
                      alt={v.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: "rgba(255,255,255,0.2)" }}>
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                  )}
                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="w-7 h-7 flex items-center justify-center"
                      style={{ background: "var(--gold-c)", border: "2px solid var(--paper)" }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--ink-strong)" className="ml-0.5">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                  </div>
                  {/* Duration */}
                  {v.duration && (
                    <div
                      className="absolute bottom-1 right-1 c-kicker px-1 py-0.5"
                      style={{ background: "rgba(0,0,0,0.75)", color: "#fff", fontSize: 8 }}
                    >
                      {formatDuration(v.duration)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 py-0.5">
                  <h4
                    className="c-card-t text-[12px] line-clamp-2 mb-1.5"
                    style={{ color: "var(--ink-strong)" }}
                  >
                    {v.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="c-kicker tabular-nums" style={{ fontSize: 9, color: "rgba(26,21,18,0.5)" }}>
                      {formatViews(v.view_count)} VIEWS
                    </span>
                    {v.published_at && (
                      <>
                        <span style={{ opacity: 0.3, fontSize: 9 }}>·</span>
                        <span className="c-kicker" style={{ fontSize: 9, color: "rgba(26,21,18,0.5)" }}>
                          {new Date(v.published_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
