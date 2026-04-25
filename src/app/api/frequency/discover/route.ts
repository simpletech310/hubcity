import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/frequency/discover
 *
 * Returns the home-tab rails for the FREQUENCY hub:
 *   - new singles (release_type=single, latest)
 *   - new albums (release_type IN album,ep,mixtape, latest)
 *   - trending podcasts (one episode per show, latest per show)
 *   - editorial playlists
 *   - genres
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const [albums, podcasts, playlists, genres] = await Promise.all([
      supabase
        .from("albums")
        .select("id, slug, title, description, release_type, cover_art_url, genre_slug, release_date, creator_id, is_demo, created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(48),
      supabase
        .from("podcasts")
        .select(
          "id, title, description, audio_url, mux_playback_id, thumbnail_url, duration, episode_number, season_number, genre_slug, show_slug, show_title, show_description, published_at"
        )
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(60),
      supabase
        .from("playlists")
        .select("id, title, description, cover_art_url, genre_slug, is_editorial, created_at")
        .eq("is_public", true)
        .order("is_editorial", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("audio_genres")
        .select("slug, name, icon, sort_order")
        .eq("active", true)
        .order("sort_order"),
    ]);

    if (albums.error) throw albums.error;
    if (podcasts.error) throw podcasts.error;
    if (playlists.error) throw playlists.error;
    if (genres.error) throw genres.error;

    const albumRows = albums.data ?? [];
    const newSingles = albumRows.filter((a) => a.release_type === "single");
    const newAlbums = albumRows.filter((a) => a.release_type !== "single");

    // Group podcast episodes by show; latest episode per show is the rail tile.
    const showsByKey = new Map<string, { show_slug: string; show_title: string; show_description: string | null; cover_art_url: string | null; latest: typeof podcasts.data[number]; genre_slug: string | null; episode_count: number }>();
    for (const ep of podcasts.data ?? []) {
      const key = ep.show_slug ?? ep.id;
      const existing = showsByKey.get(key);
      if (!existing) {
        showsByKey.set(key, {
          show_slug: ep.show_slug ?? ep.id,
          show_title: ep.show_title ?? ep.title,
          show_description: ep.show_description ?? null,
          cover_art_url: ep.thumbnail_url,
          latest: ep,
          genre_slug: ep.genre_slug,
          episode_count: 1,
        });
      } else {
        existing.episode_count += 1;
      }
    }
    const shows = Array.from(showsByKey.values());

    return NextResponse.json({
      new_singles: newSingles.slice(0, 12),
      new_albums: newAlbums.slice(0, 12),
      podcasts: shows.slice(0, 12),
      playlists: playlists.data ?? [],
      genres: genres.data ?? [],
    });
  } catch (e) {
    console.error("frequency/discover", e);
    return NextResponse.json({ error: "Failed to load Frequency" }, { status: 500 });
  }
}
