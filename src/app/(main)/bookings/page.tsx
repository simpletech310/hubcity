import { redirect } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import type { Booking, Business } from "@/types/database";

const statusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

const statusVariant: Record<string, "gold" | "emerald" | "coral" | "cyan" | "purple"> = {
  pending: "gold",
  confirmed: "cyan",
  completed: "emerald",
  cancelled: "coral",
  no_show: "coral",
};

export default async function MyBookingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, business:businesses(id, name, slug, category, address)")
    .eq("customer_id", user.id)
    .order("date", { ascending: false });

  const bookingList = (bookings ?? []) as (Booking & { business: Business })[];

  return (
    <div className="animate-fade-in pb-24">
      {/* Header */}
      <div className="px-5 pt-4 mb-4">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 text-gold text-sm font-semibold press"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M10 12L6 8l4-4" />
          </svg>
          Back
        </Link>
        <h1 className="font-heading text-2xl font-bold mt-3">My Bookings</h1>
      </div>

      <div className="px-5 space-y-3">
        {bookingList.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-txt-secondary text-sm mb-4">
              No bookings yet.
            </p>
            <Link href="/business">
              <span className="text-gold text-sm font-semibold press">
                Browse Businesses
              </span>
            </Link>
          </div>
        ) : (
          bookingList.map((booking) => (
            <Card key={booking.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-bold">
                    {booking.service_name}
                  </h3>
                  <p className="text-[11px] text-txt-secondary mt-0.5">
                    {booking.business?.name}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-txt-secondary">
                      {new Date(booking.date + "T00:00:00").toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" }
                      )}
                    </span>
                    <span className="text-xs text-txt-secondary">
                      {booking.start_time}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Badge
                    label={statusLabels[booking.status] ?? booking.status}
                    variant={statusVariant[booking.status] ?? "gold"}
                  />
                  {booking.price != null && (
                    <span className="text-sm font-bold text-gold">
                      ${(booking.price / 100).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
