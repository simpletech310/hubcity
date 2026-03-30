import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { current_lat, current_lng, current_location_name, vendor_status } =
      await request.json();

    // Verify user owns a mobile vendor business
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id, is_mobile_vendor")
      .eq("owner_id", user.id)
      .eq("is_mobile_vendor", true)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: "No mobile vendor business found for this user" },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {
      location_updated_at: new Date().toISOString(),
    };

    if (current_lat !== undefined) updateData.current_lat = current_lat;
    if (current_lng !== undefined) updateData.current_lng = current_lng;
    if (current_location_name !== undefined)
      updateData.current_location_name = current_location_name;
    if (vendor_status !== undefined) updateData.vendor_status = vendor_status;

    const { data: updated, error: updateError } = await supabase
      .from("businesses")
      .update(updateData)
      .eq("id", business.id)
      .select("*")
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ business: updated });
  } catch (error) {
    console.error("Vendor location update error:", error);
    return NextResponse.json(
      { error: "Failed to update vendor location" },
      { status: 500 }
    );
  }
}
