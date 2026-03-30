import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const supabase = await createClient();

    // Admin auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "city_official"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all tickets for this event, joined through order_items → ticket_config → venue_section
    const { data: tickets, error: ticketsError } = await supabase
      .from("tickets")
      .select(
        `
        id,
        checked_in_at,
        order_item:ticket_order_items!tickets_order_item_id_fkey(
          event_ticket_config_id,
          ticket_config:event_ticket_config!ticket_order_items_event_ticket_config_id_fkey(
            venue_section:venue_sections(name)
          )
        )
        `
      )
      .eq("event_id", eventId);

    if (ticketsError) {
      console.error("Check-in stats tickets fetch error:", ticketsError);
      return NextResponse.json(
        { error: "Failed to fetch check-in stats" },
        { status: 500 }
      );
    }

    const ticketList = tickets ?? [];
    const total_tickets = ticketList.length;
    const checked_in = ticketList.filter((t) => t.checked_in_at !== null).length;

    // Group by section name
    const sectionMap = new Map<string, { total: number; checked_in: number }>();

    for (const ticket of ticketList) {
      // Navigate the nested join: order_item → ticket_config → venue_section
      const orderItem = Array.isArray(ticket.order_item)
        ? ticket.order_item[0]
        : ticket.order_item;
      const ticketConfig = orderItem
        ? Array.isArray(orderItem.ticket_config)
          ? orderItem.ticket_config[0]
          : orderItem.ticket_config
        : null;
      const venueSection = ticketConfig
        ? Array.isArray(ticketConfig.venue_section)
          ? ticketConfig.venue_section[0]
          : ticketConfig.venue_section
        : null;

      const sectionName = venueSection?.name ?? "Unknown";

      const existing = sectionMap.get(sectionName) ?? { total: 0, checked_in: 0 };
      sectionMap.set(sectionName, {
        total: existing.total + 1,
        checked_in: existing.checked_in + (ticket.checked_in_at !== null ? 1 : 0),
      });
    }

    const by_section = Array.from(sectionMap.entries()).map(
      ([section_name, data]) => ({
        section_name,
        total: data.total,
        checked_in: data.checked_in,
      })
    );

    return NextResponse.json({
      total_tickets,
      checked_in,
      by_section,
    });
  } catch (error) {
    console.error("Check-in stats GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch check-in stats" },
      { status: 500 }
    );
  }
}
