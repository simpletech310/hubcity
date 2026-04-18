import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStrictRateLimiter, checkRateLimit } from "@/lib/ratelimit";

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

    const {
      business_id,
      service_name,
      date,
      start_time,
      end_time,
      price,
      notes,
      stripe_payment_intent_id,
      staff_id,
      staff_name,
    } = await request.json();

    if (!business_id || !service_name || !date || !start_time || !end_time) {
      return NextResponse.json(
        {
          error:
            "business_id, service_name, date, start_time, and end_time are required",
        },
        { status: 400 }
      );
    }

    // Check for conflicts
    const { data: conflicts } = await supabase
      .from("bookings")
      .select("id")
      .eq("business_id", business_id)
      .eq("date", date)
      .neq("status", "cancelled")
      .lt("start_time", end_time)
      .gt("end_time", start_time);

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { error: "This time slot is no longer available" },
        { status: 409 }
      );
    }

    // Insert booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        business_id,
        customer_id: user.id,
        service_name,
        date,
        start_time,
        end_time,
        status: "pending",
        price: price || null,
        stripe_payment_intent_id: stripe_payment_intent_id || null,
        notes: notes || null,
        staff_id: staff_id || null,
        staff_name: staff_name || null,
      })
      .select("*")
      .single();

    if (bookingError) throw bookingError;

    // Upsert business_customers
    const { data: existing } = await supabase
      .from("business_customers")
      .select("id, total_bookings, total_spent")
      .eq("business_id", business_id)
      .eq("customer_id", user.id)
      .single();

    if (existing) {
      await supabase
        .from("business_customers")
        .update({
          total_bookings: existing.total_bookings + 1,
          total_spent: existing.total_spent + (price || 0),
          last_visit: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("business_customers").insert({
        business_id,
        customer_id: user.id,
        total_orders: 0,
        total_bookings: 1,
        total_spent: price || 0,
        first_visit: new Date().toISOString(),
        last_visit: new Date().toISOString(),
        tags: [],
      });
    }

    // Notify business owner of new booking (fire-and-forget)
    supabase
      .from("businesses")
      .select("owner_id")
      .eq("id", business_id)
      .single()
      .then(({ data: biz }) => {
        if (biz?.owner_id) {
          supabase
            .from("notifications")
            .insert({
              user_id: biz.owner_id,
              type: "booking",
              title: "New booking request",
              body: `${service_name} on ${date} at ${start_time}`,
              link_type: "booking",
              link_id: booking.id,
            })
            .then(({ error: notifError }) => {
              if (notifError) console.error("Notification insert error:", notifError);
            });
        }
      });

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Create booking error:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
