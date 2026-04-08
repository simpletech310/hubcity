"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import type { CityHighlight } from "@/types/highlights";
import type { ReactionEmoji } from "@/types/database";
import HighlightReactions from "./HighlightReactions";

interface HighlightViewerProps {
  highlights: CityHighlight[];
  initialIndex: number;
  onClose: () => void;
  onViewed: (id: string) => void;
  userId: string | null;
  userReactions: Record<string, ReactionEmoji[]>;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Calculate pixel dimensions to fit media inside viewport without object-fit */
function calculateFitDimensions(
  mediaW: number,
  mediaH: number,
  viewportW: number,
  viewportH: number
): { width: number; height: number } {
  const scale = Math.min(viewportW / mediaW, viewportH / mediaH);
  return {
    width: Math.round(mediaW * scale),
    height: Math.round(mediaH * scale),
  };
}

export default function HighlightViewer({
  highlights,
  initialIndex,
  onClose,
  onViewed,
  userId,
  userReactions,
}: HighlightViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(false);
  const [mediaDims, setMediaDims] = useState<{ width: number; height: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const current = highlights[currentIndex];
  const author = current?.author;

  // Viewport dimensions for media sizing (leave space for UI overlays)
  const getViewport = useCallback(() => {
    const w = Math.min(window.innerWidth, 430);
    const h = window.innerHeight - 80; // Top bar + bottom caption space
    return { w, h };
  }, []);

  // Calculate media dimensions from stored values or from loaded media
  useEffect(() => {
    if (!current) return;
    if (current.media_width && current.media_height) {
      const vp = getViewport();
      setMediaDims(
        calculateFitDimensions(current.media_width, current.media_height, vp.w, vp.h)
      );
    } else {
      setMediaDims(null); // Will be set by onLoad/onLoadedMetadata
    }
  }, [currentIndex, current, getViewport]);

  // Mark as viewed
  useEffect(() => {
    if (current) {
      onViewed(current.id);
      // Fire view API (non-blocking)
      fetch(`/api/city-highlights/${current.id}/view`, { method: "POST" }).catch(() => {});
    }
  }, [current, onViewed]);

  // Auto-play video with sound; fall back to muted
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = 0;
    vid.volume = 1.0;
    vid.muted = false;
    setIsMuted(false);
    vid.play().catch(() => {
      vid.muted = true;
      setIsMuted(true);
      vid.play().catch(() => {});
    });
  }, [currentIndex]);

  const toggleMute = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = !vid.muted;
    setIsMuted(vid.muted);
  }, []);

  const goNext = useCallback(() => {
    if (currentIndex < highlights.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onClose();
    }
  }, [currentIndex, highlights.length, onClose]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goNext, goPrev]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!current) return null;

  const handleTap = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 3) {
      goPrev();
    } else {
      goNext();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;

    if (dy > 100 && Math.abs(dx) < 80) {
      onClose();
      return;
    }

    if (Math.abs(dx) > 50 && Math.abs(dy) < 80) {
      if (dx < 0) goNext();
      else goPrev();
    }
  };

  /** Fallback: read dimensions from loaded media */
  const handleVideoMeta = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (mediaDims) return; // Already have stored dims
    const vid = e.currentTarget;
    const vp = getViewport();
    setMediaDims(calculateFitDimensions(vid.videoWidth, vid.videoHeight, vp.w, vp.h));
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (mediaDims) return;
    const img = e.currentTarget;
    const vp = getViewport();
    setMediaDims(calculateFitDimensions(img.naturalWidth, img.naturalHeight, vp.w, vp.h));
  };

  // Media style: explicit pixels if we have dims, otherwise auto sizing as fallback
  const mediaStyle: React.CSSProperties = mediaDims
    ? { width: `${mediaDims.width}px`, height: `${mediaDims.height}px` }
    : { maxWidth: "100vw", maxHeight: "100vh", width: "auto", height: "auto" };

  return (
    <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-[env(safe-area-inset-top,12px)] left-0 right-0 z-20 flex gap-1 px-3 pt-2">
        {highlights.map((_, i) => (
          <div key={i} className="flex-1 h-[2px] rounded-full overflow-hidden bg-white/20">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                i <= currentIndex ? "w-full bg-gold" : "w-0 bg-gold"
              }`}
            />
          </div>
        ))}
      </div>

      {/* Author info */}
      <div className="absolute top-[calc(env(safe-area-inset-top,12px)+20px)] left-0 right-0 z-20 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          {author?.avatar_url ? (
            <Image
              src={author.avatar_url}
              alt={author.display_name}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-white/20"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-royal to-hc-purple flex items-center justify-center text-gold font-heading font-bold text-xs ring-2 ring-white/20">
              {author?.display_name?.charAt(0) || "?"}
            </div>
          )}
          <div>
            <p className="text-[13px] font-semibold text-white leading-tight">
              {author?.display_name || "Unknown"}
            </p>
            <p className="text-[10px] text-white/50">{timeAgo(current.created_at)}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white press"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Media */}
      <div
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {current.media_type === "video" ? (
          <video
            key={current.id}
            ref={videoRef}
            src={current.media_url}
            autoPlay
            playsInline
            loop
            preload="auto"
            controls={false}
            onLoadedMetadata={handleVideoMeta}
            style={mediaStyle}
          />
        ) : current.media_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={current.id}
            src={current.media_url}
            alt={current.caption || "Highlight"}
            onLoad={handleImageLoad}
            style={mediaStyle}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-[#1a1510] to-black">
            <p className="text-white/50 text-sm">No media</p>
          </div>
        )}
      </div>

      {/* Mute/unmute button */}
      {current.media_type === "video" && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          className="absolute bottom-[calc(env(safe-area-inset-bottom,20px)+140px)] right-5 z-20 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white press"
        >
          {isMuted ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
            </svg>
          )}
        </button>
      )}

      {/* Reactions overlay */}
      <div className="absolute bottom-[calc(env(safe-area-inset-bottom,20px)+90px)] left-0 right-0 z-20 px-5">
        <HighlightReactions
          highlightId={current.id}
          reactionCounts={current.reaction_counts || {}}
          userReactions={userReactions[current.id] || []}
          userId={userId}
        />
      </div>

      {/* Link button */}
      {current.link_url && (
        <div className="absolute bottom-[calc(env(safe-area-inset-bottom,20px)+60px)] left-0 right-0 z-20 px-5">
          <a
            href={current.link_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 press hover:bg-white/25 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/70">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
            </svg>
            <span className="text-[12px] font-semibold text-white">
              {current.link_label || "Learn More"}
            </span>
          </a>
        </div>
      )}

      {/* Caption overlay */}
      {current.caption && (
        <div className="absolute bottom-[env(safe-area-inset-bottom,20px)] left-0 right-0 z-20 px-5 pb-6">
          <div className="bg-black/50 backdrop-blur-sm rounded-xl px-4 py-3">
            <p className="text-[13px] text-white leading-relaxed">{current.caption}</p>
          </div>
        </div>
      )}
    </div>
  );
}
