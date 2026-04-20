"use client";

import { useEffect } from "react";

export interface LightboxImage {
  url: string;
  alt?: string;
  caption?: string | null;
}

interface LightboxProps {
  images: LightboxImage[];
  index: number | null;
  onClose: () => void;
  onChange: (next: number) => void;
}

export default function Lightbox({ images, index, onClose, onChange }: LightboxProps) {
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && index > 0) onChange(index - 1);
      else if (e.key === "ArrowRight" && index < images.length - 1) onChange(index + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onClose, onChange]);

  if (index === null || !images[index]) return null;

  const current = images[index];

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close"
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {index > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onChange(index - 1);
          }}
          aria-label="Previous"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}
      {index < images.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onChange(index + 1);
          }}
          aria-label="Next"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      <img
        src={current.url}
        alt={current.alt ?? ""}
        className="max-w-[92vw] max-h-[85vh] object-contain rounded-xl"
        onClick={(e) => e.stopPropagation()}
      />

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 px-4">
        {current.caption && (
          <p className="text-sm text-white/80 text-center max-w-[80vw] truncate">
            {current.caption}
          </p>
        )}
        <p className="text-[11px] text-white/50">
          {index + 1} / {images.length}
        </p>
      </div>
    </div>
  );
}
