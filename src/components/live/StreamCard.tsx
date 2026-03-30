"use client";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { LiveStream } from "@/types/database";

const CATEGORY_BADGE: Record<string, { label: string; variant: "gold" | "blue" | "coral" | "emerald" | "cyan" | "purple" | "pink" }> = {
  government: { label: "Government", variant: "cyan" },
  sports: { label: "Sports", variant: "emerald" },
  culture: { label: "Culture", variant: "pink" },
  education: { label: "Education", variant: "blue" },
  community: { label: "Community", variant: "purple" },
};

const CATEGORY_GRADIENT: Record<string, string> = {
  government: "from-cyan/20 to-blue-500/20",
  sports: "from-emerald/20 to-green-500/20",
  culture: "from-pink/20 to-coral/20",
  education: "from-blue-400/20 to-indigo-500/20",
  community: "from-purple-400/20 to-violet-500/20",
};

interface StreamCardProps {
  stream: LiveStream;
  isLive?: boolean;
  onWatch?: () => void;
}

export default function StreamCard({ stream, isLive, onWatch }: StreamCardProps) {
  const badge = CATEGORY_BADGE[stream.category] || CATEGORY_BADGE.community;
  const gradient = CATEGORY_GRADIENT[stream.category] || CATEGORY_GRADIENT.community;

  const scheduledDate = stream.scheduled_at
    ? new Date(stream.scheduled_at).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <Card
      hover={isLive}
      className={isLive ? "border-coral/30 cursor-pointer" : ""}
      onClick={isLive ? onWatch : undefined}
    >
      <div className="flex gap-3">
        {/* Thumbnail / art */}
        <div
          className={`w-20 h-[60px] rounded-xl bg-gradient-to-br ${gradient} shrink-0 relative overflow-hidden flex items-center justify-center`}
        >
          {isLive ? (
            <>
              <div className="absolute inset-0 bg-midnight/20" />
              <div className="relative flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-coral/30 flex items-center justify-center animate-pulse">
                  <svg width="14" height="16" viewBox="0 0 12 14" fill="white">
                    <polygon points="0,0 12,7 0,14" />
                  </svg>
                </div>
              </div>
              {/* Live dot */}
              <div className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-coral/90 rounded-full px-1.5 py-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[8px] text-white font-bold">LIVE</span>
              </div>
            </>
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <svg width="12" height="14" viewBox="0 0 12 14" fill="white" opacity={0.5}>
                <polygon points="0,0 12,7 0,14" />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-[13px] mb-1 line-clamp-1">
            {stream.title}
          </h3>
          {scheduledDate && (
            <p className="text-[11px] text-txt-secondary mb-1.5">
              {isLive ? "🔴 Started " : "📅 "}
              {scheduledDate}
            </p>
          )}
          <div className="flex items-center gap-2">
            <Badge label={badge.label} variant={badge.variant} />
            {isLive && (
              <span className="text-[10px] text-coral font-semibold">
                ● Tap to watch
              </span>
            )}
            {stream.creator?.display_name && (
              <span className="text-[10px] text-txt-secondary truncate">
                by {stream.creator.display_name}
              </span>
            )}
          </div>
        </div>

        {/* Action */}
        {isLive ? (
          <button
            onClick={onWatch}
            className="self-center px-3 py-1.5 rounded-full bg-coral/20 text-coral text-[11px] font-bold press hover:bg-coral/30 transition-colors shrink-0"
          >
            Watch
          </button>
        ) : (
          <div className="self-center w-8 h-8 rounded-full bg-white/[0.06] border border-border-subtle flex items-center justify-center text-txt-secondary shrink-0">
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="7" cy="7" r="6" />
              <path d="M7 4v3l2 1" />
            </svg>
          </div>
        )}
      </div>
    </Card>
  );
}
