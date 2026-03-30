"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
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
    .toUpperCase() || "HC";

  return (
    <Card className="border-coral/25 relative overflow-hidden !p-0">
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-coral via-pink to-transparent z-10" />

      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        {/* Avatar with live indicator */}
        <div className="relative">
          {stream.creator?.avatar_url ? (
            <img
              src={stream.creator.avatar_url}
              alt={stream.creator.display_name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-coral/30"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral/30 to-pink/30 flex items-center justify-center text-white font-heading font-bold text-sm ring-2 ring-coral/30">
              {creatorInitials}
            </div>
          )}
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-coral flex items-center justify-center ring-2 ring-card">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-bold truncate">
              {stream.creator?.display_name || "Hub City"}
            </p>
            <Badge label="LIVE" variant="coral" shine />
          </div>
          <p className="text-[10px] text-txt-secondary">Broadcasting now</p>
        </div>

        <Badge
          label={
            stream.category.charAt(0).toUpperCase() + stream.category.slice(1)
          }
          variant="purple"
        />
      </div>

      {/* Stream title */}
      <div className="px-4 pb-3">
        <p className="text-[13px] font-semibold leading-snug">
          {stream.title}
        </p>
        {stream.description && (
          <p className="text-[11px] text-txt-secondary mt-1 line-clamp-2">
            {stream.description}
          </p>
        )}
      </div>

      {/* Player or thumbnail */}
      {watching && stream.mux_playback_id ? (
        <div className="mx-4 mb-4 rounded-xl overflow-hidden border border-border-subtle">
          <MuxPlayer
            playbackId={stream.mux_playback_id}
            streamType="live"
            autoPlay="muted"
            accentColor="#E84855"
            style={{ aspectRatio: "16/9", width: "100%" }}
            metadata={{
              video_title: stream.title,
              viewer_user_id: "hubcity-pulse",
            }}
          />
        </div>
      ) : (
        <button
          onClick={() => setWatching(true)}
          className="w-full px-4 pb-4"
        >
          <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-coral/15 via-midnight to-pink/10 aspect-video flex flex-col items-center justify-center border border-coral/20 group hover:border-coral/40 transition-colors">
            {/* Animated circles */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border border-coral/10 animate-ping opacity-20" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border border-coral/5 animate-pulse opacity-10" />
            </div>

            {/* Play button */}
            <div className="relative w-16 h-16 rounded-full bg-coral/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-coral/30 transition-colors mb-2">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="white"
              >
                <polygon points="8,5 19,12 8,19" />
              </svg>
            </div>
            <span className="relative text-xs font-bold text-coral">
              Tap to Watch Live
            </span>

            {/* Live badge */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-coral/90 rounded-full px-2.5 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="text-[10px] text-white font-bold tracking-wider">
                LIVE
              </span>
            </div>
          </div>
        </button>
      )}
    </Card>
  );
}
