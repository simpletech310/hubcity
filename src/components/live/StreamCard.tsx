"use client";

import type { LiveStream } from "@/types/database";

interface StreamCardProps {
  stream: LiveStream;
  isLive?: boolean;
  onWatch?: () => void;
}

export default function StreamCard({ stream, isLive, onWatch }: StreamCardProps) {
  const categoryLabel = stream.category.toUpperCase();

  const scheduledDate = stream.scheduled_at
    ? new Date(stream.scheduled_at)
        .toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
        .toUpperCase()
    : null;

  return (
    <div
      onClick={isLive ? onWatch : undefined}
      className={isLive ? "cursor-pointer press" : ""}
      style={{
        background: "var(--paper)",
        border: "2px solid var(--rule-strong-c)",
        padding: 12,
      }}
    >
      <div className="flex gap-3">
        {/* Thumbnail — ink frame */}
        <div
          className="w-20 h-[60px] shrink-0 relative overflow-hidden flex items-center justify-center"
          style={{
            background: "var(--ink-strong)",
            border: "2px solid var(--rule-strong-c)",
          }}
        >
          {stream.mux_playback_id && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://image.mux.com/${stream.mux_playback_id}/thumbnail.webp?width=160&height=120&time=5`}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {isLive ? (
            <>
              <div className="absolute inset-0" style={{ background: "rgba(26,21,18,0.35)" }} />
              <div
                className="relative flex items-center justify-center animate-pulse"
                style={{
                  width: 32,
                  height: 32,
                  background: "var(--gold-c)",
                  border: "2px solid var(--paper)",
                }}
              >
                <svg width="12" height="14" viewBox="0 0 12 14" fill="var(--ink-strong)">
                  <polygon points="0,0 12,7 0,14" />
                </svg>
              </div>
              {/* LIVE chip top-right */}
              <div
                className="absolute top-1 right-1 inline-flex items-center gap-1 px-1 c-kicker"
                style={{
                  background: "var(--paper)",
                  border: "1.5px solid var(--rule-strong-c)",
                  color: "var(--ink-strong)",
                  fontSize: 8,
                  height: 15,
                }}
              >
                <span
                  className="animate-pulse"
                  style={{
                    width: 4,
                    height: 4,
                    background: "var(--gold-c)",
                    display: "inline-block",
                  }}
                />
                LIVE
              </div>
            </>
          ) : (
            <>
              <div
                className="relative flex items-center justify-center"
                style={{
                  width: 28,
                  height: 28,
                  background: "var(--paper)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                <svg width="10" height="12" viewBox="0 0 12 14" fill="var(--ink-strong)">
                  <polygon points="0,0 12,7 0,14" />
                </svg>
              </div>
            </>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3
            className="c-card-t line-clamp-1"
            style={{ fontSize: 13, color: "var(--ink-strong)" }}
          >
            {stream.title}
          </h3>
          {scheduledDate && (
            <p className="c-kicker mt-1" style={{ fontSize: 9, opacity: 0.65 }}>
              {isLive ? "STARTED " : ""}
              {scheduledDate}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="c-badge c-badge-ink" style={{ fontSize: 9 }}>
              {categoryLabel}
            </span>
            {stream.creator?.display_name && (
              <span
                className="c-kicker truncate"
                style={{ fontSize: 9, opacity: 0.55 }}
              >
                BY {stream.creator.display_name.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Action */}
        {isLive ? (
          <button
            onClick={onWatch}
            className="c-btn c-btn-primary c-btn-sm shrink-0 self-center"
          >
            WATCH
          </button>
        ) : (
          <div
            className="self-center flex items-center justify-center shrink-0"
            style={{
              width: 32,
              height: 32,
              background: "var(--paper)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--ink-strong)",
            }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="7" cy="7" r="6" />
              <path d="M7 4v3l2 1" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
