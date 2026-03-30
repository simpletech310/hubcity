"use client";

import { useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import dynamic from "next/dynamic";

const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), {
  ssr: false,
});

interface LiveStream {
  id: string;
  title: string;
  category: string;
  mux_playback_id: string | null;
  status: string;
  viewer_count: number;
}

interface LiveNowBannerProps {
  streams: LiveStream[];
}

export default function LiveNowBanner({ streams }: LiveNowBannerProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (streams.length === 0) return null;

  return (
    <section className="px-5 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-coral animate-pulse" />
          <span className="font-heading font-bold text-sm">Live Now</span>
          <Badge label={`${streams.length} LIVE`} variant="coral" shine />
        </div>
        <Link
          href="/live"
          className="text-[11px] text-gold font-semibold press flex items-center gap-1"
        >
          All Streams
          <svg
            width="12"
            height="12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M4.5 2.5l3.5 3.5-3.5 3.5" />
          </svg>
        </Link>
      </div>

      {/* Stream cards */}
      <div className="space-y-3">
        {streams.map((stream) => (
          <div key={stream.id}>
            {/* Card */}
            <button
              onClick={() =>
                setExpanded(expanded === stream.id ? null : stream.id)
              }
              className="w-full text-left"
            >
              <div className="relative rounded-2xl overflow-hidden border border-coral/30 bg-gradient-to-r from-coral/10 via-card to-card hover:from-coral/15 transition-colors">
                {/* Top accent */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-coral via-pink to-transparent" />

                <div className="flex items-center gap-3 p-4">
                  {/* Live indicator */}
                  <div className="w-12 h-12 rounded-xl bg-coral/20 flex items-center justify-center shrink-0 relative">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect
                        x="1"
                        y="5"
                        width="15"
                        height="14"
                        rx="2"
                        ry="2"
                      />
                    </svg>
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-coral animate-pulse border-2 border-card" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold text-[13px] truncate mb-0.5">
                      {stream.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge
                        label={
                          stream.category.charAt(0).toUpperCase() +
                          stream.category.slice(1)
                        }
                        variant="coral"
                      />
                      <span className="text-[10px] text-txt-secondary">
                        🔴 Broadcasting live
                      </span>
                    </div>
                  </div>

                  {/* Watch button */}
                  <div className="shrink-0">
                    <span className="px-3 py-1.5 rounded-full bg-coral text-white text-[11px] font-bold">
                      {expanded === stream.id ? "Hide" : "Watch"}
                    </span>
                  </div>
                </div>
              </div>
            </button>

            {/* Expanded player */}
            {expanded === stream.id && stream.mux_playback_id && (
              <div className="mt-2 rounded-2xl overflow-hidden border border-border-subtle shadow-lg shadow-black/40 animate-fade-in">
                <MuxPlayer
                  playbackId={stream.mux_playback_id}
                  streamType="live"
                  autoPlay="muted"
                  accentColor="#E84855"
                  style={{ aspectRatio: "16/9", width: "100%" }}
                  metadata={{
                    video_title: stream.title,
                    viewer_user_id: "hubcity-home",
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
