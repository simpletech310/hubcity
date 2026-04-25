import { createClient } from "@/lib/supabase/server";
import ReelsViewer from "@/components/reels/ReelsViewer";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { getActiveCity } from "@/lib/city-context";
import type { Reel } from "@/types/database";

export const metadata = {
  title: "Moments | Culture",
  description:
    "Record a moment, share a moment. Short videos from the Hub City and beyond.",
};

export default async function MomentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ r?: string }>;
}) {
  const supabase = await createClient();
  const nowISO = new Date().toISOString();
  const activeCity = await getActiveCity();
  const params = (await searchParams) ?? {};
  const startReelId = params.r;

  const cityUpper = (activeCity?.name ?? "Everywhere").toUpperCase();

  // Culture masthead (only visible alongside the empty state; hidden once
  // the viewer takes full-screen control with its own dark overlay).
  const Masthead = (
    <header
      className="culture-surface culture-dark px-[18px] pt-6 pb-5"
      style={{ borderBottom: "3px solid var(--gold-c)" }}
    >
      <div className="c-kicker" style={{ color: "var(--gold-c)", opacity: 0.9 }}>
        § ISSUE MOMENTS · {cityUpper}
      </div>
      <h1
        className="c-display mt-2"
        style={{
          fontSize: 64,
          lineHeight: 0.82,
          letterSpacing: "-0.02em",
          color: "var(--ink-strong)",
        }}
      >
        MOMENTS.
      </h1>
      <p
        className="c-serif-it mt-2"
        style={{ fontSize: 14, lineHeight: 1.4, color: "var(--ink-soft)" }}
      >
        Record a moment, share a moment.
      </p>
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
        <div
          className="fixed inset-0 z-40 flex flex-col items-center justify-center px-8 text-center"
          style={{ background: "#0F0D0B" }}
        >
          <div
            className="w-16 h-16 flex items-center justify-center mb-4"
            style={{ border: "2px solid #F3EEDC" }}
          >
            <Icon name="video" size={28} style={{ color: "#F3EEDC" }} />
          </div>
          <div
            className="c-kicker mb-2"
            style={{ color: "var(--gold-c)" }}
          >
            § NO MOMENTS YET
          </div>
          <h2
            className="c-hero"
            style={{ fontSize: 36, color: "#F3EEDC" }}
          >
            Record the
            <br />
            first one.
          </h2>
          <p
            className="mt-3 c-body"
            style={{ color: "rgba(243,238,220,0.7)", fontSize: 13 }}
          >
            Up to 90 seconds of vertical video.
          </p>
          <Link
            href="/moments/new"
            className="c-btn c-btn-accent mt-5"
            style={{ padding: "12px 18px" }}
          >
            RECORD A MOMENT
          </Link>
        </div>
      </>
    );
  }

  const initialIndex = startReelId
    ? Math.max(0, reels.findIndex((r) => r.id === startReelId))
    : 0;

  return (
    <>
      {Masthead}
      <ReelsViewer reels={reels} initialIndex={initialIndex} />
    </>
  );
}
