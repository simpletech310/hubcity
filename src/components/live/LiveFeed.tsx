"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
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
        <h1 className="font-heading text-2xl font-bold mb-1">Live</h1>
        <p className="text-sm text-txt-secondary">
          Stream Compton events in real-time
        </p>
      </div>

      {/* Live Now Banner */}
      <div className="px-5 mb-6">
        {activeStreams.length > 0 ? (
          <Card className="bg-gradient-to-r from-coral/20 to-pink/15 border-coral/30 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-coral via-pink to-transparent" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-coral/20 flex items-center justify-center shrink-0">
                <div className="w-3 h-3 rounded-full bg-coral animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-bold">
                    {activeStreams.length} Live Now!
                  </p>
                  <Badge label="LIVE" variant="coral" shine />
                </div>
                <p className="text-[11px] text-txt-secondary">
                  Tap a stream below to watch
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="bg-gradient-to-r from-coral/10 to-pink/10 border-coral/15 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-coral/40 via-pink/20 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-coral/15 flex items-center justify-center shrink-0">
                <div className="w-3 h-3 rounded-full bg-white/30" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-bold">No Live Streams</p>
                  <Badge label="Offline" variant="coral" />
                </div>
                <p className="text-[11px] text-txt-secondary">
                  {upcomingStreams.length > 0
                    ? "Check the schedule below"
                    : "No streams scheduled yet"}
                </p>
              </div>
            </div>
          </Card>
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
              <h2 className="font-heading font-bold text-base">Live Now</h2>
              <div className="w-2 h-2 rounded-full bg-coral animate-pulse" />
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
          <h2 className="font-heading font-bold text-base">
            {upcomingStreams.length > 0 ? "Upcoming Streams" : "Scheduled"}
          </h2>
          <span className="text-[11px] text-txt-secondary">
            {filteredUpcoming.length} scheduled
          </span>
        </div>

        {filteredUpcoming.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-3"><Icon name="pulse" size={28} /></p>
            <p className="text-sm text-txt-secondary">
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
        <div className="relative rounded-2xl overflow-hidden p-6 bg-gradient-to-br from-royal/40 via-deep to-midnight border border-gold/10">
          <div className="pattern-dots absolute inset-0 opacity-20" />
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center mx-auto mb-4 animate-float">
              <span className="text-3xl">•</span>
            </div>
            <h3 className="font-heading font-bold text-lg mb-3 text-center">
              How Live Streaming Works
            </h3>
            <div className="space-y-3 text-[12px] text-txt-secondary leading-relaxed">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-gold/15 text-gold flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                <p>Admin or city official creates a stream from this page</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-gold/15 text-gold flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                <p>Copy the RTMP URL + Stream Key into OBS, Streamyard, or a phone streaming app</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-gold/15 text-gold flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
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
          className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-coral to-pink shadow-lg shadow-coral/30 flex items-center justify-center text-white press z-40 hover:scale-105 transition-transform"
          style={{
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
