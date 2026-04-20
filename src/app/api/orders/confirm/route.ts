import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { getStrictRateLimiter, checkRateLimit } from "@/lib/ratelimit";
import { sendOrderReceiptEmail } from "@/lib/email-notifications";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit(getStrictRateLimiter(), user.id);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", reset: rl.reset },
        { status: 429 }
      );
    }

    const { order_id } = await request.json();

    if (!order_id) {
      return NextResponse.json(
        { error: "order_id is required" },
        { status: 400 }
      );
    }

    // Get the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, stripe_payment_intent_id, status, business_id, total, order_number, customer_id")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify this is the customer's order
    if (order.customer_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Verify payment with Stripe
    if (order.stripe_payment_intent_id) {
      const stripe = getStripe();
      const paymentIntent = await stripe.paymentIntents.retrieve(
        order.stripe_payment_intent_id
      );

      if (paymentIntent.status !== "succeeded") {
        return NextResponse.json(
          { error: "Payment not completed", payment_status: paymentIntent.status },
          { status: 400 }
        );
      }
    }

    // Update order to confirmed
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: "confirmed" })
      .eq("id", order_id);

    if (updateError) throw updateError;

    // Decrement stock for each item (fire-and-forget)
    supabase
      .from("order_items")
      .select("menu_item_id, variant_id, quantity")
      .eq("order_id", order_id)
      .then(({ data: orderItems }) => {
        if (!orderItems) return;
        for (const item of orderItems) {
          if (item.variant_id) {
            supabase.rpc("decrement_variant_stock", {
              v_id: item.variant_id,
              qty: item.quantity,
            }).then(() => {});
          } else if (item.menu_item_id) {
            supabase.rpc("decrement_item_stock", {
              item_id: item.menu_item_id,
              qty: item.quantity,
            }).then(() => {});
          }
        }
      });

    // Track customer (fire-and-forget)
    supabase
      .from("business_customers")
      .select("id, total_orders, total_spent")
      .eq("business_id", order.business_id)
      .eq("customer_id", user.id)
      .single()
      .then(({ data: existing }) => {
        if (existing) {
          supabase
            .from("business_customers")
            .update({
              total_orders: existing.total_orders + 1,
              total_spent: existing.total_spent + order.total,
              last_visit: new Date().toISOString(),
            })
            .eq("id", existing.id)
            .then(() => {});
        } else {
          supabase
            .from("business_customers")
            .insert({
              business_id: order.business_id,
              customer_id: user.id,
              total_orders: 1,
              total_bookings: 0,
              total_spent: order.total,
              first_visit: new Date().toISOString(),
              last_visit: new Date().toISOString(),
              tags: [],
            })
            .then(() => {});
        }
      });

    // Notify business owner (fire-and-forget)
    supabase
      .from("businesses")
      .select("owner_id, name")
      .eq("id", order.business_id)
      .single()
      .then(({ data: biz }) => {
        if (biz?.owner_id) {
          supabase
            .from("notifications")
            .insert({
              user_id: biz.owner_id,
              type: "order",
              title: "New order received!",
              body: `Order ${order.order_number} — $${(order.total / 100).toFixed(2)}`,
              link_type: "order",
              link_id: order.id,
            })
            .then(() => {});
        }
      });

    // Send customer receipt (fire-and-forget, idempotent via receipt_sent_at).
    sendOrderReceiptEmail(order_id).catch((emailErr) => {
      console.error("Order receipt email error (non-fatal):", emailErr);
    });

    return NextResponse.json({ confirmed: true, order_id });
  } catch (error) {
    console.error("Order confirm error:", error);
    return NextResponse.json(
      { error: "Failed to confirm order" },
      { status: 500 }
    );
  }
}
