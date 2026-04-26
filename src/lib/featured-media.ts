// ─────────────────────────────────────────────────────────
// Resolves a creator's pinned featured-media slot into a
// normalized FeaturedMedia shape that <CreatorFeaturedTile>
// can render. The pinned row is a soft pointer (no DB FK) so
// the resolver re-validates the underlying row each time and
// falls back to null if it's been deleted/unpublished.
// ─────────────────────────────────────────────────────────

import type { SupabaseClient } from "@supabase/supabase-js";

export type FeaturedKind = "reel" | "video" | "post" | "track" | "exhibit";

export type FeaturedMedia =
  | {
      kind: "reel";
      id: string;
      video_url: string;
      poster_url: string | null;
      caption: string | null;
      duration_seconds: number | null;
    }
  | {
      kind: "video";
      id: string;
      mux_playback_id: string | null;
      title: string;
      description: string | null;
      duration_seconds: number | null;
      thumbnail_url: string | null;
    }
  | {
      kind: "post";
      id: string;
      image_url: string;
      body: string | null;
    }
  | {
      kind: "track";
      id: string;
      title: string;
      cover_art_url: string | null;
      mux_playback_id: string | null;
      preview_seconds: number | null;
      duration_seconds: number | null;
      album_id: string | null;
      album_title: string | null;
    }
  | {
      kind: "exhibit";
      id: string;
      image_url: string;
      caption: string | null;
    };

interface ProfileRef {
  id: string;
  featured_kind: FeaturedKind | null;
  featured_id: string | null;
  featured_caption: string | null;
}

/**
 * Look up the pinned media row for a profile and shape it for the tile.
 * Returns null if the profile hasn't pinned anything, or if the underlying
 * row no longer exists (caller should fall back to algorithmic auto-pick).
 *
 * Server-side ownership is enforced when the pin is set
 * (see /api/profile/featured) — this resolver does not re-check ownership.
 */
export async function resolveFeaturedMedia(
  supabase: SupabaseClient,
  profile: ProfileRef
): Promise<FeaturedMedia | null> {
  if (!profile.featured_kind || !profile.featured_id) return null;

  const id = profile.featured_id;
  const captionOverride = profile.featured_caption;

  switch (profile.featured_kind) {
    case "reel": {
      const { data } = await supabase
        .from("reels")
        .select("id, video_url, poster_url, caption, duration_seconds, is_published")
        .eq("id", id)
        .maybeSingle();
      if (!data || !data.is_published) return null;
      return {
        kind: "reel",
        id: data.id,
        video_url: data.video_url,
        poster_url: data.poster_url,
        caption: captionOverride ?? data.caption,
        duration_seconds: data.duration_seconds,
      };
    }
    case "video": {
      const { data } = await supabase
        .from("channel_videos")
        .select("id, title, description, mux_playback_id, duration_seconds, thumbnail_url, is_published, status")
        .eq("id", id)
        .maybeSingle();
      if (!data || data.is_published === false) return null;
      return {
        kind: "video",
        id: data.id,
        mux_playback_id: data.mux_playback_id ?? null,
        title: data.title,
        description: captionOverride ?? data.description,
        duration_seconds: data.duration_seconds,
        thumbnail_url:
          data.thumbnail_url ??
          (data.mux_playback_id
            ? `https://image.mux.com/${data.mux_playback_id}/thumbnail.webp`
            : null),
      };
    }
    case "post": {
      const { data } = await supabase
        .from("posts")
        .select("id, image_url, body, is_published")
        .eq("id", id)
        .maybeSingle();
      if (!data || data.is_published === false || !data.image_url) return null;
      return {
        kind: "post",
        id: data.id,
        image_url: data.image_url,
        body: captionOverride ?? data.body,
      };
    }
    case "track": {
      const { data } = await supabase
        .from("tracks")
        .select(
          "id, title, mux_playback_id, duration_seconds, is_published, album:albums(id, title, cover_art_url, preview_seconds)"
        )
        .eq("id", id)
        .maybeSingle();
      if (!data || data.is_published === false) return null;
      const album = Array.isArray(data.album) ? data.album[0] : data.album;
      return {
        kind: "track",
        id: data.id,
        title: data.title,
        cover_art_url: album?.cover_art_url ?? null,
        mux_playback_id: data.mux_playback_id ?? null,
        preview_seconds: album?.preview_seconds ?? null,
        duration_seconds: data.duration_seconds,
        album_id: album?.id ?? null,
        album_title: album?.title ?? null,
      };
    }
    case "exhibit": {
      const { data } = await supabase
        .from("profile_gallery_images")
        .select("id, image_url, caption")
        .eq("id", id)
        .maybeSingle();
      if (!data) return null;
      return {
        kind: "exhibit",
        id: data.id,
        image_url: data.image_url,
        caption: captionOverride ?? data.caption,
      };
    }
    default:
      return null;
  }
}
