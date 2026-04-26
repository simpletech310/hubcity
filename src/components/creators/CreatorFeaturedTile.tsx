"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import Icon from "@/components/ui/Icon";
import { useAudioPlay, type PlayableItem } from "@/components/audio/AudioPlayContext";
import type { FeaturedMedia } from "@/lib/featured-media";

const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), { ssr: false });

interface Props {
  media: FeaturedMedia;
  /** Aspect ratio for the tile. Defaults to 16/10 to match the platform. */
  aspect?: "16/10" | "16/9" | "9/16" | "1/1";
  /** Where clicking the tile should go (used for reels — opens viewer). */
  hrefOverride?: string;
  /** Compact = fewer text overlays, used in tight roster cards. */
  compact?: boolean;
  className?: string;
}

const aspectClass: Record<NonNullable<Props["aspect"]>, string> = {
  "16/10": "aspect-[16/10]",
  "16/9": "aspect-[16/9]",
  "9/16": "aspect-[9/16]",
  "1/1": "aspect-square",
};

function KindPill({ label }: { label: string }) {
  return (
    <span
      className="absolute top-3 left-3 c-kicker px-2.5 py-1"
      style={{
        fontSize: 9,
        background: "rgba(0,0,0,0.6)",
        color: "#fff",
        letterSpacing: "0.16em",
        border: "2px solid rgba(255,255,255,0.18)",
      }}
    >
      {label}
    </span>
  );
}

function PlayDot() {
  return (
    <div
      className="absolute inset-0 m-auto w-14 h-14 flex items-center justify-center pointer-events-none"
      style={{
        background: "rgba(0,0,0,0.45)",
        border: "2px solid rgba(255,255,255,0.85)",
        borderRadius: "9999px",
        backdropFilter: "blur(4px)",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="#fff" aria-hidden>
        <path d="M5 3l11 7-11 7V3z" />
      </svg>
    </div>
  );
}

export default function CreatorFeaturedTile({
  media,
  aspect = "16/10",
  hrefOverride,
  compact = false,
  className = "",
}: Props) {
  const cls = `relative w-full overflow-hidden ${aspectClass[aspect]} ${className}`;
  const frame: React.CSSProperties = {
    background: "var(--ink-strong)",
    border: "2px solid var(--rule-strong-c)",
  };

  // ── reel ─────────────────────────────────────────────
  if (media.kind === "reel") {
    const href = hrefOverride ?? `/reels?reel=${media.id}`;
    return (
      <Link href={href} className={`block press ${cls}`} style={frame}>
        {media.poster_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.poster_url} alt={media.caption ?? "Featured reel"} className="w-full h-full object-cover" />
        ) : (
          <video src={media.video_url} muted playsInline preload="metadata" className="w-full h-full object-cover" />
        )}
        <KindPill label="REEL" />
        <PlayDot />
        {!compact && media.caption && (
          <div
            className="absolute inset-x-0 bottom-0 px-4 pt-10 pb-4 pointer-events-none"
            style={{ background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%)" }}
          >
            <p className="c-card-t line-clamp-2" style={{ fontSize: 14, color: "#fff" }}>
              {media.caption}
            </p>
          </div>
        )}
      </Link>
    );
  }

  // ── post (image) ─────────────────────────────────────
  if (media.kind === "post") {
    return (
      <Link href={`/pulse?post=${media.id}`} className={`block press ${cls}`} style={frame}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={media.image_url} alt={media.body ?? "Featured post"} className="w-full h-full object-cover" />
        <KindPill label="POST" />
        {!compact && media.body && (
          <div
            className="absolute inset-x-0 bottom-0 px-4 pt-10 pb-4 pointer-events-none"
            style={{ background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%)" }}
          >
            <p className="c-body line-clamp-2" style={{ fontSize: 13, color: "#fff" }}>
              {media.body}
            </p>
          </div>
        )}
      </Link>
    );
  }

  // ── exhibit (gallery image) ──────────────────────────
  if (media.kind === "exhibit") {
    return (
      <div className={`block ${cls}`} style={frame}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={media.image_url} alt={media.caption ?? "Featured exhibit"} className="w-full h-full object-cover" />
        <KindPill label="EXHIBIT" />
        {!compact && media.caption && (
          <div
            className="absolute inset-x-0 bottom-0 px-4 pt-10 pb-4 pointer-events-none"
            style={{ background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%)" }}
          >
            <p className="c-body line-clamp-2" style={{ fontSize: 13, color: "#fff" }}>
              {media.caption}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── video (Mux) ──────────────────────────────────────
  if (media.kind === "video") {
    return <VideoTile media={media} cls={cls} frame={frame} compact={compact} />;
  }

  // ── track (audio) ────────────────────────────────────
  return <TrackTile media={media} cls={cls} frame={frame} compact={compact} />;
}

function VideoTile({
  media,
  cls,
  frame,
  compact,
}: {
  media: Extract<FeaturedMedia, { kind: "video" }>;
  cls: string;
  frame: React.CSSProperties;
  compact: boolean;
}) {
  const [playing, setPlaying] = useState(false);

  if (playing && media.mux_playback_id) {
    return (
      <div className={cls} style={frame}>
        <MuxPlayer
          streamType="on-demand"
          playbackId={media.mux_playback_id}
          autoPlay
          accentColor="#F2A900"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      disabled={!media.mux_playback_id}
      className={`block press ${cls} text-left`}
      style={frame}
    >
      {media.thumbnail_url ? (
        <Image
          src={media.thumbnail_url}
          alt={media.title}
          fill
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover"
        />
      ) : (
        <div className="w-full h-full" style={{ background: "var(--ink-strong)" }} />
      )}
      <KindPill label="VIDEO" />
      <PlayDot />
      {!compact && media.title && (
        <div
          className="absolute inset-x-0 bottom-0 px-4 pt-10 pb-4 pointer-events-none"
          style={{ background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%)" }}
        >
          <p className="c-card-t line-clamp-2" style={{ fontSize: 14, color: "#fff" }}>
            {media.title}
          </p>
        </div>
      )}
    </button>
  );
}

function TrackTile({
  media,
  cls,
  frame,
  compact,
}: {
  media: Extract<FeaturedMedia, { kind: "track" }>;
  cls: string;
  frame: React.CSSProperties;
  compact: boolean;
}) {
  const { play, current, isPlaying, toggle } = useAudioPlay();
  const isCurrent = current?.id === media.id;
  const showPause = isCurrent && isPlaying;

  function onPlay(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!media.mux_playback_id) return;
    if (isCurrent) {
      toggle();
      return;
    }
    const item: PlayableItem = {
      id: media.id,
      kind: "track",
      title: media.title,
      subtitle: media.album_title ?? null,
      coverUrl: media.cover_art_url,
      muxPlaybackId: media.mux_playback_id,
      durationSeconds: media.duration_seconds ?? null,
      context: media.album_id
        ? { kind: "album", slug: media.album_id, title: media.album_title ?? "Album" }
        : null,
    };
    play(item);
  }

  return (
    <div className={cls} style={frame}>
      {media.cover_art_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={media.cover_art_url} alt={media.title} className="w-full h-full object-cover" />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ background: "var(--ink-strong)" }}
        >
          <Icon name="music" size={32} style={{ color: "var(--gold-c)" }} />
        </div>
      )}
      <KindPill label="TRACK" />
      <button
        type="button"
        onClick={onPlay}
        disabled={!media.mux_playback_id}
        aria-label={showPause ? "Pause" : "Play"}
        className="absolute inset-0 m-auto w-14 h-14 flex items-center justify-center press disabled:opacity-50"
        style={{
          background: "rgba(0,0,0,0.55)",
          border: "2px solid rgba(255,255,255,0.85)",
          borderRadius: "9999px",
          backdropFilter: "blur(4px)",
        }}
      >
        {showPause ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="#fff" aria-hidden>
            <rect x="3" y="2" width="4" height="14" />
            <rect x="11" y="2" width="4" height="14" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="#fff" aria-hidden>
            <path d="M5 3l11 7-11 7V3z" />
          </svg>
        )}
      </button>
      {!compact && (
        <div
          className="absolute inset-x-0 bottom-0 px-4 pt-10 pb-4 pointer-events-none"
          style={{ background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%)" }}
        >
          <p className="c-card-t line-clamp-1" style={{ fontSize: 14, color: "#fff" }}>
            {media.title}
          </p>
          {media.album_title && (
            <p className="c-meta line-clamp-1" style={{ fontSize: 11, color: "#fff", opacity: 0.8 }}>
              {media.album_title}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
