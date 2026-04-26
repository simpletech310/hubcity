"use client";

import Link from "next/link";
import Image from "next/image";
import { useAudioPlay, type PlayableItem } from "./AudioPlayContext";

export interface FeaturedSingleData {
  album: {
    id: string;
    slug: string;
    title: string;
    cover_art_url: string | null;
    description: string | null;
    release_date: string | null;
    channel_id: string | null;
    creator_display_name: string | null;
  };
  track: {
    id: string;
    title: string;
    mux_playback_id: string | null;
    duration_seconds: number | null;
    features: string[] | null;
  };
}

/**
 * Big editorial featured-single card for the FREQUENCY home tab.
 * Vertical magazine-cover layout: full-width square cover image, then
 * a paper-card body with the kicker, title, artist, description, and
 * a primary PLAY button. Tap-to-play wires straight into the persistent
 * <AudioPlayer>.
 */
export default function FeaturedSingleHero({
  single,
}: {
  single: FeaturedSingleData;
}) {
  const { play, current, isPlaying, toggle } = useAudioPlay();
  const trackId = single.track.id;
  const isCurrent = current?.id === trackId;
  const showPause = isCurrent && isPlaying;

  function onPlay() {
    if (isCurrent) {
      toggle();
      return;
    }
    if (!single.track.mux_playback_id) return;
    const item: PlayableItem = {
      id: trackId,
      kind: "track",
      title: single.track.title,
      subtitle: single.album.title,
      coverUrl: single.album.cover_art_url,
      muxPlaybackId: single.track.mux_playback_id,
      durationSeconds: single.track.duration_seconds,
      channelId: single.album.channel_id,
      context: {
        kind: "album",
        slug: single.album.slug,
        title: single.album.title,
      },
    };
    play(item, [item]);
  }

  const features = single.track.features ?? [];
  const featLine = features.length > 0 ? `feat. ${features.join(", ")}` : null;
  const releaseYear = single.album.release_date
    ? new Date(single.album.release_date).getFullYear()
    : null;

  return (
    <div className="px-5">
      <div
        className="overflow-hidden"
        style={{
          border: "3px solid var(--rule-strong-c)",
          background: "var(--paper-warm)",
        }}
      >
        {/* Cover image — full-width, 1:1 */}
        <Link
          href={`/frequency/album/${single.album.slug}`}
          className="block press relative w-full aspect-square overflow-hidden"
          style={{ background: "var(--ink-strong)" }}
        >
          {single.album.cover_art_url ? (
            <Image
              src={single.album.cover_art_url}
              alt={single.album.title}
              fill
              sizes="(max-width: 430px) 100vw, 430px"
              className="object-cover"
              unoptimized={single.album.cover_art_url.endsWith(".svg")}
              priority
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "var(--gold-c)" }}
            >
              <span className="c-hero" style={{ fontSize: 80 }}>
                ♪
              </span>
            </div>
          )}

          {/* Kicker chip in corner */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="c-badge c-badge-gold">FEATURED</span>
            <span className="c-badge c-badge-ink">SINGLE</span>
          </div>

          {/* Bottom gradient wash for legibility */}
          <div
            className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)",
            }}
          />
          {releaseYear && (
            <span
              className="absolute bottom-3 right-3 c-kicker"
              style={{
                color: "#fff",
                fontSize: 10,
                letterSpacing: "0.18em",
                opacity: 0.9,
              }}
            >
              § {releaseYear}
            </span>
          )}
        </Link>

        {/* Body */}
        <div className="px-5 pt-4 pb-5">
          {featLine && (
            <p
              className="c-kicker"
              style={{
                fontSize: 10,
                letterSpacing: "0.18em",
                color: "var(--ink-strong)",
                opacity: 0.7,
              }}
            >
              {featLine.toUpperCase()}
            </p>
          )}

          <h2
            className="c-hero mt-1"
            style={{
              fontSize: 34,
              lineHeight: 0.92,
              letterSpacing: "-0.012em",
              color: "var(--ink-strong)",
            }}
          >
            {single.track.title.toUpperCase()}.
          </h2>

          {single.album.creator_display_name && (
            <p
              className="c-serif-it mt-1"
              style={{
                fontSize: 15,
                color: "var(--ink-strong)",
                opacity: 0.85,
              }}
            >
              {single.album.creator_display_name}
            </p>
          )}

          {single.album.description && (
            <p
              className="c-body mt-3"
              style={{
                fontSize: 14,
                lineHeight: 1.5,
                color: "var(--ink-strong)",
                opacity: 0.85,
              }}
            >
              {single.album.description}
            </p>
          )}

          {/* CTA row */}
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={onPlay}
              disabled={!single.track.mux_playback_id}
              className="press inline-flex items-center justify-center gap-2 flex-1"
              style={{
                background: "var(--gold-c)",
                border: "2px solid var(--ink-strong)",
                color: "var(--ink-strong)",
                fontFamily: "var(--font-archivo), Archivo, sans-serif",
                fontWeight: 800,
                fontSize: 12,
                letterSpacing: "0.18em",
                padding: "12px 16px",
                opacity: single.track.mux_playback_id ? 1 : 0.5,
              }}
              aria-label={showPause ? "Pause" : "Play"}
            >
              {showPause ? (
                <>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                  PAUSE
                </>
              ) : (
                <>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <polygon points="6,3 20,12 6,21" />
                  </svg>
                  PLAY NOW
                </>
              )}
            </button>

            <Link
              href={`/frequency/album/${single.album.slug}`}
              className="press inline-flex items-center gap-1.5"
              style={{
                background: "transparent",
                border: "2px solid var(--ink-strong)",
                color: "var(--ink-strong)",
                fontFamily: "var(--font-archivo), Archivo, sans-serif",
                fontWeight: 800,
                fontSize: 11,
                letterSpacing: "0.16em",
                padding: "12px 14px",
              }}
            >
              OPEN
              <svg
                width="12"
                height="12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M6 4l4 4-4 4" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
