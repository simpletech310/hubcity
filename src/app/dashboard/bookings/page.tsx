import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { Booking } from "@/types/database";
import BookingActions from "./BookingActions";
import BookingFilters from "./BookingFilters";
import BookingViewToggle from "./BookingViewToggle";
import BookingCalendar from "./BookingCalendar";

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const statusColors: Record<string, "gold" | "emerald" | "cyan" | "coral" | "purple"> = {
  pending: "gold",
  confirmed: "emerald",
  completed: "cyan",
  cancelled: "coral",
  no_show: "coral",
};

export default async function DashboardBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; view?: string }>;
}) {
  const { filter = "all", view = "list" } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!business) return null;

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "*, customer:profiles!bookings_customer_id_fkey(display_name)"
    )
    .eq("business_id", business.id)
    .order("date", { ascending: false })
    .order("start_time", { ascending: false });

  const allBookings = (bookings ?? []) as (Booking & {
    customer: { display_name: string } | null;
  })[];

  // Compute stats
  const today = new Date().toISOString().split("T")[0];
  const pendingCount = allBookings.filter((b) => b.status === "pending").length;
  const todayCount = allBookings.filter((b) => b.date === today).length;
  const todayRevenue = allBookings
    .filter((b) => b.date === today && (b.status === "confirmed" || b.status === "completed"))
    .reduce((sum, b) => sum + (b.price ?? 0), 0);

  // Filter bookings
  const filteredBookings = allBookings.filter((b) => {
    switch (filter) {
      case "upcoming":
        return b.status === "confirmed" && b.date >= today;
      case "pending":
        return b.status === "pending";
      case "completed":
        return b.status === "completed";
      case "cancelled":
        return b.status === "cancelled" || b.status === "no_show";
      default:
        return true;
    }
  });

  return (
    <div className="px-4 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-bold">Bookings</h1>
        <BookingViewToggle currentView={view} />
      </div>

      {/* Stat Bar */}
      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-xl bg-white/[0.03] border border-border-subtle p-2.5 text-center">
          <p className="text-lg font-bold">{allBookings.length}</p>
          <p className="text-[10px] text-txt-secondary uppercase tracking-wider">Total</p>
        </div>
        <div className="rounded-xl bg-gold/5 border border-gold/15 p-2.5 text-center">
          <p className="text-lg font-bold text-gold">{pendingCount}</p>
          <p className="text-[10px] text-txt-secondary uppercase tracking-wider">Pending</p>
        </div>
        <div className="rounded-xl bg-cyan/5 border border-cyan/15 p-2.5 text-center">
          <p className="text-lg font-bold text-cyan">{todayCount}</p>
          <p className="text-[10px] text-txt-secondary uppercase tracking-wider">Today</p>
        </div>
        <div className="rounded-xl bg-emerald/5 border border-emerald/15 p-2.5 text-center">
          <p className="text-lg font-bold text-emerald">{formatCents(todayRevenue)}</p>
          <p className="text-[10px] text-txt-secondary uppercase tracking-wider">Revenue</p>
        </div>
      </div>

      {/* Filter Row (list view only) */}
      {view !== "calendar" && <BookingFilters currentFilter={filter} />}

      {view === "calendar" ? (
        <BookingCalendar
          bookings={allBookings.map((b) => ({
            id: b.id,
            service_name: b.service_name,
            date: b.date,
            start_time: b.start_time,
            end_time: b.end_time,
            status: b.status,
            price: b.price,
            staff_name: b.staff_name ?? null,
            customer_name: b.customer?.display_name || "Customer",
          }))}
        />
      ) : filteredBookings.length === 0 ? (
        <Card className="text-center py-10">
          <div className="w-12 h-12 rounded-full bg-cyan/10 flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-cyan">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium mb-1">
            {filter === "all" ? "No bookings yet" : `No ${filter} bookings`}
          </p>
          <p className="text-xs text-txt-secondary">
            {filter === "all"
              ? "Bookings will appear here when customers schedule appointments"
              : "Try a different filter to see more bookings"}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredBookings.map((booking) => (
            <Link key={booking.id} href={`/dashboard/bookings/${booking.id}`}>
              <Card hover>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold">{booking.service_name}</p>
                    <p className="text-xs text-txt-secondary mt-0.5">
                      {booking.customer?.display_name || "Customer"}
                      {booking.staff_name ? ` · ${booking.staff_name}` : ""}
                    </p>
                  </div>
                  <Badge
                    label={booking.status.replace("_", " ")}
                    variant={statusColors[booking.status] || "gold"}
                    size="sm"
                  />
                </div>

                <div className="flex items-center gap-4 text-xs text-txt-secondary">
                  <span className="flex items-center gap-1">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(booking.date + "T00:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                  </span>
                  {booking.price !== null && (
                    <span className="font-semibold text-gold">
                      {formatCents(booking.price)}
                    </span>
                  )}
                </div>

                {booking.notes && (
                  <p className="text-xs text-txt-secondary mt-2 italic">
                    {booking.notes}
                  </p>
                )}

                {booking.status === "pending" && (
                  <div className="mt-3" onClick={(e) => e.preventDefault()}>
                    <BookingActions bookingId={booking.id} />
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
