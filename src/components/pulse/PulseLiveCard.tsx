"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { LiveStream } from "@/types/database";

const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), {
  ssr: false,
});

interface PulseLiveCardProps {
  stream: LiveStream;
}

export default function PulseLiveCard({ stream }: PulseLiveCardProps) {
  const [watching, setWatching] = useState(false);

  const creatorInitials = stream.creator?.display_name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "K";

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: "var(--paper)",
        border: "2px solid var(--rule-strong-c)",
        color: "var(--ink-strong)",
      }}
    >
      {/* Top accent — gold foil bar */}
      <div style={{ height: 4, background: "var(--gold-c)" }} />

      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        {/* Avatar with live indicator */}
        <div className="relative">
          {stream.creator?.avatar_url ? (
            <img
              src={stream.creator.avatar_url}
              alt={stream.creator.display_name}
              className="w-10 h-10 rounded-full object-cover"
              style={{ border: "2px solid var(--rule-strong-c)" }}
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center c-card-t"
              style={{
                background: "var(--gold-c)",
                color: "var(--ink-strong)",
                border: "2px solid var(--rule-strong-c)",
                fontSize: 13,
              }}
            >
              {creatorInitials}
            </div>
          )}
          <div
            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: "#E84855", border: "2px solid var(--paper)" }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="c-card-t truncate" style={{ fontSize: 13 }}>
              {stream.creator?.display_name || "Culture"}
            </p>
            <span className="c-badge-live" style={{ fontSize: 9 }}>LIVE</span>
          </div>
          <p className="c-meta">Broadcasting now</p>
        </div>

        <span className="c-badge-ink" style={{ fontSize: 9 }}>
          {stream.category.charAt(0).toUpperCase() + stream.category.slice(1)}
        </span>
      </div>

      {/* Stream title */}
      <div
        className="px-4 pb-3"
        style={{ borderTop: "2px solid var(--rule-strong-c)", paddingTop: 12 }}
      >
        <p className="c-card-t" style={{ fontSize: 13 }}>
          {stream.title}
        </p>
        {stream.description && (
          <p className="c-body-sm mt-1 line-clamp-2" style={{ fontSize: 11 }}>
            {stream.description}
          </p>
        )}
      </div>

      {/* Player or thumbnail — player canvas stays dark (Mux video) */}
      {watching && stream.mux_playback_id ? (
        <div
          className="mx-4 mb-4 overflow-hidden"
          style={{ border: "2px solid var(--rule-strong-c)" }}
        >
          <MuxPlayer
            playbackId={stream.mux_playback_id}
            streamType="live"
            autoPlay="muted"
            accentColor="#E84855"
            style={{ aspectRatio: "16/9", width: "100%" }}
            metadata={{
              video_title: stream.title,
              viewer_user_id: "knect-pulse",
            }}
          />
        </div>
      ) : (
        <button
          onClick={() => setWatching(true)}
          className="w-full px-4 pb-4"
        >
          {/* Thumbnail canvas stays dark — this is a video surface */}
          <div
            className="relative overflow-hidden aspect-video flex flex-col items-center justify-center group transition-colors"
            style={{
              background: "var(--ink-strong)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            {/* Animated circles */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full animate-ping opacity-20" style={{ border: "1px solid #E84855" }} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full animate-pulse opacity-10" style={{ border: "1px solid #E84855" }} />
            </div>

            {/* Play button */}
            <div
              className="relative w-16 h-16 rounded-full flex items-center justify-center transition-colors mb-2"
              style={{ background: "rgba(232,72,85,0.25)" }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="white"
              >
                <polygon points="8,5 19,12 8,19" />
              </svg>
            </div>
            <span className="c-card-t" style={{ fontSize: 11, color: "#E84855" }}>
              TAP TO WATCH LIVE
            </span>

            {/* Live badge */}
            <div
              className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1"
              style={{ background: "#E84855", border: "1.5px solid var(--paper)" }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="c-kicker" style={{ fontSize: 9, color: "#fff" }}>
                LIVE
              </span>
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
