import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const business_id = searchParams.get("business_id");
    const date = searchParams.get("date");
    const service_id = searchParams.get("service_id");

    if (!business_id || !date) {
      return NextResponse.json(
        { error: "business_id and date query params are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch lead time from service if provided
    let leadTimeHours = 0;
    if (service_id) {
      const { data: service } = await supabase
        .from("services")
        .select("lead_time_hours")
        .eq("id", service_id)
        .single();
      leadTimeHours = service?.lead_time_hours ?? 0;
    }

    const now = new Date();
    const earliestAllowed = new Date(now.getTime() + leadTimeHours * 60 * 60 * 1000);
    const requestedDate = new Date(date + "T00:00:00");
    const isToday = requestedDate.toDateString() === now.toDateString();

    // Get day of week (0=Sun, 6=Sat)
    const dayOfWeek = new Date(date + "T00:00:00").getDay();

    // Get time slots for this day
    const { data: timeSlots, error: slotsError } = await supabase
      .from("time_slots")
      .select("*")
      .eq("business_id", business_id)
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true);

    if (slotsError) throw slotsError;

    if (!timeSlots || timeSlots.length === 0) {
      return NextResponse.json({ slots: [] });
    }

    // Get existing bookings for this date
    const { data: existingBookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("start_time, end_time")
      .eq("business_id", business_id)
      .eq("date", date)
      .neq("status", "cancelled");

    if (bookingsError) throw bookingsError;

    // Calculate available slots
    const slots: Array<{
      start_time: string;
      end_time: string;
      available: boolean;
    }> = [];

    for (const timeSlot of timeSlots) {
      const slotDuration = timeSlot.slot_duration; // minutes
      const maxBookings = timeSlot.max_bookings;

      // Generate individual slots within the time range
      let currentStart = timeToMinutes(timeSlot.start_time);
      const rangeEnd = timeToMinutes(timeSlot.end_time);

      while (currentStart + slotDuration <= rangeEnd) {
        const slotStart = minutesToTime(currentStart);
        const slotEnd = minutesToTime(currentStart + slotDuration);

        // Skip slots that violate lead time on today's date
        let passesLeadTime = true;
        if (isToday && leadTimeHours > 0) {
          const slotDateTime = new Date(requestedDate);
          slotDateTime.setHours(Math.floor(currentStart / 60), currentStart % 60, 0, 0);
          if (slotDateTime < earliestAllowed) {
            passesLeadTime = false;
          }
        }

        // Count overlapping bookings
        const overlapping = (existingBookings || []).filter(
          (b) => b.start_time < slotEnd && b.end_time > slotStart
        ).length;

        slots.push({
          start_time: slotStart,
          end_time: slotEnd,
          available: passesLeadTime && overlapping < maxBookings,
        });

        currentStart += slotDuration;
      }
    }

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Get available slots error:", error);
    return NextResponse.json(
      { error: "Failed to get available slots" },
      { status: 500 }
    );
  }
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}
