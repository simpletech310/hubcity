"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReelPlayer from "./ReelPlayer";
import Icon from "@/components/ui/Icon";
import type { Reel } from "@/types/database";

interface ReelsViewerProps {
  reels: Reel[];
  /** Optional index to start at */
  initialIndex?: number;
  /** If true, shows a close button in the top-right */
  onClose?: () => void;
}

export default function ReelsViewer({
  reels,
  initialIndex = 0,
  onClose,
}: ReelsViewerProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  // Default: try sound on. ReelPlayer flips this to true via
  // onAutoplayBlocked if the browser refuses unmuted autoplay.
  const [muted, setMuted] = useState(false);
  const [showUnmuteHint, setShowUnmuteHint] = useState(false);

  // Scroll to initial index on mount
  useEffect(() => {
    const el = itemRefs.current[initialIndex];
    if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // IntersectionObserver to pick the active reel
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.65) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            if (!Number.isNaN(idx)) setActiveIndex(idx);
          }
        }
      },
      { root, threshold: [0.65, 0.9] }
    );

    for (const node of itemRefs.current) {
      if (node) observer.observe(node);
    }
    return () => observer.disconnect();
  }, [reels.length]);

  const setItemRef = useCallback(
    (idx: number) => (node: HTMLDivElement | null) => {
      itemRefs.current[idx] = node;
    },
    []
  );

  const advance = useCallback(() => {
    const next = activeIndex + 1;
    if (next >= reels.length) {
      // Wrap to the first reel so playback continues indefinitely,
      // matching Facebook / Instagram Reels behaviour.
      const first = itemRefs.current[0];
      if (first) first.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const el = itemRefs.current[next];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeIndex, reels.length]);

  const handleAutoplayBlocked = useCallback(() => {
    setMuted(true);
    setShowUnmuteHint(true);
  }, []);

  const enableSound = useCallback(() => {
    setMuted(false);
    setShowUnmuteHint(false);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => !m);
    setShowUnmuteHint(false);
  }, []);

  if (reels.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8 text-white/60">
        <Icon name="video" size={40} className="text-white/20 mb-3" />
        <p className="text-base font-semibold">No reels yet</p>
        <p className="text-sm mt-1">Be the first to post a reel.</p>
      </div>
    );
  }

  // Each reel item needs an EXPLICIT pixel-based height so the <video>
  // element inside it renders at a real size. `h-full` / `height: 100%`
  // inside an overflow-y scroll container doesn't resolve reliably
  // across browsers, which was rendering items at 0px tall — the reel
  // kept playing audio but the video was invisible.
  const ITEM_HEIGHT = "calc(100dvh - 76px - env(safe-area-inset-bottom, 0px))";

  return (
    <div
      className="fixed top-0 left-1/2 -translate-x-1/2 max-w-[430px] w-full bg-black z-40"
      style={{
        height: ITEM_HEIGHT,
      }}
    >
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {reels.map((reel, idx) => (
          <div
            key={reel.id}
            ref={setItemRef(idx)}
            data-index={idx}
            className="w-full snap-start snap-always"
            style={{ height: ITEM_HEIGHT }}
          >
            <ReelPlayer
              reel={reel}
              active={idx === activeIndex}
              muted={muted}
              onToggleMute={toggleMute}
              onEnded={idx === activeIndex ? advance : undefined}
              onAutoplayBlocked={handleAutoplayBlocked}
            />
          </div>
        ))}
      </div>

      {/* Top header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 via-black/30 to-transparent z-20 pointer-events-none">
        <button
          onClick={() => {
            if (onClose) {
              onClose();
              return;
            }
            // Prefer going back if there's history, otherwise route to the
            // main feed so the user is never stuck inside the reels viewer.
            if (typeof window !== "undefined" && window.history.length > 1) {
              router.back();
            } else {
              router.push("/pulse");
            }
          }}
          className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white press hover:bg-black/80 pointer-events-auto shadow-lg"
          aria-label="Close reels"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <h1 className="font-heading font-bold text-white text-base drop-shadow pointer-events-none">
          Reels
        </h1>
        <div className="w-11 h-11" />
      </div>

      {/* Tap-to-unmute hint — shown when the browser blocks audio autoplay */}
      {showUnmuteHint && (
        <button
          onClick={enableSound}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-[12px] font-bold shadow-lg press animate-fade-in"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
          </svg>
          Tap for sound
        </button>
      )}
    </div>
  );
}
