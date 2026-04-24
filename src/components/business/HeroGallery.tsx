"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

/**
 * Public-profile hero gallery. Mobile: swipeable single-image carousel
 * with paging dots. Desktop: image grid (cover left, secondary thumbs).
 *
 * Entirely client-side; no external carousel library needed.
 */
export default function HeroGallery({
  images,
  alt,
  fallback,
}: {
  images: string[];
  alt: string;
  fallback?: React.ReactNode;
}) {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== active) setActive(idx);
  }, [active]);

  const goTo = useCallback((i: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    setActive(i);
  }, []);

  if (!images.length) {
    return <div className="relative h-64 overflow-hidden">{fallback}</div>;
  }

  if (images.length === 1) {
    return (
      <div className="relative h-64 overflow-hidden">
        <Image src={images[0]} alt={alt} fill priority className="object-cover" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Mobile: swipe carousel */}
      <div className="md:hidden">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex h-64 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {images.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="relative shrink-0 w-full h-full snap-center"
            >
              <Image
                src={src}
                alt={`${alt} — photo ${i + 1}`}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
        {/* Dots — printed bars, no pills */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Show photo ${i + 1}`}
              style={{
                height: 4,
                width: i === active ? 22 : 6,
                background: i === active ? "var(--gold-c)" : "var(--paper)",
                border: "1.5px solid var(--rule-strong-c)",
                transition: "width 150ms",
              }}
            />
          ))}
        </div>
        {/* Counter — paper chip with ink border */}
        <div
          className="absolute top-3 right-3 z-10 inline-flex items-center px-2"
          style={{
            background: "var(--paper)",
            border: "2px solid var(--rule-strong-c)",
            height: 22,
          }}
        >
          <span
            className="c-kicker"
            style={{ fontSize: 10, letterSpacing: "0.12em" }}
          >
            {active + 1} / {images.length}
          </span>
        </div>
      </div>

      {/* Desktop: collage grid */}
      <div className="hidden md:grid h-80 grid-cols-4 grid-rows-2 gap-1.5 overflow-hidden">
        <div className="relative col-span-2 row-span-2">
          <Image
            src={images[0]}
            alt={alt}
            fill
            priority
            sizes="(max-width: 1024px) 50vw, 600px"
            className="object-cover"
          />
        </div>
        {images.slice(1, 5).map((src, i) => (
          <div key={`${src}-${i}`} className="relative">
            <Image
              src={src}
              alt={`${alt} — photo ${i + 2}`}
              fill
              sizes="(max-width: 1024px) 25vw, 300px"
              className="object-cover"
            />
            {i === 3 && images.length > 5 && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: "rgba(26,21,18,0.72)" }}
              >
                <span
                  className="c-hero"
                  style={{
                    fontSize: 28,
                    lineHeight: 1,
                    color: "var(--paper)",
                  }}
                >
                  +{images.length - 5}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
