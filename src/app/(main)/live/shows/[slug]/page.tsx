import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ShowDetail from "@/components/live/ShowDetail";
import type { ChannelVideo, Show, VideoAd } from "@/types/database";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ShowPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: show } = await supabase
    .from("shows")
    .select("*, channel:channels(id, name, slug, type, scope)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!show) notFound();

  const { data: episodes } = await supabase
    .from("channel_videos")
    .select("*")
    .eq("show_id", show.id)
    .eq("is_published", true)
    .eq("status", "ready")
    .order("episode_number", { ascending: true });

  const { data: walmartAd } = await supabase
    .from("video_ads")
    .select("id, title, mux_playback_id, cta_text, cta_url, business_id, duration")
    .eq("is_active", true)
    .eq("ad_type", "pre_roll")
    .not("mux_playback_id", "is", null)
    .limit(1)
    .maybeSingle();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let purchasedVideoIds: string[] = [];
  if (user) {
    const { data: purchases } = await supabase
      .from("video_purchases")
      .select("video_id")
      .eq("user_id", user.id);
    purchasedVideoIds = (purchases || []).map((p) => p.video_id);
  }

  return (
    <div className="animate-fade-in pb-24">
      <div className="px-5 pt-4">
        <Link
          href="/live"
          className="inline-flex items-center gap-1.5 text-[12px] text-txt-secondary hover:text-white transition-colors press mb-3"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Knect TV
        </Link>
      </div>

      <ShowDetail
        show={show as Show}
        episodes={(episodes as ChannelVideo[]) || []}
        walmartAd={(walmartAd as VideoAd | null) ?? null}
        userId={user?.id || null}
        purchasedVideoIds={purchasedVideoIds}
      />
    </div>
  );
}
