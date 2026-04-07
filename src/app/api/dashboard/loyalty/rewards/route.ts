import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/dashboard/loyalty/rewards — business owner's rewards
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

    const { data: rewards, error } = await supabase
      .from("loyalty_rewards")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ rewards: rewards || [] });
  } catch (error) {
    console.error("Dashboard loyalty rewards error:", error);
    return NextResponse.json({ error: "Failed to fetch rewards" }, { status: 500 });
  }
}

// POST /api/dashboard/loyalty/rewards — create a reward
export async function POST(request: Request) {
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

    const body = await request.json();
    const { name, description, points_required, reward_type, reward_value, reward_item_id, max_redemptions_per_user } = body;

    if (!name || !points_required || !reward_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: reward, error } = await supabase
      .from("loyalty_rewards")
      .insert({
        business_id: business.id,
        name: name.trim(),
        description: description?.trim() || null,
        points_required,
        reward_type,
        reward_value: reward_value || 0,
        reward_item_id: reward_item_id || null,
        max_redemptions_per_user: max_redemptions_per_user || 0,
        is_active: true,
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ reward });
  } catch (error) {
    console.error("Create loyalty reward error:", error);
    return NextResponse.json({ error: "Failed to create reward" }, { status: 500 });
  }
}
