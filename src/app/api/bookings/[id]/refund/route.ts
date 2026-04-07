import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST(
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

    // Get the booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, business_id, customer_id, service_name, status, price, stripe_payment_intent_id")
      .eq("id", id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Verify business ownership
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", booking.business_id)
      .eq("owner_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: "Not authorized to refund this booking" },
        { status: 403 }
      );
    }

    // Can't refund already cancelled bookings
    if (booking.status === "cancelled") {
      return NextResponse.json(
        { error: "Booking is already cancelled" },
        { status: 400 }
      );
    }

    // Must have a Stripe payment intent
    if (!booking.stripe_payment_intent_id) {
      return NextResponse.json(
        { error: "No payment found for this booking" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const refundAmount: number | undefined = body.amount;

    // Validate partial refund amount
    if (refundAmount !== undefined) {
      if (typeof refundAmount !== "number" || refundAmount <= 0) {
        return NextResponse.json(
          { error: "Invalid refund amount" },
          { status: 400 }
        );
      }
      if (booking.price && refundAmount > booking.price) {
        return NextResponse.json(
          { error: "Refund amount exceeds booking price" },
          { status: 400 }
        );
      }
    }

    // Create Stripe refund
    const stripe = getStripe();
    const refundParams: { payment_intent: string; amount?: number } = {
      payment_intent: booking.stripe_payment_intent_id,
    };

    if (refundAmount) {
      refundParams.amount = refundAmount;
    }

    const refund = await stripe.refunds.create(refundParams);

    // Update booking status to cancelled
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (updateError) {
      console.error("Failed to update booking status after refund:", updateError);
    }

    // Notify customer
    if (booking.customer_id) {
      const refundLabel = refundAmount
        ? `$${(refundAmount / 100).toFixed(2)} partial refund`
        : "full refund";

      supabase
        .from("notifications")
        .insert({
          user_id: booking.customer_id,
          type: "booking",
          title: `Refund processed for ${booking.service_name}`,
          body: `A ${refundLabel} has been issued.`,
          link_type: "booking",
          link_id: id,
        })
        .then(({ error: notifError }) => {
          if (notifError) console.error("Notification insert error:", notifError);
        });
    }

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
        currency: refund.currency,
      },
    });
  } catch (error) {
    console.error("Refund error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process refund";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
