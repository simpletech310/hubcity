import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { Booking } from "@/types/database";
import BookingStatusActions from "./BookingStatusActions";
import BookingRefundButton from "./BookingRefundButton";

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(time: string) {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:${m} ${ampm}`;
}

const statusColors: Record<string, "gold" | "emerald" | "cyan" | "coral" | "purple"> = {
  pending: "gold",
  confirmed: "emerald",
  completed: "cyan",
  cancelled: "coral",
  no_show: "coral",
};

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "*, customer:profiles!bookings_customer_id_fkey(display_name, phone)"
    )
    .eq("id", id)
    .single();

  if (!booking) notFound();

  // Verify business ownership
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", booking.business_id)
    .eq("owner_id", user.id)
    .single();

  if (!business) notFound();

  const typedBooking = booking as Booking & {
    customer: { display_name: string; phone: string | null } | null;
  };

  const canRefund =
    (typedBooking.status === "confirmed" || typedBooking.status === "completed") &&
    !!typedBooking.stripe_payment_intent_id;

  return (
    <div className="px-4 py-5 space-y-4">
      {/* Back button */}
      <Link
        href="/dashboard/bookings"
        className="inline-flex items-center gap-1.5 text-sm text-txt-secondary hover:text-white transition-colors"
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Bookings
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold">
            {typedBooking.service_name}
          </h1>
          <p className="text-xs text-txt-secondary mt-0.5">
            Booked {new Date(typedBooking.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
        <Badge
          label={typedBooking.status.replace("_", " ")}
          variant={statusColors[typedBooking.status] || "gold"}
          size="md"
        />
      </div>

      {/* Status Actions */}
      <BookingStatusActions
        bookingId={typedBooking.id}
        currentStatus={typedBooking.status}
        hasPayment={!!typedBooking.stripe_payment_intent_id}
      />

      {/* Date & Time */}
      <Card className="glass-card-elevated">
        <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-2">
          Date & Time
        </h3>
        <div className="flex items-center gap-3 text-sm">
          <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gold">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="font-medium">{formatDate(typedBooking.date)}</p>
            <p className="text-txt-secondary text-xs mt-0.5">
              {formatTime(typedBooking.start_time)} - {formatTime(typedBooking.end_time)}
            </p>
          </div>
        </div>
      </Card>

      {/* Customer Info */}
      <Card className="glass-card-elevated">
        <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-2">
          Customer
        </h3>
        <div className="flex items-center gap-3 text-sm">
          <div className="w-9 h-9 rounded-xl bg-cyan/10 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-cyan">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className="font-medium">
              {typedBooking.customer?.display_name || "Unknown Customer"}
            </p>
            {typedBooking.customer?.phone && (
              <p className="text-txt-secondary text-xs mt-0.5">
                {typedBooking.customer.phone}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Provider */}
      {typedBooking.staff_name && (
        <Card className="glass-card-elevated">
          <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-2">
            Provider
          </h3>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0 text-gold font-bold">
              {typedBooking.staff_name.charAt(0)}
            </div>
            <p className="font-medium">{typedBooking.staff_name}</p>
          </div>
        </Card>
      )}

      {/* Notes */}
      {typedBooking.notes && (
        <Card className="glass-card-elevated">
          <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-2">
            Notes
          </h3>
          <p className="text-sm text-txt-secondary italic">{typedBooking.notes}</p>
        </Card>
      )}

      {/* Price & Payment */}
      <Card className="glass-card-elevated">
        <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-3">
          Payment
        </h3>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-txt-secondary">Price</span>
            <span className="font-semibold text-gold">
              {typedBooking.price !== null ? formatCents(typedBooking.price) : "Free"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-txt-secondary">Method</span>
            <span>{typedBooking.stripe_payment_intent_id ? "Stripe" : "N/A"}</span>
          </div>
          {typedBooking.stripe_payment_intent_id && (
            <div className="flex justify-between">
              <span className="text-txt-secondary">Payment ID</span>
              <span className="text-xs text-txt-secondary font-mono">
                {typedBooking.stripe_payment_intent_id.slice(0, 8)}...{typedBooking.stripe_payment_intent_id.slice(-4)}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Refund */}
      {canRefund && (
        <BookingRefundButton
          bookingId={typedBooking.id}
          price={typedBooking.price ?? 0}
          paymentIntentId={typedBooking.stripe_payment_intent_id}
        />
      )}
    </div>
  );
}
