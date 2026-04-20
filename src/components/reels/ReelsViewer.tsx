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
  const [muted, setMuted] = useState(true);

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

  if (reels.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8 text-white/60">
        <Icon name="video" size={40} className="text-white/20 mb-3" />
        <p className="text-base font-semibold">No reels yet</p>
        <p className="text-sm mt-1">Be the first to post a reel.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-40">
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
            style={{ height: "100dvh" }}
          >
            <ReelPlayer
              reel={reel}
              active={idx === activeIndex}
              muted={muted}
              onToggleMute={() => setMuted((m) => !m)}
            />
          </div>
        ))}
      </div>

      {/* Top header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 via-black/20 to-transparent z-10">
        <button
          onClick={() => (onClose ? onClose() : router.back())}
          className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white press hover:bg-black/60"
          aria-label="Close"
        >
          <Icon name="back" size={16} />
        </button>
        <h1 className="font-heading font-bold text-white text-base drop-shadow">
          Reels
        </h1>
        <div className="w-9 h-9" />
      </div>
    </div>
  );
}
