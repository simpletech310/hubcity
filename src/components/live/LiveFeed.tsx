"use client";

import { useState } from "react";
import Chip from "@/components/ui/Chip";
import LivePlayer from "./LivePlayer";
import CreateStreamModal from "./CreateStreamModal";
import StreamCard from "./StreamCard";
import type { LiveStream } from "@/types/database";
import Icon from "@/components/ui/Icon";

const categories = [
  { label: "All", value: "all" },
  { label: "Government", value: "government" },
  { label: "Sports", value: "sports" },
  { label: "Culture", value: "culture" },
  { label: "Education", value: "education" },
];

interface LiveFeedProps {
  streams: LiveStream[];
  canStream: boolean;
  userId: string | null;
}

export default function LiveFeed({ streams, canStream, userId }: LiveFeedProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [watchingStream, setWatchingStream] = useState<LiveStream | null>(null);

  const activeStreams = streams.filter((s) => s.status === "active");
  const upcomingStreams = streams.filter((s) => s.status === "idle");

  const filteredUpcoming =
    activeCategory === "all"
      ? upcomingStreams
      : upcomingStreams.filter((s) => s.category === activeCategory);

  const filteredActive =
    activeCategory === "all"
      ? activeStreams
      : activeStreams.filter((s) => s.category === activeCategory);

  // If watching a stream, show the player
  if (watchingStream && watchingStream.mux_playback_id) {
    return (
      <LivePlayer
        stream={watchingStream}
        onBack={() => setWatchingStream(null)}
      />
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-4 mb-5">
        <p className="c-kicker mb-1" style={{ fontSize: 10 }}>§ BROADCAST</p>
        <h1 className="c-hero mb-1" style={{ fontSize: 32 }}>LIVE</h1>
        <p className="c-serif-it" style={{ fontSize: 14 }}>
          Stream Compton events in real-time.
        </p>
      </div>

      {/* Live Now Banner */}
      <div className="px-5 mb-6">
        {activeStreams.length > 0 ? (
          <div
            className="relative overflow-hidden p-4"
            style={{
              background: "var(--paper)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--ink-strong)",
            }}
          >
            <div style={{ height: 3, background: "#E84855", marginTop: -16, marginLeft: -16, marginRight: -16, marginBottom: 12 }} />
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 flex items-center justify-center shrink-0"
                style={{ background: "#E84855", border: "2px solid var(--rule-strong-c)" }}
              >
                <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="c-card-t" style={{ fontSize: 13 }}>
                    {activeStreams.length} LIVE NOW!
                  </p>
                  <span className="c-badge-live" style={{ fontSize: 9 }}>LIVE</span>
                </div>
                <p className="c-meta">
                  Tap a stream below to watch
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="relative overflow-hidden p-4"
            style={{
              background: "var(--paper)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--ink-strong)",
            }}
          >
            <div style={{ height: 3, background: "var(--rule-strong-c)", opacity: 0.3, marginTop: -16, marginLeft: -16, marginRight: -16, marginBottom: 12 }} />
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 flex items-center justify-center shrink-0"
                style={{ border: "2px solid var(--rule-strong-c)" }}
              >
                <div className="w-3 h-3 rounded-full" style={{ background: "var(--rule-strong-c)", opacity: 0.3 }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="c-card-t" style={{ fontSize: 13 }}>NO LIVE STREAMS</p>
                  <span className="c-badge-ink" style={{ fontSize: 9 }}>OFFLINE</span>
                </div>
                <p className="c-meta">
                  {upcomingStreams.length > 0
                    ? "Check the schedule below"
                    : "No streams scheduled yet"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-5 mb-5 overflow-x-auto scrollbar-hide pb-1">
        {categories.map((cat) => (
          <Chip
            key={cat.value}
            label={cat.label}
            active={activeCategory === cat.value}
            onClick={() => setActiveCategory(cat.value)}
          />
        ))}
      </div>

      {/* Active Streams */}
      {filteredActive.length > 0 && (
        <div className="px-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="c-card-t" style={{ fontSize: 14 }}>LIVE NOW</h2>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#E84855" }} />
            </div>
          </div>
          <div className="space-y-3 stagger">
            {filteredActive.map((stream) => (
              <StreamCard
                key={stream.id}
                stream={stream}
                isLive
                onWatch={() => setWatchingStream(stream)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Streams */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="c-card-t" style={{ fontSize: 14 }}>
            {upcomingStreams.length > 0 ? "UPCOMING STREAMS" : "SCHEDULED"}
          </h2>
          <span className="c-meta">
            {filteredUpcoming.length} scheduled
          </span>
        </div>

        {filteredUpcoming.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-3"><Icon name="pulse" size={28} /></p>
            <p className="c-body">
              No streams scheduled yet
            </p>
          </div>
        ) : (
          <div className="space-y-3 stagger">
            {filteredUpcoming.map((stream) => (
              <StreamCard
                key={stream.id}
                stream={stream}
                onWatch={() => {
                  if (stream.status === "active") setWatchingStream(stream);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* How It Works section */}
      <div className="px-5 mt-8 mb-4">
        <div
          className="relative overflow-hidden p-6"
          style={{
            background: "var(--paper)",
            border: "2px solid var(--rule-strong-c)",
            color: "var(--ink-strong)",
          }}
        >
          <div style={{ height: 4, background: "var(--gold-c)", marginTop: -24, marginLeft: -24, marginRight: -24, marginBottom: 16 }} />
          <div className="relative">
            <h3 className="c-hero mb-3 text-center" style={{ fontSize: 22 }}>
              HOW LIVE STREAMING WORKS
            </h3>
            <div className="space-y-3 c-body" style={{ fontSize: 12 }}>
              <div className="flex items-start gap-3">
                <span
                  className="w-6 h-6 flex items-center justify-center c-card-t shrink-0 mt-0.5"
                  style={{
                    background: "var(--gold-c)",
                    color: "var(--ink-strong)",
                    border: "1.5px solid var(--rule-strong-c)",
                    fontSize: 10,
                  }}
                >1</span>
                <p>Admin or city official creates a stream from this page</p>
              </div>
              <div className="flex items-start gap-3">
                <span
                  className="w-6 h-6 flex items-center justify-center c-card-t shrink-0 mt-0.5"
                  style={{
                    background: "var(--gold-c)",
                    color: "var(--ink-strong)",
                    border: "1.5px solid var(--rule-strong-c)",
                    fontSize: 10,
                  }}
                >2</span>
                <p>Copy the RTMP URL + Stream Key into OBS, Streamyard, or a phone streaming app</p>
              </div>
              <div className="flex items-start gap-3">
                <span
                  className="w-6 h-6 flex items-center justify-center c-card-t shrink-0 mt-0.5"
                  style={{
                    background: "var(--gold-c)",
                    color: "var(--ink-strong)",
                    border: "1.5px solid var(--rule-strong-c)",
                    fontSize: 10,
                  }}
                >3</span>
                <p>Start broadcasting — the stream appears live for all Culture users</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAB - Create Stream (admins/officials only) */}
      {canStream && (
        <button
          onClick={() => setCreateOpen(true)}
          className="fixed bottom-24 right-4 w-14 h-14 rounded-full flex items-center justify-center text-white press z-40 hover:scale-105 transition-transform"
          style={{
            background: "#E84855",
            border: "3px solid var(--rule-strong-c)",
            maxWidth: "calc((430px - 2rem) + 2rem)",
            right: "max(1rem, calc((100vw - 430px) / 2 + 1rem))",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        </button>
      )}

      {/* Create Stream Modal */}
      {canStream && (
        <CreateStreamModal
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </div>
  );
}
