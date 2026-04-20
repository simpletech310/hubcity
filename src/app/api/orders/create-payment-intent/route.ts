import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, generateOrderNumber, calculatePlatformFee } from "@/lib/stripe";
import { getStrictRateLimiter, checkRateLimit } from "@/lib/ratelimit";
import {
  cacheIntent,
  findCachedIntent,
  readIdempotencyKey,
} from "@/lib/idempotency";

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

    const rl = await checkRateLimit(getStrictRateLimiter(), user.id);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", reset: rl.reset },
        { status: 429 }
      );
    }

    const { key: idempotencyKey } = readIdempotencyKey(request);

    const cached = await findCachedIntent(supabase, user.id, idempotencyKey);
    if (cached) {
      const { data: existingOrder } = cached.resource_id
        ? await supabase
            .from("orders")
            .select("id,order_number,total")
            .eq("id", cached.resource_id)
            .maybeSingle()
        : { data: null };
      return NextResponse.json({
        order_id: cached.resource_id,
        order_number: existingOrder?.order_number ?? null,
        client_secret: cached.client_secret,
        total: cached.amount_cents,
        idempotent_replay: true,
      });
    }

    const {
      business_id,
      items,
      type,
      tip = 0,
      delivery_address,
      delivery_notes,
      coupon_id,
      pickup_location_name,
      pickup_vehicle_id,
    } = await request.json();

    if (!business_id || !items || !items.length || !type) {
      return NextResponse.json(
        { error: "business_id, items, and type are required" },
        { status: 400 }
      );
    }

    // Store-hours enforcement (P5). If no hours rows are configured for today,
    // allow the order (grandfather businesses that haven't set hours). If hours
    // are configured, the current time must fall within an active window.
    {
      const nowLa = new Date().toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
        hour12: false,
      });
      // nowLa looks like "4/19/2026, 14:35:02" — parse it back into pieces.
      const parsed = new Date(nowLa.replace(",", ""));
      const dow = parsed.getDay(); // 0=Sun..6=Sat
      const mins = parsed.getHours() * 60 + parsed.getMinutes();

      const { data: hours } = await supabase
        .from("food_vendor_hours")
        .select("opens_at, closes_at, active")
        .eq("business_id", business_id)
        .eq("day_of_week", dow)
        .eq("active", true);

      if (hours && hours.length > 0) {
        const toMinutes = (t: string | null) => {
          if (!t) return null;
          const [hh, mm] = t.split(":").map(Number);
          return hh * 60 + (mm || 0);
        };
        const isOpen = hours.some((h) => {
          const o = toMinutes(h.opens_at);
          const c = toMinutes(h.closes_at);
          if (o == null || c == null) return false;
          // Allow "closes at midnight" (24:00) or wrap-around like 18:00-02:00
          return c >= o ? mins >= o && mins < c : mins >= o || mins < c;
        });
        if (!isOpen) {
          // Compute the next opening for a helpful error message.
          let next_open: string | null = null;
          for (let offset = 0; offset < 8 && !next_open; offset++) {
            const d = (dow + offset) % 7;
            const { data: futureHours } = await supabase
              .from("food_vendor_hours")
              .select("opens_at")
              .eq("business_id", business_id)
              .eq("day_of_week", d)
              .eq("active", true)
              .order("opens_at", { ascending: true })
              .limit(1);
            if (futureHours && futureHours.length > 0 && futureHours[0].opens_at) {
              const op = futureHours[0].opens_at as string;
              const opMins =
                Number(op.split(":")[0]) * 60 + Number(op.split(":")[1] || 0);
              if (offset === 0 && opMins <= mins) continue;
              next_open = `day_of_week=${d} ${op}`;
            }
          }
          return NextResponse.json(
            { error: "Store is closed", next_open },
            { status: 400 }
          );
        }
      }
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

    // Get business name + Stripe Connect account
    const { data: business } = await supabase
      .from("businesses")
      .select("name")
      .eq("id", business_id)
      .single();

    const { data: stripeAccount } = await supabase
      .from("stripe_accounts")
      .select("stripe_account_id, charges_enabled")
      .eq("business_id", business_id)
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
        pickup_location_name:
          type === "pickup" ? (pickup_location_name || null) : null,
        pickup_vehicle_id:
          type === "pickup" ? (pickup_vehicle_id || null) : null,
        idempotency_key: idempotencyKey,
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

    // Create Stripe PaymentIntent (with Connect if business has Stripe account).
    // The idempotencyKey is forwarded to Stripe so duplicate submits return the
    // same intent instead of double-charging.
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: total,
        currency: "usd",
        metadata: {
          order_id: order.id,
          order_number,
          business_id,
          customer_id: user.id,
          idempotency_key: idempotencyKey,
        },
        description: `Order ${order_number} at ${business?.name || "Culture Business"}`,
        automatic_payment_methods: { enabled: true },
        ...(stripeAccount?.charges_enabled && stripeAccount.stripe_account_id
          ? {
              application_fee_amount: platform_fee,
              transfer_data: { destination: stripeAccount.stripe_account_id },
            }
          : {}),
      },
      { idempotencyKey }
    );

    await supabase
      .from("orders")
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq("id", order.id);

    await cacheIntent(supabase, {
      idempotency_key: idempotencyKey,
      user_id: user.id,
      resource_type: "order",
      resource_id: order.id,
      stripe_payment_intent_id: paymentIntent.id,
      amount_cents: total,
      currency: "usd",
      client_secret: paymentIntent.client_secret ?? null,
    });

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
