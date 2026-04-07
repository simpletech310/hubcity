import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/coupons/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: coupon } = await supabase
      .from("coupons")
      .select("id, business_id")
      .eq("id", id)
      .single();

    if (!coupon) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });

    const { data: biz } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", coupon.business_id)
      .eq("owner_id", user.id)
      .single();

    if (!biz) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

    const body = await request.json();
    const allowedFields = ["title", "description", "discount_type", "discount_value", "min_order_amount", "max_uses", "max_uses_per_customer", "applies_to", "applies_to_ids", "valid_from", "valid_until", "is_active"];
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const { data: updated, error } = await supabase
      .from("coupons")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ coupon: updated });
  } catch (error) {
    console.error("Update coupon error:", error);
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}

// DELETE /api/coupons/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: coupon } = await supabase
      .from("coupons")
      .select("id, business_id")
      .eq("id", id)
      .single();

    if (!coupon) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });

    const { data: biz } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", coupon.business_id)
      .eq("owner_id", user.id)
      .single();

    if (!biz) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

    // Soft delete — just deactivate
    const { error } = await supabase
      .from("coupons")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete coupon error:", error);
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
