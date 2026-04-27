"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { ScheduledBroadcast, VideoAd } from "@/types/database";

const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), { ssr: false });

interface LiveSimulatedPlayerProps {
  schedule: ScheduledBroadcast[];
  ads: VideoAd[];
  userId: string | null;
  /**
   * Fires whenever the on-air content video changes (mount, schedule
   * advance, visibility re-sync). `null` during an ad slot so callers
   * can pause their derived state.
   */
  onVideoChange?: (videoId: string | null) => void;
}

// Find the index of the broadcast currently on-air based on wall-clock time.
function findCurrentIndex(schedule: ScheduledBroadcast[], now: number): number {
  for (let i = 0; i < schedule.length; i++) {
    const starts = new Date(schedule[i].starts_at).getTime();
    const ends = new Date(schedule[i].ends_at).getTime();
    if (now >= starts && now < ends) return i;
    if (now < starts) return Math.max(0, i - 1);
  }
  return schedule.length - 1;
}

function fmtAirtime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function LiveSimulatedPlayer({
  schedule,
  ads,
  userId,
  onVideoChange,
}: LiveSimulatedPlayerProps) {
  const [currentAd, setCurrentAd] = useState<VideoAd | null>(() => {
    const startIdx = findCurrentIndex(schedule, Date.now());
    if (schedule[startIdx]?.is_ad_slot && ads && ads.length > 0) {
      return ads[Math.floor(Math.random() * ads.length)];
    }
    return null;
  });
  const [phase, setPhase] = useState<"content" | "ad">(() => {
    const startIdx = findCurrentIndex(schedule, Date.now());
    return schedule[startIdx]?.is_ad_slot ? "ad" : "content";
  });
  const [currentIndex, setCurrentIndex] = useState(() =>
    findCurrentIndex(schedule, Date.now())
  );
  const [startTime, setStartTime] = useState(() => {
    if (!schedule.length) return 0;
    const entry = schedule[findCurrentIndex(schedule, Date.now())];
    const offset = (Date.now() - new Date(entry.starts_at).getTime()) / 1000;
    return Math.max(0, offset);
  });
  const mountedAt = useRef(Date.now());

  // When the tab returns to focus after backgrounding, re-sync to wall clock
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      // If we've been away more than 2 minutes, re-sync
      if (Date.now() - mountedAt.current < 120_000) return;
      const newIdx = findCurrentIndex(schedule, Date.now());
      if (newIdx !== currentIndex) {
        const entry = schedule[newIdx];
        const offset = (Date.now() - new Date(entry.starts_at).getTime()) / 1000;
        const isAd = entry.is_ad_slot;
        setCurrentIndex(newIdx);
        setStartTime(Math.max(0, offset));
        
        if (isAd && ads && ads.length > 0) {
          setCurrentAd(currentAd || ads[Math.floor(Math.random() * ads.length)]);
          setPhase("ad");
        } else {
          setPhase("content");
        }
        
        mountedAt.current = Date.now();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [schedule, currentIndex]);

  const currentBroadcast = schedule[currentIndex];
  const nextBroadcast = schedule[currentIndex + 1];

  // Pull video + show metadata off the current broadcast
  const currentVideo = currentBroadcast?.video;
  const currentShow = currentVideo?.show;

  // Notify parent whenever the on-air video changes so things like
  // the "Because you're watching" rail can refetch tied content.
  // During an ad slot we pass null to freeze derived state.
  useEffect(() => {
    if (!onVideoChange) return;
    onVideoChange(phase === "ad" ? null : currentVideo?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVideo?.id, phase]);

  const handleContentEnded = useCallback(() => {
    // Pick a random ad, then advance to next non-ad slot
    if (ads && ads.length > 0) {
      const randomAd = ads[Math.floor(Math.random() * ads.length)];
      setCurrentAd(randomAd);
      setPhase("ad");
    } else {
      advanceToNextContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ads]);

  const advanceToNextContent = useCallback(() => {
    // Skip over ad-slot broadcasts; land on the next content slot
    let idx = currentIndex + 1;
    while (idx < schedule.length && schedule[idx].is_ad_slot) idx++;
    if (idx >= schedule.length) {
      // Loop back to start if we've exhausted the schedule (48h window should cover it)
      idx = 0;
    }
    setCurrentIndex(idx);
    setStartTime(0);
    setPhase("content");
  }, [currentIndex, schedule]);

  const handleAdEnded = useCallback(() => {
    advanceToNextContent();
  }, [advanceToNextContent]);

  const upcoming = useMemo(() => {
    return schedule
      .slice(currentIndex + 1)
      .filter((b) => !b.is_ad_slot && b.video)
      .slice(0, 5);
  }, [schedule, currentIndex]);

  if (!schedule.length || !currentBroadcast || !currentVideo?.mux_playback_id) {
    return (
      <div className="mb-6">
        <div
          className="px-6 py-10 text-center"
          style={{
            background: "var(--paper)",
            borderTop: "3px solid var(--rule-strong-c)",
            borderBottom: "3px solid var(--rule-strong-c)",
          }}
        >
          <p className="c-kicker" style={{ opacity: 0.7 }}>
            § CULTURE TV LIVE · OFF AIR
          </p>
          <p className="c-serif-it mt-2" style={{ fontSize: 14, color: "var(--ink-strong)" }}>
            The schedule hasn&apos;t been generated yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 animate-fade-in">
      {/* ── Branding strip — gold pill + show kicker, full-bleed ── */}
      <div
        className="px-[18px] py-2 flex items-center gap-3"
        style={{
          background: "var(--ink-strong)",
          color: "var(--paper)",
          borderTop: "3px solid var(--rule-strong-c)",
          borderBottom: "3px solid var(--rule-strong-c)",
        }}
      >
        <span
          className="inline-flex items-center gap-1.5"
          style={{
            background: "var(--gold-c)",
            color: "var(--ink-strong)",
            padding: "3px 8px",
            fontFamily: "var(--font-archivo), Archivo, sans-serif",
            fontWeight: 800,
            fontSize: 10,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          <span
            className="inline-block animate-pulse"
            style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ink-strong)" }}
          />
          CULTURE TV · LIVE
        </span>
        {phase === "content" && currentVideo && (
          <span
            className="c-kicker truncate"
            style={{ fontSize: 10, color: "var(--gold-c)", letterSpacing: "0.14em" }}
          >
            ON AIR · {(currentShow?.title ?? currentVideo.title).toUpperCase()}
            {currentBroadcast.ends_at && ` · UNTIL ${fmtAirtime(currentBroadcast.ends_at).toUpperCase()}`}
          </span>
        )}
        {phase === "ad" && (
          <span
            className="c-kicker"
            style={{ fontSize: 10, color: "var(--gold-c)", letterSpacing: "0.14em" }}
          >
            COMMERCIAL BREAK
          </span>
        )}
      </div>

      {/* ── Player — full-bleed, no rounded corners, ink letterbox ── */}
      <div style={{ background: "var(--ink-strong)", borderBottom: "3px solid var(--rule-strong-c)" }}>
        {phase === "content" && (
          <MuxPlayer
            key={`content-${currentBroadcast.id}`}
            playbackId={currentVideo.mux_playback_id}
            streamType="on-demand"
            autoPlay
            accentColor="#F2A900"
            startTime={startTime}
            style={{ aspectRatio: "16/9", width: "100%" }}
            metadata={{
              video_title: currentVideo.title,
              viewer_user_id: userId || "anon",
            }}
            onEnded={handleContentEnded}
          />
        )}
        {phase === "ad" && currentAd?.mux_playback_id && (
          <MuxPlayer
            key={`ad-${currentBroadcast.id}`}
            playbackId={currentAd.mux_playback_id}
            streamType="on-demand"
            autoPlay
            accentColor="#F2A900"
            style={{ aspectRatio: "16/9", width: "100%" }}
            metadata={{
              video_title: `Ad: ${currentAd.title}`,
              viewer_user_id: userId || "anon",
            }}
            onEnded={handleAdEnded}
          />
        )}
      </div>

      {/* ── Now Playing — newsprint show card ─────────────────── */}
      {phase === "content" && currentVideo && (
        <Link
          href={`/live/watch/${currentVideo.id}`}
          className="press"
          style={{
            display: "flex",
            gap: 14,
            padding: "14px 18px",
            background: "var(--paper)",
            borderBottom: "2px solid var(--rule-strong-c)",
          }}
        >
          <div
            style={{
              width: 70,
              height: 92,
              flexShrink: 0,
              overflow: "hidden",
              background: "var(--ink-strong)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            {currentShow?.poster_url || currentVideo.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentShow?.poster_url ?? currentVideo.thumbnail_url ?? ""}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ color: "var(--gold-c)" }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6,3 20,12 6,21" />
                </svg>
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="c-kicker" style={{ fontSize: 9, opacity: 0.65 }}>
              § NOW PLAYING
            </div>
            <p
              className="c-card-t mt-1"
              style={{
                fontSize: 17,
                color: "var(--ink-strong)",
                lineHeight: 1.15,
                letterSpacing: "0.005em",
              }}
            >
              {currentShow?.title ?? currentVideo.title}
            </p>
            {currentShow ? (
              <p
                className="c-serif-it mt-1"
                style={{
                  fontSize: 13,
                  color: "var(--ink-strong)",
                  opacity: 0.85,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {currentVideo.episode_number != null
                  ? `Ep ${currentVideo.episode_number} · ${currentVideo.title}`
                  : currentVideo.title}
              </p>
            ) : (
              currentVideo.description && (
                <p
                  className="c-serif-it mt-1"
                  style={{
                    fontSize: 13,
                    color: "var(--ink-strong)",
                    opacity: 0.85,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {currentVideo.description}
                </p>
              )
            )}
            <div
              className="c-kicker mt-2"
              style={{ fontSize: 9, color: "var(--gold-c)" }}
            >
              WATCH FULL PAGE →
            </div>
          </div>
        </Link>
      )}

      {/* ── Up Next — featured tile + poster strip ────────────── */}
      {upcoming.length > 0 ? (
        <section className="px-[18px] pt-4 pb-1">
          <div className="flex items-baseline justify-between mb-2">
            <div className="c-kicker">§ UP NEXT</div>
            <span
              className="c-kicker"
              style={{ fontSize: 10, color: "var(--ink-strong)", opacity: 0.55 }}
            >
              {upcoming.length.toString().padStart(2, "0")}
            </span>
          </div>
          <div className="c-rule mb-3" />

          {/* Featured first item — wide row */}
          {(() => {
            const next = upcoming[0];
            const nv = next.video;
            if (!nv) return null;
            const ns = nv.show;
            const teaser = ns?.tagline ?? nv.description ?? null;
            return (
              <Link
                key={next.id}
                href={`/live/watch/${nv.id}`}
                className="press"
                style={{
                  display: "flex",
                  gap: 12,
                  padding: 10,
                  background: "var(--paper)",
                  border: "2px solid var(--rule-strong-c)",
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: 86,
                    height: 114,
                    flexShrink: 0,
                    overflow: "hidden",
                    background: "var(--ink-strong)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  {ns?.poster_url || nv.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ns?.poster_url ?? nv.thumbnail_url ?? ""}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ color: "var(--gold-c)" }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="6,3 20,12 6,21" />
                      </svg>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span
                    className="inline-block"
                    style={{
                      background: "var(--gold-c)",
                      color: "var(--ink-strong)",
                      padding: "2px 7px",
                      fontFamily: "var(--font-archivo), Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: 9,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                    }}
                  >
                    NEXT · {fmtAirtime(next.starts_at).toUpperCase()}
                  </span>
                  <p
                    className="c-card-t mt-1.5"
                    style={{
                      fontSize: 15,
                      color: "var(--ink-strong)",
                      lineHeight: 1.15,
                      letterSpacing: "0.005em",
                    }}
                  >
                    {ns?.title ?? nv.title}
                  </p>
                  {teaser && (
                    <p
                      className="c-serif-it mt-1"
                      style={{
                        fontSize: 12,
                        color: "var(--ink-strong)",
                        opacity: 0.85,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {teaser}
                    </p>
                  )}
                </div>
              </Link>
            );
          })()}

          {/* Smaller poster strip for items 2..N */}
          {upcoming.length > 1 && (
            <>
              <div className="c-kicker mb-2" style={{ fontSize: 10, opacity: 0.7 }}>
                § LATER
              </div>
              <div
                className="flex gap-3 overflow-x-auto pb-1"
                style={{ scrollSnapType: "x mandatory" }}
              >
                {upcoming.slice(1).map((b) => {
                  if (!b.video) return null;
                  const v = b.video;
                  const s = v.show;
                  return (
                    <div
                      key={b.id}
                      className="shrink-0"
                      aria-disabled
                      style={{
                        width: 116,
                        scrollSnapAlign: "start",
                        cursor: "default",
                        opacity: 0.85,
                      }}
                    >
                      <div
                        style={{
                          aspectRatio: "2 / 3",
                          overflow: "hidden",
                          background: "var(--ink-strong)",
                          border: "2px solid var(--rule-strong-c)",
                          marginBottom: 6,
                        }}
                      >
                        {s?.poster_url || v.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={s?.poster_url ?? v.thumbnail_url ?? ""}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ color: "var(--gold-c)" }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="6,3 20,12 6,21" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <p
                        className="c-kicker"
                        style={{ fontSize: 10, color: "var(--gold-c)", letterSpacing: "0.14em" }}
                      >
                        {fmtAirtime(b.starts_at).toUpperCase()}
                      </p>
                      <p
                        className="c-card-t truncate"
                        style={{ fontSize: 12, color: "var(--ink-strong)", marginTop: 2 }}
                      >
                        {s?.title ?? v.title}
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      ) : (
        phase === "content" && (
          <section className="px-[18px] pt-4 pb-3">
            <div
              style={{
                background: "var(--paper)",
                border: "2px solid var(--rule-strong-c)",
                padding: "16px 14px",
                textAlign: "center",
              }}
            >
              <div className="c-kicker" style={{ fontSize: 10, opacity: 0.7 }}>
                § PROGRAMMING RESUMES SHORTLY
              </div>
            </div>
          </section>
        )
      )}
    </div>
  );
}
