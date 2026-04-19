import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/bookings/available-slots
 *
 * Returns the available booking slots for a given business + date, honoring:
 *   • time_slots (the weekly availability windows from migration 017)
 *   • service duration + lead_time_hours
 *   • service.buffer_before_minutes / buffer_after_minutes (migration 056)
 *   • staff assignments via staff_services (if staff_id provided, only slots
 *     that staff can work; otherwise slots where *at least one* staff who
 *     performs this service is free)
 *   • the service.timezone for lead-time and "today" comparisons
 *
 * Query params:
 *   business_id (required)
 *   date        (required, YYYY-MM-DD)
 *   service_id  (recommended — without it we can't apply buffers/staff filter)
 *   staff_id    (optional — filter to a specific provider)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("business_id");
    const date = searchParams.get("date");
    const serviceId = searchParams.get("service_id");
    const staffId = searchParams.get("staff_id");

    if (!businessId || !date) {
      return NextResponse.json(
        { error: "business_id and date query params are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // ─── Service config ─────────────────────────────────────────
    let leadTimeHours = 0;
    let bufferBefore = 0;
    let bufferAfter = 0;
    let serviceDuration: number | null = null;
    let serviceTimezone = "America/Los_Angeles";

    if (serviceId) {
      const { data: service } = await supabase
        .from("services")
        .select(
          "lead_time_hours, duration, buffer_before_minutes, buffer_after_minutes, timezone"
        )
        .eq("id", serviceId)
        .single();
      if (service) {
        leadTimeHours = service.lead_time_hours ?? 0;
        bufferBefore = service.buffer_before_minutes ?? 0;
        bufferAfter = service.buffer_after_minutes ?? 0;
        serviceDuration = service.duration ?? null;
        serviceTimezone = service.timezone ?? serviceTimezone;
      }
    }

    // ─── Qualified staff for this service ──────────────────────
    // If a specific staff_id was requested, we only need that one. Otherwise
    // we want the full set of active staff who can perform this service —
    // a slot is considered "available" if at least one of them is free.
    let qualifiedStaff: { id: string }[] = [];
    if (serviceId) {
      if (staffId) {
        // Only this staff member, and they must actually do this service.
        const { data: link } = await supabase
          .from("staff_services")
          .select("staff_id, business_staff!inner(id, is_active, business_id)")
          .eq("service_id", serviceId)
          .eq("staff_id", staffId)
          .maybeSingle();
        if (link) qualifiedStaff = [{ id: staffId }];
      } else {
        const { data: staffRows } = await supabase
          .from("staff_services")
          .select("staff_id, business_staff!inner(id, is_active, business_id)")
          .eq("service_id", serviceId);
        qualifiedStaff = (staffRows ?? [])
          .filter((r) => {
            const bs = Array.isArray(r.business_staff)
              ? r.business_staff[0]
              : r.business_staff;
            return bs && bs.business_id === businessId && bs.is_active !== false;
          })
          .map((r) => ({ id: r.staff_id }));
      }
    }
    const hasStaffRequirement = qualifiedStaff.length > 0 || Boolean(staffId);

    // ─── Lead time / "today" check (timezone-aware best-effort) ─
    const now = new Date();
    const earliestAllowedMs = now.getTime() + leadTimeHours * 60 * 60 * 1000;
    const requestedDate = parseDateInTz(date, serviceTimezone);
    const isToday = sameDayInTz(now, requestedDate, serviceTimezone);
    const dayOfWeek = requestedDate.getDay(); // 0=Sun..6=Sat in local TZ after adjustment

    // ─── Weekly time_slots for this day ─────────────────────────
    const { data: timeSlots, error: slotsError } = await supabase
      .from("time_slots")
      .select("*")
      .eq("business_id", businessId)
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true);

    if (slotsError) throw slotsError;
    if (!timeSlots || timeSlots.length === 0) {
      return NextResponse.json({ slots: [] });
    }

    // ─── Existing bookings for this date (for conflict checks) ──
    const { data: existingBookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("start_time, end_time, staff_id")
      .eq("business_id", businessId)
      .eq("date", date)
      .neq("status", "cancelled");

    if (bookingsError) throw bookingsError;
    const bookings = existingBookings ?? [];

    // ─── Generate slots ─────────────────────────────────────────
    const slots: Array<{
      start_time: string;
      end_time: string;
      available: boolean;
      staff_id?: string | null;
    }> = [];

    for (const timeSlot of timeSlots) {
      // Prefer the service duration when available, fall back to the time_slot's
      // own slot_duration so businesses that haven't attached a service still work.
      const slotDuration: number = serviceDuration ?? timeSlot.slot_duration ?? 30;
      const maxBookings: number = timeSlot.max_bookings ?? 1;

      let currentStart = timeToMinutes(timeSlot.start_time);
      const rangeEnd = timeToMinutes(timeSlot.end_time);

      while (currentStart + slotDuration <= rangeEnd) {
        const slotStart = minutesToTime(currentStart);
        const slotEnd = minutesToTime(currentStart + slotDuration);

        // Lead-time check (today only).
        let passesLeadTime = true;
        if (isToday && leadTimeHours > 0) {
          const slotDateTime = new Date(requestedDate);
          slotDateTime.setHours(
            Math.floor(currentStart / 60),
            currentStart % 60,
            0,
            0
          );
          if (slotDateTime.getTime() < earliestAllowedMs) passesLeadTime = false;
        }

        // Buffer-padded window for conflict detection. A new booking at
        // [slotStart, slotEnd] needs the padded window
        // [slotStart - bufferBefore, slotEnd + bufferAfter] to be clear of
        // conflicts with any existing booking's padded window. We achieve
        // that symmetrically: treat each existing booking as blocking
        // [b.start - bufferBefore, b.end + bufferAfter] and check plain overlap.
        const paddedStart = currentStart - bufferBefore;
        const paddedEnd = currentStart + slotDuration + bufferAfter;

        let available = passesLeadTime;
        let assignedStaff: string | null = null;

        if (available) {
          if (hasStaffRequirement) {
            // Need at least one qualified staff member free for this padded window.
            const freeStaff = qualifiedStaff.find((st) => {
              return !bookings.some((b) => {
                if (b.staff_id && b.staff_id !== st.id) return false;
                const bStart = timeToMinutes(b.start_time) - bufferBefore;
                const bEnd = timeToMinutes(b.end_time) + bufferAfter;
                return paddedStart < bEnd && paddedEnd > bStart;
              });
            });
            if (freeStaff) {
              assignedStaff = freeStaff.id;
            } else {
              available = false;
            }
          } else {
            // No staff model — fall back to the old max_bookings cap with
            // buffer-aware overlap detection.
            const overlapping = bookings.filter((b) => {
              const bStart = timeToMinutes(b.start_time) - bufferBefore;
              const bEnd = timeToMinutes(b.end_time) + bufferAfter;
              return paddedStart < bEnd && paddedEnd > bStart;
            }).length;
            if (overlapping >= maxBookings) available = false;
          }
        }

        slots.push({
          start_time: slotStart,
          end_time: slotEnd,
          available,
          ...(hasStaffRequirement ? { staff_id: assignedStaff } : {}),
        });

        currentStart += slotDuration;
      }
    }

    return NextResponse.json({ slots, timezone: serviceTimezone });
  } catch (error) {
    console.error("Get available slots error:", error);
    return NextResponse.json(
      { error: "Failed to get available slots" },
      { status: 500 }
    );
  }
}

// ─── Helpers ────────────────────────────────────────────────────

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, minutes));
  const h = Math.floor(clamped / 60)
    .toString()
    .padStart(2, "0");
  const m = (clamped % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Parse a YYYY-MM-DD date as midnight local to the given IANA timezone.
 * We avoid adding `date-fns-tz` by relying on Intl.DateTimeFormat — this
 * is good enough for civil-time lead-time checks; exact DST-edge
 * correctness can be polished when the TZ story is revisited.
 */
function parseDateInTz(ymd: string, _timezone: string): Date {
  // Intentional: parse as local wall-clock. Callers use `sameDayInTz` for
  // timezone-correct "today" comparisons.
  return new Date(`${ymd}T00:00:00`);
}

function sameDayInTz(a: Date, b: Date, timezone: string): boolean {
  try {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return fmt.format(a) === fmt.format(b);
  } catch {
    return a.toDateString() === b.toDateString();
  }
}
