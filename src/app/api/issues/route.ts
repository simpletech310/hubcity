import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStrictRateLimiter, checkRateLimit } from "@/lib/ratelimit";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = request.nextUrl;

    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const district = searchParams.get("district");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("city_issues")
      .select(
        "*, reporter:profiles!reported_by(id, display_name, avatar_url)"
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (type && type !== "all") {
      query = query.eq("type", type);
    }
    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    if (district && district !== "all") {
      query = query.eq("district", parseInt(district));
    }

    const { data, error } = await query;
    if (error) throw error;

    // Get aggregate stats
    const { count: totalCount } = await supabase
      .from("city_issues")
      .select("*", { count: "exact", head: true });

    const { count: inProgressCount } = await supabase
      .from("city_issues")
      .select("*", { count: "exact", head: true })
      .eq("status", "in_progress");

    const { count: resolvedThisMonth } = await supabase
      .from("city_issues")
      .select("*", { count: "exact", head: true })
      .eq("status", "resolved")
      .gte(
        "resolved_at",
        new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1
        ).toISOString()
      );

    return NextResponse.json({
      issues: data ?? [],
      stats: {
        total: totalCount ?? 0,
        in_progress: inProgressCount ?? 0,
        resolved_this_month: resolvedThisMonth ?? 0,
      },
    });
  } catch (error) {
    console.error("Fetch issues error:", error);
    return NextResponse.json(
      { error: "Failed to fetch issues" },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const {
      type,
      title,
      description,
      location_text,
      latitude,
      longitude,
      district,
      image_url,
      source_post_id,
    } = body;

    if (!type || !title) {
      return NextResponse.json(
        { error: "Type and title are required" },
        { status: 400 }
      );
    }

    // Look up department info from hashtag_actions
    const { data: hashtagAction } = await supabase
      .from("hashtag_actions")
      .select("department, department_email")
      .eq("issue_type", type)
      .eq("is_active", true)
      .single();

    const { data: issue, error } = await supabase
      .from("city_issues")
      .insert({
        type,
        title,
        description: description || null,
        location_text: location_text || null,
        latitude: latitude || null,
        longitude: longitude || null,
        district: district || null,
        image_url: image_url || null,
        source_post_id: source_post_id || null,
        reported_by: user.id,
        assigned_department: hashtagAction?.department || null,
        department_email: hashtagAction?.department_email || null,
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ issue });
  } catch (error) {
    console.error("Create issue error:", error);
    return NextResponse.json(
      { error: "Failed to create issue" },
      { status: 500 }
    );
  }
}
