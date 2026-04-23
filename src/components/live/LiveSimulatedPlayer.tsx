"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { ScheduledBroadcast, VideoAd } from "@/types/database";

const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), { ssr: false });

interface LiveSimulatedPlayerProps {
  schedule: ScheduledBroadcast[];
  ads: VideoAd[];
  userId: string | null;
  /**
   * Fires whenever the on-air content video changes (mount, schedule
   * advance, visibility re-sync). `null` during an ad slot so callers
   * can pause their derived state.
   */
  onVideoChange?: (videoId: string | null) => void;
}

// Find the index of the broadcast currently on-air based on wall-clock time.
function findCurrentIndex(schedule: ScheduledBroadcast[], now: number): number {
  for (let i = 0; i < schedule.length; i++) {
    const starts = new Date(schedule[i].starts_at).getTime();
    const ends = new Date(schedule[i].ends_at).getTime();
    if (now >= starts && now < ends) return i;
    if (now < starts) return Math.max(0, i - 1);
  }
  return schedule.length - 1;
}

function fmtAirtime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function LiveSimulatedPlayer({
  schedule,
  ads,
  userId,
  onVideoChange,
}: LiveSimulatedPlayerProps) {
  const [currentAd, setCurrentAd] = useState<VideoAd | null>(() => {
    const startIdx = findCurrentIndex(schedule, Date.now());
    if (schedule[startIdx]?.is_ad_slot && ads && ads.length > 0) {
      return ads[Math.floor(Math.random() * ads.length)];
    }
    return null;
  });
  const [phase, setPhase] = useState<"content" | "ad">(() => {
    const startIdx = findCurrentIndex(schedule, Date.now());
    return schedule[startIdx]?.is_ad_slot ? "ad" : "content";
  });
  const [currentIndex, setCurrentIndex] = useState(() =>
    findCurrentIndex(schedule, Date.now())
  );
  const [startTime, setStartTime] = useState(() => {
    if (!schedule.length) return 0;
    const entry = schedule[findCurrentIndex(schedule, Date.now())];
    const offset = (Date.now() - new Date(entry.starts_at).getTime()) / 1000;
    return Math.max(0, offset);
  });
  const mountedAt = useRef(Date.now());

  // When the tab returns to focus after backgrounding, re-sync to wall clock
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      // If we've been away more than 2 minutes, re-sync
      if (Date.now() - mountedAt.current < 120_000) return;
      const newIdx = findCurrentIndex(schedule, Date.now());
      if (newIdx !== currentIndex) {
        const entry = schedule[newIdx];
        const offset = (Date.now() - new Date(entry.starts_at).getTime()) / 1000;
        const isAd = entry.is_ad_slot;
        setCurrentIndex(newIdx);
        setStartTime(Math.max(0, offset));
        
        if (isAd && ads && ads.length > 0) {
          setCurrentAd(currentAd || ads[Math.floor(Math.random() * ads.length)]);
          setPhase("ad");
        } else {
          setPhase("content");
        }
        
        mountedAt.current = Date.now();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [schedule, currentIndex]);

  const currentBroadcast = schedule[currentIndex];
  const nextBroadcast = schedule[currentIndex + 1];

  // Pull video + show metadata off the current broadcast
  const currentVideo = currentBroadcast?.video;
  const currentShow = currentVideo?.show;

  // Notify parent whenever the on-air video changes so things like
  // the "Because you're watching" rail can refetch tied content.
  // During an ad slot we pass null to freeze derived state.
  useEffect(() => {
    if (!onVideoChange) return;
    onVideoChange(phase === "ad" ? null : currentVideo?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVideo?.id, phase]);

  const handleContentEnded = useCallback(() => {
    // Pick a random ad, then advance to next non-ad slot
    if (ads && ads.length > 0) {
      const randomAd = ads[Math.floor(Math.random() * ads.length)];
      setCurrentAd(randomAd);
      setPhase("ad");
    } else {
      advanceToNextContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ads]);

  const advanceToNextContent = useCallback(() => {
    // Skip over ad-slot broadcasts; land on the next content slot
    let idx = currentIndex + 1;
    while (idx < schedule.length && schedule[idx].is_ad_slot) idx++;
    if (idx >= schedule.length) {
      // Loop back to start if we've exhausted the schedule (48h window should cover it)
      idx = 0;
    }
    setCurrentIndex(idx);
    setStartTime(0);
    setPhase("content");
  }, [currentIndex, schedule]);

  const handleAdEnded = useCallback(() => {
    advanceToNextContent();
  }, [advanceToNextContent]);

  const upcoming = useMemo(() => {
    return schedule
      .slice(currentIndex + 1)
      .filter((b) => !b.is_ad_slot && b.video?.show)
      .slice(0, 5);
  }, [schedule, currentIndex]);

  if (!schedule.length || !currentBroadcast || !currentVideo?.mux_playback_id) {
    return (
      <div className="px-5 pt-4 mb-6">
        <div className="rounded-2xl border border-border-subtle bg-white/[0.04] p-8 text-center">
          <p className="font-heading text-lg text-txt-secondary">
            Culture TV Live is off the air.
          </p>
          <p className="text-xs text-txt-secondary mt-1">
            The schedule hasn&apos;t been generated yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-4 mb-6 animate-fade-in">
      {/* Branding strip */}
      <div className="flex items-center gap-2 mb-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-coral/15 border border-coral/30">
          <span className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
          <span className="font-heading text-[10px] font-bold text-coral tracking-[0.1em]">
            CULTURE TV LIVE
          </span>
        </div>
        {phase === "content" && currentShow && (
          <span className="text-[11px] text-txt-secondary">
            ON AIR · {currentShow.title}
            {currentBroadcast.ends_at && ` · ends ${fmtAirtime(currentBroadcast.ends_at)}`}
          </span>
        )}
        {phase === "ad" && (
          <span className="text-[11px] text-gold font-semibold">
            Commercial break
          </span>
        )}
      </div>

      {/* Player */}
      <div className="rounded-2xl overflow-hidden border border-border-subtle shadow-lg shadow-black/40 bg-black">
        {phase === "content" && (
          <MuxPlayer
            key={`content-${currentBroadcast.id}`}
            playbackId={currentVideo.mux_playback_id}
            streamType="on-demand"
            autoPlay
            accentColor="#F2A900"
            startTime={startTime}
            style={{ aspectRatio: "16/9", width: "100%" }}
            metadata={{
              video_title: currentVideo.title,
              viewer_user_id: userId || "anon",
            }}
            onEnded={handleContentEnded}
          />
        )}
        {phase === "ad" && currentAd?.mux_playback_id && (
          <MuxPlayer
            key={`ad-${currentBroadcast.id}`}
            playbackId={currentAd.mux_playback_id}
            streamType="on-demand"
            autoPlay
            accentColor="#F2A900"
            style={{ aspectRatio: "16/9", width: "100%" }}
            metadata={{
              video_title: `Ad: ${currentAd.title}`,
              viewer_user_id: userId || "anon",
            }}
            onEnded={handleAdEnded}
          />
        )}
      </div>

      {/* Metadata card (clickable for more info) */}
      {phase === "content" && currentShow && (
        <Link
          href={`/live/shows/${currentShow.slug}`}
          className="mt-3 flex items-center gap-3 p-3 rounded-xl border border-border-subtle bg-white/[0.04] hover:bg-white/[0.08] transition-colors press"
        >
          {currentShow.poster_url && (
            <div className="w-12 h-16 rounded-md overflow-hidden bg-white/[0.08] shrink-0">
              <img
                src={currentShow.poster_url}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-sm truncate">
              {currentShow.title}
            </p>
            {currentShow.tagline && (
              <p className="text-[11px] text-txt-secondary truncate">
                {currentShow.tagline}
              </p>
            )}
          </div>
          <span className="text-[11px] text-gold font-semibold shrink-0">
            More info →
          </span>
        </Link>
      )}

      {/* Up Next */}
      {upcoming.length > 0 && (
        <div className="mt-4">
          <h3 className="font-heading font-bold text-[11px] tracking-wider text-txt-secondary uppercase mb-2">
            Up Next
          </h3>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-1 px-1">
            {upcoming.map((b) => (
              <Link
                key={b.id}
                href={b.video?.show ? `/live/shows/${b.video.show.slug}` : "#"}
                className="shrink-0 w-[140px] press"
              >
                <div className="aspect-[2/3] rounded-lg overflow-hidden bg-white/[0.06] mb-1.5">
                  {b.video?.show?.poster_url ? (
                    <img
                      src={b.video.show.poster_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                <p className="text-[11px] text-gold font-semibold">
                  {fmtAirtime(b.starts_at)}
                </p>
                <p className="text-[12px] font-semibold truncate">
                  {b.video?.show?.title || b.video?.title}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
