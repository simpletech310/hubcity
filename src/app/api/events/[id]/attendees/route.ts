import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get total counts by status
    const { count: goingCount } = await supabase
      .from("event_rsvps")
      .select("*", { count: "exact", head: true })
      .eq("event_id", id)
      .eq("status", "going");

    const { count: interestedCount } = await supabase
      .from("event_rsvps")
      .select("*", { count: "exact", head: true })
      .eq("event_id", id)
      .eq("status", "interested");

    // Get attendee profiles (going + interested, limited to 20)
    const { data: attendees } = await supabase
      .from("event_rsvps")
      .select("status, created_at, user:profiles!event_rsvps_user_id_fkey(id, display_name, avatar_url, handle)")
      .eq("event_id", id)
      .in("status", ["going", "interested"])
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      going_count: goingCount || 0,
      interested_count: interestedCount || 0,
      attendees: attendees ?? [],
    });
  } catch (error) {
    console.error("Fetch attendees error:", error);
    return NextResponse.json({ error: "Failed to fetch attendees" }, { status: 500 });
  }
}
