import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params;
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership or admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const { data: business } = await supabase
      .from("businesses")
      .select("id, owner_id")
      .eq("id", businessId)
      .single();

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (business.owner_id !== user.id && profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Date ranges
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    // Parallel data fetches
    const [
      allOrders,
      monthOrders,
      lastMonthOrders,
      allBookings,
      monthBookings,
      reviews,
      topItemsResult,
      recentOrdersResult,
    ] = await Promise.all([
      // Total orders + revenue
      supabase
        .from("orders")
        .select("id, total, customer_id")
        .eq("business_id", businessId)
        .neq("status", "cancelled"),
      // This month orders
      supabase
        .from("orders")
        .select("id, total")
        .eq("business_id", businessId)
        .neq("status", "cancelled")
        .gte("created_at", monthStart),
      // Last month orders (for comparison)
      supabase
        .from("orders")
        .select("id, total")
        .eq("business_id", businessId)
        .neq("status", "cancelled")
        .gte("created_at", lastMonthStart)
        .lte("created_at", lastMonthEnd),
      // Total bookings
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId),
      // This month bookings
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .gte("created_at", monthStart),
      // Reviews
      supabase
        .from("reviews")
        .select("rating")
        .eq("business_id", businessId),
      // Top menu items by order count
      supabase
        .from("order_items")
        .select("name, quantity, order:orders!inner(business_id)")
        .eq("order.business_id", businessId),
      // Recent orders
      supabase
        .from("orders")
        .select("*, customer:profiles!orders_customer_id_fkey(display_name)")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    // Compute stats
    const orders = allOrders.data ?? [];
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const uniqueCustomers = new Set(orders.map((o) => o.customer_id)).size;

    const monthOrdersData = monthOrders.data ?? [];
    const ordersThisMonth = monthOrdersData.length;
    const revenueThisMonth = monthOrdersData.reduce((sum, o) => sum + (o.total || 0), 0);

    const lastMonthData = lastMonthOrders.data ?? [];
    const revenueLastMonth = lastMonthData.reduce((sum, o) => sum + (o.total || 0), 0);

    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const totalBookings = allBookings.count ?? 0;
    const bookingsThisMonth = monthBookings.count ?? 0;

    // Reviews stats
    const reviewsData = reviews.data ?? [];
    const reviewCount = reviewsData.length;
    const avgRating =
      reviewCount > 0
        ? Math.round((reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10
        : 0;
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviewsData.forEach((r) => {
      const bucket = Math.min(5, Math.max(1, Math.round(r.rating)));
      ratingDistribution[bucket]++;
    });

    // Top items aggregation
    const itemCounts: Record<string, number> = {};
    (topItemsResult.data ?? []).forEach((item: { name: string; quantity: number }) => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
    });
    const topItems = Object.entries(itemCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      stats: {
        total_orders: totalOrders,
        orders_this_month: ordersThisMonth,
        total_revenue: totalRevenue,
        revenue_this_month: revenueThisMonth,
        revenue_last_month: revenueLastMonth,
        avg_order_value: avgOrderValue,
        total_bookings: totalBookings,
        bookings_this_month: bookingsThisMonth,
        unique_customers: uniqueCustomers,
      },
      top_items: topItems,
      review_stats: {
        avg_rating: avgRating,
        count: reviewCount,
        distribution: ratingDistribution,
      },
      recent_orders: recentOrdersResult.data ?? [],
    });
  } catch (err) {
    console.error("Analytics error:", err);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
