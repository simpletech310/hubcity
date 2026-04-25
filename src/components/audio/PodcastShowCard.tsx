"use client";

import Link from "next/link";
import Image from "next/image";

/**
 * Tile for a rolled-up podcast show on the FREQUENCY hub.
 * The discover endpoint groups episodes by `show_slug`, so every tile
 * here represents one show; the link goes to the show page where the
 * full episode list lives.
 */
export default function PodcastShowCard({
  show,
  width = 156,
}: {
  show: {
    show_slug: string | null;
    show_title: string;
    show_description?: string | null;
    cover_art_url?: string | null;
    episode_count?: number;
  };
  width?: number;
}) {
  const cover = show.cover_art_url;
  const slug = show.show_slug ?? "";

  return (
    <Link
      href={`/frequency/podcast/${slug}`}
      className="block press shrink-0 snap-start"
      style={{ width }}
    >
      <div
        className="relative aspect-square overflow-hidden"
        style={{
          border: "2px solid var(--rule-strong-c)",
          background: "var(--paper-soft, #DCD3BF)",
        }}
      >
        {cover ? (
          <Image
            src={cover}
            alt={show.show_title}
            width={width}
            height={width}
            className="w-full h-full object-cover"
            unoptimized={cover.endsWith(".svg")}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "var(--gold-c)" }}
          >
            <span
              className="c-hero"
              style={{ fontSize: 22, color: "var(--ink-strong)" }}
            >
              🎙
            </span>
          </div>
        )}

        <div
          className="absolute top-2 left-2 px-1.5 py-0.5"
          style={{
            background: "var(--ink-strong)",
            color: "var(--paper)",
            fontFamily: "var(--font-archivo), Archivo, sans-serif",
            fontWeight: 800,
            fontSize: 9,
            letterSpacing: "0.14em",
          }}
        >
          PODCAST
        </div>
      </div>

      <div className="mt-2">
        <div
          className="c-card-t truncate"
          style={{ fontSize: 13, lineHeight: 1.15, color: "var(--ink-strong)" }}
        >
          {show.show_title}
        </div>
        {typeof show.episode_count === "number" && (
          <div
            className="c-meta truncate"
            style={{ fontSize: 11, opacity: 0.75, color: "var(--ink-strong)" }}
          >
            {show.episode_count} episode{show.episode_count === 1 ? "" : "s"}
          </div>
        )}
      </div>
    </Link>
  );
}
