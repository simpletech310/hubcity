import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/loyalty/balance — current user's loyalty points
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: balance } = await supabase
      .from("loyalty_balances")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Get loyalty config
    const { data: config } = await supabase
      .from("loyalty_config")
      .select("*")
      .eq("id", 1)
      .single();

    return NextResponse.json({
      balance: balance || { user_id: user.id, points: 0, lifetime_points: 0 },
      config: config || { points_per_dollar: 10, points_to_dollar_ratio: 0.006667, min_redemption_points: 100, max_daily_earn: 500 },
    });
  } catch (error) {
    console.error("Loyalty balance error:", error);
    return NextResponse.json({ error: "Failed to fetch balance" }, { status: 500 });
  }
}
