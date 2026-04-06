import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify allowed role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, display_name")
      .eq("id", user.id)
      .single();

    const allowedRoles = ["business_owner", "admin", "city_official", "city_ambassador"];
    if (!profile || !allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // For admins, show all; for others, show only their own
    let query = supabase
      .from("job_listings")
      .select("*, business:businesses(id, name, slug, image_urls)")
      .order("created_at", { ascending: false });

    if (profile.role !== "admin") {
      query = query.eq("posted_by", user.id);
    }

    const { data: jobs, error } = await query;

    if (error) throw error;

    // Get user's business if they have one
    let business: { id: string; name: string } | null = null;
    if (profile.role === "business_owner") {
      const { data: biz } = await supabase
        .from("businesses")
        .select("id, name")
        .eq("owner_id", user.id)
        .single();
      business = biz;
    }

    return NextResponse.json({
      jobs: jobs ?? [],
      context: {
        role: profile.role,
        displayName: profile.display_name,
        business,
      },
    });
  } catch (error) {
    console.error("Dashboard jobs GET error:", error);
    return NextResponse.json(
      { error: "Failed to get dashboard jobs" },
      { status: 500 }
    );
  }
}
