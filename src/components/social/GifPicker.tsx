"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * GifPicker — editorial popover for picking a GIPHY GIF.
 *
 * Opens trending on first mount, debounces search (300ms), renders a
 * 2-column preview grid. Click a tile → onPick(url) and closes.
 *
 * Closes on: Escape, click-outside, explicit close button.
 */

type TrimmedGif = {
  id: string;
  url: string;
  preview: string;
  alt: string;
};

interface GifPickerProps {
  open: boolean;
  onClose: () => void;
  onPick: (url: string) => void;
  /** Optional anchor label (e.g. where the picker is shown from) */
  title?: string;
}

export default function GifPicker({
  open,
  onClose,
  onPick,
  title = "GIFs",
}: GifPickerProps) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<TrimmedGif[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchGifs = useCallback(async (q: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const url = `/api/giphy/search?limit=24${q ? `&q=${encodeURIComponent(q)}` : ""}`;
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        setError("Couldn't load GIFs");
        setGifs([]);
        return;
      }
      const data = (await res.json()) as { gifs?: TrimmedGif[] };
      setGifs(data.gifs ?? []);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError("Couldn't load GIFs");
      setGifs([]);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  // Load trending on open
  useEffect(() => {
    if (!open) return;
    setQuery("");
    fetchGifs("");
    // Focus input
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open, fetchGifs]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(() => {
      fetchGifs(query.trim());
    }, 300);
    return () => clearTimeout(handle);
  }, [query, open, fetchGifs]);

  // Escape + click-outside
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    // Defer mousedown listener to next tick so the opener click doesn't close it
    const t = setTimeout(() => {
      document.addEventListener("mousedown", onDown);
    }, 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
      clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pointer-events-none">
      {/* Backdrop — subtle, doesn't steal focus on desktop */}
      <div
        className="absolute inset-0 bg-black/40 sm:bg-black/20 pointer-events-auto"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Pick a GIF"
        className="panel-editorial relative w-full sm:w-[380px] sm:max-w-[calc(100vw-2rem)] max-h-[70vh] sm:max-h-[520px] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col pointer-events-auto animate-slide-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <span className="text-xs font-heading font-bold uppercase tracking-[0.2em] text-gold">
            {title}
          </span>
          <button
            onClick={onClose}
            className="text-[11px] text-txt-secondary hover:text-white press"
            aria-label="Close GIF picker"
          >
            Close
          </button>
        </div>

        {/* Gold hairline */}
        <div className="h-px bg-gold/20 mx-4" />

        {/* Search input */}
        <div className="px-4 py-3">
          <div className="relative">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-secondary pointer-events-none"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search GIPHY"
              className="w-full bg-white/5 border border-border-subtle rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/20 transition-all"
              autoComplete="off"
            />
          </div>
        </div>

        {/* Gold hairline */}
        <div className="h-px bg-gold/20 mx-4" />

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading && gifs.length === 0 ? (
            <GridSkeleton />
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-sm text-txt-secondary">{error}</p>
              <button
                onClick={() => fetchGifs(query.trim())}
                className="mt-2 text-xs text-gold press hover:underline"
              >
                Try again
              </button>
            </div>
          ) : gifs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-txt-secondary">No GIFs found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {gifs.map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    onPick(g.url);
                    onClose();
                  }}
                  className="relative aspect-square rounded-lg overflow-hidden bg-white/5 border border-border-subtle hover:border-gold/40 press transition-all group"
                  aria-label={`Pick GIF: ${g.alt}`}
                >
                  {/* Use unoptimized <img> for GIF animation (next/image
                      downgrades animated GIFs to first frame). */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={g.preview}
                    alt={g.alt}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Powered-by footer (GIPHY attribution per API terms) */}
        <div className="px-4 pb-3 pt-1 shrink-0 border-t border-border-subtle">
          <p className="text-[10px] text-txt-secondary text-center uppercase tracking-[0.2em]">
            Powered by GIPHY
          </p>
        </div>
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-lg bg-white/[0.04] animate-pulse"
        />
      ))}
    </div>
  );
}

/** For Next/Image consumers rendering a picked GIF elsewhere. */
export function GifImage({
  url,
  alt = "GIF",
  className,
}: {
  url: string;
  alt?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-white/5 border border-border-subtle ${className ?? ""}`}
    >
      <Image
        src={url}
        alt={alt}
        width={320}
        height={240}
        unoptimized
        className="w-full h-auto object-cover"
      />
    </div>
  );
}
