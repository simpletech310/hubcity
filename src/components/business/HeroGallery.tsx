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
        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Show photo ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? "w-6 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
        {/* Counter pill */}
        <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1">
          <span className="text-[10px] font-bold text-white">
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
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
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
