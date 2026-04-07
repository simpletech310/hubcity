import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CHAMBER_SLUG = "compton-chamber-of-commerce";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify business owner
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "business_owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get business type for update filtering
    const { data: business } = await supabase
      .from("businesses")
      .select("business_type")
      .eq("owner_id", user.id)
      .single();

    const today = new Date().toISOString().split("T")[0];

    const [groupResult, resourcesResult, grantsResult, eventsResult, updatesResult] =
      await Promise.all([
        // Chamber group
        supabase
          .from("community_groups")
          .select("id, name, member_count")
          .eq("slug", CHAMBER_SLUG)
          .single(),

        // Business resources
        supabase
          .from("resources")
          .select("*")
          .eq("is_published", true)
          .eq("category", "business")
          .order("status", { ascending: true })
          .limit(20),

        // Business grants (resources with applications)
        supabase
          .from("resources")
          .select("*")
          .eq("is_published", true)
          .eq("category", "business")
          .eq("accepts_applications", true)
          .neq("status", "closed")
          .order("deadline", { ascending: true, nullsFirst: false })
          .limit(20),

        // Business-relevant events
        supabase
          .from("events")
          .select("*")
          .eq("is_published", true)
          .in("category", ["business", "networking", "community"])
          .gte("start_date", today)
          .order("start_date", { ascending: true })
          .limit(20),

        // Chamber updates
        supabase
          .from("chamber_updates")
          .select("*, author:profiles!chamber_updates_author_id_fkey(display_name, avatar_url)")
          .eq("is_published", true)
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(30),
      ]);

    return NextResponse.json({
      group: groupResult.data,
      resources: resourcesResult.data ?? [],
      grants: grantsResult.data ?? [],
      events: eventsResult.data ?? [],
      updates: updatesResult.data ?? [],
      business_type: business?.business_type ?? null,
    });
  } catch (error) {
    console.error("Chamber hub data error:", error);
    return NextResponse.json(
      { error: "Failed to load chamber hub data" },
      { status: 500 }
    );
  }
}
