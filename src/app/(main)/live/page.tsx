import { createClient } from "@/lib/supabase/server";
import KnectTV from "@/components/live/KnectTV";
import type {
  Channel,
  ChannelVideo,
  LiveStream,
  TimeBlock,
  Show,
  ScheduledBroadcast,
  VideoAd,
} from "@/types/database";

export default async function LivePage() {
  const supabase = await createClient();

  // Fetch channels (includes new `scope` + `is_live_simulated` columns)
  const { data: rawChannels } = await supabase
    .from("channels")
    .select("*, owner:profiles!channels_owner_id_fkey(id, display_name, avatar_url, role)")
    .eq("is_active", true)
    .order("follower_count", { ascending: false });

  // Fetch active live streams (real live, not simulated)
  const { data: rawStreams } = await supabase
    .from("live_streams")
    .select(
      "*, creator:profiles(id, display_name, avatar_url, role, verification_status), channel:channels(id, name, slug, avatar_url, type, scope)"
    )
    .neq("status", "disabled")
    .order("status", { ascending: true })
    .order("scheduled_at", { ascending: true, nullsFirst: false });

  // Fetch featured videos
  const { data: rawFeatured } = await supabase
    .from("channel_videos")
    .select("*, channel:channels(id, name, slug, avatar_url, type, scope), show:shows(id, slug, title, poster_url, tagline)")
    .eq("is_published", true)
    .eq("is_featured", true)
    .eq("status", "ready")
    .order("published_at", { ascending: false })
    .limit(10);

  // Fetch recent videos
  const { data: rawRecent } = await supabase
    .from("channel_videos")
    .select("*, channel:channels(id, name, slug, avatar_url, type, scope), show:shows(id, slug, title, poster_url, tagline)")
    .eq("is_published", true)
    .eq("status", "ready")
    .order("published_at", { ascending: false })
    .limit(30);

  // Fetch all shows (for the on-demand poster grid)
  const { data: rawShows } = await supabase
    .from("shows")
    .select("*, channel:channels(id, name, slug, type, scope)")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  // Fetch time blocks (legacy weekly schedule for any per-channel recurring slots)
  const { data: rawTimeBlocks } = await supabase
    .from("time_blocks")
    .select("*, channel:channels(id, name, slug, avatar_url, type, scope)")
    .eq("is_active", true)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  // Fetch the Knect TV Live simulated-broadcast schedule (next ~50 slots)
  const nowIso = new Date().toISOString();
  const { data: liveChannelRow } = await supabase
    .from("channels")
    .select("id")
    .eq("slug", "knect-tv-live")
    .maybeSingle();

  const { data: rawSchedule, error: scheduleErr } = liveChannelRow
    ? await supabase
        .from("scheduled_broadcasts")
        .select(
          "id, channel_id, video_id, starts_at, ends_at, position, is_ad_slot, video:channel_videos(id, title, mux_playback_id, duration, show_id, show:shows(id, slug, title, poster_url, tagline))"
        )
        .eq("channel_id", liveChannelRow.id)
        .gte("ends_at", nowIso)
        .order("starts_at", { ascending: true })
        .limit(50)
    : { data: [], error: null };
  if (scheduleErr) console.error("schedule fetch error:", scheduleErr);

  // Fetch the active Walmart pre-roll ad (inter-video spot on the live stream)
  const { data: rawAd } = await supabase
    .from("video_ads")
    .select("id, title, mux_playback_id, cta_text, cta_url, business_id, duration")
    .eq("is_active", true)
    .eq("ad_type", "pre_roll")
    .not("mux_playback_id", "is", null)
    .limit(1)
    .maybeSingle();

  // Current user + verification + follows + purchases
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRole: string | null = null;
  let verificationStatus: string | null = null;
  let followedChannelIds: string[] = [];
  let purchasedVideoIds: string[] = [];

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, verification_status")
      .eq("id", user.id)
      .single();
    userRole = profile?.role || null;
    verificationStatus = profile?.verification_status || null;

    const { data: follows } = await supabase
      .from("channel_follows")
      .select("channel_id")
      .eq("user_id", user.id);
    followedChannelIds = (follows || []).map((f) => f.channel_id);

    const { data: purchases } = await supabase
      .from("video_purchases")
      .select("video_id")
      .eq("user_id", user.id);
    purchasedVideoIds = (purchases || []).map((p) => p.video_id);
  }

  const isVerified = verificationStatus === "verified";
  const canStream =
    userRole === "admin" || userRole === "city_official" || userRole === "city_ambassador";

  return (
    <KnectTV
      channels={(rawChannels as Channel[]) || []}
      streams={(rawStreams as LiveStream[]) || []}
      featuredVideos={(rawFeatured as ChannelVideo[]) || []}
      recentVideos={(rawRecent as ChannelVideo[]) || []}
      shows={(rawShows as Show[]) || []}
      timeBlocks={(rawTimeBlocks as TimeBlock[]) || []}
      liveSchedule={(rawSchedule as unknown as ScheduledBroadcast[]) || []}
      walmartAd={(rawAd as VideoAd | null) ?? null}
      canStream={canStream}
      userId={user?.id || null}
      isVerified={isVerified}
      followedChannelIds={followedChannelIds}
      purchasedVideoIds={purchasedVideoIds}
    />
  );
}
