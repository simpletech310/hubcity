import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const supabase = await createClient();

    const { data: configs, error } = await supabase
      .from("event_ticket_config")
      .select(
        `
        id,
        venue_section_id,
        price,
        capacity,
        available_count,
        max_per_order,
        is_active,
        venue_section:venue_sections(name, color, description)
        `
      )
      .eq("event_id", eventId)
      .order("venue_section(sort_order)");

    if (error) {
      console.error("Availability fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch availability" },
        { status: 500 }
      );
    }

    return NextResponse.json({ configs: configs ?? [] });
  } catch (error) {
    console.error("Availability GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
