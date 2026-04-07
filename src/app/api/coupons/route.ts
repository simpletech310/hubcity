import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/coupons?business_id=X
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("business_id");

    if (!businessId) {
      return NextResponse.json({ error: "business_id required" }, { status: 400 });
    }

    const { data: coupons, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ coupons: coupons || [] });
  } catch (error) {
    console.error("Coupons fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

// POST /api/coupons — create a coupon
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { business_id, code, title, description, discount_type, discount_value, min_order_amount, max_uses, max_uses_per_customer, applies_to, applies_to_ids, valid_from, valid_until } = body;

    if (!business_id || !code || !title || !discount_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify ownership
    const { data: biz } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", business_id)
      .eq("owner_id", user.id)
      .single();

    if (!biz) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

    const { data: coupon, error } = await supabase
      .from("coupons")
      .insert({
        business_id,
        code: code.toUpperCase().trim(),
        title: title.trim(),
        description: description?.trim() || null,
        discount_type,
        discount_value: discount_value || 0,
        min_order_amount: min_order_amount || 0,
        max_uses: max_uses || null,
        max_uses_per_customer: max_uses_per_customer || 1,
        applies_to: applies_to || "all",
        applies_to_ids: applies_to_ids || null,
        valid_from: valid_from || new Date().toISOString(),
        valid_until: valid_until || null,
        is_active: true,
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "A coupon with this code already exists" }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ coupon });
  } catch (error) {
    console.error("Create coupon error:", error);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}
