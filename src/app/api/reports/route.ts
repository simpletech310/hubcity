import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStrictRateLimiter, checkRateLimit } from "@/lib/ratelimit";

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

    const { content_type, content_id, reason, details } =
      await request.json();

    if (!content_type || !content_id || !reason) {
      return NextResponse.json(
        { error: "content_type, content_id, and reason required" },
        { status: 400 }
      );
    }

    const validTypes = ["post", "comment", "review", "business"];
    const validReasons = [
      "spam",
      "inappropriate",
      "harassment",
      "misinformation",
      "other",
    ];

    if (!validTypes.includes(content_type)) {
      return NextResponse.json(
        { error: "Invalid content_type" },
        { status: 400 }
      );
    }
    if (!validReasons.includes(reason)) {
      return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
    }

    const { data: report, error } = await supabase
      .from("content_reports")
      .insert({
        reporter_id: user.id,
        content_type,
        content_id,
        reason,
        details: details || null,
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Create report error:", error);
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "city_official", "city_ambassador"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") || "pending";

    let query = supabase
      .from("content_reports")
      .select(
        "*, reporter:profiles!reporter_id(id, display_name, avatar_url)"
      );

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data: reports, error } = await query
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ reports: reports ?? [] });
  } catch (error) {
    console.error("Fetch reports error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
