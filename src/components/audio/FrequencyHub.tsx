"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import SnapCarousel from "@/components/ui/editorial/SnapCarousel";
import AlbumCard from "./AlbumCard";
import PodcastShowCard from "./PodcastShowCard";
import GenreTile from "./GenreTile";
import FeaturedSingleHero, {
  type FeaturedSingleData,
} from "./FeaturedSingleHero";
import type { Album, AudioGenre, Playlist } from "@/types/database";

type ShowTile = {
  show_slug: string | null;
  show_title: string;
  show_description: string | null;
  cover_art_url: string | null;
  episode_count: number;
  genre_slug?: string | null;
};

export interface FrequencyHubData {
  /** Optional editorial featured single — renders as a magazine-cover hero
   *  at the top of the home tab. Can play directly from the hero. */
  featured?: FeaturedSingleData | null;
  new_singles: Album[];
  new_albums: Album[];
  podcasts: ShowTile[];
  playlists: Playlist[];
  genres: AudioGenre[];
}

type TabId = "home" | "music" | "podcasts" | "genres" | "library";

const TABS: { id: TabId; label: string }[] = [
  { id: "home", label: "HOME" },
  { id: "music", label: "MUSIC" },
  { id: "podcasts", label: "PODCASTS" },
  { id: "genres", label: "GENRES" },
  { id: "library", label: "LIBRARY" },
];

/**
 * Client-side index for the FREQUENCY hub.
 * Receives all rail data already fetched server-side; no client fetch
 * on first paint. Tabs are local state — they switch which rail set
 * is visible without a route change so the persistent mini player
 * never unmounts.
 */
export default function FrequencyHub({ data }: { data: FrequencyHubData }) {
  const [tab, setTab] = useState<TabId>("home");

  const allAlbums = useMemo(
    () => [...data.new_singles, ...data.new_albums],
    [data.new_singles, data.new_albums]
  );

  return (
    <div className="culture-surface min-h-dvh" style={{ paddingBottom: 16 }}>
      {/* Masthead — matches the "On Air." treatment in /live */}
      <div
        className="px-[18px] pt-5 pb-4"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <div className="c-kicker">
          § VOL.{new Date().getFullYear() % 100} · AIRWAVE · AUDIO
        </div>
        <h1
          className="c-hero mt-2"
          style={{
            fontSize: 56,
            lineHeight: 0.88,
            letterSpacing: "-0.02em",
          }}
        >
          Frequency.
        </h1>
        <p
          className="c-serif-it mt-2"
          style={{ fontSize: 13, opacity: 0.8, color: "var(--ink-strong)" }}
        >
          Compton&rsquo;s audio desk — singles, albums, podcasts, mixes.
        </p>
      </div>

      {/* Tab strip */}
      <div
        className="overflow-x-auto scrollbar-hide"
        style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
      >
        <div className="flex gap-1 px-3 py-2 min-w-max">
          {TABS.map((t) => {
            const on = t.id === tab;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="press"
                style={{
                  padding: "6px 12px",
                  fontFamily: "var(--font-archivo), Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: 11,
                  letterSpacing: "0.16em",
                  color: on ? "var(--ink-strong)" : "var(--ink-strong)",
                  background: on ? "var(--gold-c)" : "transparent",
                  border: on
                    ? "2px solid var(--ink-strong)"
                    : "2px solid transparent",
                }}
                aria-pressed={on}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "home" && <HomeTab data={data} />}
      {tab === "music" && <MusicTab albums={allAlbums} />}
      {tab === "podcasts" && <PodcastsTab shows={data.podcasts} />}
      {tab === "genres" && <GenresTab genres={data.genres} />}
      {tab === "library" && <LibraryTab />}
    </div>
  );
}

// ── HOME ────────────────────────────────────────────────

function HomeTab({ data }: { data: FrequencyHubData }) {
  // Numbering: featured single is N=1 when present; subsequent rails shift.
  let n = 1;
  const featuredN = data.featured ? n++ : null;
  const singlesN = data.new_singles.length > 0 ? n++ : null;
  const albumsN = data.new_albums.length > 0 ? n++ : null;
  const podcastsN = data.podcasts.length > 0 ? n++ : null;
  const genresN = data.genres.length > 0 ? n++ : null;
  const playlistsN = data.playlists.length > 0 ? n++ : null;

  const isEmpty =
    !data.featured &&
    data.new_singles.length === 0 &&
    data.new_albums.length === 0 &&
    data.podcasts.length === 0 &&
    data.playlists.length === 0;

  if (isEmpty) {
    return (
      <div className="px-5 py-12">
        <div
          className="p-6 text-center"
          style={{
            background: "var(--paper-warm)",
            border: "2px solid var(--rule-strong-c)",
          }}
        >
          <p className="c-kicker" style={{ color: "var(--ink-mute)" }}>
            § THE BOOTH IS WARMING UP
          </p>
          <p
            className="c-card-t mt-2"
            style={{ color: "var(--ink-strong)", fontSize: 18 }}
          >
            No music published yet.
          </p>
          <p
            className="c-serif-it mt-2"
            style={{ fontSize: 13, color: "var(--ink-mute)" }}
          >
            When creators drop a single, EP, or mixtape it&rsquo;ll surface
            here. Are you a creator? Stage your first release from the
            dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-5 space-y-6">
      {data.featured && featuredN !== null && (
        <SnapCarousel
          kicker="THIS WEEK"
          title="Featured Single"
          number={featuredN}
          rail={false}
        >
          <FeaturedSingleHero single={data.featured} />
        </SnapCarousel>
      )}

      {data.new_singles.length > 0 && singlesN !== null && (
        <SnapCarousel kicker="NEW" title="Singles" number={singlesN}>
          {data.new_singles.map((a) => (
            <AlbumCard key={a.id} album={a} />
          ))}
        </SnapCarousel>
      )}

      {data.new_albums.length > 0 && albumsN !== null && (
        <SnapCarousel kicker="DROPS" title="Albums &amp; EPs" number={albumsN}>
          {data.new_albums.map((a) => (
            <AlbumCard key={a.id} album={a} />
          ))}
        </SnapCarousel>
      )}

      {data.podcasts.length > 0 && podcastsN !== null && (
        <SnapCarousel kicker="ON THE MIC" title="Podcasts" number={podcastsN}>
          {data.podcasts.map((s) => (
            <PodcastShowCard
              key={s.show_slug ?? s.show_title}
              show={{
                show_slug: s.show_slug,
                show_title: s.show_title,
                cover_art_url: s.cover_art_url,
                episode_count: s.episode_count,
              }}
            />
          ))}
        </SnapCarousel>
      )}

      {data.genres.length > 0 && genresN !== null && (
        <SnapCarousel kicker="DIAL IN" title="Genres" number={genresN}>
          {data.genres.map((g) => (
            <GenreTile key={g.slug} genre={g} />
          ))}
        </SnapCarousel>
      )}

      {data.playlists.length > 0 && playlistsN !== null && (
        <SnapCarousel kicker="EDITOR" title="Playlists" number={playlistsN}>
          {data.playlists.map((p) => (
            <PlaylistCard key={p.id} playlist={p} />
          ))}
        </SnapCarousel>
      )}
    </div>
  );
}

// ── MUSIC ───────────────────────────────────────────────

function MusicTab({ albums }: { albums: Album[] }) {
  if (albums.length === 0) return <Empty label="No music yet." />;
  return (
    <div className="px-5 pt-5">
      <div className="grid grid-cols-2 gap-4">
        {albums.map((a) => (
          <AlbumCard key={a.id} album={a} width={170} />
        ))}
      </div>
    </div>
  );
}

// ── PODCASTS ────────────────────────────────────────────

function PodcastsTab({ shows }: { shows: ShowTile[] }) {
  if (shows.length === 0) return <Empty label="No podcasts yet." />;
  return (
    <div className="px-5 pt-5">
      <div className="grid grid-cols-2 gap-4">
        {shows.map((s) => (
          <PodcastShowCard
            key={s.show_slug ?? s.show_title}
            show={{
              show_slug: s.show_slug,
              show_title: s.show_title,
              cover_art_url: s.cover_art_url,
              episode_count: s.episode_count,
            }}
            width={170}
          />
        ))}
      </div>
    </div>
  );
}

// ── GENRES ──────────────────────────────────────────────

function GenresTab({ genres }: { genres: AudioGenre[] }) {
  if (genres.length === 0) return <Empty label="No genres yet." />;
  return (
    <div className="px-5 pt-5">
      <div className="grid grid-cols-2 gap-3">
        {genres.map((g) => (
          <GenreTile key={g.slug} genre={g} width={180} />
        ))}
      </div>
    </div>
  );
}

// ── LIBRARY ─────────────────────────────────────────────

function LibraryTab() {
  return (
    <div className="px-5 pt-8 text-center">
      <div className="c-kicker mb-2">YOUR LIBRARY</div>
      <p
        className="c-serif-it mx-auto"
        style={{ maxWidth: 280, fontSize: 14, color: "var(--ink-strong)", opacity: 0.8 }}
      >
        Saved albums, followed shows, and your playlists will live here. We&rsquo;re
        wiring saves up next.
      </p>
    </div>
  );
}

// ── PLAYLIST CARD ──────────────────────────────────────

function PlaylistCard({ playlist }: { playlist: Playlist }) {
  return (
    <Link
      href={`/frequency/playlist/${playlist.id}`}
      className="block press shrink-0 snap-start"
      style={{ width: 156 }}
    >
      <div
        className="relative aspect-square overflow-hidden flex items-center justify-center p-3"
        style={{
          background: "var(--ink-strong)",
          color: "var(--paper)",
          border: "2px solid var(--rule-strong-c)",
        }}
      >
        <div className="text-center">
          <div
            className="c-kicker"
            style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--gold-c)" }}
          >
            PLAYLIST
          </div>
          <div
            className="c-hero mt-1"
            style={{
              fontSize: 18,
              lineHeight: 1.05,
              fontFamily: "var(--font-fraunces), Fraunces, serif",
              fontStyle: "italic",
              fontWeight: 700,
            }}
          >
            {playlist.title}
          </div>
        </div>
      </div>
      <div className="mt-2">
        <div
          className="c-card-t truncate"
          style={{ fontSize: 13, lineHeight: 1.15, color: "var(--ink-strong)" }}
        >
          {playlist.title}
        </div>
        {playlist.is_editorial && (
          <div
            className="c-meta truncate"
            style={{ fontSize: 11, opacity: 0.75, color: "var(--ink-strong)" }}
          >
            Editorial pick
          </div>
        )}
      </div>
    </Link>
  );
}

// ── EMPTY STATE ────────────────────────────────────────

function Empty({ label }: { label: string }) {
  return (
    <div className="px-5 pt-12 text-center">
      <p
        className="c-serif-it"
        style={{ fontSize: 15, color: "var(--ink-strong)", opacity: 0.7 }}
      >
        {label}
      </p>
    </div>
  );
}
