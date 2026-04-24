"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import Icon from "@/components/ui/Icon";

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
      {/* Header — kicker + LIVE badge on paper */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 px-2 c-kicker"
            style={{
              background: "var(--gold-c)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--ink-strong)",
              fontSize: 10,
              height: 22,
              letterSpacing: "0.14em",
            }}
          >
            <span
              className="animate-pulse"
              style={{
                width: 6,
                height: 6,
                background: "var(--ink-strong)",
                display: "inline-block",
              }}
            />
            LIVE NOW · {streams.length}
          </span>
        </div>
        <Link
          href="/live"
          className="c-kicker press inline-flex items-center gap-1"
          style={{ color: "var(--gold-c)", fontSize: 10 }}
        >
          ALL STREAMS ↗
        </Link>
      </div>

      {/* Stream cards — printed list */}
      <div className="space-y-3">
        {streams.map((stream) => (
          <div key={stream.id}>
            <button
              onClick={() =>
                setExpanded(expanded === stream.id ? null : stream.id)
              }
              className="w-full text-left"
            >
              <div
                className="relative overflow-hidden"
                style={{
                  background: "var(--paper)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                <div className="flex items-center gap-3 p-4">
                  {/* Ink tile w/ play */}
                  <div
                    className="flex items-center justify-center shrink-0 relative"
                    style={{
                      width: 48,
                      height: 48,
                      background: "var(--ink-strong)",
                      border: "2px solid var(--rule-strong-c)",
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--gold-c)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="6 4 20 12 6 20 6 4" />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3
                      className="c-card-t truncate"
                      style={{ fontSize: 14, color: "var(--ink-strong)" }}
                    >
                      {stream.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="c-badge c-badge-ink"
                        style={{ fontSize: 9 }}
                      >
                        {stream.category.toUpperCase()}
                      </span>
                      <span
                        className="c-kicker inline-flex items-center gap-1"
                        style={{ fontSize: 9, opacity: 0.65 }}
                      >
                        <Icon name="live" size={10} />
                        BROADCASTING
                      </span>
                    </div>
                  </div>

                  {/* Watch CTA */}
                  <span
                    className="c-btn c-btn-primary c-btn-sm shrink-0"
                  >
                    {expanded === stream.id ? "HIDE" : "WATCH"}
                  </span>
                </div>
              </div>
            </button>

            {/* Expanded player — keep dark, paper-framed */}
            {expanded === stream.id && stream.mux_playback_id && (
              <div
                className="mt-2 overflow-hidden animate-fade-in"
                style={{ border: "2px solid var(--rule-strong-c)" }}
              >
                <MuxPlayer
                  playbackId={stream.mux_playback_id}
                  streamType="live"
                  autoPlay="muted"
                  accentColor="#F2A900"
                  style={{ aspectRatio: "16/9", width: "100%" }}
                  metadata={{
                    video_title: stream.title,
                    viewer_user_id: "knect-home",
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
