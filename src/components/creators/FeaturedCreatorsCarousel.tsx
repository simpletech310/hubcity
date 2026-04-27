"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";

export interface FeaturedCarouselSlide {
  creator: {
    id: string;
    handle: string;
    display_name: string;
    avatar_url: string | null;
    bio: string | null;
    verified: boolean;
  };
  media: {
    kind: "reel" | "video" | "post";
    href: string;
    img: string | null;
    title: string | null;
    duration: number | null;
  };
}

interface Props {
  slides: FeaturedCarouselSlide[];
  /** Auto-advance interval in ms. Pass 0 to disable. */
  autoAdvanceMs?: number;
}

/**
 * Horizontal scroll-snap carousel of "cover" creators at the top of
 * /creators. Mirrors the home-page event slider:
 *   - 1 slide per viewport
 *   - swipe / scroll to advance, dots underneath show position
 *   - auto-advance every N seconds, pauses while the user is touching
 *
 * Each slide reuses the existing magazine-cover layout that lived
 * inline in /creators/page.tsx — gold-rule top byline, full-bleed
 * cinematic still, gold play button, title + handle slab below.
 */
export default function FeaturedCreatorsCarousel({
  slides,
  autoAdvanceMs = 6000,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Track which slide is closest to centered as the user scrolls.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    function onScroll() {
      if (!el) return;
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      setActiveIndex(Math.max(0, Math.min(slides.length - 1, idx)));
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [slides.length]);

  // Auto-advance.
  useEffect(() => {
    if (slides.length <= 1 || autoAdvanceMs <= 0 || paused) return;
    const id = window.setInterval(() => {
      const el = scrollerRef.current;
      if (!el) return;
      const next = (activeIndex + 1) % slides.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, autoAdvanceMs);
    return () => window.clearInterval(id);
  }, [activeIndex, autoAdvanceMs, paused, slides.length]);

  function jumpTo(index: number) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  }

  if (slides.length === 0) return null;

  return (
    <section
      style={{
        background: "var(--ink-strong)",
        borderBottom: "3px solid var(--rule-strong-c)",
        position: "relative",
      }}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Top byline strip */}
      <div
        className="flex items-center justify-between px-5 py-2.5"
        style={{ borderBottom: "1px solid rgba(242,169,0,0.35)" }}
      >
        <div className="flex items-center gap-2">
          <span
            style={{
              width: 6,
              height: 6,
              background: "var(--gold-c)",
              display: "inline-block",
            }}
          />
          <span
            className="c-kicker"
            style={{
              fontSize: 9,
              color: "var(--gold-c)",
              letterSpacing: "0.14em",
            }}
          >
            THE COVER · THIS WEEK&apos;S BIG STORIES
          </span>
        </div>
        <span
          className="c-kicker tabular-nums"
          style={{ fontSize: 9, color: "var(--paper)", opacity: 0.6 }}
        >
          {String(activeIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
        </span>
      </div>

      {/* Scroll-snap track */}
      <div
        ref={scrollerRef}
        className="flex overflow-x-auto"
        style={{
          scrollSnapType: "x mandatory",
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {slides.map((slide, idx) => (
          <div
            key={slide.creator.id}
            className="shrink-0 w-full"
            style={{ scrollSnapAlign: "start", scrollSnapStop: "always" }}
            aria-hidden={idx !== activeIndex}
          >
            <SlideCard slide={slide} />
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div
          className="flex items-center justify-center gap-2 py-3"
          role="tablist"
          aria-label="Featured creators"
        >
          {slides.map((s, idx) => (
            <button
              key={s.creator.id}
              onClick={() => jumpTo(idx)}
              role="tab"
              aria-selected={idx === activeIndex}
              aria-label={`Show ${s.creator.display_name}`}
              className="press"
              style={{
                width: idx === activeIndex ? 22 : 8,
                height: 8,
                background: idx === activeIndex ? "var(--gold-c)" : "rgba(243,238,220,0.35)",
                border: "1px solid rgba(243,238,220,0.5)",
                transition: "width 200ms ease",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function SlideCard({ slide }: { slide: FeaturedCarouselSlide }) {
  const { creator, media } = slide;
  return (
    <>
      {/* Featured media — cinematic still */}
      <Link href={media.href} className="block press relative">
        <div
          className="relative overflow-hidden"
          style={{
            aspectRatio: "16/10",
            background: "var(--ink-strong)",
            borderBottom: "2px solid var(--gold-c)",
          }}
        >
          {media.img && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={media.img}
              alt=""
              className="w-full h-full object-cover"
              style={{ opacity: 0.78 }}
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(26,21,18,0.92) 0%, rgba(26,21,18,0.55) 45%, rgba(26,21,18,0.25) 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, transparent 50%, rgba(26,21,18,0.85) 100%)",
            }}
          />

          {/* Kind chip top-right */}
          <div className="absolute top-4 right-4">
            <div
              className="inline-flex items-center gap-1.5 px-2 py-1"
              style={{ background: "var(--gold-c)", color: "var(--ink-strong)" }}
            >
              <Icon
                name={media.kind === "video" ? "film" : media.kind === "reel" ? "video" : "photo"}
                size={10}
                style={{ color: "var(--ink-strong)" }}
              />
              <span
                className="c-kicker"
                style={{ fontSize: 9, color: "var(--ink-strong)" }}
              >
                {media.kind === "video"
                  ? "FEATURED FILM"
                  : media.kind === "reel"
                    ? "MOMENT"
                    : "FROM THE FEED"}
              </span>
            </div>
          </div>

          {/* Big play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="flex items-center justify-center"
              style={{
                width: 64,
                height: 64,
                background: "var(--gold-c)",
                border: "3px solid var(--paper)",
                boxShadow: "5px 5px 0 rgba(0,0,0,0.45)",
              }}
            >
              <svg width="22" height="22" fill="var(--ink-strong)" viewBox="0 0 10 10">
                <polygon points="3,1.5 9,5 3,8.5" />
              </svg>
            </div>
          </div>

          {/* Bottom slab */}
          <div className="absolute inset-x-0 bottom-0 p-5">
            {media.title && (
              <h2
                className="c-hero line-clamp-2 mb-2"
                style={{
                  fontSize: 28,
                  lineHeight: 1.0,
                  letterSpacing: "-0.02em",
                  color: "var(--paper)",
                  textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                }}
              >
                {media.title}
              </h2>
            )}
            <div className="flex items-center gap-2">
              <span
                className="c-kicker"
                style={{ fontSize: 9, color: "var(--gold-c)" }}
              >
                @{creator.handle}
              </span>
              {creator.verified && (
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ color: "var(--gold-c)" }}
                >
                  <path
                    d="M9 12l2 2 4-4"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                </svg>
              )}
              {media.duration && (
                <>
                  <span
                    className="c-kicker"
                    style={{ fontSize: 9, color: "var(--paper)", opacity: 0.5 }}
                  >
                    ·
                  </span>
                  <span
                    className="c-kicker tabular-nums"
                    style={{ fontSize: 9, color: "var(--paper)", opacity: 0.65 }}
                  >
                    {Math.floor(media.duration / 60)}:
                    {Math.floor(media.duration % 60).toString().padStart(2, "0")}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Creator credit slab */}
      <Link
        href={`/user/${creator.handle}`}
        className="flex items-center gap-3 px-5 py-4 press"
      >
        <div
          className="shrink-0 overflow-hidden"
          style={{
            width: 48,
            height: 48,
            background: "var(--gold-c)",
            border: "2px solid var(--gold-c)",
          }}
        >
          {creator.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={creator.avatar_url}
              alt={creator.display_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span
                style={{
                  fontFamily: "var(--font-anton), Anton, Impact, sans-serif",
                  fontSize: 18,
                  color: "var(--ink-strong)",
                }}
              >
                {creator.display_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="c-card-t line-clamp-1"
            style={{ fontSize: 17, color: "var(--paper)" }}
          >
            {creator.display_name}
          </p>
          {creator.bio && (
            <p
              className="c-serif-it line-clamp-1 mt-0.5"
              style={{ fontSize: 12, color: "rgba(243,238,220,0.7)" }}
            >
              {creator.bio}
            </p>
          )}
        </div>
        <span
          className="c-kicker shrink-0"
          style={{ fontSize: 10, color: "var(--gold-c)" }}
        >
          VIEW PROFILE →
        </span>
      </Link>
    </>
  );
}
