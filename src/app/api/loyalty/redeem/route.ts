import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/loyalty/redeem — redeem points for a reward at checkout
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { reward_id, points_to_redeem } = await request.json();

    if (!reward_id || !points_to_redeem || points_to_redeem <= 0) {
      return NextResponse.json({ error: "Invalid redemption request" }, { status: 400 });
    }

    // Get reward details
    const { data: reward, error: rewardError } = await supabase
      .from("loyalty_rewards")
      .select("*")
      .eq("id", reward_id)
      .eq("is_active", true)
      .single();

    if (rewardError || !reward) {
      return NextResponse.json({ error: "Reward not found" }, { status: 404 });
    }

    if (points_to_redeem < reward.points_required) {
      return NextResponse.json({ error: "Not enough points for this reward" }, { status: 400 });
    }

    // Check user balance
    const { data: balance } = await supabase
      .from("loyalty_balances")
      .select("points")
      .eq("user_id", user.id)
      .single();

    if (!balance || balance.points < points_to_redeem) {
      return NextResponse.json({ error: "Insufficient loyalty points" }, { status: 400 });
    }

    // Check per-user redemption limit
    if (reward.max_redemptions_per_user > 0) {
      const { count } = await supabase
        .from("loyalty_transactions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("type", "redeem")
        .ilike("description", `%${reward.name}%`);

      if ((count ?? 0) >= reward.max_redemptions_per_user) {
        return NextResponse.json({ error: "Redemption limit reached for this reward" }, { status: 400 });
      }
    }

    // Get loyalty config for dollar conversion
    const { data: config } = await supabase
      .from("loyalty_config")
      .select("points_to_dollar_ratio")
      .eq("id", 1)
      .single();

    const ratio = config?.points_to_dollar_ratio || 0.006667;

    // Calculate discount based on reward type
    let discountCents = 0;
    if (reward.reward_type === "discount_fixed") {
      discountCents = reward.reward_value;
    } else if (reward.reward_type === "discount_percent") {
      // Percent discount is applied at checkout; pass value through
      discountCents = reward.reward_value; // represents percent
    } else {
      // For free_item/custom, use points-to-dollar conversion
      discountCents = Math.round(points_to_redeem * ratio * 100);
    }

    // Deduct points
    const { error: updateError } = await supabase
      .from("loyalty_balances")
      .update({
        points: balance.points - points_to_redeem,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) throw updateError;

    // Record transaction
    const { error: txError } = await supabase
      .from("loyalty_transactions")
      .insert({
        user_id: user.id,
        business_id: reward.business_id,
        type: "redeem",
        points: -points_to_redeem,
        description: `Redeemed: ${reward.name}`,
      });

    if (txError) throw txError;

    return NextResponse.json({
      success: true,
      points_deducted: points_to_redeem,
      remaining_points: balance.points - points_to_redeem,
      discount_cents: discountCents,
      reward_type: reward.reward_type,
    });
  } catch (error) {
    console.error("Loyalty redeem error:", error);
    return NextResponse.json({ error: "Failed to redeem points" }, { status: 500 });
  }
}
