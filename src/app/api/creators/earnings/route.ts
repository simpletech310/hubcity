import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/creators/earnings — authenticated creator sees their own earnings
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user is a creator
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_creator")
      .eq("id", user.id)
      .single();

    if (!profile?.is_creator) {
      return NextResponse.json(
        { error: "Creator access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("creator_earnings")
      .select("*")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false });

    if (status && ["pending", "paid"].includes(status)) {
      query = query.eq("status", status);
    }

    const { data: earnings, error } = await query;

    if (error) throw error;

    const allEarnings = earnings || [];

    // Calculate totals
    const total_earnings = allEarnings.reduce(
      (sum, e) => sum + (e.amount_cents || 0),
      0
    );
    const pending_payout = allEarnings
      .filter((e) => e.status === "pending")
      .reduce((sum, e) => sum + (e.amount_cents || 0), 0);

    // Calculate this month's earnings
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);
    const this_month = allEarnings
      .filter((e) => new Date(e.created_at) >= thisMonthStart)
      .reduce((sum, e) => sum + (e.amount_cents || 0), 0);

    // Get content count — queries are defensive in case tables don't exist yet
    let content_count = 0;
    let total_views = 0;

    try {
      // Count videos on creator's channel
      const { data: creatorChannel } = await supabase
        .from("channels")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1)
        .single();

      if (creatorChannel) {
        const { count: videoCount } = await supabase
          .from("channel_videos")
          .select("id", { count: "exact", head: true })
          .eq("channel_id", creatorChannel.id);

        const { data: viewData } = await supabase
          .from("channel_videos")
          .select("view_count")
          .eq("channel_id", creatorChannel.id);

        content_count += videoCount ?? 0;
        total_views = (viewData || []).reduce(
          (sum, v) => sum + (v.view_count || 0),
          0
        );
      }

      // Count podcast episodes
      const { count: podcastCount } = await supabase
        .from("podcasts")
        .select("id", { count: "exact", head: true })
        .eq("channel_id", creatorChannel?.id || "");

      content_count += podcastCount ?? 0;
    } catch {
      // Tables may not exist yet — use defaults (0)
    }

    // Map earnings to the shape the dashboard expects
    const recent_earnings = allEarnings.slice(0, 20).map((e) => ({
      id: e.id,
      date: e.created_at,
      source: e.source || e.description || "Ad Revenue",
      amount: e.amount_cents || 0,
      status: e.status as "pending" | "paid" | "processing",
    }));

    return NextResponse.json({
      total_earnings,
      this_month,
      pending_payout,
      content_count,
      total_views,
      recent_earnings,
    });
  } catch (error) {
    console.error("Creator earnings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch earnings" },
      { status: 500 }
    );
  }
}
