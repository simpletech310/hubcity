"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export type HeroSlide = {
  id: string;
  title: string;
  kicker: string;
  cta: string;
  href: string;
  imageUrl: string | null;
  subtitle: string | null;
  meta: string | null;
};

interface EventSliderHeroProps {
  slides: HeroSlide[];
  /** Auto-advance interval in ms. 0 disables. Default 6000. */
  autoplayMs?: number;
}

/**
 * Full-bleed 1:1 hero carousel for the home page. Replaces the
 * legacy single-event hero — pulls the next 5 upcoming events,
 * trending streams, and culture longreads, then paginates them as
 * editorial magazine covers with snap-scroll, autoplay, and a
 * § kicker / dot-row at the bottom. Tap a slide to open it.
 *
 * Mobile-first: the scroller is a horizontal `overflow-x` strip
 * with `scrollSnap` on the children, so listeners can swipe with
 * native momentum on iOS / Android. Autoplay backs off the moment
 * the user manually scrubs (so the carousel doesn't fight their
 * touch).
 */
export default function EventSliderHero({
  slides,
  autoplayMs = 6000,
}: EventSliderHeroProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const userScrubbedRef = useRef(false);

  // Track which slide is currently centered in the scroller.
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    function onScroll() {
      if (!root) return;
      const slideWidth = root.clientWidth;
      if (slideWidth <= 0) return;
      const idx = Math.round(root.scrollLeft / slideWidth);
      setActiveIndex(Math.max(0, Math.min(slides.length - 1, idx)));
    }
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, [slides.length]);

  // Pause autoplay the first time the listener manually swipes.
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const onTouch = () => {
      userScrubbedRef.current = true;
    };
    root.addEventListener("touchstart", onTouch, { passive: true });
    root.addEventListener("pointerdown", onTouch, { passive: true });
    return () => {
      root.removeEventListener("touchstart", onTouch);
      root.removeEventListener("pointerdown", onTouch);
    };
  }, []);

  // Autoplay (manual scrub disables it for the rest of the session).
  useEffect(() => {
    if (!autoplayMs || slides.length < 2) return;
    if (paused) return;
    const id = window.setInterval(() => {
      if (userScrubbedRef.current) return;
      const root = scrollerRef.current;
      if (!root) return;
      const next = (activeIndex + 1) % slides.length;
      root.scrollTo({ left: next * root.clientWidth, behavior: "smooth" });
    }, autoplayMs);
    return () => window.clearInterval(id);
  }, [activeIndex, slides.length, autoplayMs, paused]);

  function jumpTo(idx: number) {
    userScrubbedRef.current = true;
    const root = scrollerRef.current;
    if (!root) return;
    root.scrollTo({ left: idx * root.clientWidth, behavior: "smooth" });
  }

  if (slides.length === 0) return null;

  return (
    <div
      className="relative"
      style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={scrollerRef}
        className="flex overflow-x-auto scrollbar-hide"
        style={{
          scrollSnapType: "x mandatory",
          scrollBehavior: "smooth",
        }}
      >
        {slides.map((slide) => (
          <div
            key={slide.id}
            className="shrink-0 w-full"
            style={{ scrollSnapAlign: "start" }}
          >
            <Link
              href={slide.href}
              className="block relative overflow-hidden"
              style={{ aspectRatio: "1 / 1" }}
            >
              {slide.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={slide.imageUrl}
                  alt={slide.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 c-ph" aria-hidden />
              )}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, transparent 30%, rgba(26,21,18,0.88) 100%)",
                }}
              />
              <span
                className="c-badge c-badge-gold absolute"
                style={{ top: 14, left: 14, fontSize: 10 }}
              >
                {slide.kicker}
              </span>
              <div className="absolute inset-x-0 bottom-0 px-[18px] py-6">
                {slide.meta && (
                  <span
                    className="c-kicker"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.18em",
                      color: "var(--gold-c)",
                      opacity: 0.95,
                    }}
                  >
                    {slide.meta}
                  </span>
                )}
                <h1
                  className="mt-1.5"
                  style={{
                    fontFamily: "var(--font-anton), Anton, sans-serif",
                    fontSize: 52,
                    lineHeight: 0.88,
                    color: "#F3EEDC",
                    textTransform: "uppercase",
                    letterSpacing: "-0.018em",
                    margin: 0,
                  }}
                >
                  {slide.title}.
                </h1>
                {slide.subtitle && (
                  <p
                    className="c-serif-it mt-2 max-w-sm"
                    style={{
                      fontSize: 13,
                      color: "rgba(243,238,220,0.85)",
                      lineHeight: 1.45,
                    }}
                  >
                    {slide.subtitle}
                  </p>
                )}
                <div className="flex items-center gap-2.5 mt-4">
                  <span
                    style={{
                      padding: "8px 14px",
                      background: "var(--gold-c)",
                      color: "var(--ink-strong)",
                      fontFamily: "var(--font-archivo), Archivo, sans-serif",
                      fontWeight: 900,
                      fontSize: 11,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      border: "2px solid var(--ink-strong)",
                      boxShadow: "0 2px 0 rgba(0,0,0,0.25)",
                    }}
                  >
                    {slide.cta}
                  </span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Pagination dots — bottom-center, ink/gold, tappable */}
      {slides.length > 1 && (
        <div
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 pointer-events-auto"
          style={{ bottom: 14 }}
        >
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => jumpTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="press"
              style={{
                width: i === activeIndex ? 22 : 8,
                height: 8,
                background:
                  i === activeIndex
                    ? "var(--gold-c)"
                    : "rgba(243,238,220,0.45)",
                border: "1.5px solid rgba(26,21,18,0.55)",
                transition: "width 0.25s ease",
              }}
            />
          ))}
        </div>
      )}

      {/* Slide counter chip — top-right */}
      {slides.length > 1 && (
        <div
          className="absolute z-10 c-kicker tabular-nums"
          style={{
            top: 14,
            right: 14,
            padding: "5px 9px",
            background: "rgba(26,21,18,0.65)",
            color: "var(--paper)",
            border: "1.5px solid rgba(243,238,220,0.35)",
            fontSize: 9,
            letterSpacing: "0.16em",
          }}
        >
          {String(activeIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
        </div>
      )}
    </div>
  );
}
