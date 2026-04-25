"use client";

import Link from "next/link";
import Image from "next/image";
import type { Podcast } from "@/types/database";
import { useAudioPlay, type PlayableItem } from "./AudioPlayContext";

function formatDuration(seconds: number | null | undefined) {
  if (!seconds || !isFinite(seconds)) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface ShowMeta {
  slug: string;
  title: string;
  description: string | null;
  cover_art_url: string | null;
  genre_slug: string | null;
  episode_count: number;
}

/**
 * Detail view for a podcast show. The episode list is the queue —
 * tapping any episode plays it and pre-loads the rest of the show into
 * the mini-player queue.
 */
export default function PodcastShowDetail({
  show,
  episodes,
}: {
  show: ShowMeta;
  episodes: Podcast[];
}) {
  const { play, current, isPlaying, toggle } = useAudioPlay();

  const queue: PlayableItem[] = episodes
    .filter((e) => !!e.mux_playback_id)
    .map((e) => ({
      id: e.id,
      kind: "episode",
      title: e.title,
      subtitle: show.title,
      coverUrl: e.thumbnail_url ?? show.cover_art_url ?? null,
      muxPlaybackId: e.mux_playback_id as string,
      durationSeconds: e.duration ?? null,
      context: { kind: "podcast", slug: show.slug, title: show.title },
    }));

  const isCurrentInShow = !!current && episodes.some((e) => e.id === current.id);
  const showPause = isCurrentInShow && isPlaying;

  function onPlayLatest() {
    if (isCurrentInShow) {
      toggle();
      return;
    }
    if (queue.length === 0) return;
    play(queue[0], queue);
  }

  return (
    <div className="culture-surface min-h-dvh" style={{ paddingBottom: 24 }}>
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
          PODCAST
        </span>
      </div>

      {/* Hero */}
      <div className="px-5 pt-2 pb-5 flex flex-col items-center">
        <div
          className="w-full aspect-square max-w-[300px] overflow-hidden"
          style={{
            border: "3px solid var(--rule-strong-c)",
            background: "var(--paper-soft, #DCD3BF)",
          }}
        >
          {show.cover_art_url ? (
            <Image
              src={show.cover_art_url}
              alt={show.title}
              width={300}
              height={300}
              className="w-full h-full object-cover"
              unoptimized={show.cover_art_url.endsWith(".svg")}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: "var(--gold-c)" }}
            >
              <span className="c-hero" style={{ fontSize: 60 }}>
                🎙
              </span>
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
          {show.title}
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
          {show.episode_count} EPISODE{show.episode_count === 1 ? "" : "S"}
          {show.genre_slug && <> · {show.genre_slug.replace(/-/g, " ").toUpperCase()}</>}
        </div>

        <button
          type="button"
          onClick={onPlayLatest}
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
              PLAY LATEST
            </>
          )}
        </button>
      </div>

      {show.description && (
        <div className="px-5 pb-5">
          <div className="rule-hairline mb-4" />
          <p
            className="c-serif-it"
            style={{
              fontSize: 14,
              lineHeight: 1.55,
              color: "var(--ink-strong)",
              opacity: 0.9,
            }}
          >
            {show.description}
          </p>
        </div>
      )}

      {/* Episode list */}
      <div
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
          EPISODES
        </div>
        {episodes.map((ep) => (
          <EpisodeRow
            key={ep.id}
            episode={ep}
            show={show}
            queue={queue}
          />
        ))}
      </div>
    </div>
  );
}

function EpisodeRow({
  episode,
  show,
  queue,
}: {
  episode: Podcast;
  show: ShowMeta;
  queue: PlayableItem[];
}) {
  const { current, isPlaying, toggle, play } = useAudioPlay();
  const isCurrent = current?.id === episode.id;
  const showPause = isCurrent && isPlaying;

  function onClick() {
    if (isCurrent) {
      toggle();
      return;
    }
    if (!episode.mux_playback_id) return;
    const me: PlayableItem = {
      id: episode.id,
      kind: "episode",
      title: episode.title,
      subtitle: show.title,
      coverUrl: episode.thumbnail_url ?? show.cover_art_url ?? null,
      muxPlaybackId: episode.mux_playback_id as string,
      durationSeconds: episode.duration ?? null,
      context: { kind: "podcast", slug: show.slug, title: show.title },
    };
    play(me, queue);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-start gap-3 px-4 py-3 press text-left"
      style={{ borderTop: "1px solid var(--rule-strong-c)" }}
    >
      <div
        className="w-9 h-9 shrink-0 flex items-center justify-center mt-0.5"
        style={{
          background: isCurrent ? "var(--gold-c)" : "transparent",
          border: "2px solid var(--ink-strong)",
          color: "var(--ink-strong)",
        }}
      >
        {showPause ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="6,3 20,12 6,21" />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {episode.episode_number != null && (
          <div
            style={{
              fontFamily: "var(--font-archivo), Archivo, sans-serif",
              fontWeight: 800,
              fontSize: 10,
              letterSpacing: "0.16em",
              color: "var(--ink-strong)",
              opacity: 0.65,
            }}
          >
            EP {episode.episode_number}
          </div>
        )}
        <div
          className="c-card-t"
          style={{
            fontSize: 14,
            color: "var(--ink-strong)",
            lineHeight: 1.2,
          }}
        >
          {episode.title}
        </div>
        {episode.description && (
          <div
            className="c-serif-it mt-1"
            style={{
              fontSize: 12,
              color: "var(--ink-strong)",
              opacity: 0.75,
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {episode.description}
          </div>
        )}
        <div
          className="mt-1 c-meta"
          style={{
            fontFamily: "var(--font-archivo), Archivo, sans-serif",
            fontVariantNumeric: "tabular-nums",
            fontSize: 11,
            color: "var(--ink-strong)",
            opacity: 0.7,
          }}
        >
          {formatDuration(episode.duration)}
        </div>
      </div>
    </button>
  );
}
