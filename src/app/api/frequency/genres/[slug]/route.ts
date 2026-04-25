import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/frequency/genres/[slug]
 *
 * Returns albums + podcasts filtered to a genre, used by the
 * /frequency/genre/[slug] page.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    const [genre, albums, podcasts] = await Promise.all([
      supabase.from("audio_genres").select("*").eq("slug", slug).single(),
      supabase
        .from("albums")
        .select("id, slug, title, description, release_type, cover_art_url, genre_slug, release_date, creator_id, created_at")
        .eq("genre_slug", slug)
        .eq("is_published", true)
        .order("created_at", { ascending: false }),
      supabase
        .from("podcasts")
        .select("id, title, description, mux_playback_id, thumbnail_url, duration, episode_number, season_number, genre_slug, show_slug, show_title, show_description, published_at")
        .eq("genre_slug", slug)
        .eq("is_published", true)
        .order("published_at", { ascending: false }),
    ]);

    if (genre.error) {
      return NextResponse.json({ error: "Genre not found" }, { status: 404 });
    }

    // Roll up podcasts to one row per show
    const shows = new Map<string, { show_slug: string; show_title: string; show_description: string | null; cover_art_url: string | null; episode_count: number }>();
    for (const ep of podcasts.data ?? []) {
      const k = ep.show_slug ?? ep.id;
      const existing = shows.get(k);
      if (!existing) {
        shows.set(k, {
          show_slug: ep.show_slug ?? ep.id,
          show_title: ep.show_title ?? ep.title,
          show_description: ep.show_description ?? null,
          cover_art_url: ep.thumbnail_url,
          episode_count: 1,
        });
      } else {
        existing.episode_count += 1;
      }
    }

    return NextResponse.json({
      genre: genre.data,
      albums: albums.data ?? [],
      podcasts: Array.from(shows.values()),
    });
  } catch (e) {
    console.error("frequency/genres/[slug]", e);
    return NextResponse.json({ error: "Failed to load genre" }, { status: 500 });
  }
}
