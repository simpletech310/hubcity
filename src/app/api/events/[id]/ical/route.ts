import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateICalEvent } from "@/lib/ical";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: event, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const locationParts = [event.location_name, event.address].filter(Boolean);

    const ics = generateICalEvent({
      title: event.title,
      description: event.description ?? undefined,
      startDate: event.start_date,
      startTime: event.start_time ?? undefined,
      endDate: event.end_date ?? undefined,
      endTime: event.end_time ?? undefined,
      location: locationParts.length > 0 ? locationParts.join(", ") : undefined,
      url: `https://hubcity.4everforward.net/events/${id}`,
    });

    return new Response(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="event.ics"',
      },
    });
  } catch (err) {
    console.error("iCal generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate calendar file" },
      { status: 500 }
    );
  }
}
