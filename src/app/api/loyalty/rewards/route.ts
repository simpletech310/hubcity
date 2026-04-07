import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/loyalty/rewards?business_id=X — available rewards for a business
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("business_id");

    if (!businessId) {
      return NextResponse.json({ error: "business_id required" }, { status: 400 });
    }

    const { data: rewards, error } = await supabase
      .from("loyalty_rewards")
      .select("*")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .order("points_required", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ rewards: rewards || [] });
  } catch (error) {
    console.error("Loyalty rewards error:", error);
    return NextResponse.json({ error: "Failed to fetch rewards" }, { status: 500 });
  }
}
