"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import Card from "@/components/ui/Card";
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

  // Hit the playback gate so the server can decide whether to show the
  // player or the paywall. Today this returns the public Mux playback id
  // when allowed; the gate is the policy enforcement layer.
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
    return () => {
      cancelled = true;
    };
  }, [video.id]);

  // Increment view count once when ad completes and video starts
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
      <div className="flex items-center gap-3 px-5 pt-4 mb-4">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-white/[0.06] border border-border-subtle flex items-center justify-center text-txt-secondary press hover:text-white transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-base truncate">{video.title}</h1>
        </div>
      </div>

      {/* ── Player / Paywall ────────────────────────────── */}
      <div className="px-5 mb-4">
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
          <div className="rounded-2xl overflow-hidden border border-border-subtle shadow-lg shadow-black/40 relative">
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
                accentColor="#D4A017"
                style={{ aspectRatio: "16/9", width: "100%" }}
                metadata={{
                  video_title: video.title,
                  viewer_user_id: userId || "anon",
                }}
              />
            ) : (
              <div className="aspect-video bg-gradient-to-br from-midnight to-deep flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-txt-secondary">Processing video...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Video Info ──────────────────────────────────── */}
      <div className="px-5 space-y-4 mb-6">
        <div>
          <h2 className="font-heading font-bold text-lg mb-1">{video.title}</h2>
          <div className="flex items-center gap-3 text-[11px] text-txt-secondary">
            <span>{formatViews(video.view_count)} views</span>
            {video.published_at && (
              <>
                <span>&middot;</span>
                <span>
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
                <span>&middot;</span>
                <span>{formatDuration(video.duration)}</span>
              </>
            )}
          </div>
        </div>

        {/* Channel info */}
        {channel && (
          <Link
            href={`/live/channel/${channel.id}`}
            className="flex items-center gap-3 press"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-royal to-hc-purple flex items-center justify-center overflow-hidden shrink-0">
              {channel.avatar_url ? (
                <img
                  src={channel.avatar_url}
                  alt={channel.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gold font-heading font-bold text-sm">
                  {channelInitials(channel.name)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-heading font-bold text-[13px] truncate">
                  {channel.name}
                </h3>
                {Boolean((channel as unknown as Record<string, unknown>).is_verified) && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-cyan shrink-0">
                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )}
              </div>
              <div className="flex items-center gap-2">
                {badge && <Badge label={badge.label} variant={badge.variant} />}
                <span className="text-[10px] text-txt-secondary">
                  {(channel as unknown as Record<string, unknown>).follower_count as number || 0} followers
                </span>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-txt-secondary shrink-0">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        )}

        {/* Description */}
        {video.description && (
          <div className="bg-white/[0.03] rounded-xl p-4 border border-border-subtle">
            <p className="text-sm text-txt-secondary leading-relaxed">
              {video.description}
            </p>
          </div>
        )}

        {/* Video type badge */}
        {video.video_type !== "on_demand" && (
          <div className="flex gap-2">
            <Badge
              label={video.video_type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              variant={
                video.video_type === "featured"
                  ? "gold"
                  : video.video_type === "original"
                  ? "gold"
                  : video.video_type === "podcast"
                  ? "purple"
                  : video.video_type === "city_hall"
                  ? "cyan"
                  : "blue"
              }
              size="md"
            />
          </div>
        )}
      </div>

      {/* ── More From This Channel ──────────────────────── */}
      {moreVideos.length > 0 && (
        <div className="px-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-base">
              More from {channel?.name || "this channel"}
            </h3>
          </div>
          <div className="space-y-3">
            {moreVideos.map((v) => (
              <Card
                key={v.id}
                hover
                onClick={() => router.push(`/live/watch/${v.id}`)}
                className="cursor-pointer"
              >
                <div className="flex gap-3">
                  <div className="w-28 h-[72px] rounded-xl overflow-hidden shrink-0 relative bg-gradient-to-br from-midnight to-deep flex items-center justify-center group">
                    {v.thumbnail_url ? (
                      <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                    ) : v.mux_playback_id ? (
                      <img
                        src={`https://image.mux.com/${v.mux_playback_id}/thumbnail.webp?width=224&height=144&time=5`}
                        alt={v.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-white/20">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="white" className="ml-0.5">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </div>
                    </div>
                    {v.duration && (
                      <div className="absolute bottom-1 right-1 bg-black/70 rounded px-1 py-0.5 text-[9px] font-mono text-white">
                        {formatDuration(v.duration)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <h4 className="font-heading font-bold text-[13px] line-clamp-2 mb-1">
                      {v.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-txt-secondary">
                      <span>{formatViews(v.view_count)} views</span>
                      {v.published_at && (
                        <>
                          <span>&middot;</span>
                          <span>
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
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
