import { createClient } from "@/lib/supabase/server";
import ReelsViewer from "@/components/reels/ReelsViewer";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import type { Reel } from "@/types/database";

export const metadata = {
  title: "Reels | Knect",
  description: "Watch short videos from Compton creators, businesses, and community.",
};

export default async function ReelsPage() {
  const supabase = await createClient();
  const nowISO = new Date().toISOString();

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
    );
  }

  return <ReelsViewer reels={reels} />;
}
