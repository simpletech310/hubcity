import { createClient } from "@/lib/supabase/server";
import FrequencyHub, {
  type FrequencyHubData,
} from "@/components/audio/FrequencyHub";
import type { Album, AudioGenre, Playlist, Podcast } from "@/types/database";

export const dynamic = "force-dynamic";

/**
 * /frequency — server-rendered hub index.
 *
 * Fetches the same rails the discover endpoint exposes, but inline so
 * first paint includes content. The client component handles tab
 * switching without re-fetching.
 */
export default async function FrequencyPage() {
  const supabase = await createClient();

  const [albumsR, podcastsR, playlistsR, genresR] = await Promise.all([
    supabase
      .from("albums")
      .select(
        "id, slug, title, description, release_type, cover_art_url, genre_slug, release_date, creator_id, is_demo, is_published, access_type, price_cents, ppv_stripe_price_id, preview_seconds, play_count, like_count, channel_id, cover_art_path, created_at, updated_at"
      )
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
      .select("*")
      .eq("is_public", true)
      .order("is_editorial", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("audio_genres")
      .select("slug, name, icon, sort_order, active")
      .eq("active", true)
      .order("sort_order"),
  ]);

  const albumRows = (albumsR.data ?? []) as Album[];
  const newSingles = albumRows.filter((a) => a.release_type === "single");
  const newAlbums = albumRows.filter((a) => a.release_type !== "single");

  // Roll up podcasts to one tile per show (latest episode wins).
  type Ep = Pick<
    Podcast,
    | "id"
    | "title"
    | "thumbnail_url"
    | "show_slug"
    | "show_title"
    | "show_description"
    | "genre_slug"
    | "published_at"
  >;
  const showsByKey = new Map<
    string,
    {
      show_slug: string | null;
      show_title: string;
      show_description: string | null;
      cover_art_url: string | null;
      episode_count: number;
      genre_slug: string | null;
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
        genre_slug: ep.genre_slug ?? null,
      });
    } else {
      existing.episode_count += 1;
    }
  }

  const data: FrequencyHubData = {
    new_singles: newSingles.slice(0, 12),
    new_albums: newAlbums.slice(0, 12),
    podcasts: Array.from(showsByKey.values()).slice(0, 12),
    playlists: (playlistsR.data ?? []) as Playlist[],
    genres: ((genresR.data ?? []) as AudioGenre[]),
  };

  return <FrequencyHub data={data} />;
}
