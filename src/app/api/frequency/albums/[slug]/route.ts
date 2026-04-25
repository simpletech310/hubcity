import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/frequency/albums/[slug]
 *
 * Returns album metadata + ordered tracks. Each track exposes
 * mux_playback_id for client-side playback.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: album, error } = await supabase
      .from("albums")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .single();

    if (error || !album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    const { data: tracks, error: terr } = await supabase
      .from("tracks")
      .select("*")
      .eq("album_id", album.id)
      .eq("is_published", true)
      .order("track_number");

    if (terr) throw terr;

    return NextResponse.json({ album, tracks: tracks ?? [] });
  } catch (e) {
    console.error("frequency/albums/[slug]", e);
    return NextResponse.json({ error: "Failed to load album" }, { status: 500 });
  }
}
