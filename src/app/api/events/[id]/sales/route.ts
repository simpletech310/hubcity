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

    if (!profile || !["admin", "city_official", "city_ambassador"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Aggregated totals from ticket_orders (confirmed + refunded)
    const { data: orders, error: ordersError } = await supabase
      .from("ticket_orders")
      .select("id, subtotal, platform_fee, total, status, created_at, customer_name, customer_email, customer_id")
      .eq("event_id", eventId)
      .in("status", ["confirmed", "refunded"]);

    if (ordersError) {
      console.error("Sales orders fetch error:", ordersError);
      return NextResponse.json(
        { error: "Failed to fetch sales data" },
        { status: 500 }
      );
    }

    const orderList = orders ?? [];

    const total_revenue = orderList.reduce((sum, o) => sum + (o.total ?? 0), 0);
    const total_fees = orderList.reduce((sum, o) => sum + (o.platform_fee ?? 0), 0);
    const orders_count = orderList.length;

    // Per-section breakdown via ticket_order_items
    const orderIds = orderList.map((o) => o.id);

    let by_section: Array<{
      section_name: string;
      quantity_sold: number;
      total_revenue: number;
    }> = [];

    if (orderIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from("ticket_order_items")
        .select("section_name, price, quantity")
        .in("order_id", orderIds);

      if (itemsError) {
        console.error("Sales items fetch error:", itemsError);
        return NextResponse.json(
          { error: "Failed to fetch sales items" },
          { status: 500 }
        );
      }

      const sectionMap = new Map<
        string,
        { quantity_sold: number; total_revenue: number }
      >();

      for (const item of items ?? []) {
        const existing = sectionMap.get(item.section_name) ?? {
          quantity_sold: 0,
          total_revenue: 0,
        };
        sectionMap.set(item.section_name, {
          quantity_sold: existing.quantity_sold + (item.quantity ?? 0),
          total_revenue:
            existing.total_revenue +
            (item.price ?? 0) * (item.quantity ?? 0),
        });
      }

      by_section = Array.from(sectionMap.entries()).map(([section_name, data]) => ({
        section_name,
        ...data,
      }));
    }

    const tickets_sold = by_section.reduce((sum, s) => sum + s.quantity_sold, 0);

    // Recent 20 orders with customer profile join
    const { data: recentOrdersRaw, error: recentError } = await supabase
      .from("ticket_orders")
      .select(
        `
        id,
        order_number,
        status,
        total,
        customer_name,
        customer_email,
        created_at,
        customer:profiles!ticket_orders_customer_id_fkey(id, display_name, avatar_url)
        `
      )
      .eq("event_id", eventId)
      .in("status", ["confirmed", "refunded"])
      .order("created_at", { ascending: false })
      .limit(20);

    if (recentError) {
      console.error("Recent orders fetch error:", recentError);
      return NextResponse.json(
        { error: "Failed to fetch recent orders" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      total_revenue,
      total_fees,
      tickets_sold,
      orders_count,
      by_section,
      recent_orders: recentOrdersRaw ?? [],
    });
  } catch (error) {
    console.error("Sales GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales data" },
      { status: 500 }
    );
  }
}
