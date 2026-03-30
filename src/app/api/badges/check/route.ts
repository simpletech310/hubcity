import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface BadgeCheck {
  type: string;
  label: string;
  description: string;
  check: (supabase: Awaited<ReturnType<typeof createClient>>, userId: string) => Promise<boolean>;
}

const BADGE_CHECKS: BadgeCheck[] = [
  {
    type: "first_post",
    label: "First Voice",
    description: "Published your first post",
    check: async (supabase, userId) => {
      const { count } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("author_id", userId)
        .eq("is_published", true);
      return (count ?? 0) >= 1;
    },
  },
  {
    type: "first_rsvp",
    label: "Event Explorer",
    description: "RSVPed to your first event",
    check: async (supabase, userId) => {
      const { count } = await supabase
        .from("event_rsvps")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      return (count ?? 0) >= 1;
    },
  },
  {
    type: "first_order",
    label: "Shop Local",
    description: "Placed your first order",
    check: async (supabase, userId) => {
      const { count } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", userId);
      return (count ?? 0) >= 1;
    },
  },
  {
    type: "pollster",
    label: "Pollster",
    description: "Voted in 10 polls",
    check: async (supabase, userId) => {
      const { count } = await supabase
        .from("poll_votes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      return (count ?? 0) >= 10;
    },
  },
  {
    type: "voice_heard",
    label: "Voice Heard",
    description: "Responded to 5 surveys",
    check: async (supabase, userId) => {
      const { count } = await supabase
        .from("survey_responses")
        .select("*", { count: "exact", head: true })
        .eq("respondent_id", userId);
      return (count ?? 0) >= 5;
    },
  },
  {
    type: "community_champion",
    label: "Community Champion",
    description: "Published 50+ posts",
    check: async (supabase, userId) => {
      const { count } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("author_id", userId)
        .eq("is_published", true);
      return (count ?? 0) >= 50;
    },
  },
  {
    type: "issue_reporter",
    label: "City Watchdog",
    description: "Reported 5 city issues",
    check: async (supabase, userId) => {
      const { count } = await supabase
        .from("city_issues")
        .select("*", { count: "exact", head: true })
        .eq("reported_by", userId);
      return (count ?? 0) >= 5;
    },
  },
  {
    type: "shop_local_5",
    label: "Local Champion",
    description: "Ordered from 5 different businesses",
    check: async (supabase, userId) => {
      const { data } = await supabase
        .from("orders")
        .select("business_id")
        .eq("customer_id", userId);
      const unique = new Set((data ?? []).map((o) => o.business_id));
      return unique.size >= 5;
    },
  },
  {
    type: "district_pride",
    label: "District Pride",
    description: "Verified address and active in district",
    check: async (supabase, userId) => {
      const { data } = await supabase
        .from("profiles")
        .select("verification_status, district")
        .eq("id", userId)
        .single();
      return data?.verification_status === "verified" && !!data?.district;
    },
  },
];

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get existing badges
    const { data: existingBadges } = await supabase
      .from("citizen_badges")
      .select("badge_type")
      .eq("user_id", user.id);

    const existing = new Set(
      (existingBadges ?? []).map((b) => b.badge_type)
    );

    const newBadges: string[] = [];

    for (const badge of BADGE_CHECKS) {
      if (existing.has(badge.type)) continue;

      const earned = await badge.check(supabase, user.id);
      if (earned) {
        const { error } = await supabase.from("citizen_badges").insert({
          user_id: user.id,
          badge_type: badge.type,
        });
        if (!error) {
          newBadges.push(badge.type);
        }
      }
    }

    // Get all badges
    const { data: allBadges } = await supabase
      .from("citizen_badges")
      .select("*")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: true });

    return NextResponse.json({
      badges: allBadges ?? [],
      new_badges: newBadges,
      badge_definitions: BADGE_CHECKS.map((b) => ({
        type: b.type,
        label: b.label,
        description: b.description,
      })),
    });
  } catch (error) {
    console.error("Badge check error:", error);
    return NextResponse.json(
      { error: "Failed to check badges" },
      { status: 500 }
    );
  }
}
