"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Icon from "@/components/ui/Icon";
import type {
  ExploreItem,
  ExploreKind,
  ExploreWhatFilter,
} from "@/types/database";

const WHAT_FILTERS: { key: ExploreWhatFilter; label: string; kinds: ExploreKind[] }[] = [
  { key: "all", label: "All", kinds: [] },
  { key: "creator", label: "Creators", kinds: ["creator"] },
  { key: "post", label: "Posts", kinds: ["post"] },
  { key: "event", label: "Events", kinds: ["event"] },
  { key: "show", label: "Shows", kinds: ["show"] },
  { key: "business", label: "Businesses", kinds: ["business"] },
  { key: "challenge", label: "Challenges", kinds: ["food_challenge"] },
  { key: "group", label: "Groups", kinds: ["group", "group_post"] },
  { key: "culture", label: "Culture", kinds: ["exhibit", "artwork", "mural"] },
];

function ratioStyle(hint: ExploreItem["aspectHint"]): React.CSSProperties {
  switch (hint) {
    case "portrait":
      return { aspectRatio: "3 / 4" };
    case "landscape":
      return { aspectRatio: "4 / 3" };
    case "square":
    default:
      return { aspectRatio: "1 / 1" };
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  return {
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: d.getDate().toString(),
  };
}

function MosaicTile({ item }: { item: ExploreItem }) {
  const date = formatDate(item.meta?.date);

  // Creator tile — no image? Square ink frame with a gold initial.
  if (item.kind === "creator" && !item.image_url) {
    return (
      <Link
        href={item.href}
        className="mb-2 break-inside-avoid block group press relative overflow-hidden"
        style={{
          background: "var(--paper-warm)",
          border: "2px solid var(--rule-strong-c)",
        }}
      >
        <div
          className="flex flex-col items-center justify-center gap-2 p-5 text-center"
          style={{ aspectRatio: "1 / 1" }}
        >
          <div
            className="w-14 h-14 flex items-center justify-center"
            style={{
              background: "var(--ink-strong)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--gold-c)",
              fontFamily: "var(--font-anton), Anton, sans-serif",
              fontSize: 28,
              lineHeight: 1,
            }}
          >
            {item.title.charAt(0).toUpperCase()}
          </div>
          <p
            className="c-card-t line-clamp-1 w-full"
            style={{ fontSize: 12, color: "var(--ink-strong)" }}
          >
            {item.title}
          </p>
          {item.chip && (
            <span className="c-badge c-badge-gold">
              {item.chip.label.toUpperCase()}
            </span>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      className="mb-2 break-inside-avoid block group press relative overflow-hidden"
      style={{ border: "2px solid var(--rule-strong-c)" }}
    >
      <div
        className="relative w-full overflow-hidden"
        style={{ background: "var(--ink-strong)", ...ratioStyle(item.aspectHint) }}
      >
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            sizes="(max-width: 430px) 50vw, 300px"
            className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon name="photo" size={28} style={{ color: "var(--gold-c)", opacity: 0.4 }} />
          </div>
        )}

        {/* Ink wash so overlay text reads against any photo */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(26,21,18,0.25) 0%, transparent 35%, rgba(26,21,18,0.85) 100%)",
          }}
        />

        {/* Top-left: chip or date pill */}
        {item.kind === "event" && date ? (
          <div
            className="absolute top-2 left-2 overflow-hidden"
            style={{
              background: "var(--paper)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            <div
              className="px-2 py-0.5 c-kicker text-center"
              style={{
                background: "var(--gold-c)",
                color: "var(--ink-strong)",
                fontSize: 9,
                letterSpacing: "0.16em",
              }}
            >
              {date.month}
            </div>
            <div className="px-2 py-1 text-center">
              <p
                className="tabular-nums"
                style={{
                  fontFamily: "var(--font-archivo-narrow), Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: 14,
                  lineHeight: 1,
                  color: "var(--ink-strong)",
                }}
              >
                {date.day}
              </p>
            </div>
          </div>
        ) : item.chip ? (
          <div className="absolute top-2 left-2">
            <span className="c-badge c-badge-gold">
              {item.chip.label.toUpperCase()}
            </span>
          </div>
        ) : null}

        {/* Top-right: AD label for chain businesses */}
        {item.meta?.isAd && (
          <span
            className="absolute top-2 right-2 c-badge"
            style={{
              background: "rgba(0,0,0,0.7)",
              color: "var(--gold-c)",
              border: "1px solid rgba(212,175,55,0.45)",
              fontSize: 8,
            }}
          >
            AD
          </span>
        )}

        {/* Bottom overlay: title + subtitle / author */}
        <div className="absolute inset-x-0 bottom-0 p-2.5">
          <p
            className="c-card-t line-clamp-1"
            style={{
              fontSize: 12,
              lineHeight: 1.15,
              color: "var(--paper)",
            }}
          >
            {item.title}
          </p>
          {item.kind === "post" && item.meta?.author ? (
            <div className="flex items-center gap-1.5 mt-1">
              {item.meta.author.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.meta.author.avatar_url}
                  alt=""
                  className="w-4 h-4 object-cover"
                  style={{ border: "1px solid var(--gold-c)" }}
                />
              ) : (
                <div
                  className="w-4 h-4"
                  style={{ background: "var(--gold-c)" }}
                />
              )}
              <span
                className="c-kicker line-clamp-1"
                style={{
                  fontSize: 9,
                  letterSpacing: "0.14em",
                  color: "var(--gold-c)",
                  opacity: 0.95,
                }}
              >
                @{item.meta.author.handle}
              </span>
            </div>
          ) : item.subtitle ? (
            <p
              className="c-meta line-clamp-1 mt-0.5"
              style={{
                fontSize: 10,
                color: "var(--paper)",
                opacity: 0.7,
                textTransform: "none",
              }}
            >
              {item.subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

interface ExploreMosaicProps {
  items: ExploreItem[];
}

export default function ExploreMosaic({ items }: ExploreMosaicProps) {
  const [search, setSearch] = useState("");
  const [what, setWhat] = useState<ExploreWhatFilter>("all");

  const filtered = useMemo(() => {
    let result = items;

    if (what !== "all") {
      const entry = WHAT_FILTERS.find((f) => f.key === what);
      const allowed = new Set(entry?.kinds ?? []);
      result = result.filter((i) => allowed.has(i.kind));
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.subtitle && i.subtitle.toLowerCase().includes(q))
      );
    }

    return result;
  }, [items, what, search]);

  return (
    <div>
      {/* Search + filter strip */}
      <div
        className="px-5 pt-4 pb-3"
        style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
      >
        {/* Search */}
        <div className="relative mb-3">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--ink-strong)"
            strokeOpacity="0.4"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search creators, events, shows, art…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 focus:outline-none"
            style={{
              background: "var(--paper-warm)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--ink-strong)",
              fontSize: 13,
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 press"
              style={{ color: "var(--ink-strong)", opacity: 0.4 }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4l6 6M10 4l-6 6"/></svg>
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {WHAT_FILTERS.map((f) => {
            const active = what === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setWhat(f.key)}
                className="shrink-0 px-3 py-1.5 press transition-colors"
                style={{
                  background: active ? "var(--gold-c)" : "var(--paper)",
                  border: "2px solid var(--rule-strong-c)",
                  color: "var(--ink-strong)",
                  fontFamily: "var(--font-archivo-narrow), sans-serif",
                  fontSize: 11,
                  fontWeight: active ? 800 : 600,
                  letterSpacing: "0.06em",
                }}
              >
                {f.label.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Count */}
      <div className="px-5 pt-3 pb-1">
        <p
          className="c-kicker"
          style={{
            fontSize: 10,
            letterSpacing: "0.18em",
            color: "var(--ink-strong)",
            opacity: 0.55,
          }}
        >
          {filtered.length} {filtered.length === 1 ? "RESULT" : "RESULTS"}
        </p>
      </div>

      {/* Mosaic */}
      <div className="px-4 pt-3">
        {filtered.length === 0 ? (
          <div
            className="text-center py-12"
            style={{
              background: "var(--paper-soft)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            <Icon name="search" size={22} style={{ color: "var(--ink-strong)", opacity: 0.35 }} className="mx-auto mb-3" />
            <p className="c-card-t" style={{ fontSize: 13 }}>Nothing found</p>
            <p className="c-meta mt-1" style={{ fontSize: 11 }}>
              Try clearing a filter or searching something else.
            </p>
          </div>
        ) : (
          <div className="columns-2 gap-2 [column-fill:_balance]">
            {filtered.map((item) => (
              <MosaicTile key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
