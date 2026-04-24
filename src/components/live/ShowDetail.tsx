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
          {/* Player container — Mux iframe stays dark (video canvas) */}
          <div
            className="overflow-hidden relative"
            style={{ border: "2px solid var(--rule-strong-c)" }}
          >
            <MuxPlayer
              playbackId={playing.mux_playback_id}
              streamType="on-demand"
              autoPlay
              accentColor="#F2A900"
              style={{ aspectRatio: "16/9", width: "100%" }}
              metadata={{ video_title: playing.title, viewer_user_id: userId || "anon" }}
            />
            {showPaywall && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
                <div
                  className="text-center max-w-[260px] p-5"
                  style={{
                    background: "var(--paper)",
                    border: "3px solid var(--rule-strong-c)",
                    color: "var(--ink-strong)",
                  }}
                >
                  <h3 className="c-card-t mb-2" style={{ fontSize: 16 }}>Premium episode</h3>
                  <p className="c-body-sm mb-4">
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
                    className="c-btn c-btn-primary press"
                  >
                    UNLOCK FOR ${((playing.price_cents || 0) / 100).toFixed(2)}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="px-5 space-y-2">
          <h1 className="c-hero" style={{ fontSize: 24 }}>{playing.title}</h1>
          <p className="c-body">{playing.description}</p>
          <button
            onClick={() => {
              setPlaying(null);
              setPhase("idle");
            }}
            className="mt-2 c-meta press"
            style={{ color: "var(--ink-strong)" }}
          >
            ← BACK TO SHOW
          </button>
        </div>
      </div>
    );
  }

  // Show landing page
  return (
    <div className="px-5">
      {/* Poster — ink canvas (intentional: this is framed artwork) */}
      <div
        className="overflow-hidden aspect-[2/3] max-w-[240px] mx-auto mb-5"
        style={{
          background: "var(--ink-strong)",
          border: "3px solid var(--rule-strong-c)",
        }}
      >
        {show.poster_url ? (
          <img src={show.poster_url} alt={show.title} className="w-full h-full object-cover" />
        ) : null}
      </div>

      <div className="text-center mb-6">
        {show.channel && (
          <Link
            href="/live"
            className="inline-block c-kicker mb-2"
            style={{ fontSize: 11, color: "var(--gold-c)" }}
          >
            {show.channel.name}
          </Link>
        )}
        <h1 className="c-hero mb-2" style={{ fontSize: 28 }}>{show.title}</h1>
        {show.tagline && (
          <p className="c-serif-it mb-3" style={{ fontSize: 15 }}>{show.tagline}</p>
        )}
        {show.description && (
          <p className="c-body max-w-md mx-auto">
            {show.description}
          </p>
        )}
        {show.runtime_minutes && (
          <p className="c-meta mt-3">
            {show.runtime_minutes} MIN · {(show.format || "Series").toUpperCase()}
          </p>
        )}
      </div>

      <div className="mb-6">
        {episodes.length === 0 ? (
          <p className="c-body text-center">
            No episodes published yet. Check back soon.
          </p>
        ) : episodes.length === 1 ? (
          <button
            onClick={() => startPlayback(episodes[0])}
            className="c-btn c-btn-accent w-full flex items-center justify-center gap-2 press"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            WATCH NOW
          </button>
        ) : (
          <div className="space-y-3">
            <h3 className="c-card-t mb-2" style={{ fontSize: 13 }}>EPISODES</h3>
            {episodes.map((ep) => (
              <button
                key={ep.id}
                onClick={() => startPlayback(ep)}
                className="w-full flex items-center gap-3 p-3 transition-colors press text-left"
                style={{
                  background: "var(--paper)",
                  border: "2px solid var(--rule-strong-c)",
                  color: "var(--ink-strong)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 c-card-t"
                  style={{
                    background: "var(--gold-c)",
                    color: "var(--ink-strong)",
                    border: "2px solid var(--rule-strong-c)",
                    fontSize: 12,
                  }}
                >
                  {ep.episode_number || "•"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="c-card-t truncate" style={{ fontSize: 13 }}>{ep.title}</p>
                  {ep.duration && (
                    <p className="c-meta">
                      {Math.round(ep.duration / 60)} min
                    </p>
                  )}
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0" style={{ color: "var(--gold-c)" }}>
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
