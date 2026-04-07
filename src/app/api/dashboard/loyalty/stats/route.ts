import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/dashboard/loyalty/stats — business loyalty metrics
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!business) return NextResponse.json({ error: "No business found" }, { status: 404 });

    // Get total points earned at this business
    const { data: earnedTx } = await supabase
      .from("loyalty_transactions")
      .select("points")
      .eq("business_id", business.id)
      .eq("type", "earn");

    const totalPointsEarned = (earnedTx || []).reduce((sum, t) => sum + t.points, 0);

    // Get total points redeemed at this business
    const { data: redeemedTx } = await supabase
      .from("loyalty_transactions")
      .select("points")
      .eq("business_id", business.id)
      .eq("type", "redeem");

    const totalPointsRedeemed = Math.abs((redeemedTx || []).reduce((sum, t) => sum + t.points, 0));

    // Unique loyalty customers
    const { data: uniqueCustomers } = await supabase
      .from("loyalty_transactions")
      .select("user_id")
      .eq("business_id", business.id);

    const uniqueCount = new Set((uniqueCustomers || []).map((t) => t.user_id)).size;

    // Active rewards count
    const { count: activeRewards } = await supabase
      .from("loyalty_rewards")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("is_active", true);

    return NextResponse.json({
      stats: {
        total_points_earned: totalPointsEarned,
        total_points_redeemed: totalPointsRedeemed,
        unique_loyalty_customers: uniqueCount,
        active_rewards: activeRewards || 0,
      },
    });
  } catch (error) {
    console.error("Dashboard loyalty stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
