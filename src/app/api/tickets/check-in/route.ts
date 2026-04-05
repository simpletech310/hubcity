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

    // Check role — must be admin or city_official
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "admin" && profile.role !== "city_official" && profile.role !== "city_ambassador") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { ticket_code } = await request.json();

    if (!ticket_code) {
      return NextResponse.json(
        { error: "ticket_code is required" },
        { status: 400 }
      );
    }

    // Find ticket
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("*")
      .eq("ticket_code", ticket_code)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Check if already checked in
    if (ticket.checked_in_at) {
      return NextResponse.json(
        {
          error: "Ticket already checked in",
          already_checked_in: true,
          checked_in_at: ticket.checked_in_at,
        },
        { status: 409 }
      );
    }

    // Mark as checked in
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        checked_in_at: new Date().toISOString(),
        checked_in_by: user.id,
      })
      .eq("id", ticket.id);

    if (updateError) throw updateError;

    // Fetch section name from order item
    const { data: orderItem } = await supabase
      .from("ticket_order_items")
      .select("section_name")
      .eq("id", ticket.order_item_id)
      .single();

    // Fetch event title
    const { data: event } = await supabase
      .from("events")
      .select("title")
      .eq("id", ticket.event_id)
      .single();

    return NextResponse.json({
      success: true,
      ticket_code,
      section_name: orderItem?.section_name || null,
      event_title: event?.title || null,
    });
  } catch (error) {
    console.error("Ticket check-in error:", error);
    return NextResponse.json(
      { error: "Failed to check in ticket" },
      { status: 500 }
    );
  }
}
