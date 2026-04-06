import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Try by id first, then by slug
    let { data: channel, error } = await supabase
      .from("channels")
      .select("*, owner:profiles!channels_owner_id_fkey(id, display_name, avatar_url, role)")
      .eq("id", id)
      .single();

    if (error || !channel) {
      const slugResult = await supabase
        .from("channels")
        .select("*, owner:profiles!channels_owner_id_fkey(id, display_name, avatar_url, role)")
        .eq("slug", id)
        .single();
      channel = slugResult.data;
      error = slugResult.error;
    }

    if (error || !channel) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      );
    }

    // Fetch videos
    const { data: videos } = await supabase
      .from("channel_videos")
      .select("*")
      .eq("channel_id", channel.id)
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    // Fetch live streams
    const { data: live_streams } = await supabase
      .from("live_streams")
      .select(
        "*, creator:profiles(id, display_name, avatar_url, role, verification_status)"
      )
      .eq("channel_id", channel.id)
      .neq("status", "disabled")
      .order("scheduled_at", { ascending: true, nullsFirst: false });

    return NextResponse.json({
      channel,
      videos: videos || [],
      live_streams: live_streams || [],
    });
  } catch (error) {
    console.error("Channel GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const { data: channel } = await supabase
      .from("channels")
      .select("owner_id")
      .eq("id", id)
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
    const allowedFields = [
      "name",
      "description",
      "avatar_url",
      "banner_url",
      "is_active",
      "is_verified",
    ];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("channels")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update channel:", error);
      return NextResponse.json(
        { error: "Failed to update channel" },
        { status: 500 }
      );
    }

    return NextResponse.json({ channel: data });
  } catch (error) {
    console.error("Channel PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
