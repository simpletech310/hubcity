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

    const { business_id, service_id, date, start_time, end_time, notes } =
      await request.json();

    if (!business_id || !service_id || !date || !start_time || !end_time) {
      return NextResponse.json(
        { error: "business_id, service_id, date, start_time, and end_time are required" },
        { status: 400 }
      );
    }

    // Fetch service to get authoritative price + deposit
    const { data: service } = await supabase
      .from("services")
      .select("id, name, price, deposit_amount, duration")
      .eq("id", service_id)
      .eq("business_id", business_id)
      .eq("is_available", true)
      .single();

    if (!service) {
      return NextResponse.json(
        { error: "Service not found or unavailable" },
        { status: 404 }
      );
    }

    // Check for booking conflicts
    const { data: conflicts } = await supabase
      .from("bookings")
      .select("id")
      .eq("business_id", business_id)
      .eq("date", date)
      .neq("status", "cancelled")
      .lt("start_time", end_time)
      .gt("end_time", start_time);

    // Get time slot to check max_bookings
    const dayOfWeek = new Date(date + "T00:00:00").getDay();
    const { data: timeSlots } = await supabase
      .from("time_slots")
      .select("max_bookings")
      .eq("business_id", business_id)
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true);

    const maxBookings = timeSlots?.[0]?.max_bookings ?? 1;
    if ((conflicts?.length ?? 0) >= maxBookings) {
      return NextResponse.json(
        { error: "This time slot is no longer available" },
        { status: 409 }
      );
    }

    // Determine charge amount
    const chargeAmount =
      (service.deposit_amount ?? 0) > 0 ? service.deposit_amount : service.price;

    // Get business name
    const { data: business } = await supabase
      .from("businesses")
      .select("name")
      .eq("id", business_id)
      .single();

    // Create booking with pending status
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        business_id,
        customer_id: user.id,
        service_name: service.name,
        date,
        start_time,
        end_time,
        price: service.price,
        notes: notes || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (bookingError) throw bookingError;

    // Create Stripe PaymentIntent
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: chargeAmount,
      currency: "usd",
      metadata: {
        booking_id: booking.id,
        business_id,
        customer_id: user.id,
        service_name: service.name,
      },
      description: `Booking: ${service.name} at ${business?.name || "Hub City Business"}`,
      automatic_payment_methods: { enabled: true },
    });

    // Save payment intent on booking
    await supabase
      .from("bookings")
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq("id", booking.id);

    return NextResponse.json({
      booking_id: booking.id,
      client_secret: paymentIntent.client_secret,
      charge_amount: chargeAmount,
      total_price: service.price,
      deposit_amount: service.deposit_amount ?? 0,
    });
  } catch (error) {
    console.error("Create booking payment intent error:", error);
    return NextResponse.json(
      { error: "Failed to create booking payment" },
      { status: 500 }
    );
  }
}
