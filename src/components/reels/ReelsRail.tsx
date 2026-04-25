"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import ReelsViewer from "./ReelsViewer";
import type { Reel } from "@/types/database";

interface ReelsRailProps {
  reels: Reel[];
  /** Header label — defaults to "Reels" */
  label?: string;
  /** Show a "See all" link to /reels */
  showSeeAll?: boolean;
  /** When true, a "+ Post" tile appears (for profile own view) */
  canPost?: boolean;
  /** Callback when user taps the + tile */
  onPost?: () => void;
}

function accentFor(role?: string | null) {
  switch (role) {
    case "content_creator":
    case "creator":
      return "#FF6B6B";
    case "business_owner":
      return "#22C55E";
    case "city_ambassador":
      return "#8B5CF6";
    case "school":
      return "#22C55E";
    case "city_official":
    case "admin":
      return "#F2A900";
    default:
      return "#F2A900";
  }
}

export default function ReelsRail({
  reels,
  label = "Reels",
  showSeeAll = true,
  canPost = false,
  onPost,
}: ReelsRailProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Group: if the same author posted multiple reels, keep the newest first.
  // Keep the full ordered list for the viewer (they all play sequentially).
  const ordered = useMemo(() => reels, [reels]);

  if (reels.length === 0 && !canPost) return null;

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center justify-between px-5 mb-2.5">
          <h2 className="c-kicker flex items-center gap-2" style={{ color: "var(--ink-strong)" }}>
            <Icon name="video" size={14} style={{ color: "var(--gold-c)" }} />
            {label}
          </h2>
          {showSeeAll && reels.length > 0 && (
            <Link
              href="/reels"
              className="c-kicker press"
              style={{ color: "var(--gold-c)", fontSize: 11 }}
            >
              See all
            </Link>
          )}
        </div>

        <div className="-mx-1 px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2.5 pb-1">
            {canPost &&
              (onPost ? (
                <button
                  onClick={onPost}
                  className="shrink-0 w-[92px] h-[148px] flex flex-col items-center justify-center gap-2 press"
                  style={{ border: "2px dashed var(--rule-strong-c)", background: "var(--paper-warm)" }}
                >
                  <div
                    className="w-8 h-8 flex items-center justify-center"
                    style={{ border: "2px solid var(--rule-strong-c)", background: "var(--paper)" }}
                  >
                    <Icon name="plus" size={16} style={{ color: "var(--gold-c)" }} />
                  </div>
                  <p className="c-kicker" style={{ fontSize: 9, color: "var(--gold-c)" }}>POST REEL</p>
                </button>
              ) : (
                <Link
                  href="/reels/new"
                  className="shrink-0 w-[92px] h-[148px] flex flex-col items-center justify-center gap-2 press"
                  style={{ border: "2px dashed var(--rule-strong-c)", background: "var(--paper-warm)" }}
                >
                  <div
                    className="w-8 h-8 flex items-center justify-center"
                    style={{ border: "2px solid var(--rule-strong-c)", background: "var(--paper)" }}
                  >
                    <Icon name="plus" size={16} style={{ color: "var(--gold-c)" }} />
                  </div>
                  <p className="c-kicker" style={{ fontSize: 9, color: "var(--gold-c)" }}>POST REEL</p>
                </Link>
              ))}

            {ordered.map((reel, idx) => {
              const accent = accentFor(reel.author?.role);
              return (
                <button
                  key={reel.id}
                  onClick={() => setOpenIndex(idx)}
                  className="shrink-0 relative w-[92px] h-[148px] overflow-hidden press group"
                  style={{
                    borderWidth: 2,
                    borderStyle: "solid",
                    borderColor: `${accent}88`,
                    background: "#111",
                  }}
                  aria-label={`Play reel by ${reel.author?.display_name ?? "creator"}`}
                >
                  {reel.poster_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={reel.poster_url}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                    />
                  ) : (
                    <video
                      src={reel.video_url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  )}

                  {/* bottom gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />

                  {/* author label */}
                  <div className="absolute inset-x-0 bottom-1 px-1.5 flex items-center gap-1">
                    {reel.author?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={reel.author.avatar_url}
                        alt=""
                        className="w-4 h-4 rounded-full object-cover border border-white/40"
                      />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-white/20" />
                    )}
                    <span className="text-[9px] font-semibold text-white truncate drop-shadow">
                      {reel.author?.display_name ?? ""}
                    </span>
                  </div>

                  {/* Story chip */}
                  {reel.is_story && (
                    <span
                      className="absolute top-1 left-1 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider"
                      style={{ background: "rgba(139,92,246,0.85)", color: "#fff" }}
                    >
                      Story
                    </span>
                  )}

                  {/* Play icon */}
                  <div
                    className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.55)" }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                      <polygon points="6,4 20,12 6,20" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {openIndex !== null && (
        <ReelsViewer
          reels={ordered}
          initialIndex={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}
