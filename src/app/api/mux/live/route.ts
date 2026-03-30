import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createMuxClient } from "@/lib/mux";

// POST — Create a new live stream
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "city_official"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, description, category, scheduled_at } = await request.json();

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Create Mux live stream
    const mux = createMuxClient();
    const stream = await mux.video.liveStreams.create({
      playback_policy: ["public"],
      new_asset_settings: {
        playback_policy: ["public"],
      },
      reduced_latency: true,
    });

    const playbackId =
      stream.playback_ids?.find((p) => p.policy === "public")?.id ??
      stream.playback_ids?.[0]?.id;

    // Save to Supabase
    const { data: liveStream, error } = await supabase
      .from("live_streams")
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        category: category || "community",
        mux_stream_id: stream.id,
        mux_stream_key: stream.stream_key,
        mux_playback_id: playbackId,
        rtmp_url: "rtmps://global-live.mux.com:443/app",
        status: "idle",
        scheduled_at: scheduled_at || null,
        created_by: user.id,
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ stream: liveStream });
  } catch (error) {
    console.error("Live stream creation error:", error);
    return NextResponse.json(
      { error: "Failed to create live stream" },
      { status: 500 }
    );
  }
}

// GET — List live streams
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: streams, error } = await supabase
      .from("live_streams")
      .select(
        "*, creator:profiles(id, display_name, avatar_url, role, verification_status)"
      )
      .neq("status", "disabled")
      .order("status", { ascending: true }) // 'active' before 'idle'
      .order("scheduled_at", { ascending: true, nullsFirst: false });

    if (error) throw error;

    return NextResponse.json({ streams: streams || [] });
  } catch (error) {
    console.error("Live streams fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch streams" },
      { status: 500 }
    );
  }
}
