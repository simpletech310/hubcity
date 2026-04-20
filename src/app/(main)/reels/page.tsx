import { createClient } from "@/lib/supabase/server";
import ReelsViewer from "@/components/reels/ReelsViewer";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { getActiveCity } from "@/lib/city-context";
import type { Reel } from "@/types/database";

export const metadata = {
  title: "Reels | Culture",
  description: "Watch short videos from Compton creators, businesses, and community.",
};

export default async function ReelsPage() {
  const supabase = await createClient();
  const nowISO = new Date().toISOString();
  const activeCity = await getActiveCity();

  const Masthead = (
    <header className="relative px-5 pt-6 pb-6 border-b border-white/[0.08] panel-editorial">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[10px] font-bold uppercase tracking-editorial text-gold tabular-nums">
          VOL · 01 · ISSUE REELS
        </span>
        <span className="block w-1 h-1 rounded-full bg-gold/60" />
        <span className="text-[10px] font-bold uppercase tracking-editorial text-white/40">
          {activeCity?.name?.toUpperCase() ?? "EVERYWHERE"}
        </span>
      </div>
      <h1 className="masthead text-white text-[44px]">REELS.</h1>
      <div className="mt-3 flex items-center gap-3">
        <span className="block h-[2px] w-8 bg-gold" />
        <span className="text-[10px] font-bold uppercase tracking-editorial text-ivory/60">
          Short-form video from the culture.
        </span>
      </div>
    </header>
  );

  const { data: rawReels } = await supabase
    .from("reels")
    .select(
      "*, author:profiles!reels_author_id_fkey(id, display_name, handle, avatar_url, role, verification_status)"
    )
    .eq("is_published", true)
    .or(`expires_at.is.null,expires_at.gt.${nowISO}`)
    .order("created_at", { ascending: false })
    .limit(50);

  const reels = (rawReels ?? []) as Reel[];

  if (reels.length === 0) {
    return (
      <>
        {Masthead}
        <div className="fixed inset-0 bg-black z-40 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <Icon name="video" size={28} className="text-white/40" />
          </div>
          <h1 className="font-heading font-bold text-xl text-white mb-2">
            No reels yet
          </h1>
          <p className="text-sm text-white/60 mb-6">
            Be the first to post a reel. Up to 90 seconds of vertical video.
          </p>
          <Link
            href="/reels/new"
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-gold to-gold-light text-midnight font-bold text-sm press"
          >
            Post a reel
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      {Masthead}
      <ReelsViewer reels={reels} />
    </>
  );
}
