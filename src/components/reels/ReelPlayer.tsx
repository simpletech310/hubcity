"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";
import type { Reel, ReactionEmoji } from "@/types/database";
import { REACTION_EMOJI_MAP } from "@/lib/constants";

interface ReelPlayerProps {
  reel: Reel;
  /** Whether this reel is the currently active one in the viewer */
  active: boolean;
  /** Global mute state shared across the viewer */
  muted: boolean;
  onToggleMute: () => void;
  /** Called when the video ends naturally — viewer uses this to auto-advance */
  onEnded?: () => void;
  /**
   * Called when the browser blocks unmuted autoplay so the viewer can force
   * muted=true and show a "tap to unmute" prompt.
   */
  onAutoplayBlocked?: () => void;
}

function fmtCount(n: number | null | undefined) {
  const v = n ?? 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return `${v}`;
}

export default function ReelPlayer({
  reel,
  active,
  muted,
  onToggleMute,
  onEnded,
  onAutoplayBlocked,
}: ReelPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const viewSentRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(reel.like_count);
  const [reactionCounts, setReactionCounts] = useState(reel.reaction_counts);
  const [showHeart, setShowHeart] = useState(false);

  // Play / pause based on active state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active) {
      video.currentTime = 0;
      video.muted = muted;
      const attempt = async () => {
        try {
          await video.play();
          setPlaying(true);
        } catch {
          // Browser blocked unmuted autoplay — retry muted so the reel
          // still plays, and tell the viewer to surface an unmute hint.
          if (!video.muted) {
            video.muted = true;
            onAutoplayBlocked?.();
            try {
              await video.play();
              setPlaying(true);
            } catch {
              setPlaying(false);
            }
          } else {
            setPlaying(false);
          }
        }
      };
      attempt();
      // fire view once per activation
      if (!viewSentRef.current) {
        viewSentRef.current = true;
        fetch(`/api/reels/${reel.id}/view`, { method: "POST" }).catch(() => {});
      }
    } else {
      video.pause();
      setPlaying(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, reel.id]);

  // Keep mute in sync with external state changes
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  // Progress tracker
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTime = () => {
      if (video.duration) setProgress(video.currentTime / video.duration);
    };
    video.addEventListener("timeupdate", onTime);
    return () => video.removeEventListener("timeupdate", onTime);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  const react = async (emoji: ReactionEmoji) => {
    // optimistic
    setReactionCounts((curr) => {
      const next = { ...curr };
      next[emoji] = (next[emoji] ?? 0) + 1;
      return next;
    });
    if (emoji === "heart") {
      setLiked(true);
      setLikeCount((c) => c + 1);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 900);
    }
    try {
      const res = await fetch(`/api/reels/${reel.id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (!res.ok) throw new Error();
      const body = await res.json();
      setReactionCounts(body.counts ?? {});
      setLikeCount(body.like_count ?? 0);
      setLiked(body.added && emoji === "heart");
    } catch {
      // roll back on failure
      setReactionCounts((curr) => {
        const next = { ...curr };
        next[emoji] = Math.max(0, (next[emoji] ?? 1) - 1);
        return next;
      });
      if (emoji === "heart") {
        setLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
      }
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/reels/${reel.id}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: reel.caption ?? "Reel",
          text: reel.caption ?? undefined,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // user cancelled — ignore
    }
  };

  const author = reel.author;

  return (
    <div
      className="relative w-full h-full bg-black snap-start flex items-center justify-center overflow-hidden"
      style={{ height: "100%" }}
    >
      <video
        ref={videoRef}
        src={reel.video_url}
        poster={reel.poster_url ?? undefined}
        className="w-full h-full object-contain"
        playsInline
        muted={muted}
        preload="metadata"
        onClick={togglePlay}
        onDoubleClick={() => react("heart")}
        onEnded={() => onEnded?.()}
      />

      {/* Double-tap heart burst */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-ping-once">
          <span className="text-8xl drop-shadow-2xl">
            {REACTION_EMOJI_MAP.heart}
          </span>
        </div>
      )}

      {/* Play icon when paused */}
      {!playing && active && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <polygon points="6,4 20,12 6,20" />
            </svg>
          </div>
        </button>
      )}

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
        <div
          className="h-full bg-white/80 transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Left: caption + author */}
      <div className="absolute left-0 right-16 bottom-0 p-4 pb-6 pointer-events-none">
        {author && (
          <Link
            href={author.handle ? `/user/${author.handle}` : "#"}
            className="inline-flex items-center gap-2 pointer-events-auto mb-2"
          >
            {author.avatar_url ? (
              <img
                src={author.avatar_url}
                alt=""
                className="w-8 h-8 rounded-full object-cover border border-white/20"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-xs font-bold">
                {author.display_name.charAt(0)}
              </div>
            )}
            <span className="text-[13px] font-bold text-white drop-shadow">
              {author.display_name}
            </span>
            {author.verification_status === "verified" && (
              <Icon name="verified" size={12} className="text-cyan" />
            )}
            {reel.is_story && (
              <Badge label="Story" variant="purple" />
            )}
          </Link>
        )}
        {reel.caption && (
          <p className="text-[13px] text-white/95 line-clamp-3 drop-shadow leading-snug">
            {reel.caption}
          </p>
        )}
      </div>

      {/* Right: action column */}
      <div className="absolute right-2 bottom-20 flex flex-col items-center gap-4">
        <button
          onClick={() => react("heart")}
          className="flex flex-col items-center gap-1 press"
          aria-label="Like"
        >
          <div
            className={`w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center ${
              liked ? "bg-coral/90" : "bg-black/40"
            }`}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill={liked ? "white" : "none"}
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          </div>
          <span className="text-[11px] font-bold text-white drop-shadow">
            {fmtCount(likeCount)}
          </span>
        </button>

        <button
          onClick={() => react("fire")}
          className="flex flex-col items-center gap-1 press"
          aria-label="Fire reaction"
        >
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-2xl">
            {REACTION_EMOJI_MAP.fire}
          </div>
          <span className="text-[11px] font-bold text-white drop-shadow">
            {fmtCount(reactionCounts.fire)}
          </span>
        </button>

        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-1 press"
          aria-label="Share"
        >
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
            <Icon name="share" size={20} className="text-white" />
          </div>
          <span className="text-[11px] font-bold text-white drop-shadow">
            Share
          </span>
        </button>

        <button
          onClick={onToggleMute}
          className="flex flex-col items-center gap-1 press"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
            {muted ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
              </svg>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
