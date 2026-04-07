import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, generateOrderNumber, calculatePlatformFee } from "@/lib/stripe";

const CA_TAX_RATE = 0.095;

interface OrderItemInput {
  menu_item_id: string;
  variant_id?: string | null;
  name: string;
  price: number;
  quantity: number;
  special_instructions?: string | null;
}

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
      coupon_id,
    } = await request.json();

    if (!business_id || !items || !items.length || !type) {
      return NextResponse.json(
        { error: "business_id, items, and type are required" },
        { status: 400 }
      );
    }

    // Stock validation
    for (const item of items as OrderItemInput[]) {
      if (item.variant_id) {
        const { data: variant } = await supabase
          .from("product_variants")
          .select("stock_count, name")
          .eq("id", item.variant_id)
          .single();

        if (variant && variant.stock_count !== null && variant.stock_count < item.quantity) {
          return NextResponse.json(
            { error: `"${item.name} (${variant.name})" only has ${variant.stock_count} in stock` },
            { status: 400 }
          );
        }
      } else if (item.menu_item_id) {
        const { data: menuItem } = await supabase
          .from("menu_items")
          .select("stock_count, name")
          .eq("id", item.menu_item_id)
          .single();

        if (menuItem && menuItem.stock_count !== null && menuItem.stock_count < item.quantity) {
          return NextResponse.json(
            { error: `"${menuItem.name}" only has ${menuItem.stock_count} in stock` },
            { status: 400 }
          );
        }
      }
    }

    // Calculate totals
    const subtotal = (items as OrderItemInput[]).reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const platform_fee = calculatePlatformFee(subtotal);
    const tax = Math.round(subtotal * CA_TAX_RATE);

    // Validate and apply coupon
    let discount_amount = 0;
    let validCouponId: string | null = null;

    if (coupon_id) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("id", coupon_id)
        .eq("business_id", business_id)
        .eq("is_active", true)
        .single();

      if (coupon) {
        const now = new Date();
        const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null;
        const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;
        const withinDates =
          (!validFrom || now >= validFrom) && (!validUntil || now <= validUntil);
        const withinUses =
          !coupon.max_uses || (coupon.current_uses ?? 0) < coupon.max_uses;
        const meetsMinimum =
          !coupon.min_order_amount || subtotal >= coupon.min_order_amount;

        if (withinDates && withinUses && meetsMinimum) {
          if (coupon.discount_type === "percent") {
            discount_amount = Math.round(subtotal * (coupon.discount_value / 100));
          } else if (coupon.discount_type === "fixed_amount") {
            discount_amount = Math.min(coupon.discount_value, subtotal);
          }
          // free_shipping doesn't affect total calculation here
          validCouponId = coupon.id;

          // Increment usage
          await supabase
            .from("coupons")
            .update({ current_uses: (coupon.current_uses ?? 0) + 1 })
            .eq("id", coupon.id);
        }
      }
    }

    const total = Math.max(subtotal + tax + tip - discount_amount, 0);
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
        discount_amount,
        coupon_id: validCouponId,
        delivery_address: delivery_address || null,
        delivery_notes: delivery_notes || null,
      })
      .select("id")
      .single();

    if (orderError) throw orderError;

    // Insert order items
    const orderItems = (items as OrderItemInput[]).map((item) => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id || null,
      variant_id: item.variant_id || null,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      special_instructions: item.special_instructions || null,
    }));

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
