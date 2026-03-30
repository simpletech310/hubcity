import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStrictRateLimiter, checkRateLimit } from "@/lib/ratelimit";

// GET /api/ads/campaigns — business owners see their campaigns, admins see all
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("ad_campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    // Non-admins only see campaigns for their businesses
    if (profile.role !== "admin") {
      // Get businesses owned by this user
      const { data: businesses } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id);

      const businessIds = (businesses || []).map((b) => b.id);

      if (businessIds.length === 0) {
        return NextResponse.json({ campaigns: [] });
      }

      query = query.in("business_id", businessIds);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data: campaigns, error } = await query;

    if (error) throw error;

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("List campaigns error:", error);
    return NextResponse.json(
      { error: "Failed to list campaigns" },
      { status: 500 }
    );
  }
}

// POST /api/ads/campaigns — create a draft campaign
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit(getStrictRateLimiter(), user.id);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", reset: rl.reset },
        { status: 429 }
      );
    }

    // Check user is admin or business owner
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { name, business_id, budget_cents, start_date, end_date, targeting } =
      await request.json();

    if (!name || !business_id || !budget_cents || !start_date || !end_date) {
      return NextResponse.json(
        { error: "name, business_id, budget_cents, start_date, and end_date are required" },
        { status: 400 }
      );
    }

    // Verify the user owns this business or is admin
    if (profile.role !== "admin") {
      const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("id", business_id)
        .eq("owner_id", user.id)
        .single();

      if (!business) {
        return NextResponse.json(
          { error: "Business not found or not owned by you" },
          { status: 403 }
        );
      }
    }

    const { data: campaign, error } = await supabase
      .from("ad_campaigns")
      .insert({
        name: name.trim(),
        business_id,
        budget_cents: Number(budget_cents),
        start_date,
        end_date,
        targeting: targeting || null,
        status: "draft",
        created_by: user.id,
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Create campaign error:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
