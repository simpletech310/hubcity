"use client";

import Link from "next/link";
import Image from "next/image";
import type { Playlist } from "@/types/database";
import { useAudioPlay, type PlayableItem } from "./AudioPlayContext";

/**
 * A single playable row inside a playlist. Tap anywhere to start
 * playback and dispatch the *full* playlist queue so Next/Previous on
 * the mini player walk the playlist naturally — same pattern as
 * `<TrackRow>` for albums.
 */
export interface PlaylistTrack {
  /** Stable id (track id or episode id). */
  id: string;
  kind: "track" | "episode";
  position: number;
  title: string;
  /** Where this track originates from — "Album Title" or "Show Title". */
  contextTitle: string | null;
  contextSlug: string | null;
  /** Per-row cover (album cover or episode/show thumbnail). */
  coverUrl: string | null;
  muxPlaybackId: string | null;
  durationSeconds: number | null;
  channelId: string | null;
  features: string[] | null;
}

function formatDuration(seconds: number | null | undefined) {
  if (!seconds || !Number.isFinite(seconds)) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function PlaylistRow({
  row,
  queue,
  playlistTitle,
}: {
  row: PlaylistTrack;
  queue: PlayableItem[];
  playlistTitle: string;
}) {
  const { current, isPlaying, toggle, play } = useAudioPlay();
  const isCurrent = current?.id === row.id;
  const showPause = isCurrent && isPlaying;

  function onClick() {
    if (isCurrent) {
      toggle();
      return;
    }
    if (!row.muxPlaybackId) return;
    const me: PlayableItem = {
      id: row.id,
      kind: row.kind,
      title: row.title,
      // Subtitle in the mini player shows the playlist context so the
      // listener knows where they are.
      subtitle: playlistTitle,
      coverUrl: row.coverUrl,
      muxPlaybackId: row.muxPlaybackId,
      durationSeconds: row.durationSeconds,
      channelId: row.channelId,
      // No detail-page back-link from a playlist (we keep playlist
      // context, not the source album), so leave context null.
      context: null,
    };
    play(me, queue);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!row.muxPlaybackId}
      className="w-full flex items-center gap-3 px-4 py-3 press text-left disabled:opacity-50"
      style={{ borderTop: "1px solid var(--rule-strong-c)" }}
    >
      {/* Position / play state indicator */}
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
          <span>{row.position}</span>
        )}
      </div>

      {/* Tiny album/episode cover */}
      <div
        className="w-10 h-10 shrink-0 overflow-hidden"
        style={{ border: "1.5px solid var(--rule-strong-c)" }}
      >
        {row.coverUrl ? (
          <Image
            src={row.coverUrl}
            alt=""
            width={40}
            height={40}
            className="w-full h-full object-cover"
            unoptimized={row.coverUrl.endsWith(".svg")}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "var(--gold-c)" }}
          >
            <span style={{ fontSize: 16 }}>♪</span>
          </div>
        )}
      </div>

      {/* Title + source */}
      <div className="flex-1 min-w-0">
        <div
          className="c-card-t truncate"
          style={{ fontSize: 14, color: "var(--ink-strong)", lineHeight: 1.2 }}
        >
          {row.title}
        </div>
        <div
          className="c-meta truncate"
          style={{ fontSize: 11, opacity: 0.7, color: "var(--ink-strong)" }}
        >
          {row.features && row.features.length > 0 && (
            <>feat. {row.features.join(", ")} · </>
          )}
          {row.contextTitle ?? (row.kind === "episode" ? "Podcast" : "Track")}
        </div>
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
        {formatDuration(row.durationSeconds)}
      </div>
    </button>
  );
}

export default function PlaylistDetail({
  playlist,
  rows,
}: {
  playlist: Playlist;
  rows: PlaylistTrack[];
}) {
  const { play, current, isPlaying, toggle } = useAudioPlay();

  const queue: PlayableItem[] = rows
    .filter((r) => !!r.muxPlaybackId)
    .map((r) => ({
      id: r.id,
      kind: r.kind,
      title: r.title,
      subtitle: playlist.title,
      coverUrl: r.coverUrl,
      muxPlaybackId: r.muxPlaybackId as string,
      durationSeconds: r.durationSeconds,
      channelId: r.channelId,
      context: null,
    }));

  const isCurrentInPlaylist = !!current && rows.some((r) => r.id === current.id);
  const showPause = isCurrentInPlaylist && isPlaying;
  const totalSec = rows.reduce(
    (n, r) => n + (Number.isFinite(r.durationSeconds ?? 0) ? (r.durationSeconds ?? 0) : 0),
    0
  );
  const totalMin = Math.round(totalSec / 60);

  function onPlayAll() {
    if (isCurrentInPlaylist) {
      toggle();
      return;
    }
    if (queue.length === 0) return;
    play(queue[0], queue);
  }

  return (
    <div className="culture-surface min-h-dvh" style={{ paddingBottom: 24 }}>
      {/* Back / kicker */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <Link
          href="/frequency"
          className="press inline-flex items-center gap-1"
          style={{
            fontFamily: "var(--font-archivo), Archivo, sans-serif",
            fontWeight: 800,
            fontSize: 11,
            letterSpacing: "0.16em",
            color: "var(--ink-strong)",
          }}
        >
          ← FREQUENCY
        </Link>
        <span
          className="c-kicker"
          style={{ fontSize: 10, letterSpacing: "0.18em", color: "var(--ink-strong)" }}
        >
          {playlist.is_editorial ? "EDITORIAL · PLAYLIST" : "PLAYLIST"}
        </span>
      </div>

      {/* Hero */}
      <div className="px-5 pt-2 pb-5 flex flex-col items-center">
        <div
          className="w-full aspect-square max-w-[300px] overflow-hidden flex items-center justify-center p-6"
          style={{
            border: "3px solid var(--rule-strong-c)",
            background: playlist.cover_art_url ? "var(--paper-soft, #DCD3BF)" : "var(--ink-strong)",
            color: playlist.cover_art_url ? "var(--ink-strong)" : "var(--paper)",
          }}
        >
          {playlist.cover_art_url ? (
            <Image
              src={playlist.cover_art_url}
              alt={playlist.title}
              width={300}
              height={300}
              className="w-full h-full object-cover"
              unoptimized={playlist.cover_art_url.endsWith(".svg")}
            />
          ) : (
            <div className="text-center">
              <div
                className="c-kicker"
                style={{ fontSize: 11, letterSpacing: "0.18em", color: "var(--gold-c)" }}
              >
                PLAYLIST
              </div>
              <div
                className="c-hero mt-2"
                style={{
                  fontSize: 28,
                  lineHeight: 1.05,
                  fontFamily: "var(--font-fraunces), Fraunces, serif",
                  fontStyle: "italic",
                  fontWeight: 700,
                }}
              >
                {playlist.title}
              </div>
            </div>
          )}
        </div>

        <h1
          className="c-hero mt-4 text-center"
          style={{
            fontSize: 36,
            lineHeight: 0.95,
            letterSpacing: "-0.01em",
            color: "var(--ink-strong)",
          }}
        >
          {playlist.title}
        </h1>

        <div
          className="mt-1 c-meta"
          style={{
            fontFamily: "var(--font-archivo), Archivo, sans-serif",
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: "0.14em",
            color: "var(--ink-strong)",
            opacity: 0.7,
          }}
        >
          {rows.length} TRACK{rows.length === 1 ? "" : "S"}
          {totalMin > 0 && <> · {totalMin} MIN</>}
          {playlist.is_editorial && <> · EDITORIAL</>}
        </div>

        <button
          type="button"
          onClick={onPlayAll}
          disabled={queue.length === 0}
          className="press mt-5 inline-flex items-center gap-2 px-5 py-2"
          style={{
            background: "var(--gold-c)",
            border: "2px solid var(--ink-strong)",
            color: "var(--ink-strong)",
            fontFamily: "var(--font-archivo), Archivo, sans-serif",
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: "0.18em",
            opacity: queue.length === 0 ? 0.4 : 1,
          }}
        >
          {showPause ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
              PAUSE
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6,3 20,12 6,21" />
              </svg>
              PLAY ALL
            </>
          )}
        </button>
      </div>

      {/* Description */}
      {playlist.description && (
        <div className="px-5 pb-5">
          <div
            className="rule-hairline mb-4"
            style={{ borderColor: "var(--rule-strong-c)" }}
          />
          <p
            className="c-serif-it"
            style={{
              fontSize: 14,
              lineHeight: 1.55,
              color: "var(--ink-strong)",
              opacity: 0.9,
            }}
          >
            {playlist.description}
          </p>
        </div>
      )}

      {/* Track list */}
      <div
        className="mt-2"
        style={{
          borderTop: "3px solid var(--rule-strong-c)",
          borderBottom: "3px solid var(--rule-strong-c)",
        }}
      >
        <div
          className="px-4 py-2 c-kicker"
          style={{
            fontSize: 10,
            letterSpacing: "0.2em",
            color: "var(--ink-strong)",
            background: "var(--paper-soft, #DCD3BF)",
          }}
        >
          TRACKLIST
        </div>
        <div>
          {rows.length === 0 ? (
            <div className="px-4 py-6 c-meta" style={{ opacity: 0.7 }}>
              This playlist is empty.
            </div>
          ) : (
            rows.map((r) => (
              <PlaylistRow
                key={`${r.kind}:${r.id}`}
                row={r}
                queue={queue}
                playlistTitle={playlist.title}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
