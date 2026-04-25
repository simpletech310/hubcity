"use client";

import Link from "next/link";
import Image from "next/image";
import type { Album } from "@/types/database";

const RELEASE_LABEL: Record<string, string> = {
  single: "SINGLE",
  ep: "EP",
  album: "ALBUM",
  mixtape: "MIXTAPE",
};

/**
 * Square album / single tile for FREQUENCY rails. The whole tile is a
 * link into the album detail page; the gold play overlay is purely
 * decorative (real playback is dispatched from the detail page or
 * from inline track rows).
 */
export default function AlbumCard({
  album,
  width = 156,
  showDemoChip = true,
}: {
  album: Pick<
    Album,
    "slug" | "title" | "release_type" | "cover_art_url" | "is_demo"
  > & { creator?: { display_name: string } | null };
  width?: number;
  showDemoChip?: boolean;
}) {
  const cover = album.cover_art_url;
  return (
    <Link
      href={`/frequency/album/${album.slug}`}
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
            alt={album.title}
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
              ♪
            </span>
          </div>
        )}

        {/* Release-type chip */}
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
          {RELEASE_LABEL[album.release_type] ?? album.release_type.toUpperCase()}
        </div>

        {showDemoChip && album.is_demo && (
          <div
            className="absolute top-2 right-2 px-1.5 py-0.5"
            style={{
              background: "var(--gold-c)",
              color: "var(--ink-strong)",
              fontFamily: "var(--font-archivo), Archivo, sans-serif",
              fontWeight: 800,
              fontSize: 9,
              letterSpacing: "0.14em",
            }}
          >
            DEMO
          </div>
        )}
      </div>

      <div className="mt-2">
        <div
          className="c-card-t truncate"
          style={{ fontSize: 13, lineHeight: 1.15, color: "var(--ink-strong)" }}
        >
          {album.title}
        </div>
        {album.creator?.display_name && (
          <div
            className="c-meta truncate"
            style={{ fontSize: 11, opacity: 0.75, color: "var(--ink-strong)" }}
          >
            {album.creator.display_name}
          </div>
        )}
      </div>
    </Link>
  );
}
