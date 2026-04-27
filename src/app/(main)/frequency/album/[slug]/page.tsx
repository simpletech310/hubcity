import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import AlbumDetail from "@/components/audio/AlbumDetail";
import { resolveAlbumAccess } from "@/lib/audio-access";
import { buildOg } from "@/lib/og";
import { SITE_DOMAIN } from "@/lib/branding";
import type { Album, Track } from "@/types/database";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: album } = await supabase
    .from("albums")
    .select(
      "title, description, cover_art_url, slug, release_type, creator_id",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (!album) return { title: "Album not found" };

  const meta = buildOg({
    title: album.title,
    description: album.description ?? `${album.release_type?.toUpperCase()} on Frequency.`,
    image: album.cover_art_url ?? null,
    type: "music.album",
    path: `/frequency/album/${album.slug}`,
  });
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicAlbum",
    name: album.title,
    image: album.cover_art_url || undefined,
    description: album.description || undefined,
    url: `${SITE_DOMAIN}/frequency/album/${album.slug}`,
    albumReleaseType: album.release_type,
  };
  return {
    ...meta,
    other: { "application/ld+json": JSON.stringify(jsonLd) },
  };
}

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: album, error } = await supabase
    .from("albums")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !album) notFound();

  const albumRow = album as Album;

  const [{ data: tracks }, creatorRow, channelRow, userR] = await Promise.all([
    supabase
      .from("tracks")
      .select("*")
      .eq("album_id", albumRow.id)
      .eq("is_published", true)
      .order("track_number"),
    albumRow.creator_id
      ? supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("id", albumRow.creator_id as string)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    albumRow.channel_id
      ? supabase
          .from("channels")
          .select(
            "id, name, owner_id, subscription_price_cents, subscription_currency"
          )
          .eq("id", albumRow.channel_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.auth.getUser(),
  ]);

  const channel = (channelRow.data ?? null) as
    | {
        id: string;
        name: string | null;
        owner_id: string | null;
        subscription_price_cents: number | null;
        subscription_currency: string | null;
      }
    | null;

  const access = await resolveAlbumAccess(
    supabase,
    {
      id: albumRow.id,
      channel_id: albumRow.channel_id ?? null,
      access_type: albumRow.access_type ?? "free",
    },
    channel,
    userR.data.user?.id ?? null
  );

  const albumWithCreator: Album = {
    ...albumRow,
    creator: creatorRow.data
      ? {
          display_name: creatorRow.data.display_name as string,
          avatar_url: (creatorRow.data.avatar_url as string | null) ?? null,
        }
      : null,
  };

  return (
    <AlbumDetail
      album={albumWithCreator}
      tracks={(tracks ?? []) as Track[]}
      access={access}
      channelName={channel?.name ?? null}
    />
  );
}
