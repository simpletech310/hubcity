import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = request.nextUrl;
    const channelId = searchParams.get("channel_id");

    let query = supabase
      .from("podcasts")
      .select("*, channel:channels(id, name, slug, avatar_url)")
      .eq("is_published", true)
      .order("season_number", { ascending: false })
      .order("episode_number", { ascending: false });

    if (channelId) {
      query = query.eq("channel_id", channelId);
    }

    const { data, error } = await query.limit(50);
    if (error) throw error;

    return NextResponse.json({ podcasts: data ?? [] });
  } catch (error) {
    console.error("Fetch podcasts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch podcasts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "city_official"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      channel_id,
      title,
      description,
      audio_url,
      duration,
      episode_number,
      season_number,
      thumbnail_url,
      is_published,
    } = body;

    if (!channel_id || !title || !audio_url) {
      return NextResponse.json(
        { error: "channel_id, title, and audio_url required" },
        { status: 400 }
      );
    }

    const { data: podcast, error } = await supabase
      .from("podcasts")
      .insert({
        channel_id,
        title,
        description: description || null,
        audio_url,
        duration: duration || null,
        episode_number: episode_number || null,
        season_number: season_number || 1,
        thumbnail_url: thumbnail_url || null,
        is_published: is_published ?? false,
        published_at: is_published ? new Date().toISOString() : null,
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ podcast });
  } catch (error) {
    console.error("Create podcast error:", error);
    return NextResponse.json(
      { error: "Failed to create podcast" },
      { status: 500 }
    );
  }
}
