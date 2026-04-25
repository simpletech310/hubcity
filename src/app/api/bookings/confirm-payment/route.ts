import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { booking_id } = await request.json();

    if (!booking_id) {
      return NextResponse.json(
        { error: "booking_id is required" },
        { status: 400 }
      );
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, stripe_payment_intent_id, status, business_id, customer_id, price, service_name")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.customer_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Verify payment with Stripe and capture the actual amount charged so
    // we always have an authoritative `deposit_paid_cents` regardless of
    // whether the create-payment-intent step recorded it.
    let amountReceived: number | null = null;
    if (booking.stripe_payment_intent_id) {
      const stripe = getStripe();
      const paymentIntent = await stripe.paymentIntents.retrieve(
        booking.stripe_payment_intent_id
      );

      if (paymentIntent.status !== "succeeded") {
        return NextResponse.json(
          { error: "Payment not completed", payment_status: paymentIntent.status },
          { status: 400 }
        );
      }
      amountReceived = paymentIntent.amount_received ?? paymentIntent.amount ?? null;
    }

    // Update booking to confirmed + persist deposit amount.
    const update: {
      status: string;
      deposit_paid_cents?: number;
    } = { status: "confirmed" };
    if (amountReceived != null) update.deposit_paid_cents = amountReceived;

    const { error: updateError } = await supabase
      .from("bookings")
      .update(update)
      .eq("id", booking_id);

    if (updateError) throw updateError;

    // Track customer (fire-and-forget)
    supabase
      .from("business_customers")
      .select("id, total_bookings, total_spent")
      .eq("business_id", booking.business_id)
      .eq("customer_id", user.id)
      .single()
      .then(({ data: existing }) => {
        if (existing) {
          supabase
            .from("business_customers")
            .update({
              total_bookings: (existing.total_bookings ?? 0) + 1,
              total_spent: existing.total_spent + (booking.price ?? 0),
              last_visit: new Date().toISOString(),
            })
            .eq("id", existing.id)
            .then(() => {});
        } else {
          supabase
            .from("business_customers")
            .insert({
              business_id: booking.business_id,
              customer_id: user.id,
              total_orders: 0,
              total_bookings: 1,
              total_spent: booking.price ?? 0,
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
      .eq("id", booking.business_id)
      .single()
      .then(({ data: biz }) => {
        if (biz?.owner_id) {
          supabase
            .from("notifications")
            .insert({
              user_id: biz.owner_id,
              type: "booking",
              title: "New booking received!",
              body: `${booking.service_name} — $${((booking.price ?? 0) / 100).toFixed(2)}`,
              link_type: "booking",
              link_id: booking.id,
            })
            .then(() => {});
        }
      });

    return NextResponse.json({ confirmed: true, booking_id });
  } catch (error) {
    console.error("Booking confirm error:", error);
    return NextResponse.json(
      { error: "Failed to confirm booking" },
      { status: 500 }
    );
  }
}
