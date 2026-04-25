"use client";

import Link from "next/link";
import Image from "next/image";
import type { Album, Track } from "@/types/database";
import TrackRow from "./TrackRow";
import { useAudioPlay, type PlayableItem } from "./AudioPlayContext";
import AudioPaywall from "./AudioPaywall";
import type { AudioAccess } from "@/lib/audio-access";

const RELEASE_LABEL: Record<string, string> = {
  single: "SINGLE",
  ep: "EP",
  album: "ALBUM",
  mixtape: "MIXTAPE",
};

/**
 * Detail view for an album / single / EP / mixtape. Renders the cover
 * hero, description, credit lines, and the ordered track list. The big
 * gold PLAY button starts the whole album from track 1.
 */
export default function AlbumDetail({
  album,
  tracks,
  access,
  channelName,
}: {
  album: Album;
  tracks: Track[];
  access?: AudioAccess;
  channelName?: string | null;
}) {
  const { play, current, isPlaying, toggle } = useAudioPlay();
  const locked = access ? !access.allowed : false;

  const queue: PlayableItem[] = tracks
    .filter((t) => !!t.mux_playback_id)
    .map((t) => ({
      id: t.id,
      kind: "track",
      title: t.title,
      subtitle: album.title,
      coverUrl: album.cover_art_url,
      muxPlaybackId: t.mux_playback_id as string,
      durationSeconds: t.duration_seconds,
      channelId: album.channel_id ?? null,
      context: { kind: "album", slug: album.slug, title: album.title },
    }));

  const isCurrentInAlbum = !!current && tracks.some((t) => t.id === current.id);
  const showPause = isCurrentInAlbum && isPlaying;

  function onPlayAll() {
    if (isCurrentInAlbum) {
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
          {RELEASE_LABEL[album.release_type] ?? album.release_type.toUpperCase()}
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
          {album.cover_art_url ? (
            <Image
              src={album.cover_art_url}
              alt={album.title}
              width={300}
              height={300}
              className="w-full h-full object-cover"
              unoptimized={album.cover_art_url.endsWith(".svg")}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: "var(--gold-c)" }}
            >
              <span className="c-hero" style={{ fontSize: 60 }}>
                ♪
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
          {album.title}
        </h1>

        {album.creator?.display_name && (
          <div
            className="mt-1 c-serif-it"
            style={{ fontSize: 14, color: "var(--ink-strong)", opacity: 0.85 }}
          >
            {album.creator.display_name}
          </div>
        )}

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
          {tracks.length} TRACK{tracks.length === 1 ? "" : "S"}
          {album.release_date && (
            <> · {new Date(album.release_date).getFullYear()}</>
          )}
          {album.is_demo && <> · DEMO</>}
        </div>

        {/* Play all OR paywall */}
        {locked && access && !access.allowed ? (
          <AudioPaywall
            channelId={access.channel_id}
            channelName={channelName}
            priceCents={access.subscription_price_cents}
            currency={access.currency}
            reason={access.reason}
            contentLabel={album.title}
          />
        ) : (
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
        )}
      </div>

      {/* Description */}
      {album.description && (
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
            {album.description}
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
          className="px-4 py-2 c-kicker flex items-center justify-between"
          style={{
            fontSize: 10,
            letterSpacing: "0.2em",
            color: "var(--ink-strong)",
            background: "var(--paper-soft, #DCD3BF)",
          }}
        >
          <span>TRACKLIST</span>
          {locked && (
            <span style={{ opacity: 0.7 }}>🔒 SUBSCRIBERS</span>
          )}
        </div>
        <div style={{ opacity: locked ? 0.5 : 1, pointerEvents: locked ? "none" : "auto" }}>
          {tracks.map((t) => (
            <TrackRow
              key={t.id}
              track={t}
              album={{
                slug: album.slug,
                title: album.title,
                cover_art_url: album.cover_art_url,
              }}
              queue={queue}
            />
          ))}
        </div>
      </div>

      {/* Per-track credits */}
      {tracks.some((t) => t.credits || (t.features && t.features.length > 0)) && (
        <div className="px-5 pt-6">
          <div
            className="c-kicker mb-3"
            style={{ fontSize: 10, letterSpacing: "0.2em", color: "var(--ink-strong)" }}
          >
            CREDITS
          </div>
          <div className="space-y-3">
            {tracks.map((t) => {
              const hasFeat = t.features && t.features.length > 0;
              const hasCredits =
                t.credits && Object.keys(t.credits).length > 0;
              if (!hasFeat && !hasCredits) return null;
              return (
                <div
                  key={t.id}
                  className="text-[12px]"
                  style={{ color: "var(--ink-strong)" }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-archivo), Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: 11,
                      letterSpacing: "0.12em",
                    }}
                  >
                    {t.track_number}. {t.title.toUpperCase()}
                  </div>
                  {hasFeat && (
                    <div style={{ opacity: 0.8 }}>
                      Features: {t.features!.join(", ")}
                    </div>
                  )}
                  {hasCredits &&
                    Object.entries(t.credits as Record<string, unknown>).map(
                      ([k, v]) => (
                        <div key={k} style={{ opacity: 0.8 }}>
                          {k.replace(/_/g, " ")}: {String(v)}
                        </div>
                      )
                    )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
