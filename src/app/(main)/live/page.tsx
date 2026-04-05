import { createClient } from "@/lib/supabase/server";
import HubCityTV from "@/components/live/HubCityTV";
import type { Channel, ChannelVideo, LiveStream, TimeBlock } from "@/types/database";

export default async function LivePage() {
  const supabase = await createClient();

  // Fetch channels
  const { data: rawChannels } = await supabase
    .from("channels")
    .select("*, owner:profiles(id, display_name, avatar_url, role)")
    .eq("is_active", true)
    .order("follower_count", { ascending: false });

  // Fetch active live streams
  const { data: rawStreams } = await supabase
    .from("live_streams")
    .select(
      "*, creator:profiles(id, display_name, avatar_url, role, verification_status), channel:channels(id, name, slug, avatar_url, type)"
    )
    .neq("status", "disabled")
    .order("status", { ascending: true })
    .order("scheduled_at", { ascending: true, nullsFirst: false });

  // Fetch featured videos
  const { data: rawFeatured } = await supabase
    .from("channel_videos")
    .select("*, channel:channels(id, name, slug, avatar_url, type)")
    .eq("is_published", true)
    .eq("is_featured", true)
    .eq("status", "ready")
    .order("published_at", { ascending: false })
    .limit(10);

  // Fetch recent videos
  const { data: rawRecent } = await supabase
    .from("channel_videos")
    .select("*, channel:channels(id, name, slug, avatar_url, type)")
    .eq("is_published", true)
    .eq("status", "ready")
    .order("published_at", { ascending: false })
    .limit(30);

  // Fetch time blocks for all days (full weekly schedule)
  const { data: rawTimeBlocks } = await supabase
    .from("time_blocks")
    .select("*, channel:channels(id, name, slug, avatar_url, type)")
    .eq("is_active", true)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  // Get current user + role
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRole: string | null = null;
  let followedChannelIds: string[] = [];

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    userRole = profile?.role || null;

    const { data: follows } = await supabase
      .from("channel_follows")
      .select("channel_id")
      .eq("user_id", user.id);
    followedChannelIds = (follows || []).map((f) => f.channel_id);
  }

  const canStream = userRole === "admin" || userRole === "city_official" || userRole === "city_ambassador";

  return (
    <HubCityTV
      channels={(rawChannels as Channel[]) || []}
      streams={(rawStreams as LiveStream[]) || []}
      featuredVideos={(rawFeatured as ChannelVideo[]) || []}
      recentVideos={(rawRecent as ChannelVideo[]) || []}
      timeBlocks={(rawTimeBlocks as TimeBlock[]) || []}
      canStream={canStream}
      userId={user?.id || null}
      followedChannelIds={followedChannelIds}
    />
  );
}
