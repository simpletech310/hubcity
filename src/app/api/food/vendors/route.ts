import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("businesses")
      .select(
        "id, name, slug, description, current_lat, current_lng, current_location_name, vendor_status, location_updated_at, image_urls, rating_avg, rating_count, accepts_orders"
      )
      .eq("is_mobile_vendor", true)
      .eq("is_published", true)
      .eq("vendor_status", "active")
      .order("location_updated_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ vendors: data ?? [] });
  } catch (error) {
    console.error("Food vendors error:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}
