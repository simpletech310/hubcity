import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/coupons/validate — validate a coupon code at checkout
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { code, business_id, subtotal } = await request.json();

    if (!code || !business_id) {
      return NextResponse.json({ error: "Code and business_id required" }, { status: 400 });
    }

    // Find the coupon
    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("business_id", business_id)
      .eq("code", code.toUpperCase().trim())
      .eq("is_active", true)
      .single();

    if (error || !coupon) {
      return NextResponse.json({ error: "Invalid coupon code" }, { status: 404 });
    }

    // Check expiration
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      return NextResponse.json({ error: "This coupon has expired" }, { status: 400 });
    }

    // Check not yet valid
    if (coupon.valid_from && new Date(coupon.valid_from) > new Date()) {
      return NextResponse.json({ error: "This coupon is not yet active" }, { status: 400 });
    }

    // Check max uses
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return NextResponse.json({ error: "This coupon has reached its usage limit" }, { status: 400 });
    }

    // Check per-customer usage
    if (coupon.max_uses_per_customer) {
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("coupon_id", coupon.id)
        .eq("customer_id", user.id);

      if ((count ?? 0) >= coupon.max_uses_per_customer) {
        return NextResponse.json({ error: "You've already used this coupon" }, { status: 400 });
      }
    }

    // Check minimum order
    const orderAmount = subtotal || 0;
    if (coupon.min_order_amount && orderAmount < coupon.min_order_amount) {
      return NextResponse.json({
        error: `Minimum order of $${(coupon.min_order_amount / 100).toFixed(2)} required`,
      }, { status: 400 });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === "percent") {
      discountAmount = Math.round(orderAmount * (coupon.discount_value / 100));
    } else if (coupon.discount_type === "fixed_amount") {
      discountAmount = coupon.discount_value;
    }
    // free_shipping would be handled at checkout, discount = 0 here

    // Don't exceed order total
    discountAmount = Math.min(discountAmount, orderAmount);

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        title: coupon.title,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
      },
      discount_amount: discountAmount,
    });
  } catch (error) {
    console.error("Validate coupon error:", error);
    return NextResponse.json({ error: "Failed to validate coupon" }, { status: 500 });
  }
}
