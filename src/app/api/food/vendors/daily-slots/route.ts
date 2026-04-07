import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/food/vendors/daily-slots?business_id=X&date=YYYY-MM-DD
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("business_id");
    const date = searchParams.get("date");

    if (!businessId) {
      return NextResponse.json({ error: "business_id required" }, { status: 400 });
    }

    let query = supabase
      .from("vendor_daily_slots")
      .select("*")
      .eq("business_id", businessId)
      .order("start_time", { ascending: true });

    if (date) {
      query = query.eq("date", date);
    } else {
      // Default: today and future
      const today = new Date().toISOString().split("T")[0];
      query = query.gte("date", today);
    }

    const { data: slots, error } = await query.limit(50);
    if (error) throw error;

    return NextResponse.json({ slots: slots || [] });
  } catch (error) {
    console.error("Vendor daily slots fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 });
  }
}

// POST /api/food/vendors/daily-slots — create a new slot
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { business_id, date, start_time, end_time, location_name, location_address, latitude, longitude, notes } = body;

    if (!business_id || !date || !start_time || !end_time || !location_name) {
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

    const { data: slot, error } = await supabase
      .from("vendor_daily_slots")
      .insert({
        business_id,
        date,
        start_time,
        end_time,
        location_name,
        location_address: location_address || null,
        latitude: latitude || null,
        longitude: longitude || null,
        notes: notes || null,
        status: "scheduled",
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ slot });
  } catch (error) {
    console.error("Create vendor daily slot error:", error);
    return NextResponse.json({ error: "Failed to create slot" }, { status: 500 });
  }
}
