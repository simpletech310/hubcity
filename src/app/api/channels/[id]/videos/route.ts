import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createMuxClient } from "@/lib/mux";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const videoType = searchParams.get("video_type");

    let query = supabase
      .from("channel_videos")
      .select("*, channel:channels(id, name, slug, avatar_url, type)")
      .eq("channel_id", id)
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    if (videoType) {
      query = query.eq("video_type", videoType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch channel videos:", error);
      return NextResponse.json(
        { error: "Failed to fetch videos" },
        { status: 500 }
      );
    }

    return NextResponse.json({ videos: data || [] });
  } catch (error) {
    console.error("Channel videos GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: channelId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions: admin or channel owner
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const { data: channel } = await supabase
      .from("channels")
      .select("id, owner_id")
      .eq("id", channelId)
      .single();

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      );
    }

    const isAdmin = profile?.role === "admin";
    const isOwner = channel.owner_id === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, video_type, is_featured } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Create Mux direct upload
    const mux = createMuxClient();
    const upload = await mux.video.uploads.create({
      cors_origin: process.env.NEXT_PUBLIC_APP_URL || "*",
      new_asset_settings: {
        playback_policy: ["public"],
        encoding_tier: "baseline",
      },
    });

    // Create channel_video record
    const { data: video, error } = await supabase
      .from("channel_videos")
      .insert({
        channel_id: channelId,
        title,
        description: description || null,
        video_type: video_type || "on_demand",
        mux_upload_id: upload.id,
        status: "processing",
        is_featured: is_featured || false,
        is_published: true,
        published_at: new Date().toISOString(),
        view_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create channel video:", error);
      return NextResponse.json(
        { error: "Failed to create video" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        video,
        upload_url: upload.url,
        upload_id: upload.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Channel videos POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
