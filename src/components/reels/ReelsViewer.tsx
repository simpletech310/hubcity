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
  /** Current user id for enabling reactions/comments. Null = signed out. */
  userId?: string | null;
  /** Emoji reactions the signed-in user has already applied, keyed by reel id. */
  userReactionsByReel?: Record<string, string[]>;
}

export default function ReelsViewer({
  reels,
  initialIndex = 0,
  onClose,
  userId = null,
  userReactionsByReel = {},
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
      <div
        className="h-full flex flex-col items-center justify-center text-center px-8"
        style={{ background: "var(--paper)", color: "var(--ink-strong)" }}
      >
        <div
          className="mb-4 flex items-center justify-center"
          style={{ width: 56, height: 56, border: "2px solid var(--rule-strong-c)", background: "var(--paper-soft)" }}
        >
          <Icon name="video" size={28} style={{ color: "var(--ink-strong)" }} />
        </div>
        <p className="c-card-t" style={{ fontSize: 16 }}>No moments yet</p>
        <p className="c-serif-it mt-1" style={{ fontSize: 13, opacity: 0.7 }}>
          Record a moment, share a moment.
        </p>
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
      className="fixed top-0 left-1/2 -translate-x-1/2 max-w-[430px] w-full bg-black z-[60]"
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
              userId={userId}
              userReactions={(userReactionsByReel[reel.id] ?? []) as Array<
                "heart" | "fire" | "clap" | "hundred" | "pray"
              >}
            />
          </div>
        ))}
      </div>

      {/* Top header — printed label on translucent ink gradient */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3 z-20 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(26,21,18,0.6) 0%, rgba(26,21,18,0.2) 60%, transparent 100%)",
        }}
      >
        <button
          onClick={() => {
            // 1. Inline modal (ReelsRail) — close in place.
            if (onClose) {
              onClose();
              return;
            }
            // 2. Browser-history present (e.g. came from feed / profile /
            //    home / trending strip) — pop back so the listener returns
            //    to whatever scroll position they had.
            if (typeof window !== "undefined" && window.history.length > 1) {
              router.back();
              return;
            }
            // 3. Direct deep-link with no history — go to the moments
            //    grid so it still feels like a "back" rather than a hard
            //    bounce home.
            router.push("/moments");
          }}
          className="inline-flex items-center gap-1.5 press pointer-events-auto"
          style={{
            height: 32,
            padding: "0 12px 0 10px",
            background: "var(--gold-c)",
            border: "2px solid var(--ink-strong)",
            color: "var(--ink-strong)",
            fontFamily: "var(--font-archivo), Archivo, sans-serif",
            fontWeight: 800,
            fontSize: 11,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
          aria-label="Back"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          BACK
        </button>
        <div
          className="inline-flex items-center gap-1.5 px-2 pointer-events-none"
          style={{
            background: "var(--paper)",
            border: "2px solid var(--rule-strong-c)",
            height: 26,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              background: "var(--gold-c)",
              display: "inline-block",
            }}
          />
          <span className="c-kicker" style={{ fontSize: 10 }}>
            MOMENTS
          </span>
        </div>
        <div style={{ width: 40, height: 40 }} />
      </div>

      {/* Tap-to-unmute hint — paper chip, ink border */}
      {showUnmuteHint && (
        <button
          onClick={enableSound}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-2 px-3 py-2 press animate-fade-in"
          style={{
            background: "var(--paper)",
            color: "var(--ink-strong)",
            border: "2px solid var(--rule-strong-c)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
          </svg>
          <span className="c-kicker" style={{ fontSize: 10 }}>
            TAP FOR SOUND
          </span>
        </button>
      )}
    </div>
  );
}
