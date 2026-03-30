import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: order, error } = await supabase
      .from("ticket_orders")
      .select(
        `
        *,
        event:events(id, title, slug, start_date, start_time, end_time, location_name, address, image_url, category, venue_id),
        items:ticket_order_items(
          id, section_name, price, quantity,
          tickets:tickets(id, ticket_code, holder_name, checked_in_at)
        )
        `
      )
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.customer_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Ticket order detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket order" },
      { status: 500 }
    );
  }
}
