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

      {/* Play icon when paused — gold square with ink triangle */}
      {!playing && active && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: 64,
              height: 64,
              background: "var(--gold-c)",
              border: "3px solid var(--paper)",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--ink-strong)">
              <polygon points="6,4 20,12 6,20" />
            </svg>
          </div>
        </button>
      )}

      {/* Progress bar — gold on ink-tinted track */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: 2, background: "rgba(245,239,224,0.18)" }}
      >
        <div
          className="h-full transition-all"
          style={{ width: `${progress * 100}%`, background: "var(--gold-c)" }}
        />
      </div>

      {/* Left: caption + author over ink gradient */}
      <div
        className="absolute left-0 right-16 bottom-0 p-4 pb-6 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(26,21,18,0.4) 35%, rgba(26,21,18,0.85) 100%)",
        }}
      >
        {author && (
          <Link
            href={author.handle ? `/user/${author.handle}` : "#"}
            className="inline-flex items-center gap-2 pointer-events-auto mb-2"
          >
            {author.avatar_url ? (
              <img
                src={author.avatar_url}
                alt=""
                className="w-8 h-8 rounded-full object-cover"
                style={{ border: "2px solid var(--paper)" }}
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: "var(--gold-c)",
                  color: "var(--ink-strong)",
                  border: "2px solid var(--paper)",
                  fontFamily: "var(--font-archivo), Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: 12,
                }}
              >
                {author.display_name.charAt(0)}
              </div>
            )}
            <span
              className="c-card-t"
              style={{ color: "var(--paper)", fontSize: 13 }}
            >
              {author.display_name}
            </span>
            {author.verification_status === "verified" && (
              <Icon name="verified" size={12} style={{ color: "var(--gold-c)" }} />
            )}
            {reel.is_story && (
              <Badge label="STORY" variant="gold" />
            )}
          </Link>
        )}
        {reel.caption && (
          <p
            className="c-serif-it line-clamp-3"
            style={{ color: "var(--paper)", fontSize: 13, lineHeight: 1.4 }}
          >
            {reel.caption}
          </p>
        )}
      </div>

      {/* Right action column */}
      <div className="absolute right-2 bottom-20 flex flex-col items-center gap-5">
        <ReelEngagementBar
          reelId={reel.id}
          authorId={reel.author_id}
          initialReactionCounts={reel.reaction_counts || {}}
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
          <div
            className="flex items-center justify-center"
            style={{
              width: 44,
              height: 44,
              background: "var(--ink-strong)",
              border: "2px solid var(--paper)",
              color: "var(--paper)",
            }}
          >
            {muted ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
