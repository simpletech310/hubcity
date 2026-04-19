"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import PreRollAd from "./PreRollAd";
import type { ChannelVideo, Show, VideoAd } from "@/types/database";

const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), { ssr: false });

interface ShowDetailProps {
  show: Show;
  episodes: ChannelVideo[];
  walmartAd: VideoAd | null;
  userId: string | null;
  purchasedVideoIds: string[];
}

const PPV_ENABLED = process.env.NEXT_PUBLIC_FEATURE_PPV === "true";

export default function ShowDetail({
  show,
  episodes,
  walmartAd,
  userId,
  purchasedVideoIds,
}: ShowDetailProps) {
  const [playing, setPlaying] = useState<ChannelVideo | null>(null);
  const [phase, setPhase] = useState<"idle" | "ad" | "content">("idle");
  const [pendingVideo, setPendingVideo] = useState<ChannelVideo | null>(null);

  const startPlayback = useCallback(
    (video: ChannelVideo) => {
      if (!video.mux_playback_id) return;
      if (walmartAd?.mux_playback_id) {
        setPendingVideo(video);
        setPhase("ad");
      } else {
        setPlaying(video);
        setPhase("content");
      }
    },
    [walmartAd]
  );

  const handleAdDone = useCallback(() => {
    if (pendingVideo) {
      setPlaying(pendingVideo);
      setPendingVideo(null);
    }
    setPhase("content");
  }, [pendingVideo]);

  // Pre-roll ad view
  if (phase === "ad" && walmartAd?.mux_playback_id) {
    return (
      <PreRollAd
        playbackId={walmartAd.mux_playback_id}
        ctaText={walmartAd.cta_text || "Shop Now"}
        ctaUrl={walmartAd.cta_url || "#"}
        businessName={walmartAd.title}
        adId={walmartAd.id}
        onComplete={handleAdDone}
        onSkip={handleAdDone}
      />
    );
  }

  // Active playback
  if (phase === "content" && playing?.mux_playback_id) {
    const isPremium = playing.is_premium && !purchasedVideoIds.includes(playing.id);
    const showPaywall = PPV_ENABLED && isPremium;

    return (
      <div className="animate-fade-in">
        <div className="px-5 mb-4">
          <div className="rounded-2xl overflow-hidden border border-border-subtle shadow-lg shadow-black/40 relative">
            <MuxPlayer
              playbackId={playing.mux_playback_id}
              streamType="on-demand"
              autoPlay
              accentColor="#F2A900"
              style={{ aspectRatio: "16/9", width: "100%" }}
              metadata={{ video_title: playing.title, viewer_user_id: userId || "anon" }}
            />
            {showPaywall && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="text-center max-w-[260px]">
                  <h3 className="font-heading font-bold text-lg mb-2">Premium episode</h3>
                  <p className="text-sm text-txt-secondary mb-4">
                    Unlock the full episode and support the creator.
                  </p>
                  <button
                    onClick={async () => {
                      const res = await fetch("/api/videos/purchase", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ video_id: playing.id }),
                      });
                      const data = await res.json();
                      alert(data.message || "Coming soon");
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gold text-midnight font-heading text-sm font-bold press"
                  >
                    Unlock for $
                    {((playing.price_cents || 0) / 100).toFixed(2)}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="px-5 space-y-2">
          <h1 className="font-heading font-bold text-xl">{playing.title}</h1>
          <p className="text-sm text-txt-secondary">{playing.description}</p>
          <button
            onClick={() => {
              setPlaying(null);
              setPhase("idle");
            }}
            className="mt-2 text-[12px] text-gold font-semibold press"
          >
            ← Back to show
          </button>
        </div>
      </div>
    );
  }

  // Show landing page
  return (
    <div className="px-5">
      <div className="rounded-2xl overflow-hidden aspect-[2/3] max-w-[240px] mx-auto mb-5 bg-white/[0.06]">
        {show.poster_url ? (
          <img src={show.poster_url} alt={show.title} className="w-full h-full object-cover" />
        ) : null}
      </div>

      <div className="text-center mb-6">
        {show.channel && (
          <Link
            href="/live"
            className="inline-block text-[11px] uppercase tracking-wider text-gold font-semibold mb-2"
          >
            {show.channel.name}
          </Link>
        )}
        <h1 className="font-heading font-bold text-2xl mb-2">{show.title}</h1>
        {show.tagline && (
          <p className="font-display italic text-warm-gray text-[15px] mb-3">{show.tagline}</p>
        )}
        {show.description && (
          <p className="text-sm text-txt-secondary leading-relaxed max-w-md mx-auto">
            {show.description}
          </p>
        )}
        {show.runtime_minutes && (
          <p className="text-[11px] text-txt-secondary mt-3">
            {show.runtime_minutes} min · {show.format || "Series"}
          </p>
        )}
      </div>

      <div className="mb-6">
        {episodes.length === 0 ? (
          <p className="text-center text-sm text-txt-secondary">
            No episodes published yet. Check back soon.
          </p>
        ) : episodes.length === 1 ? (
          <button
            onClick={() => startPlayback(episodes[0])}
            className="w-full flex items-center justify-center gap-2 bg-gold text-midnight px-6 py-4 rounded-2xl font-heading text-[15px] font-bold press shadow-lg shadow-gold/20"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Watch Now
          </button>
        ) : (
          <div className="space-y-3">
            <h3 className="font-heading font-bold text-sm mb-2">Episodes</h3>
            {episodes.map((ep) => (
              <button
                key={ep.id}
                onClick={() => startPlayback(ep)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border-subtle bg-white/[0.04] hover:bg-white/[0.08] transition-colors press text-left"
              >
                <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-heading text-[13px] font-bold shrink-0">
                  {ep.episode_number || "•"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-sm truncate">{ep.title}</p>
                  {ep.duration && (
                    <p className="text-[11px] text-txt-secondary">
                      {Math.round(ep.duration / 60)} min
                    </p>
                  )}
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-gold shrink-0">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
