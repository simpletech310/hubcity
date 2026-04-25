"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useAudioPlay } from "./AudioPlayContext";
import { muxAudioStreamUrl } from "@/lib/audio/seed";

/**
 * Persistent mini audio player. Mounted once at the (main) layout level
 * inside <AudioPlayProvider>. Renders a docked bar above CultureBottomNav
 * whenever something is loaded; tap-to-expand opens the full-screen view.
 *
 * The single <audio> element is the source of truth for playback state.
 * The context's _registerAudio + _onTimeUpdate + _onPlayState + _onEnded
 * keep React state in sync with the element.
 */
export default function AudioPlayer() {
  const audio = useRef<HTMLAudioElement | null>(null);
  const {
    current,
    isPlaying,
    position,
    duration,
    toggle,
    next,
    previous,
    seek,
    setExpanded,
    expanded,
    _registerAudio,
    _onTimeUpdate,
    _onPlayState,
    _onEnded,
  } = useAudioPlay();

  useEffect(() => {
    _registerAudio(audio.current);
    return () => _registerAudio(null);
  }, [_registerAudio]);

  if (!current) return null;

  const src = muxAudioStreamUrl(current.muxPlaybackId);
  const totalSec = duration || current.durationSeconds || 0;
  const pct = totalSec > 0 ? Math.min(100, (position / totalSec) * 100) : 0;

  return (
    <>
      {/* Hidden audio element drives playback */}
      <audio
        ref={audio}
        src={src}
        preload="metadata"
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          _onTimeUpdate(el.currentTime, el.duration || 0);
        }}
        onLoadedMetadata={(e) => {
          const el = e.currentTarget;
          _onTimeUpdate(el.currentTime, el.duration || 0);
        }}
        onPlay={() => _onPlayState(true)}
        onPause={() => _onPlayState(false)}
        onEnded={_onEnded}
      />

      {/* Docked mini bar — sits above CultureBottomNav (which is fixed bottom:0) */}
      <div
        className="fixed left-0 right-0 mx-auto max-w-[430px] z-30"
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 78px)",
          background: "var(--paper)",
          borderTop: "2px solid var(--rule-strong-c)",
          borderBottom: "2px solid var(--rule-strong-c)",
        }}
      >
        {/* Progress strip */}
        <div
          aria-hidden
          style={{
            height: 3,
            background: "var(--paper-soft, #DCD3BF)",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: `${pct}%`,
              background: "var(--gold-c)",
              transition: "width 200ms linear",
            }}
          />
        </div>

        <div className="flex items-center gap-3 px-3 py-2">
          {/* Cover */}
          <button
            onClick={() => setExpanded(true)}
            className="relative w-12 h-12 shrink-0 overflow-hidden press"
            style={{ border: "2px solid var(--rule-strong-c)", background: "var(--paper-soft, #DCD3BF)" }}
            aria-label="Expand player"
          >
            {current.coverUrl ? (
              <Image
                src={current.coverUrl}
                alt=""
                width={48}
                height={48}
                className="w-full h-full object-cover"
                unoptimized={current.coverUrl.endsWith(".svg")}
              />
            ) : (
              <div className="w-full h-full" style={{ background: "var(--gold-c)" }} />
            )}
          </button>

          {/* Title block */}
          <button
            onClick={() => setExpanded(true)}
            className="flex-1 min-w-0 text-left press"
          >
            <div
              className="c-card-t truncate"
              style={{ fontSize: 13, color: "var(--ink-strong)", lineHeight: 1.15 }}
            >
              {current.title}
            </div>
            {current.subtitle && (
              <div
                className="c-meta truncate"
                style={{ fontSize: 11, opacity: 0.75, color: "var(--ink-strong)" }}
              >
                {current.subtitle}
              </div>
            )}
          </button>

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={previous}
              className="p-2 press"
              aria-label="Previous"
              style={{ color: "var(--ink-strong)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 5h2v14H6zM20 5l-12 7 12 7z" />
              </svg>
            </button>
            <button
              onClick={toggle}
              className="w-10 h-10 flex items-center justify-center press"
              aria-label={isPlaying ? "Pause" : "Play"}
              style={{
                background: "var(--gold-c)",
                border: "2px solid var(--ink-strong)",
                color: "var(--ink-strong)",
              }}
            >
              {isPlaying ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6,3 20,12 6,21" />
                </svg>
              )}
            </button>
            <button
              onClick={next}
              className="p-2 press"
              aria-label="Next"
              style={{ color: "var(--ink-strong)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 5h2v14h-2zM4 5l12 7-12 7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {expanded && <ExpandedPlayer onClose={() => setExpanded(false)} onSeek={seek} />}
    </>
  );
}

function ExpandedPlayer({ onClose, onSeek }: { onClose: () => void; onSeek: (s: number) => void }) {
  const { current, isPlaying, position, duration, toggle, next, previous } = useAudioPlay();
  if (!current) return null;
  const totalSec = duration || current.durationSeconds || 0;

  function formatTime(s: number) {
    if (!isFinite(s) || s < 0) return "0:00";
    const m = Math.floor(s / 60);
    const x = Math.floor(s % 60);
    return `${m}:${String(x).padStart(2, "0")}`;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center"
      style={{ background: "rgba(10,10,12,0.65)" }}
    >
      <div
        className="w-full max-w-[430px] flex flex-col"
        style={{ background: "var(--paper)", borderLeft: "2px solid var(--rule-strong-c)", borderRight: "2px solid var(--rule-strong-c)" }}
      >
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
        >
          <button onClick={onClose} className="p-2 press" aria-label="Collapse">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--ink-strong)" }}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <div className="c-kicker" style={{ fontSize: 10, letterSpacing: "0.2em", color: "var(--ink-strong)" }}>
            FREQUENCY · NOW PLAYING
          </div>
          <div style={{ width: 28 }} />
        </div>

        {/* Cover */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div
            className="w-full aspect-square max-w-[360px] overflow-hidden"
            style={{ border: "3px solid var(--rule-strong-c)", background: "var(--paper-soft, #DCD3BF)" }}
          >
            {current.coverUrl ? (
              <Image
                src={current.coverUrl}
                alt=""
                width={360}
                height={360}
                className="w-full h-full object-cover"
                unoptimized={current.coverUrl.endsWith(".svg")}
              />
            ) : (
              <div className="w-full h-full" style={{ background: "var(--gold-c)" }} />
            )}
          </div>
        </div>

        {/* Title + meta */}
        <div className="px-6">
          <h2 className="c-hero" style={{ fontSize: 28, lineHeight: 1.05, color: "var(--ink-strong)" }}>
            {current.title}
          </h2>
          {current.subtitle && (
            <p className="c-serif-it mt-1" style={{ fontSize: 14, color: "var(--ink-strong)", opacity: 0.85 }}>
              {current.subtitle}
            </p>
          )}
        </div>

        {/* Scrubber */}
        <div className="px-6 mt-5">
          <input
            type="range"
            min={0}
            max={Math.max(0, Math.floor(totalSec))}
            step={1}
            value={Math.min(Math.floor(position), Math.floor(totalSec) || 0)}
            onChange={(e) => onSeek(parseInt(e.target.value, 10))}
            className="w-full"
            style={{ accentColor: "var(--gold-c)" }}
            aria-label="Seek"
          />
          <div className="flex items-center justify-between mt-1 c-meta" style={{ fontSize: 11, opacity: 0.75 }}>
            <span>{formatTime(position)}</span>
            <span>{formatTime(totalSec)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 px-6 py-6 pb-10">
          <button onClick={previous} className="p-3 press" aria-label="Previous" style={{ color: "var(--ink-strong)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 5h2v14H6zM20 5l-12 7 12 7z" />
            </svg>
          </button>
          <button
            onClick={toggle}
            className="w-16 h-16 flex items-center justify-center press"
            aria-label={isPlaying ? "Pause" : "Play"}
            style={{
              background: "var(--gold-c)",
              border: "3px solid var(--ink-strong)",
              color: "var(--ink-strong)",
            }}
          >
            {isPlaying ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6,3 20,12 6,21" />
              </svg>
            )}
          </button>
          <button onClick={next} className="p-3 press" aria-label="Next" style={{ color: "var(--ink-strong)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 5h2v14h-2zM4 5l12 7-12 7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
