import { createClient } from "@/lib/supabase/server";
import WatchPage from "@/components/live/WatchPage";
import type { ChannelVideo } from "@/types/database";

export default async function VideoWatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch video with channel + show + creator profile (the channel owner)
  // so the watch page can render proper editorial metadata underneath the
  // player.
  const { data: video } = await supabase
    .from("channel_videos")
    .select(
      `*,
       channel:channels(
         id, name, slug, avatar_url, type, follower_count, is_verified,
         owner:profiles!channels_owner_id_fkey(id, display_name, handle, avatar_url, role, verification_status)
       ),
       show:shows(id, slug, title, tagline, description, poster_url, format, runtime_minutes)`
    )
    .eq("id", id)
    .single();

  if (!video) {
    return (
      <div className="animate-fade-in px-5 pt-20 text-center">
        <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4" style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="c-meta">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
        <h2 className="font-heading font-bold text-lg mb-1" style={{ color: "var(--ink-strong)" }}>Video Not Found</h2>
        <p className="text-sm c-meta">This video doesn&apos;t exist or has been removed.</p>
      </div>
    );
  }

  // Fetch more videos from the same channel
  const { data: moreVideos } = await supabase
    .from("channel_videos")
    .select("*, channel:channels(id, name, slug, avatar_url, type)")
    .eq("channel_id", video.channel_id)
    .eq("is_published", true)
    .eq("status", "ready")
    .neq("id", id)
    .order("published_at", { ascending: false })
    .limit(6);

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <WatchPage
      video={video as ChannelVideo}
      moreVideos={(moreVideos as ChannelVideo[]) || []}
      userId={user?.id || null}
    />
  );
}
