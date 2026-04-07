"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import type { AdDecision } from "@/lib/ads";
import { fetchAd, fireTracking } from "@/lib/ads";
import type { Podcast, Channel } from "@/types/database";

type PodcastWithChannel = Podcast & { channel?: Channel };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Ad Card (shared between pre-roll and mid-roll)
// ---------------------------------------------------------------------------

interface AdCardProps {
  ad: AdDecision;
  elapsed: number;
  canSkip: boolean;
  isAudioPlaying: boolean;
  onSkip: () => void;
  onCtaClick: () => void;
}

function AdCard({ ad, elapsed, canSkip, isAudioPlaying, onSkip, onCtaClick }: AdCardProps) {
  const remaining = Math.max(0, ad.duration - elapsed);

  return (
    <div className="rounded-2xl bg-card border border-border-subtle p-5 animate-fade-in">
      {/* Sponsored label */}
      <div className="flex items-center gap-2 mb-3">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-gold">
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-4.5c0 .28-.22.5-.5.5h-2c-.28 0-.5-.22-.5-.5V7c0-.28.22-.5.5-.5h2c.28 0 .5.22.5.5v5z"
            fill="currentColor"
            opacity="0.3"
          />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
        <span className="text-[10px] font-bold text-gold uppercase tracking-wider">
          Sponsored
        </span>
        <span className="text-[10px] text-txt-secondary ml-auto">
          Ad &bull; {remaining}s
        </span>
      </div>

      {/* Content row */}
      <div className="flex gap-3 mb-4">
        {/* Business image */}
        {ad.image_url && (
          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-border-subtle bg-white/5">
            <img
              src={ad.image_url}
              alt={ad.business_name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-[14px] mb-0.5 truncate">
            {ad.business_name}
          </h3>
          <p className="text-[12px] text-txt-secondary leading-relaxed line-clamp-2 mb-2">
            &ldquo;{ad.headline}&rdquo;
          </p>
          <button
            onClick={onCtaClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/20 text-gold text-[11px] font-bold press hover:bg-gold/15 transition-colors"
          >
            {ad.cta_text || "Learn More"}
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 6h8M7 2l4 4-4 4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Playing / Skip row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isAudioPlaying ? (
            <>
              {/* Animated sound bars */}
              <div className="flex items-end gap-0.5 h-3">
                <div className="w-0.5 bg-gold rounded-full animate-pulse" style={{ height: "8px", animationDelay: "0ms" }} />
                <div className="w-0.5 bg-gold rounded-full animate-pulse" style={{ height: "12px", animationDelay: "150ms" }} />
                <div className="w-0.5 bg-gold rounded-full animate-pulse" style={{ height: "6px", animationDelay: "300ms" }} />
                <div className="w-0.5 bg-gold rounded-full animate-pulse" style={{ height: "10px", animationDelay: "100ms" }} />
              </div>
              <span className="text-[11px] text-txt-secondary">Playing ad...</span>
            </>
          ) : (
            <span className="text-[11px] text-txt-secondary">Sponsored message</span>
          )}
        </div>

        {canSkip ? (
          <button
            onClick={onSkip}
            className="text-[11px] font-bold text-white/70 hover:text-white bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg transition-colors press"
          >
            Skip &raquo;
          </button>
        ) : (
          <span className="text-[10px] text-txt-secondary/50">
            Skip in {Math.max(0, 5 - elapsed)}s
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gold/60 rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${(elapsed / ad.duration) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Audio Player (with ad integration)
// ---------------------------------------------------------------------------

function AudioPlayer({ src, podcastId }: { src: string; podcastId: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const adAudioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dragging, setDragging] = useState(false);

  // Ad state
  const [prerollAd, setPrerollAd] = useState<AdDecision | null>(null);
  const [midrollAd, setMidrollAd] = useState<AdDecision | null>(null);
  const [showingPreroll, setShowingPreroll] = useState(false);
  const [showingMidroll, setShowingMidroll] = useState(false);
  const [adElapsed, setAdElapsed] = useState(0);
  const [canSkipAd, setCanSkipAd] = useState(false);
  const [adAudioPlaying, setAdAudioPlaying] = useState(false);
  const [prerollDone, setPrerollDone] = useState(false);
  const [midrollFetched, setMidrollFetched] = useState(false);
  const [midrollFired, setMidrollFired] = useState(false);

  const adTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const skipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prerollImpressionFired = useRef(false);
  const midrollImpressionFired = useRef(false);
  const listenCounted = useRef(false);

  // Fetch pre-roll ad on mount
  useEffect(() => {
    let cancelled = false;
    fetchAd("podcast_preroll", podcastId).then((ad) => {
      if (cancelled) return;
      if (ad) {
        setPrerollAd(ad);
        setShowingPreroll(true);
      } else {
        setPrerollDone(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [podcastId]);

  // Ad timer + skip logic
  useEffect(() => {
    if (!showingPreroll && !showingMidroll) return;

    const currentAd = showingPreroll ? prerollAd : midrollAd;
    if (!currentAd) return;

    // Fire impression — track per zone to prevent cross-contamination
    const ref = showingPreroll ? prerollImpressionFired : midrollImpressionFired;
    if (!ref.current) {
      ref.current = true;
      fireTracking(currentAd.impression_url);
    }

    // Play ad audio if available
    if (currentAd.audio_url && adAudioRef.current) {
      adAudioRef.current.src = currentAd.audio_url;
      adAudioRef.current.play().catch(() => {});
      setAdAudioPlaying(true);
    }

    setAdElapsed(0);
    setCanSkipAd(false);

    adTimerRef.current = setInterval(() => {
      setAdElapsed((prev) => {
        const next = prev + 1;
        if (next >= currentAd.duration) {
          if (adTimerRef.current) clearInterval(adTimerRef.current);
          completeAd();
          return currentAd.duration;
        }
        return next;
      });
    }, 1000);

    skipTimerRef.current = setTimeout(() => setCanSkipAd(true), 5000);

    return () => {
      if (adTimerRef.current) clearInterval(adTimerRef.current);
      if (skipTimerRef.current) clearTimeout(skipTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showingPreroll, showingMidroll]);

  const completeAd = useCallback(() => {
    if (adTimerRef.current) clearInterval(adTimerRef.current);
    if (skipTimerRef.current) clearTimeout(skipTimerRef.current);

    if (adAudioRef.current) {
      adAudioRef.current.pause();
      adAudioRef.current.src = "";
    }
    setAdAudioPlaying(false);

    if (showingPreroll) {
      setShowingPreroll(false);
      setPrerollDone(true);
    }
    if (showingMidroll) {
      setShowingMidroll(false);
      setMidrollFired(true);
      // Resume podcast
      audioRef.current?.play();
      setPlaying(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showingPreroll, showingMidroll]);

  const handleAdSkip = useCallback(() => {
    completeAd();
  }, [completeAd]);

  const handleAdCtaClick = useCallback(() => {
    const ad = showingPreroll ? prerollAd : midrollAd;
    if (!ad) return;
    fireTracking(ad.click_url);
    window.open(ad.cta_url, "_blank", "noopener");
  }, [showingPreroll, prerollAd, midrollAd]);

  // Main podcast audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => {
      if (!dragging) setCurrentTime(audio.currentTime);
    };
    const onDuration = () => setDuration(audio.duration || 0);
    const onEnded = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onDuration);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onDuration);
      audio.removeEventListener("ended", onEnded);
    };
  }, [dragging]);

  // Mid-roll: fetch at 40% so it's ready, trigger at 50%
  useEffect(() => {
    if (midrollFetched || !duration || duration < 60) return;
    const pct = currentTime / duration;

    if (pct >= 0.4 && !midrollFetched) {
      setMidrollFetched(true);
      fetchAd("podcast_midroll", podcastId).then((ad) => {
        if (ad) setMidrollAd(ad);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, duration, midrollFetched]);

  // Trigger mid-roll at 50%
  useEffect(() => {
    if (!midrollAd || midrollFired || !duration) return;
    const pct = currentTime / duration;

    if (pct >= 0.5) {
      // Pause podcast and show mid-roll
      audioRef.current?.pause();
      setPlaying(false);
      setShowingMidroll(true);
    }
  }, [currentTime, duration, midrollAd, midrollFired]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
      // Increment listen count on first play
      if (!listenCounted.current) {
        listenCounted.current = true;
        fetch(`/api/podcasts/${podcastId}/listen`, { method: "POST" }).catch(() => {});
      }
    }
    setPlaying(!playing);
  }, [playing, podcastId]);

  const seekTo = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      const bar = progressRef.current;
      if (!audio || !bar || !duration) return;
      const rect = bar.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      audio.currentTime = pct * duration;
      setCurrentTime(pct * duration);
    },
    [duration]
  );

  const skip = useCallback(
    (seconds: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
    },
    [duration]
  );

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const activeAd = showingPreroll ? prerollAd : showingMidroll ? midrollAd : null;

  return (
    <div>
      <audio ref={audioRef} src={src} preload="metadata" />
      <audio ref={adAudioRef} preload="none" />

      {/* Pre-roll or Mid-roll Ad Card */}
      {activeAd && (showingPreroll || showingMidroll) && (
        <div className="mb-4">
          <AdCard
            ad={activeAd}
            elapsed={adElapsed}
            canSkip={canSkipAd}
            isAudioPlaying={adAudioPlaying}
            onSkip={handleAdSkip}
            onCtaClick={handleAdCtaClick}
          />
        </div>
      )}

      {/* Main player - hidden during pre-roll, shown but disabled during mid-roll */}
      <div className={`rounded-2xl bg-card border border-border-subtle p-5 transition-opacity ${showingPreroll ? "opacity-30 pointer-events-none" : showingMidroll ? "opacity-40 pointer-events-none" : ""}`}>
        {/* Controls row */}
        <div className="flex items-center justify-center gap-6 mb-5">
          {/* Rewind 15s */}
          <button
            onClick={() => skip(-15)}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-txt-secondary hover:text-white hover:bg-white/10 transition-colors press"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.5 8c-3.6 0-6.5 2.9-6.5 6.5s2.9 6.5 6.5 6.5 6.5-2.9 6.5-6.5H21c0 4.7-3.8 8.5-8.5 8.5S4 19.7 4 15s3.8-8.5 8.5-8.5V3l5 4-5 4V8z" />
              <text x="9.5" y="17.5" fontSize="7" fontWeight="bold" fill="currentColor">
                15
              </text>
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            onClick={() => {
              if (!prerollDone) return; // Must finish pre-roll first
              togglePlay();
            }}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-gold to-gold-light flex items-center justify-center text-midnight shadow-lg shadow-gold/20 press hover:opacity-90 transition-opacity"
          >
            {playing ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="ml-0.5"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Forward 30s */}
          <button
            onClick={() => skip(30)}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-txt-secondary hover:text-white hover:bg-white/10 transition-colors press"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.5 8c3.6 0 6.5 2.9 6.5 6.5S15.1 21 11.5 21 5 18.1 5 14.5H3c0 4.7 3.8 8.5 8.5 8.5S20 19.2 20 14.5 16.2 6 11.5 6V2.5L6.5 6.5l5 4V8z" />
              <text x="8" y="17.5" fontSize="7" fontWeight="bold" fill="currentColor">
                30
              </text>
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div
          ref={progressRef}
          onClick={seekTo}
          className="relative h-2 bg-white/10 rounded-full cursor-pointer group mb-3"
        >
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold to-gold-light rounded-full transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-gold shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 7px)` }}
          />
        </div>

        {/* Time display */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-txt-secondary font-mono">
            {formatTime(currentTime)}
          </span>
          <span className="text-[11px] text-txt-secondary font-mono">
            {duration > 0 ? formatTime(duration) : "--:--"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Episode Page
// ---------------------------------------------------------------------------

export default function PodcastEpisodePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [podcast, setPodcast] = useState<PodcastWithChannel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPodcast() {
      try {
        const res = await fetch(`/api/podcasts/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setPodcast(data.podcast);
      } catch {
        setPodcast(null);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchPodcast();
  }, [id]);

  if (loading) {
    return (
      <div className="animate-fade-in pb-safe">
        <div className="px-5 pt-4">
          <div className="skeleton h-8 w-24 rounded-lg mb-6" />
          <div className="skeleton h-64 rounded-2xl mb-4" />
          <div className="skeleton h-6 w-3/4 rounded-lg mb-2" />
          <div className="skeleton h-4 w-1/2 rounded-lg mb-6" />
          <div className="skeleton h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!podcast) {
    return (
      <div className="px-5 text-center py-20 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-card mx-auto mb-4 flex items-center justify-center">
          <Icon name="podcast" size={28} className="text-txt-secondary" />
        </div>
        <p className="text-sm font-bold mb-1">Episode not found</p>
        <p className="text-xs text-txt-secondary mb-4">
          This episode may have been removed
        </p>
        <button
          onClick={() => router.push("/podcasts")}
          className="text-xs text-gold font-semibold press"
        >
          Back to Podcasts
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-safe">
      {/* ── Back Button ── */}
      <div className="px-5 pt-4 mb-4">
        <button
          onClick={() => router.push("/podcasts")}
          className="flex items-center gap-1.5 text-sm text-txt-secondary hover:text-white press transition-colors"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M10 3L5 8l5 5" />
          </svg>
          Back to Podcasts
        </button>
      </div>

      {/* ── Episode Header ── */}
      <div className="px-5 mb-6">
        <div className="flex gap-4 items-start">
          {/* Cover art */}
          <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-gold/10 to-hc-purple/10 flex items-center justify-center shrink-0 overflow-hidden relative border border-border-subtle">
            {podcast.thumbnail_url ? (
              <Image
                src={podcast.thumbnail_url}
                alt={podcast.title}
                fill
                className="object-cover rounded-2xl"
              />
            ) : (
              <Icon name="podcast" size={36} className="text-gold/60" />
            )}
          </div>

          {/* Title & meta */}
          <div className="flex-1 min-w-0 pt-1">
            <h1 className="font-heading text-xl font-bold leading-tight mb-2">
              {podcast.title}
            </h1>
            {podcast.channel?.name && (
              <p className="text-sm text-gold font-semibold mb-1">
                {podcast.channel.name}
              </p>
            )}
          </div>
        </div>

        {/* Meta badges */}
        <div className="flex items-center gap-2 flex-wrap mt-4">
          {podcast.episode_number && (
            <Badge
              label={`Episode ${podcast.episode_number}${podcast.season_number > 1 ? ` / Season ${podcast.season_number}` : ""}`}
              variant="gold"
            />
          )}
          <Badge
            label={podcast.channel?.name ?? "Podcast"}
            variant="purple"
          />
          {podcast.listen_count > 0 && (
            <Badge
              label={`${podcast.listen_count} listens`}
              variant="cyan"
            />
          )}
          {podcast.published_at && (
            <span className="text-[11px] text-txt-secondary">
              {formatDate(podcast.published_at)}
            </span>
          )}
        </div>
      </div>

      {/* ── Audio Player (with ad support) ── */}
      <div className="px-5 mb-6">
        <AudioPlayer src={podcast.audio_url} podcastId={podcast.id} />
      </div>

      {/* ── Description ── */}
      {podcast.description && (
        <div className="px-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full bg-gold" />
            <h2 className="font-heading font-bold text-base">About this Episode</h2>
          </div>
          <div className="rounded-2xl bg-card border border-border-subtle p-4">
            <p className="text-[13px] text-txt-secondary leading-relaxed whitespace-pre-wrap">
              {podcast.description}
            </p>
          </div>
        </div>
      )}

      {/* ── Transcript ── */}
      {podcast.transcript && (
        <div className="px-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full bg-cyan" />
            <h2 className="font-heading font-bold text-base">Transcript</h2>
          </div>
          <div className="rounded-2xl bg-card border border-border-subtle p-4 max-h-64 overflow-y-auto">
            <p className="text-[12px] text-txt-secondary leading-relaxed whitespace-pre-wrap">
              {podcast.transcript}
            </p>
          </div>
        </div>
      )}

      {/* ── Bottom spacer ── */}
      <div className="h-8" />
    </div>
  );
}
