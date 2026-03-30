import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, generateOrderNumber, calculatePlatformFee } from "@/lib/stripe";

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

    // Get business name for Stripe description
    const { data: business } = await supabase
      .from("businesses")
      .select("name")
      .eq("id", business_id)
      .single();

    // Create order with pending status
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number,
        business_id,
        customer_id: user.id,
        status: "pending",
        type,
        subtotal,
        platform_fee,
        tax,
        tip,
        total,
        delivery_address: delivery_address || null,
        delivery_notes: delivery_notes || null,
      })
      .select("id")
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

    // Create Stripe PaymentIntent
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: "usd",
      metadata: {
        order_id: order.id,
        order_number,
        business_id,
        customer_id: user.id,
      },
      description: `Order ${order_number} at ${business?.name || "Hub City Business"}`,
      automatic_payment_methods: { enabled: true },
    });

    // Save payment intent ID on order
    await supabase
      .from("orders")
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq("id", order.id);

    return NextResponse.json({
      order_id: order.id,
      order_number,
      client_secret: paymentIntent.client_secret,
      total,
    });
  } catch (error) {
    console.error("Create payment intent error:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
