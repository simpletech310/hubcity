import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_STATUSES = ["going", "interested", "not_going"] as const;
type RSVPStatus = (typeof VALID_STATUSES)[number];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = (await request.json()) as { status: RSVPStatus };

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Check if user already has an RSVP for this event
    const { data: existing } = await supabase
      .from("event_rsvps")
      .select("id, status")
      .match({ event_id: eventId, user_id: user.id })
      .single();

    if (existing && existing.status === status) {
      // Same status — toggle off (delete)
      await supabase.from("event_rsvps").delete().eq("id", existing.id);

      // Decrement rsvp_count
      const { data: event } = await supabase
        .from("events")
        .select("rsvp_count")
        .eq("id", eventId)
        .single();

      if (event) {
        await supabase
          .from("events")
          .update({ rsvp_count: Math.max(0, (event.rsvp_count || 0) - 1) })
          .eq("id", eventId);
      }

      return NextResponse.json({ rsvp: null });
    }

    if (existing) {
      // Different status — update (no count change, still one RSVP)
      const { data: updated } = await supabase
        .from("event_rsvps")
        .update({ status })
        .eq("id", existing.id)
        .select("id, status")
        .single();

      return NextResponse.json({ rsvp: updated });
    }

    // New RSVP — insert and increment count
    const { data: created, error: insertError } = await supabase
      .from("event_rsvps")
      .insert({ event_id: eventId, user_id: user.id, status })
      .select("id, status")
      .single();

    if (insertError) {
      console.error("RSVP insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create RSVP" },
        { status: 500 }
      );
    }

    // Increment rsvp_count
    const { data: event } = await supabase
      .from("events")
      .select("rsvp_count")
      .eq("id", eventId)
      .single();

    if (event) {
      await supabase
        .from("events")
        .update({ rsvp_count: (event.rsvp_count || 0) + 1 })
        .eq("id", eventId);
    }

    return NextResponse.json({ rsvp: created });
  } catch (error) {
    console.error("RSVP error:", error);
    return NextResponse.json(
      { error: "Failed to update RSVP" },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: rsvp } = await supabase
      .from("event_rsvps")
      .select("id, status")
      .match({ event_id: eventId, user_id: user.id })
      .single();

    return NextResponse.json({ rsvp: rsvp ?? null });
  } catch (error) {
    console.error("RSVP fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch RSVP" },
      { status: 500 }
    );
  }
}
