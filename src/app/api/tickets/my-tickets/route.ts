import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter");
    const today = new Date().toISOString().split("T")[0];

    let query = supabase
      .from("ticket_orders")
      .select(
        `
        *,
        event:events(id, title, slug, start_date, start_time, location_name, image_url, category),
        items:ticket_order_items(id, section_name, price, quantity)
        `
      )
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    if (filter === "upcoming") {
      query = query.gte("event.start_date", today);
    } else if (filter === "past") {
      query = query.lt("event.start_date", today);
    }

    const { data: orders, error } = await query;

    if (error) throw error;

    // When filtering by event date, Supabase still returns rows but with
    // event: null for non-matching joins. Filter those out.
    const filtered =
      filter === "upcoming" || filter === "past"
        ? (orders || []).filter((o: { event: unknown }) => o.event !== null)
        : orders;

    return NextResponse.json({ orders: filtered ?? [] });
  } catch (error) {
    console.error("My tickets error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}
