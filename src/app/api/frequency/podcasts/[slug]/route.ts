import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/frequency/podcasts/[slug]
 *
 * Returns a podcast show + its episodes. Show metadata is denormalized
 * onto every episode row (show_slug, show_title, show_description), so
 * we read it from the most recent episode and bundle the episode list.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: episodes, error } = await supabase
      .from("podcasts")
      .select(
        "id, title, description, audio_url, mux_playback_id, thumbnail_url, duration, episode_number, season_number, genre_slug, show_slug, show_title, show_description, listen_count, published_at, created_at"
      )
      .eq("show_slug", slug)
      .eq("is_published", true)
      .order("episode_number", { ascending: false });

    if (error) throw error;
    if (!episodes || episodes.length === 0) {
      return NextResponse.json({ error: "Podcast not found" }, { status: 404 });
    }

    const head = episodes[0];
    const show = {
      slug: head.show_slug ?? slug,
      title: head.show_title ?? head.title,
      description: head.show_description ?? null,
      cover_art_url: head.thumbnail_url,
      genre_slug: head.genre_slug,
      episode_count: episodes.length,
    };

    return NextResponse.json({ show, episodes });
  } catch (e) {
    console.error("frequency/podcasts/[slug]", e);
    return NextResponse.json({ error: "Failed to load podcast" }, { status: 500 });
  }
}
