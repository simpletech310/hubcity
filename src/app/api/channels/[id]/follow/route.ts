import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: NextRequest,
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

    // Check if channel exists
    const { data: channel } = await supabase
      .from("channels")
      .select("id, follower_count")
      .eq("id", channelId)
      .single();

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      );
    }

    // Check if already following
    const { data: existing } = await supabase
      .from("channel_follows")
      .select("channel_id")
      .eq("channel_id", channelId)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      // Unfollow
      await supabase
        .from("channel_follows")
        .delete()
        .eq("channel_id", channelId)
        .eq("user_id", user.id);

      // Decrement follower count
      await supabase
        .from("channels")
        .update({
          follower_count: Math.max(0, (channel.follower_count || 0) - 1),
        })
        .eq("id", channelId);

      return NextResponse.json({ following: false });
    } else {
      // Follow
      const { error } = await supabase.from("channel_follows").insert({
        channel_id: channelId,
        user_id: user.id,
      });

      if (error) {
        console.error("Failed to follow channel:", error);
        return NextResponse.json(
          { error: "Failed to follow channel" },
          { status: 500 }
        );
      }

      // Increment follower count
      await supabase
        .from("channels")
        .update({
          follower_count: (channel.follower_count || 0) + 1,
        })
        .eq("id", channelId);

      return NextResponse.json({ following: true });
    }
  } catch (error) {
    console.error("Channel follow error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
