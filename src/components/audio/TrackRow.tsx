"use client";

import type { Track } from "@/types/database";
import { useAudioPlay, type PlayableItem } from "./AudioPlayContext";

function formatDuration(seconds: number | null | undefined) {
  if (!seconds || !isFinite(seconds)) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Single row in an album track list. Tap anywhere on the row to start
 * playback. The row dispatches a queue spanning the entire album so
 * Next / Previous on the mini player walk the album naturally.
 */
export default function TrackRow({
  track,
  album,
  queue,
}: {
  track: Track;
  album: { slug: string; title: string; cover_art_url: string | null };
  queue: PlayableItem[];
}) {
  const { current, isPlaying, toggle, play } = useAudioPlay();
  const isCurrent = current?.id === track.id;
  const showPause = isCurrent && isPlaying;

  function onClick() {
    if (isCurrent) {
      toggle();
      return;
    }
    if (!track.mux_playback_id) return;
    const me: PlayableItem = {
      id: track.id,
      kind: "track",
      title: track.title,
      subtitle: album.title,
      coverUrl: album.cover_art_url,
      muxPlaybackId: track.mux_playback_id,
      durationSeconds: track.duration_seconds,
      context: { kind: "album", slug: album.slug, title: album.title },
    };
    play(me, queue);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 press text-left"
      style={{ borderTop: "1px solid var(--rule-strong-c)" }}
    >
      {/* Track # / play indicator */}
      <div
        className="w-8 shrink-0 flex items-center justify-center"
        style={{
          fontFamily: "var(--font-archivo), Archivo, sans-serif",
          fontWeight: 800,
          fontSize: 13,
          color: isCurrent ? "var(--gold-c)" : "var(--ink-strong)",
        }}
      >
        {showPause ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : isCurrent ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="6,3 20,12 6,21" />
          </svg>
        ) : (
          <span>{track.track_number}</span>
        )}
      </div>

      {/* Title block */}
      <div className="flex-1 min-w-0">
        <div
          className="c-card-t truncate"
          style={{
            fontSize: 14,
            color: "var(--ink-strong)",
            lineHeight: 1.2,
          }}
        >
          {track.title}
          {track.explicit && (
            <span
              className="ml-2 inline-block px-1"
              style={{
                background: "var(--ink-strong)",
                color: "var(--paper)",
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: "0.1em",
                verticalAlign: "1px",
              }}
            >
              E
            </span>
          )}
        </div>
        {track.features && track.features.length > 0 && (
          <div
            className="c-meta truncate"
            style={{ fontSize: 11, opacity: 0.7, color: "var(--ink-strong)" }}
          >
            feat. {track.features.join(", ")}
          </div>
        )}
      </div>

      {/* Duration */}
      <div
        className="shrink-0 c-meta"
        style={{
          fontFamily: "var(--font-archivo), Archivo, sans-serif",
          fontVariantNumeric: "tabular-nums",
          fontSize: 12,
          opacity: 0.75,
          color: "var(--ink-strong)",
        }}
      >
        {formatDuration(track.duration_seconds)}
      </div>
    </button>
  );
}
