import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const business_id = searchParams.get("business_id");

    if (!business_id) {
      return NextResponse.json(
        { error: "business_id query param is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: slots, error } = await supabase
      .from("time_slots")
      .select("*")
      .eq("business_id", business_id)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Get time slots error:", error);
    return NextResponse.json(
      { error: "Failed to get time slots" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { business_id, day_of_week, start_time, end_time, slot_duration, max_bookings } =
      await request.json();

    if (!business_id || day_of_week === undefined || !start_time || !end_time || !slot_duration) {
      return NextResponse.json(
        { error: "business_id, day_of_week, start_time, end_time, and slot_duration are required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", business_id)
      .eq("owner_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: "Not authorized to manage this business" },
        { status: 403 }
      );
    }

    const { data: slot, error } = await supabase
      .from("time_slots")
      .insert({
        business_id,
        day_of_week,
        start_time,
        end_time,
        slot_duration,
        max_bookings: max_bookings ?? 1,
        is_active: true,
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ slot });
  } catch (error) {
    console.error("Create time slot error:", error);
    return NextResponse.json(
      { error: "Failed to create time slot" },
      { status: 500 }
    );
  }
}
