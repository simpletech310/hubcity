import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
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

    // Get booking and verify business ownership
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, business_id, customer_id, service_name")
      .eq("id", id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", booking.business_id)
      .eq("owner_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: "Not authorized to update this booking" },
        { status: 403 }
      );
    }

    const { status } = await request.json();

    const { data: updated, error: updateError } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) throw updateError;

    // Notify customer of booking status change (fire-and-forget)
    const bookingStatusMessages: Record<string, string> = {
      confirmed: "Your booking has been confirmed!",
      cancelled: "Your booking has been cancelled",
      completed: "Your booking is marked complete",
    };

    if (bookingStatusMessages[status] && booking.customer_id) {
      supabase
        .from("notifications")
        .insert({
          user_id: booking.customer_id,
          type: "booking",
          title: bookingStatusMessages[status],
          body: booking.service_name || "Booking update",
          link_type: "booking",
          link_id: id,
        })
        .then(({ error: notifError }) => {
          if (notifError) console.error("Notification insert error:", notifError);
        });
    }

    return NextResponse.json({ booking: updated });
  } catch (error) {
    console.error("Update booking status error:", error);
    return NextResponse.json(
      { error: "Failed to update booking status" },
      { status: 500 }
    );
  }
}
