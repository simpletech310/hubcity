"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Badge from "@/components/ui/Badge";
import VideoAdOverlay from "@/components/ads/VideoAdOverlay";
import type { LiveStream } from "@/types/database";

const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), {
  ssr: false,
});

interface LivePlayerProps {
  stream: LiveStream;
  onBack: () => void;
}

export default function LivePlayer({ stream, onBack }: LivePlayerProps) {
  const [adComplete, setAdComplete] = useState(false);

  return (
    <div className="animate-fade-in">
      {/* Back header */}
      <div className="flex items-center gap-3 px-5 pt-4 mb-4">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/[0.06] border border-border-subtle flex items-center justify-center text-txt-secondary press hover:text-white transition-colors"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-base truncate">
            {stream.title}
          </h1>
        </div>
        {stream.status === "active" && (
          <Badge label="LIVE" variant="coral" shine />
        )}
      </div>

      {/* Player */}
      <div className="px-5 mb-4">
        <div className="rounded-2xl overflow-hidden border border-border-subtle shadow-lg shadow-black/40 relative">
          {/* Pre-roll ad overlay for live streams */}
          {!adComplete && (
            <VideoAdOverlay
              contentId={stream.id}
              onAdComplete={() => setAdComplete(true)}
              zone="video_preroll"
            />
          )}

          {stream.mux_playback_id ? (
            <MuxPlayer
              playbackId={stream.mux_playback_id}
              streamType={stream.status === "active" ? "live" : "on-demand"}
              autoPlay={adComplete ? "muted" : false}
              accentColor="#D4A017"
              style={{ aspectRatio: "16/9", width: "100%" }}
              metadata={{
                video_title: stream.title,
                viewer_user_id: "hubcity-viewer",
              }}
            />
          ) : (
            <div className="aspect-video bg-gradient-to-br from-midnight to-deep flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-txt-secondary">
                  Waiting for stream...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stream Info */}
      <div className="px-5 space-y-4">
        {/* Title + description */}
        <div>
          <h2 className="font-heading font-bold text-lg mb-1">
            {stream.title}
          </h2>
          {stream.description && (
            <p className="text-sm text-txt-secondary leading-relaxed">
              {stream.description}
            </p>
          )}
        </div>

        {/* Stream details */}
        <div className="flex items-center gap-3 flex-wrap">
          <Badge
            label={stream.category.charAt(0).toUpperCase() + stream.category.slice(1)}
            variant={stream.status === "active" ? "coral" : "blue"}
          />
          {stream.creator?.display_name && (
            <div className="flex items-center gap-2 text-sm text-txt-secondary">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-royal to-hc-purple flex items-center justify-center text-gold font-heading text-[10px] font-bold">
                {stream.creator.display_name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <span className="text-xs">{stream.creator.display_name}</span>
            </div>
          )}
        </div>

        {/* Status card */}
        {stream.status === "active" && (
          <div className="rounded-xl bg-coral/10 border border-coral/20 p-4 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-coral animate-pulse shrink-0" />
            <div>
              <p className="text-sm font-semibold text-coral">
                Broadcasting Live
              </p>
              <p className="text-[11px] text-txt-secondary">
                Stream is active — enjoy the show!
              </p>
            </div>
          </div>
        )}

        {stream.status === "idle" && (
          <div className="rounded-xl bg-gold/10 border border-gold/20 p-4 flex items-center gap-3">
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-gold shrink-0"
            >
              <circle cx="9" cy="9" r="8" />
              <path d="M9 5v4l2.5 1.5" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-gold">
                Stream Scheduled
              </p>
              <p className="text-[11px] text-txt-secondary">
                Waiting for broadcaster to go live
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
