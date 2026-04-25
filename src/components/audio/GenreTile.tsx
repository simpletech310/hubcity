"use client";

import Link from "next/link";
import type { AudioGenre } from "@/types/database";

/**
 * Genre tile — pure-CSS, no artwork. Title + chevron in the newsprint
 * palette so the GENRES rail loads instantly even before any covers
 * are seeded.
 */
export default function GenreTile({
  genre,
  width = 168,
}: {
  genre: Pick<AudioGenre, "slug" | "name" | "icon">;
  width?: number;
}) {
  return (
    <Link
      href={`/frequency/genre/${genre.slug}`}
      className="block press shrink-0 snap-start"
      style={{ width }}
    >
      <div
        className="relative flex flex-col justify-between p-3"
        style={{
          height: width * 0.6,
          background: "var(--gold-c)",
          color: "var(--ink-strong)",
          border: "2px solid var(--ink-strong)",
        }}
      >
        <div
          className="c-kicker"
          style={{ fontSize: 9, letterSpacing: "0.18em" }}
        >
          GENRE
        </div>
        <div
          className="c-hero"
          style={{
            fontSize: 24,
            lineHeight: 0.95,
            letterSpacing: "-0.01em",
          }}
        >
          {genre.name}
        </div>
        <div
          aria-hidden
          className="absolute right-2 bottom-2"
          style={{ fontSize: 18 }}
        >
          ↗
        </div>
      </div>
    </Link>
  );
}
