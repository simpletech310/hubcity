"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface LiveStream {
  id: string;
  title: string;
  status: "live" | "ended" | "scheduled";
  viewer_count: number;
  scheduled_at?: string | null;
  ended_at?: string | null;
  created_at: string;
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function LivePage() {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStreams() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("live_streams")
          .select("id, title, status, viewer_count, scheduled_at, ended_at, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (data) {
          const mapped = data as LiveStream[];
          setStreams(mapped);
          setIsLive(mapped.some((s) => s.status === "live"));
        }
      } finally {
        setLoading(false);
      }
    }

    fetchStreams();
  }, []);

  const liveStreams = streams.filter((s) => s.status === "live");
  const scheduledStreams = streams.filter((s) => s.status === "scheduled");
  const recentStreams = streams.filter((s) => s.status === "ended").slice(0, 5);

  return (
    <div className="px-4 py-5 space-y-4">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-lg text-white">Live</h1>
        <p className="text-xs text-white/40 mt-0.5">Stream to your audience in real time</p>
      </div>

      {/* Live status card */}
      <div
        className={`rounded-2xl p-5 border ${
          isLive
            ? "bg-coral/10 border-coral/30"
            : "glass-card border-border-subtle"
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          {isLive ? (
            <>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-coral" />
              </span>
              <span className="text-sm font-bold text-coral uppercase tracking-widest">
                Live Now
              </span>
            </>
          ) : (
            <>
              <span className="w-3 h-3 rounded-full bg-white/20" />
              <span className="text-sm font-semibold text-white/60">
                You&apos;re not live
              </span>
            </>
          )}
        </div>

        {!isLive && (
          <p className="text-xs text-white/40 mb-4">
            Go live to connect with your audience right now. They&apos;ll get
            notified the moment you start.
          </p>
        )}

        <Link
          href="/live/start"
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            isLive
              ? "bg-coral/20 border border-coral/40 text-coral"
              : "bg-gradient-to-r from-gold to-gold-light text-midnight"
          }`}
        >
          <svg
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 24 24"
            className={isLive ? "text-coral" : "text-midnight"}
          >
            <circle cx="12" cy="12" r="10" />
          </svg>
          {isLive ? "End Stream" : "Go Live"}
        </Link>
      </div>

      {/* Currently live streams */}
      {loading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-2xl skeleton border border-border-subtle"
            />
          ))}
        </div>
      )}

      {!loading && liveStreams.length > 0 && (
        <div>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-3">
            Active Streams
          </h2>
          <div className="space-y-2">
            {liveStreams.map((stream) => (
              <Card key={stream.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-coral" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {stream.title}
                    </p>
                    <p className="text-xs text-white/40 mt-0.5">
                      Started {timeAgo(stream.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-3">
                  <svg
                    width="12"
                    height="12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="text-gold"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="text-sm font-bold text-gold">
                    {stream.viewer_count ?? 0}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Scheduled streams */}
      {!loading && scheduledStreams.length > 0 && (
        <div>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-3">
            Scheduled
          </h2>
          <div className="space-y-2">
            {scheduledStreams.map((stream) => (
              <Card key={stream.id} className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {stream.title}
                  </p>
                  {stream.scheduled_at && (
                    <p className="text-xs text-white/40 mt-0.5">
                      {formatDate(stream.scheduled_at)}
                    </p>
                  )}
                </div>
                <Badge label="Scheduled" variant="cyan" size="sm" />
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent streams */}
      {!loading && (
        <div>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-3">
            Recent Streams
          </h2>
          {recentStreams.length === 0 ? (
            <Card className="text-center py-6">
              <p className="text-sm text-white/40">No past streams yet</p>
              <p className="text-xs text-white/25 mt-1">
                Your stream history will appear here
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentStreams.map((stream) => (
                <Card key={stream.id} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {stream.title}
                    </p>
                    <p className="text-xs text-white/40 mt-0.5">
                      {timeAgo(stream.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-3">
                    <svg
                      width="12"
                      height="12"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      className="text-white/30"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="text-sm font-semibold text-white/50">
                      {stream.viewer_count ?? 0}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
