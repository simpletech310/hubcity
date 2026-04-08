"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";

interface Highlight {
  id: string;
  body: string;
  video_url: string | null;
  image_url: string | null;
  created_at: string;
  author: {
    id: string;
    display_name: string;
    handle: string | null;
    avatar_url: string | null;
    role: string;
  } | null;
}

interface HighlightViewerProps {
  highlights: Highlight[];
  initialIndex: number;
  onClose: () => void;
  onViewed: (id: string) => void;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function HighlightViewer({
  highlights,
  initialIndex,
  onClose,
  onViewed,
}: HighlightViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const current = highlights[currentIndex];
  const author = current?.author;

  // Mark as viewed
  useEffect(() => {
    if (current) {
      onViewed(current.id);
    }
  }, [current, onViewed]);

  // Auto-play video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [currentIndex]);

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

    // Swipe down to dismiss
    if (dy > 100 && Math.abs(dx) < 80) {
      onClose();
      return;
    }

    // Swipe left/right
    if (Math.abs(dx) > 50 && Math.abs(dy) < 80) {
      if (dx < 0) goNext();
      else goPrev();
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-[env(safe-area-inset-top,12px)] left-0 right-0 z-20 flex gap-1 px-3 pt-2">
        {highlights.map((_, i) => (
          <div key={i} className="flex-1 h-[2px] rounded-full overflow-hidden bg-white/20">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                i < currentIndex
                  ? "w-full bg-gold"
                  : i === currentIndex
                    ? "w-full bg-gold"
                    : "w-0 bg-gold"
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
        className="absolute inset-0 flex items-center justify-center"
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {current.video_url ? (
          <video
            ref={videoRef}
            src={current.video_url}
            autoPlay
            playsInline
            loop
            className="w-full h-full object-contain"
          />
        ) : current.image_url ? (
          <Image
            src={current.image_url}
            alt={current.body || "Highlight"}
            fill
            className="object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-[#1a1510] to-black">
            <p className="text-white/50 text-sm">No media</p>
          </div>
        )}
      </div>

      {/* Caption overlay */}
      {current.body && current.body !== "City Highlight" && (
        <div className="absolute bottom-[env(safe-area-inset-bottom,20px)] left-0 right-0 z-20 px-5 pb-6">
          <div className="bg-black/50 backdrop-blur-sm rounded-xl px-4 py-3">
            <p className="text-[13px] text-white leading-relaxed">{current.body}</p>
          </div>
        </div>
      )}
    </div>
  );
}
