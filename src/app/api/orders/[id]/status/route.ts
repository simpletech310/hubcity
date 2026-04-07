import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the order and verify business ownership
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, business_id, customer_id, order_number")
      .eq("id", id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", order.business_id)
      .eq("owner_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: "Not authorized to update this order" },
        { status: 403 }
      );
    }

    const { status } = await request.json();

    const updateData: Record<string, unknown> = { status };

    if (status === "ready" || status === "delivered" || status === "picked_up") {
      updateData.completed_at = new Date().toISOString();
    }

    // Track delivery status changes
    if (["out_for_delivery", "delayed", "delivered"].includes(status)) {
      updateData.delivery_status_updated_at = new Date().toISOString();
    }

    const { data: updated, error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) throw updateError;

    // Notify customer of status change (fire-and-forget)
    const statusMessages: Record<string, string> = {
      confirmed: "Your order has been confirmed!",
      preparing: "Your order is being prepared",
      ready: "Your order is ready for pickup!",
      out_for_delivery: "Your order is out for delivery!",
      delayed: "Your order has been delayed",
      delivered: "Your order has been delivered",
      picked_up: "Your order has been picked up",
      cancelled: "Your order has been cancelled",
    };

    if (statusMessages[status] && order.customer_id) {
      supabase
        .from("notifications")
        .insert({
          user_id: order.customer_id,
          type: "order",
          title: statusMessages[status],
          body: `Order ${order.order_number}`,
          link_type: "order",
          link_id: id,
        })
        .then(({ error: notifError }) => {
          if (notifError) console.error("Notification insert error:", notifError);
        });
    }

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error("Update order status error:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
