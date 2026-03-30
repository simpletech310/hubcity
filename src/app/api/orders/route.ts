import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateOrderNumber, calculatePlatformFee } from "@/lib/stripe";

const CA_TAX_RATE = 0.095;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      business_id,
      items,
      type,
      tip = 0,
      delivery_address,
      delivery_notes,
      stripe_payment_intent_id,
    } = await request.json();

    if (!business_id || !items || !items.length || !type) {
      return NextResponse.json(
        { error: "business_id, items, and type are required" },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = items.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity,
      0
    );
    const platform_fee = calculatePlatformFee(subtotal);
    const tax = Math.round(subtotal * CA_TAX_RATE);
    const total = subtotal + tax + tip;
    const order_number = generateOrderNumber();

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number,
        business_id,
        customer_id: user.id,
        status: stripe_payment_intent_id ? "pending" : "pending",
        type,
        subtotal,
        platform_fee,
        tax,
        tip,
        total,
        stripe_payment_intent_id: stripe_payment_intent_id || null,
        delivery_address: delivery_address || null,
        delivery_notes: delivery_notes || null,
      })
      .select("*")
      .single();

    if (orderError) throw orderError;

    // Insert order items
    const orderItems = items.map(
      (item: {
        menu_item_id: string;
        name: string;
        price: number;
        quantity: number;
        special_instructions?: string;
      }) => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id || null,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        special_instructions: item.special_instructions || null,
      })
    );

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Upsert business_customers
    const { data: existing } = await supabase
      .from("business_customers")
      .select("id, total_orders, total_spent")
      .eq("business_id", business_id)
      .eq("customer_id", user.id)
      .single();

    if (existing) {
      await supabase
        .from("business_customers")
        .update({
          total_orders: existing.total_orders + 1,
          total_spent: existing.total_spent + total,
          last_visit: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("business_customers").insert({
        business_id,
        customer_id: user.id,
        total_orders: 1,
        total_bookings: 0,
        total_spent: total,
        first_visit: new Date().toISOString(),
        last_visit: new Date().toISOString(),
        tags: [],
      });
    }

    // Notify business owner of new order (fire-and-forget)
    supabase
      .from("businesses")
      .select("owner_id, name")
      .eq("id", business_id)
      .single()
      .then(({ data: biz }) => {
        if (biz?.owner_id) {
          supabase
            .from("notifications")
            .insert({
              user_id: biz.owner_id,
              type: "order",
              title: "New order received!",
              body: `Order ${order_number} — $${(total / 100).toFixed(2)}`,
              link_type: "order",
              link_id: order.id,
            })
            .then(({ error: notifError }) => {
              if (notifError) console.error("Notification insert error:", notifError);
            });
        }
      });

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select("*, business:businesses(id, name, slug, image_urls)")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json(
      { error: "Failed to get orders" },
      { status: 500 }
    );
  }
}
