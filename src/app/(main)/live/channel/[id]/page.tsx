import { createClient } from "@/lib/supabase/server";
import ChannelPage from "@/components/live/ChannelPage";
import type { Channel, ChannelVideo, LiveStream, TimeBlock } from "@/types/database";

export default async function ChannelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch channel by id or slug
  let channel: Channel | null = null;

  const { data: byId } = await supabase
    .from("channels")
    .select("*, owner:profiles!channels_owner_id_fkey(id, display_name, avatar_url, role, verification_status)")
    .eq("id", id)
    .single();

  if (byId) {
    channel = byId as Channel;
  } else {
    const { data: bySlug } = await supabase
      .from("channels")
      .select("*, owner:profiles!channels_owner_id_fkey(id, display_name, avatar_url, role, verification_status)")
      .eq("slug", id)
      .single();
    channel = (bySlug as Channel) || null;
  }

  if (!channel) {
    return (
      <div className="culture-surface min-h-dvh animate-fade-in px-5 pt-20 text-center">
        <div className="w-16 h-16 c-frame flex items-center justify-center mx-auto mb-4" style={{ background: "var(--paper-soft)" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: "var(--ink-strong)" }}>
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
        </div>
        <span className="c-kicker block mb-1">404</span>
        <h2 className="c-card-t mb-1" style={{ color: "var(--ink-strong)" }}>Channel Not Found</h2>
        <p className="c-body text-sm">This channel doesn&apos;t exist or has been removed.</p>
      </div>
    );
  }

  // Fetch videos
  const { data: rawVideos } = await supabase
    .from("channel_videos")
    .select("*")
    .eq("channel_id", channel.id)
    .eq("is_published", true)
    .eq("status", "ready")
    .order("published_at", { ascending: false });

  // Fetch live streams
  const { data: rawStreams } = await supabase
    .from("live_streams")
    .select(
      "*, creator:profiles(id, display_name, avatar_url, role, verification_status)"
    )
    .eq("channel_id", channel.id)
    .neq("status", "disabled")
    .order("scheduled_at", { ascending: true, nullsFirst: false });

  // Fetch time blocks
  const { data: rawTimeBlocks } = await supabase
    .from("time_blocks")
    .select("*")
    .eq("channel_id", channel.id)
    .eq("is_active", true)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  // Fetch albums tied to this channel (for the Music shelf)
  const { data: rawAlbums } = await supabase
    .from("albums")
    .select("id, slug, title, cover_art_url, release_type, release_date")
    .eq("channel_id", channel.id)
    .eq("is_published", true)
    .order("release_date", { ascending: false, nullsFirst: false })
    .limit(12);

  // Fetch podcast episodes by the channel owner — aggregated below to
  // one tile per show. We key off `creator_id` so podcasts work even
  // if the host hasn't linked individual episodes to a specific
  // `channel_id` (none of the seeded shows do).
  type PodcastEpisodeRow = {
    show_slug: string;
    show_title: string | null;
    show_description: string | null;
    thumbnail_url: string | null;
    published_at: string | null;
  };
  let rawPodcastEpisodes: PodcastEpisodeRow[] = [];
  if (channel.owner_id) {
    const { data } = await supabase
      .from("podcasts")
      .select(
        "show_slug, show_title, show_description, thumbnail_url, published_at",
      )
      .eq("creator_id", channel.owner_id)
      .eq("is_published", true)
      .not("show_slug", "is", null);
    rawPodcastEpisodes = (data ?? []) as unknown as PodcastEpisodeRow[];
  }
  const podcasts = (() => {
    const byShow = new Map<
      string,
      {
        show_slug: string;
        show_title: string;
        show_description: string | null;
        cover_url: string | null;
        episode_count: number;
        latest_episode_at: string | null;
      }
    >();
    for (const ep of rawPodcastEpisodes) {
      const cur = byShow.get(ep.show_slug);
      if (cur) {
        cur.episode_count += 1;
        if (
          ep.published_at &&
          (!cur.latest_episode_at || ep.published_at > cur.latest_episode_at)
        ) {
          cur.latest_episode_at = ep.published_at;
          cur.cover_url = ep.thumbnail_url ?? cur.cover_url;
        }
      } else {
        byShow.set(ep.show_slug, {
          show_slug: ep.show_slug,
          show_title: ep.show_title ?? ep.show_slug,
          show_description: ep.show_description,
          cover_url: ep.thumbnail_url,
          episode_count: 1,
          latest_episode_at: ep.published_at,
        });
      }
    }
    return Array.from(byShow.values()).sort((a, b) =>
      (b.latest_episode_at ?? "").localeCompare(a.latest_episode_at ?? ""),
    );
  })();

  // Check follow status
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isFollowing = false;
  if (user) {
    const { data: follow } = await supabase
      .from("channel_follows")
      .select("channel_id")
      .eq("channel_id", channel.id)
      .eq("user_id", user.id)
      .single();
    isFollowing = !!follow;
  }

  // Fetch creator's Stripe account id for tips
  let stripeAccountId: string | null = null;
  if (channel.owner_id) {
    const { data: stripeAccount } = await supabase
      .from("creator_stripe_accounts")
      .select("stripe_account_id, charges_enabled")
      .eq("creator_id", channel.owner_id)
      .maybeSingle();
    if (stripeAccount?.charges_enabled && stripeAccount.stripe_account_id) {
      stripeAccountId = stripeAccount.stripe_account_id;
    }
  }

  return (
    <ChannelPage
      channel={channel}
      videos={(rawVideos as ChannelVideo[]) || []}
      streams={(rawStreams as LiveStream[]) || []}
      timeBlocks={(rawTimeBlocks as TimeBlock[]) || []}
      albums={
        (rawAlbums as Array<{
          id: string;
          slug: string;
          title: string;
          cover_art_url: string | null;
          release_type: string | null;
          release_date: string | null;
        }>) ?? []
      }
      podcasts={podcasts}
      isFollowing={isFollowing}
      userId={user?.id || null}
      stripeAccountId={stripeAccountId}
    />
  );
}
