import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AlbumDetail from "@/components/audio/AlbumDetail";
import type { Album, Track } from "@/types/database";

export const dynamic = "force-dynamic";

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

  const [{ data: tracks }, creatorRow] = await Promise.all([
    supabase
      .from("tracks")
      .select("*")
      .eq("album_id", (album as Album).id)
      .eq("is_published", true)
      .order("track_number"),
    (album as Album).creator_id
      ? supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("id", (album as Album).creator_id as string)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const albumWithCreator: Album = {
    ...(album as Album),
    creator: creatorRow.data
      ? {
          display_name: creatorRow.data.display_name as string,
          avatar_url: (creatorRow.data.avatar_url as string | null) ?? null,
        }
      : null,
  };

  return (
    <AlbumDetail album={albumWithCreator} tracks={(tracks ?? []) as Track[]} />
  );
}
