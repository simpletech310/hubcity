import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AlbumCard from "@/components/audio/AlbumCard";
import PodcastShowCard from "@/components/audio/PodcastShowCard";
import type { Album, AudioGenre, Podcast } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function GenrePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const [genreR, albumsR, podcastsR] = await Promise.all([
    supabase.from("audio_genres").select("*").eq("slug", slug).maybeSingle(),
    supabase
      .from("albums")
      .select("*")
      .eq("genre_slug", slug)
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("podcasts")
      .select(
        "id, title, show_slug, show_title, show_description, thumbnail_url, published_at, genre_slug"
      )
      .eq("genre_slug", slug)
      .eq("is_published", true)
      .order("published_at", { ascending: false }),
  ]);

  const genre = genreR.data as AudioGenre | null;
  if (!genre) notFound();

  const albums = (albumsR.data ?? []) as Album[];

  type Ep = Pick<
    Podcast,
    | "id"
    | "title"
    | "show_slug"
    | "show_title"
    | "show_description"
    | "thumbnail_url"
  >;
  const showsByKey = new Map<
    string,
    {
      show_slug: string | null;
      show_title: string;
      show_description: string | null;
      cover_art_url: string | null;
      episode_count: number;
    }
  >();
  for (const ep of (podcastsR.data ?? []) as Ep[]) {
    const key = ep.show_slug ?? ep.id;
    const existing = showsByKey.get(key);
    if (!existing) {
      showsByKey.set(key, {
        show_slug: ep.show_slug ?? ep.id,
        show_title: ep.show_title ?? ep.title,
        show_description: ep.show_description ?? null,
        cover_art_url: ep.thumbnail_url ?? null,
        episode_count: 1,
      });
    } else {
      existing.episode_count += 1;
    }
  }
  const shows = Array.from(showsByKey.values());

  return (
    <div className="culture-surface min-h-dvh" style={{ paddingBottom: 24 }}>
      <div
        className="px-[18px] pt-5 pb-4"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <Link
          href="/frequency"
          className="press inline-flex items-center gap-1 mb-2"
          style={{
            fontFamily: "var(--font-archivo), Archivo, sans-serif",
            fontWeight: 800,
            fontSize: 11,
            letterSpacing: "0.16em",
            color: "var(--ink-strong)",
          }}
        >
          ← FREQUENCY
        </Link>
        <div className="c-kicker">§ GENRE · {genre.slug.toUpperCase()}</div>
        <h1
          className="c-hero mt-2"
          style={{
            fontSize: 56,
            lineHeight: 0.88,
            letterSpacing: "-0.02em",
          }}
        >
          {genre.name}.
        </h1>
      </div>

      {albums.length > 0 && (
        <div className="px-5 pt-5">
          <div
            className="c-kicker mb-3"
            style={{ fontSize: 10, letterSpacing: "0.2em", color: "var(--ink-strong)" }}
          >
            MUSIC
          </div>
          <div className="grid grid-cols-2 gap-4">
            {albums.map((a) => (
              <AlbumCard key={a.id} album={a} width={170} />
            ))}
          </div>
        </div>
      )}

      {shows.length > 0 && (
        <div className="px-5 pt-6">
          <div
            className="c-kicker mb-3"
            style={{ fontSize: 10, letterSpacing: "0.2em", color: "var(--ink-strong)" }}
          >
            PODCASTS
          </div>
          <div className="grid grid-cols-2 gap-4">
            {shows.map((s) => (
              <PodcastShowCard
                key={s.show_slug ?? s.show_title}
                show={s}
                width={170}
              />
            ))}
          </div>
        </div>
      )}

      {albums.length === 0 && shows.length === 0 && (
        <div className="px-5 pt-12 text-center">
          <p
            className="c-serif-it"
            style={{ fontSize: 15, color: "var(--ink-strong)", opacity: 0.7 }}
          >
            No audio in this genre yet.
          </p>
        </div>
      )}
    </div>
  );
}
