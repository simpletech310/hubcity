"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";
import type { Reel, ReactionEmoji } from "@/types/database";
import { REACTION_EMOJI_MAP } from "@/lib/constants";
import ReelEngagementBar from "./ReelEngagementBar";

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
  /** Current user id (null = signed out). Enables reactions/comments. */
  userId?: string | null;
  /** Emoji reactions the signed-in user has already applied to this reel. */
  userReactions?: ReactionEmoji[];
}

export default function ReelPlayer({
  reel,
  active,
  muted,
  onToggleMute,
  onEnded,
  onAutoplayBlocked,
  userId = null,
  userReactions = [],
}: ReelPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const viewSentRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
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

  // Double-tap heart burst — triggers a heart react on the unified endpoint
  // so the overlay's ReelEngagementBar realtime subscription picks it up.
  const doubleTapHeart = async () => {
    if (!userId) return;
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 900);
    try {
      await fetch(`/api/reels/${reel.id}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji: "heart" }),
      });
    } catch {
      // silent — realtime would reconcile on next tick
    }
  };

  const author = reel.author;

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        src={reel.video_url.includes("#") ? reel.video_url : `${reel.video_url}#t=0.1`}
        poster={reel.poster_url ?? undefined}
        className="w-full h-full object-contain"
        playsInline
        muted={muted}
        preload="metadata"
        onClick={togglePlay}
        onDoubleClick={doubleTapHeart}
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

      {/* Right: action column — emoji reactions + comments + share */}
      <div className="absolute right-2 bottom-20 flex flex-col items-center gap-5">
        <ReelEngagementBar
          reelId={reel.id}
          authorId={reel.author_id}
          initialReactionCounts={reactionCounts}
          initialCommentCount={reel.comment_count}
          initialUserReactions={userReactions}
          userId={userId}
          variant="rail"
        />

        <button
          onClick={onToggleMute}
          className="flex flex-col items-center gap-1 press"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center hover:border-gold/40 transition-colors">
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
