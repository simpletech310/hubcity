import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PlaylistDetail, {
  type PlaylistTrack,
} from "@/components/audio/PlaylistDetail";
import type { Playlist, PlaylistItem } from "@/types/database";

export const dynamic = "force-dynamic";

/**
 * /frequency/playlist/[id]
 *
 * Resolves the playlist row + ordered playlist_items, joins each item
 * back to its source `tracks` (or `podcasts`) row, and hands a flat
 * row list to <PlaylistDetail>. The component builds a `PlayableItem[]`
 * queue from those rows so Next/Previous on the mini player walks the
 * playlist naturally.
 */
export default async function PlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Playlist row (RLS-public for is_public = TRUE)
  const { data: playlist, error: plErr } = await supabase
    .from("playlists")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (plErr || !playlist || (!playlist.is_public && !playlist.is_editorial)) {
    notFound();
  }

  // 2. Ordered items
  const { data: itemRows } = await supabase
    .from("playlist_items")
    .select("playlist_id, position, item_type, item_id, added_at")
    .eq("playlist_id", id)
    .order("position", { ascending: true });

  const items = (itemRows ?? []) as PlaylistItem[];
  const trackIds = items.filter((i) => i.item_type === "track").map((i) => i.item_id);
  const epIds = items.filter((i) => i.item_type === "episode").map((i) => i.item_id);

  // 3. Resolve tracks + their albums for cover/title context
  const tracksP = trackIds.length
    ? supabase
        .from("tracks")
        .select(
          "id, album_id, channel_id, title, mux_playback_id, duration_seconds, features, is_published"
        )
        .in("id", trackIds)
    : Promise.resolve({ data: [] });

  const episodesP = epIds.length
    ? supabase
        .from("podcasts")
        .select(
          "id, title, mux_playback_id, duration, thumbnail_url, show_slug, show_title, channel_id, is_published"
        )
        .in("id", epIds)
    : Promise.resolve({ data: [] });

  const [tracksR, episodesR] = await Promise.all([tracksP, episodesP]);

  type TrackRow = {
    id: string;
    album_id: string;
    channel_id: string | null;
    title: string;
    mux_playback_id: string | null;
    duration_seconds: number | null;
    features: string[] | null;
    is_published: boolean;
  };
  type EpisodeRow = {
    id: string;
    title: string;
    mux_playback_id: string | null;
    duration: number | null;
    thumbnail_url: string | null;
    show_slug: string | null;
    show_title: string | null;
    channel_id: string | null;
    is_published: boolean;
  };

  const trackRows = ((tracksR.data ?? []) as TrackRow[]).filter((t) => t.is_published);
  const episodeRows = ((episodesR.data ?? []) as EpisodeRow[]).filter((e) => e.is_published);

  // 4. Pull album covers/titles for the tracks in one query
  const albumIds = Array.from(new Set(trackRows.map((t) => t.album_id).filter(Boolean)));
  const albumMap = new Map<
    string,
    { slug: string; title: string; cover_art_url: string | null }
  >();
  if (albumIds.length) {
    const { data: albumRows } = await supabase
      .from("albums")
      .select("id, slug, title, cover_art_url")
      .in("id", albumIds);
    for (const a of (albumRows ?? []) as Array<{
      id: string;
      slug: string;
      title: string;
      cover_art_url: string | null;
    }>) {
      albumMap.set(a.id, {
        slug: a.slug,
        title: a.title,
        cover_art_url: a.cover_art_url,
      });
    }
  }

  const trackIndex = new Map(trackRows.map((t) => [t.id, t]));
  const episodeIndex = new Map(episodeRows.map((e) => [e.id, e]));

  // 5. Walk items in playlist order, drop unresolved (deleted track, etc.)
  const rows: PlaylistTrack[] = [];
  let pos = 0;
  for (const it of items) {
    pos += 1;
    if (it.item_type === "track") {
      const t = trackIndex.get(it.item_id);
      if (!t) continue;
      const album = albumMap.get(t.album_id) ?? null;
      rows.push({
        id: t.id,
        kind: "track",
        position: pos,
        title: t.title,
        contextTitle: album?.title ?? null,
        contextSlug: album?.slug ?? null,
        coverUrl: album?.cover_art_url ?? null,
        muxPlaybackId: t.mux_playback_id,
        durationSeconds: t.duration_seconds,
        channelId: t.channel_id,
        features: t.features ?? null,
      });
    } else {
      const e = episodeIndex.get(it.item_id);
      if (!e) continue;
      rows.push({
        id: e.id,
        kind: "episode",
        position: pos,
        title: e.title,
        contextTitle: e.show_title,
        contextSlug: e.show_slug,
        coverUrl: e.thumbnail_url,
        muxPlaybackId: e.mux_playback_id,
        durationSeconds: e.duration,
        channelId: e.channel_id,
        features: null,
      });
    }
  }
  // Re-number positions after dropping unresolved rows
  rows.forEach((r, i) => {
    r.position = i + 1;
  });

  return <PlaylistDetail playlist={playlist as Playlist} rows={rows} />;
}
