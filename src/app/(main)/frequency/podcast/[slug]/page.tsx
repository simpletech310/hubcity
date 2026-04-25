import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PodcastShowDetail from "@/components/audio/PodcastShowDetail";
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
    episode_count: list.length,
  };

  return <PodcastShowDetail show={show} episodes={list} />;
}
