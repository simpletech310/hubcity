import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import OfficialProfileClient from "./official-profile-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: official } = await supabase
    .from("civic_officials")
    .select("name, title")
    .eq("id", id)
    .single();

  if (!official) return { title: "Official Not Found | Knect" };

  return {
    title: `${official.name} — ${official.title} | Knect`,
    description: `Profile, voting record, flags, and accountability tracking for ${official.name}, ${official.title} in Compton.`,
  };
}

const COUNCIL_TYPES = ["mayor", "council_member"];
const SCHOOL_BOARD_TYPES = [
  "school_trustee",
  "board_president",
  "board_vp",
  "board_clerk",
  "board_member",
];
const APPOINTED_TYPES = ["city_manager", "superintendent"];

export default async function OfficialProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch official + flags in parallel
  const [{ data: official }, { data: flags }, { data: vectors }] =
    await Promise.all([
      supabase.from("civic_officials").select("*").eq("id", id).single(),
      supabase
        .from("official_flags")
        .select("*")
        .eq("official_id", id),
      supabase
        .from("accountability_vectors")
        .select("*")
        .order("sort_order"),
    ]);

  if (!official) notFound();

  // Fetch voting record or actions based on type
  let votes: any[] = [];
  let actions: any[] = [];

  if (COUNCIL_TYPES.includes(official.official_type)) {
    const { data } = await supabase
      .from("council_vote_rolls")
      .select("*, vote:council_votes(*)")
      .eq("official_id", id);
    votes = (data ?? []).map((r: any) => ({
      id: r.vote?.id ?? r.id,
      title: r.vote?.title ?? "",
      description: r.vote?.description,
      category: r.vote?.category ?? "",
      vote_date: r.vote?.vote_date ?? "",
      result: r.vote?.result ?? "",
      impact_level: r.vote?.impact_level ?? "low",
      aftermath: r.vote?.aftermath,
      position: r.position,
      notes: r.notes,
    }));
  } else if (SCHOOL_BOARD_TYPES.includes(official.official_type)) {
    const { data } = await supabase
      .from("board_action_rolls")
      .select("*, action:board_actions(*)")
      .eq("official_id", id);
    votes = (data ?? []).map((r: any) => ({
      id: r.action?.id ?? r.id,
      title: r.action?.title ?? "",
      description: r.action?.description,
      category: r.action?.category ?? "",
      vote_date: r.action?.action_date ?? "",
      result: r.action?.result ?? "",
      impact_level: r.action?.impact_level ?? "low",
      aftermath: r.action?.aftermath,
      position: r.position,
      notes: r.notes,
    }));
  }

  if (APPOINTED_TYPES.includes(official.official_type)) {
    const { data } = await supabase
      .from("manager_actions")
      .select("*")
      .eq("official_id", id)
      .order("action_date", { ascending: false });
    actions = data ?? [];
  }

  // For trustees, fetch schools in their area
  let areaSchools: any[] = [];
  if (official.trustee_area) {
    const { data } = await supabase
      .from("trustee_area_schools")
      .select("*")
      .eq("trustee_area", official.trustee_area)
      .order("school_name");
    areaSchools = data ?? [];
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Back nav */}
      <div className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <Link
            href="/officials"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-gold transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            All Officials
          </Link>
        </div>
      </div>

      <OfficialProfileClient
        official={official}
        flags={flags ?? []}
        votes={votes}
        actions={actions}
        vectors={vectors ?? []}
        areaSchools={areaSchools}
      />
    </div>
  );
}
