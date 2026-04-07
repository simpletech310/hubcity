import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/food/vendors/daily-slots/[id] — update status or details
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get slot and verify ownership
    const { data: slot } = await supabase
      .from("vendor_daily_slots")
      .select("id, business_id")
      .eq("id", id)
      .single();

    if (!slot) return NextResponse.json({ error: "Slot not found" }, { status: 404 });

    const { data: biz } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", slot.business_id)
      .eq("owner_id", user.id)
      .single();

    if (!biz) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

    const body = await request.json();
    const allowedFields = ["status", "start_time", "end_time", "location_name", "location_address", "latitude", "longitude", "notes"];
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const { data: updated, error } = await supabase
      .from("vendor_daily_slots")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ slot: updated });
  } catch (error) {
    console.error("Update vendor daily slot error:", error);
    return NextResponse.json({ error: "Failed to update slot" }, { status: 500 });
  }
}

// DELETE /api/food/vendors/daily-slots/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: slot } = await supabase
      .from("vendor_daily_slots")
      .select("id, business_id")
      .eq("id", id)
      .single();

    if (!slot) return NextResponse.json({ error: "Slot not found" }, { status: 404 });

    const { data: biz } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", slot.business_id)
      .eq("owner_id", user.id)
      .single();

    if (!biz) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

    const { error } = await supabase
      .from("vendor_daily_slots")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete vendor daily slot error:", error);
    return NextResponse.json({ error: "Failed to delete slot" }, { status: 500 });
  }
}
