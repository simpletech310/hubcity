import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { generateTicketCode } from "@/lib/tickets";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { order_id } = await request.json();

    if (!order_id) {
      return NextResponse.json(
        { error: "order_id is required" },
        { status: 400 }
      );
    }

    // Fetch ticket order
    const { data: order, error: orderError } = await supabase
      .from("ticket_orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.customer_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: `Order is already ${order.status}` },
        { status: 400 }
      );
    }

    // Verify payment with Stripe
    if (!order.stripe_payment_intent_id) {
      return NextResponse.json(
        { error: "No payment intent found" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(
      order.stripe_payment_intent_id
    );

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment has not been completed" },
        { status: 400 }
      );
    }

    // Update order status
    const { error: updateError } = await supabase
      .from("ticket_orders")
      .update({ status: "confirmed" })
      .eq("id", order_id);

    if (updateError) throw updateError;

    // Fetch order items
    const { data: orderItems, error: itemsError } = await supabase
      .from("ticket_order_items")
      .select("*")
      .eq("order_id", order_id);

    if (itemsError) throw itemsError;

    // Generate individual tickets
    let ticketCount = 0;
    const ticketRows: {
      order_item_id: string;
      order_id: string;
      event_id: string;
      ticket_code: string;
    }[] = [];

    for (const item of orderItems) {
      for (let i = 0; i < item.quantity; i++) {
        ticketRows.push({
          order_item_id: item.id,
          order_id: order.id,
          event_id: order.event_id,
          ticket_code: generateTicketCode(),
        });
        ticketCount++;
      }
    }

    if (ticketRows.length > 0) {
      const { error: ticketsError } = await supabase
        .from("tickets")
        .insert(ticketRows);

      if (ticketsError) throw ticketsError;
    }

    return NextResponse.json({
      order_id: order.id,
      order_number: order.order_number,
      ticket_count: ticketCount,
    });
  } catch (error) {
    console.error("Ticket confirmation error:", error);
    return NextResponse.json(
      { error: "Failed to confirm ticket order" },
      { status: 500 }
    );
  }
}
