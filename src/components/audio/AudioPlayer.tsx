"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useAudioPlay } from "./AudioPlayContext";

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
    stop,
    setExpanded,
    expanded,
    mode,
    ad,
    skipAd,
    clickAd,
    _registerAudio,
    _onTimeUpdate,
    _onPlayState,
    _onEnded,
  } = useAudioPlay();

  useEffect(() => {
    _registerAudio(audio.current);
    return () => _registerAudio(null);
  }, [_registerAudio]);

  // The <audio> element must always be in the DOM so the imperative
  // play() inside the click handler has a target. The mini bar is
  // conditionally rendered, but the element below stays mounted.
  const audioEl = (
    <audio
      ref={audio}
      preload="auto"
      playsInline
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
  );

  if (!current) return audioEl;

  const isAd = mode === "ad" && ad != null;
  const totalSec = isAd
    ? ad.duration || duration || 0
    : duration || current.durationSeconds || 0;
  const pct = totalSec > 0 ? Math.min(100, (position / totalSec) * 100) : 0;
  const canSkip = isAd && position >= (ad?.skippable_after ?? 5);
  const skipCountdown = isAd
    ? Math.max(0, Math.ceil((ad?.skippable_after ?? 5) - position))
    : 0;

  return (
    <>
      {audioEl}

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
        {/* AD strip — replaces the cover/title row while an ad runs */}
        {isAd && ad && (
          <div
            className="flex items-center justify-between px-3 py-1"
            style={{
              background: "var(--gold-c)",
              borderBottom: "2px solid var(--ink-strong)",
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                style={{
                  fontFamily: "var(--font-archivo), Archivo, sans-serif",
                  fontSize: 9,
                  letterSpacing: "0.22em",
                  background: "var(--ink-strong)",
                  color: "var(--paper)",
                  padding: "2px 6px",
                  fontWeight: 800,
                }}
              >
                AD
              </span>
              <button
                onClick={clickAd}
                className="press truncate text-left"
                style={{
                  fontFamily: "var(--font-archivo), Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: 11,
                  letterSpacing: "0.06em",
                  color: "var(--ink-strong)",
                }}
                aria-label="Open advertiser"
              >
                {ad.title}
              </button>
            </div>
            <button
              onClick={canSkip ? skipAd : undefined}
              disabled={!canSkip}
              className="press shrink-0 ml-2"
              style={{
                fontFamily: "var(--font-archivo), Archivo, sans-serif",
                fontWeight: 800,
                fontSize: 10,
                letterSpacing: "0.16em",
                color: "var(--ink-strong)",
                opacity: canSkip ? 1 : 0.55,
                padding: "2px 6px",
                border: "1.5px solid var(--ink-strong)",
              }}
              aria-label={canSkip ? "Skip ad" : `Skip in ${skipCountdown}s`}
            >
              {canSkip ? "SKIP ▸" : `SKIP ${skipCountdown}s`}
            </button>
          </div>
        )}

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
              {isAd ? "Up next" : current.title}
            </div>
            <div
              className="c-meta truncate"
              style={{ fontSize: 11, opacity: 0.75, color: "var(--ink-strong)" }}
            >
              {isAd
                ? current.title
                : current.subtitle ?? ""}
            </div>
          </button>

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={previous}
              className="p-2 press"
              aria-label="Previous"
              disabled={isAd}
              style={{ color: "var(--ink-strong)", opacity: isAd ? 0.4 : 1 }}
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
              disabled={isAd}
              style={{ color: "var(--ink-strong)", opacity: isAd ? 0.4 : 1 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 5h2v14h-2zM4 5l12 7-12 7z" />
              </svg>
            </button>
            <button
              onClick={stop}
              className="p-2 press"
              aria-label="Close player"
              style={{ color: "var(--ink-strong)", opacity: 0.7 }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {expanded && <ExpandedPlayer onClose={() => setExpanded(false)} onSeek={seek} onStop={stop} />}
    </>
  );
}

function ExpandedPlayer({
  onClose,
  onSeek,
  onStop,
}: {
  onClose: () => void;
  onSeek: (s: number) => void;
  onStop: () => void;
}) {
  const {
    current,
    isPlaying,
    position,
    duration,
    toggle,
    next,
    previous,
    mode,
    ad,
    skipAd,
    clickAd,
  } = useAudioPlay();
  if (!current) return null;
  const isAd = mode === "ad" && ad != null;
  const totalSec = isAd
    ? ad.duration || duration || 0
    : duration || current.durationSeconds || 0;
  const canSkip = isAd && position >= (ad?.skippable_after ?? 5);
  const skipCountdown = isAd
    ? Math.max(0, Math.ceil((ad?.skippable_after ?? 5) - position))
    : 0;

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
            {isAd ? "FREQUENCY · SPONSORED" : "FREQUENCY · NOW PLAYING"}
          </div>
          <button
            onClick={onStop}
            className="press c-kicker"
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              color: "var(--ink-strong)",
              padding: "4px 6px",
            }}
            aria-label="Close player"
          >
            STOP ✕
          </button>
        </div>

        {/* AD foil bar */}
        {isAd && ad && (
          <button
            onClick={clickAd}
            className="press w-full text-left"
            style={{
              background: "var(--gold-c)",
              borderBottom: "2px solid var(--ink-strong)",
              padding: "10px 16px",
            }}
            aria-label="Open advertiser"
          >
            <div className="flex items-center gap-3">
              <span
                style={{
                  fontFamily: "var(--font-archivo), Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  color: "var(--paper)",
                  background: "var(--ink-strong)",
                  padding: "3px 7px",
                }}
              >
                AD
              </span>
              <div className="flex-1 min-w-0">
                <div
                  className="truncate"
                  style={{
                    fontFamily: "var(--font-archivo), Archivo, sans-serif",
                    fontWeight: 800,
                    fontSize: 13,
                    letterSpacing: "0.04em",
                    color: "var(--ink-strong)",
                  }}
                >
                  {ad.title}
                </div>
                {ad.body && (
                  <div
                    className="c-serif-it truncate"
                    style={{ fontSize: 12, color: "var(--ink-strong)", opacity: 0.85 }}
                  >
                    {ad.body}
                  </div>
                )}
              </div>
              <span
                style={{
                  fontFamily: "var(--font-archivo), Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: 10,
                  letterSpacing: "0.16em",
                  color: "var(--ink-strong)",
                }}
              >
                TAP ▸
              </span>
            </div>
          </button>
        )}

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
            {isAd ? `Up next · ${current.title}` : current.title}
          </h2>
          {current.subtitle && !isAd && (
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
            disabled={isAd}
            className="w-full"
            style={{ accentColor: "var(--gold-c)", opacity: isAd ? 0.5 : 1 }}
            aria-label="Seek"
          />
          <div className="flex items-center justify-between mt-1 c-meta" style={{ fontSize: 11, opacity: 0.75 }}>
            <span>{formatTime(position)}</span>
            <span>{formatTime(totalSec)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 px-6 py-6 pb-10">
          <button onClick={previous} disabled={isAd} className="p-3 press" aria-label="Previous" style={{ color: "var(--ink-strong)", opacity: isAd ? 0.4 : 1 }}>
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
          <button onClick={isAd ? (canSkip ? skipAd : undefined) : next} disabled={isAd && !canSkip} className="p-3 press" aria-label={isAd ? "Skip ad" : "Next"} style={{ color: "var(--ink-strong)", opacity: isAd && !canSkip ? 0.4 : 1 }}>
            {isAd ? (
              <span
                style={{
                  fontFamily: "var(--font-archivo), Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: 11,
                  letterSpacing: "0.18em",
                }}
              >
                {canSkip ? "SKIP ▸" : `SKIP ${skipCountdown}s`}
              </span>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 5h2v14h-2zM4 5l12 7-12 7z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
