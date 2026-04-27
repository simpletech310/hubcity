import { createClient } from "@/lib/supabase/server";
import { getCityFilter } from "@/lib/city-filter";
import CultureTV from "@/components/live/CultureTV";
import CityFilterChip from "@/components/ui/CityFilterChip";
import { buildRelatedToLive } from "@/lib/live/relatedToLive";
import type {
  Channel,
  ChannelVideo,
  LiveStream,
  TimeBlock,
  Show,
  ScheduledBroadcast,
  VideoAd,
} from "@/types/database";

/**
 * Collapse duplicate channel_videos rows that share the same Mux
 * playback id. The Adiz "Westside Party" music video is intentionally
 * duplicated across the Adiz channel + the flagship knect-tv-live
 * channel so it shows up in the on-air rotation, but the FEATURED +
 * RECENTLY ADDED rails should only show one tile per asset.
 */
function dedupeVideosByPlaybackId(videos: ChannelVideo[]): ChannelVideo[] {
  const seen = new Set<string>();
  const out: ChannelVideo[] = [];
  for (const v of videos) {
    const key = v.mux_playback_id || v.id;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

export default async function LivePage({
  searchParams,
}: {
  searchParams?: Promise<{ city?: string | string[] }>;
}) {
  const supabase = await createClient();
  const sp = (await (searchParams ?? Promise.resolve({}))) as { city?: string | string[] };
  // Default scope = ALL cities. Listener can scope down via ?city=<slug>.
  // National channels (e.g. Culture TV) always show regardless of filter.
  const city = await getCityFilter(sp);

  // Fetch channels (includes `scope` + `is_live_simulated` columns).
  // - All-cities default: every active channel.
  // - Filtered: national channels + local channels in the chosen city.
  let channelsQuery = supabase
    .from("channels")
    .select("*, owner:profiles!channels_owner_id_fkey(id, display_name, avatar_url, role)")
    .eq("is_active", true)
    .order("follower_count", { ascending: false });
  if (city) {
    channelsQuery = channelsQuery.or(`scope.eq.national,city_id.eq.${city.id}`);
  }
  const { data: rawChannels } = await channelsQuery;

  // Fetch active live streams. Filter by city only when one is selected.
  let streamsQuery = supabase
    .from("live_streams")
    .select(
      "*, creator:profiles(id, display_name, avatar_url, role, verification_status), channel:channels(id, name, slug, avatar_url, type, scope)"
    )
    .neq("status", "disabled")
    .order("status", { ascending: true })
    .order("scheduled_at", { ascending: true, nullsFirst: false });
  if (city) streamsQuery = streamsQuery.eq("city_id", city.id);
  const { data: rawStreams } = await streamsQuery;

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
    .limit(80);

  // Cinema rails — fetched separately so each category renders as its
  // own vertical-poster strip (Family, Cartoons, Documentaries). Each
  // seeded row is tagged "[hub-cinema-seed:<category>]" in its
  // description by scripts/seed-onair-real.mjs.
  const cinemaTag = (cat: string) => `%[hub-cinema-seed:${cat}]%`;
  const [
    { data: rawFamily },
    { data: rawCartoons },
    { data: rawDocs },
  ] = await Promise.all([
    supabase
      .from("channel_videos")
      .select("*, channel:channels(id, name, slug, avatar_url, type, scope)")
      .eq("is_published", true)
      .eq("status", "ready")
      .ilike("description", cinemaTag("family"))
      .order("published_at", { ascending: false })
      .limit(12),
    supabase
      .from("channel_videos")
      .select("*, channel:channels(id, name, slug, avatar_url, type, scope)")
      .eq("is_published", true)
      .eq("status", "ready")
      .ilike("description", cinemaTag("cartoons"))
      .order("published_at", { ascending: false })
      .limit(10),
    supabase
      .from("channel_videos")
      .select("*, channel:channels(id, name, slug, avatar_url, type, scope)")
      .eq("is_published", true)
      .eq("status", "ready")
      .ilike("description", cinemaTag("docs"))
      .order("published_at", { ascending: false })
      .limit(10),
  ]);

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

  // Fetch the Culture TV Live simulated-broadcast schedule (next ~50 slots)
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
          "id, channel_id, video_id, starts_at, ends_at, position, is_ad_slot, video:channel_videos(id, title, description, episode_number, thumbnail_url, mux_playback_id, duration, show_id, show:shows(id, slug, title, poster_url, tagline))"
        )
        .eq("channel_id", liveChannelRow.id)
        .gte("ends_at", nowIso)
        .order("starts_at", { ascending: true })
        .limit(50)
    : { data: [], error: null };
  if (scheduleErr) console.error("schedule fetch error:", scheduleErr);

  // Fetch the active pre-roll ads (inter-video spots on the live stream and pre-roll)
  const { data: rawAds } = await supabase
    .from("video_ads")
    .select("id, title, mux_playback_id, cta_text, cta_url, business_id, duration")
    .eq("is_active", true)
    .eq("ad_type", "pre_roll")
    .not("mux_playback_id", "is", null);

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

  // Contextual strip: related platform content based on what's playing now
  const relatedToLive = await buildRelatedToLive(
    supabase,
    (rawSchedule as unknown as ScheduledBroadcast[]) || []
  );

  return (
    <div className="culture-surface min-h-dvh">
      <div
        className="px-[18px] pt-5 pb-4"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <div className="c-kicker">
          § VOL.{new Date().getFullYear() % 100} · AIRWAVE ·{" "}
          {new Date()
            .toLocaleDateString("en-US", { weekday: "short" })
            .toUpperCase()}
        </div>
        <div className="flex items-end justify-between gap-3 mt-2">
          <h1
            className="c-hero"
            style={{ fontSize: 56, lineHeight: 0.88, letterSpacing: "-0.02em" }}
          >
            On Air.
          </h1>
          <CityFilterChip />
        </div>
      </div>
      <CultureTV
        channels={(rawChannels as Channel[]) || []}
        streams={(rawStreams as LiveStream[]) || []}
        featuredVideos={dedupeVideosByPlaybackId((rawFeatured as ChannelVideo[]) || [])}
        recentVideos={dedupeVideosByPlaybackId((rawRecent as ChannelVideo[]) || [])}
        shows={(rawShows as Show[]) || []}
        timeBlocks={(rawTimeBlocks as TimeBlock[]) || []}
        liveSchedule={(rawSchedule as unknown as ScheduledBroadcast[]) || []}
        ads={(rawAds as VideoAd[]) || []}
        canStream={canStream}
        userId={user?.id || null}
        isVerified={isVerified}
        followedChannelIds={followedChannelIds}
        purchasedVideoIds={purchasedVideoIds}
        relatedToLive={relatedToLive}
        familyVideos={(rawFamily as ChannelVideo[]) || []}
        cartoonVideos={(rawCartoons as ChannelVideo[]) || []}
        docVideos={(rawDocs as ChannelVideo[]) || []}
      />
    </div>
  );
}
