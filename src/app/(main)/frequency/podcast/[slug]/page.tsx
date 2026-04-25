import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PodcastShowDetail from "@/components/audio/PodcastShowDetail";
import { resolvePodcastAccess } from "@/lib/audio-access";
import type { Podcast } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function PodcastShowPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: episodes, error } = await supabase
    .from("podcasts")
    .select("*")
    .eq("show_slug", slug)
    .eq("is_published", true)
    .order("episode_number", { ascending: false });

  if (error) throw error;
  const list = (episodes ?? []) as Podcast[];
  if (list.length === 0) notFound();

  const head = list[0];
  const show = {
    slug: head.show_slug ?? slug,
    title: head.show_title ?? head.title,
    description: head.show_description ?? null,
    cover_art_url: head.thumbnail_url ?? null,
    genre_slug: head.genre_slug ?? null,
    channel_id: head.channel_id ?? null,
    episode_count: list.length,
  };

  const [channelRow, userR] = await Promise.all([
    head.channel_id
      ? supabase
          .from("channels")
          .select(
            "id, name, owner_id, subscription_price_cents, subscription_currency"
          )
          .eq("id", head.channel_id)
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

  const access = await resolvePodcastAccess(
    supabase,
    { channel_id: head.channel_id ?? null },
    channel,
    userR.data.user?.id ?? null
  );

  return (
    <PodcastShowDetail
      show={show}
      episodes={list}
      access={access}
      channelName={channel?.name ?? null}
    />
  );
}
