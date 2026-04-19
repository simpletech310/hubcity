import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/live/now-playing?channel=<slug>
// Returns current + next 10 scheduled broadcasts for a simulated-live channel.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("channel") || "knect-tv-live";

  const supabase = await createClient();

  const { data: channel } = await supabase
    .from("channels")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!channel) {
    return NextResponse.json({ error: "channel not found" }, { status: 404 });
  }

  const nowIso = new Date().toISOString();

  const { data: upcoming } = await supabase
    .from("scheduled_broadcasts")
    .select(
      "id, channel_id, video_id, starts_at, ends_at, position, is_ad_slot, video:channel_videos(id, title, mux_playback_id, duration, show_id, show:shows(id, slug, title, poster_url, tagline))"
    )
    .eq("channel_id", channel.id)
    .gte("ends_at", nowIso)
    .order("starts_at", { ascending: true })
    .limit(12);

  if (!upcoming || upcoming.length === 0) {
    return NextResponse.json({ current: null, upcoming: [] });
  }

  const [current, ...rest] = upcoming;
  return NextResponse.json({ current, upcoming: rest });
}
