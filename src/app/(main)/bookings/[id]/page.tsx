import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/server";

type BookingRow = {
  id: string;
  business_id: string;
  customer_id: string;
  service_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  price: number | null;
  stripe_payment_intent_id: string | null;
  notes: string | null;
  staff_id: string | null;
  staff_name: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  created_at: string;
  business?: {
    id: string;
    name: string;
    slug: string | null;
    address: string | null;
    phone: string | null;
    image_urls: string[] | null;
    category: string | null;
  } | null;
  staff?: {
    id: string;
    name: string;
    photo_url: string | null;
    avatar_url: string | null;
    role: string | null;
  } | null;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "PENDING",
  confirmed: "CONFIRMED",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
  no_show: "NO SHOW",
};

const STATUS_TONE: Record<string, { bg: string; fg: string; dot: string }> = {
  confirmed: { bg: "var(--gold-c)", fg: "var(--ink-strong)", dot: "var(--ink-strong)" },
  completed: { bg: "var(--ink-strong)", fg: "var(--paper)", dot: "var(--gold-c)" },
  pending: { bg: "var(--paper-soft, #DCD3BF)", fg: "var(--ink-strong)", dot: "var(--gold-c)" },
  cancelled: { bg: "var(--paper)", fg: "var(--ink-mute)", dot: "var(--ink-mute)" },
  no_show: { bg: "var(--paper)", fg: "var(--ink-mute)", dot: "var(--ink-mute)" },
};

function formatTime(time: string): string {
  // "14:00:00" → "2:00 PM"
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${m} ${ampm}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

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
  if (!user) redirect(`/login?next=/bookings/${id}`);

  const { data: bookingRaw } = await supabase
    .from("bookings")
    .select(
      `*,
       business:businesses(id, name, slug, address, phone, image_urls, category),
       staff:business_staff(id, name, photo_url, avatar_url, role)`
    )
    .eq("id", id)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (!bookingRaw) notFound();
  const booking = bookingRaw as BookingRow;

  // Look up the matching service so we can show the deposit/remaining split.
  // We fall back to "full price" when the service was renamed or removed.
  const { data: serviceMatch } = await supabase
    .from("services")
    .select("id, name, price, duration, deposit_amount")
    .eq("business_id", booking.business_id)
    .eq("name", booking.service_name)
    .maybeSingle();

  const totalCents = booking.price ?? serviceMatch?.price ?? 0;
  const depositConfigured = serviceMatch?.deposit_amount ?? 0;
  // Stripe charge captured at booking time = deposit if configured, else full price.
  const depositPaidCents = booking.stripe_payment_intent_id
    ? depositConfigured > 0
      ? depositConfigured
      : totalCents
    : 0;
  const remainingCents = Math.max(0, totalCents - depositPaidCents);

  const status = booking.status;
  const tone = STATUS_TONE[status] ?? STATUS_TONE.pending;
  const cancellable = status === "pending" || status === "confirmed";
  const business = booking.business;
  const staff = booking.staff;
  const staffName = staff?.name ?? booking.staff_name ?? null;

  const isPast = new Date(booking.date + "T" + booking.start_time) < new Date();

  return (
    <div className="culture-surface min-h-dvh animate-fade-in pb-24">
      {/* Header */}
      <div
        className="px-[18px] pt-4 pb-4"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <Link
          href="/bookings"
          className="press inline-flex items-center gap-1 mb-3"
          style={{
            fontFamily: "var(--font-archivo), Archivo, sans-serif",
            fontWeight: 800,
            fontSize: 11,
            letterSpacing: "0.16em",
            color: "var(--ink-strong)",
            textTransform: "uppercase",
          }}
        >
          ← My Bookings
        </Link>
        <div className="c-kicker" style={{ opacity: 0.65 }}>
          § COMMERCE · APPOINTMENT
        </div>
        <h1
          className="c-hero mt-2"
          style={{ fontSize: 44, lineHeight: 0.92, letterSpacing: "-0.02em" }}
        >
          {booking.service_name}
        </h1>
        {business?.name && (
          <p
            className="c-serif-it mt-2"
            style={{ fontSize: 14, color: "var(--ink-strong)", opacity: 0.85 }}
          >
            with {business.name}
          </p>
        )}
      </div>

      {/* Status pill */}
      <div className="px-[18px] pt-5">
        <div
          className="inline-flex items-center gap-2"
          style={{
            background: tone.bg,
            color: tone.fg,
            border: "2px solid var(--rule-strong-c)",
            padding: "6px 12px",
            fontFamily: "var(--font-archivo), Archivo, sans-serif",
            fontWeight: 800,
            fontSize: 11,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          <span
            aria-hidden
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: tone.dot,
              display: "inline-block",
            }}
          />
          {STATUS_LABEL[status] ?? status}
          {isPast && status === "confirmed" ? " · UPCOMING" : ""}
        </div>
        {status === "cancelled" && booking.cancellation_reason && (
          <p
            className="c-serif-it mt-2"
            style={{ fontSize: 13, color: "var(--ink-mute)" }}
          >
            Reason: {booking.cancellation_reason}
          </p>
        )}
      </div>

      {/* WHEN */}
      <section className="px-[18px] pt-6">
        <div className="c-kicker mb-2">§ WHEN</div>
        <div className="c-rule mb-3" />
        <div
          className="c-frame"
          style={{ padding: 16, background: "var(--paper)" }}
        >
          <div
            className="c-card-t"
            style={{ fontSize: 18, color: "var(--ink-strong)" }}
          >
            {formatDate(booking.date)}
          </div>
          <div
            className="c-meta mt-1"
            style={{ fontSize: 13, color: "var(--ink-strong)", opacity: 0.85 }}
          >
            {formatTime(booking.start_time)} — {formatTime(booking.end_time)}
          </div>
        </div>
      </section>

      {/* WHO */}
      {staffName && (
        <section className="px-[18px] pt-6">
          <div className="c-kicker mb-2">§ WITH</div>
          <div className="c-rule mb-3" />
          <div
            className="c-frame"
            style={{ padding: 14, background: "var(--paper)", display: "flex", alignItems: "center", gap: 12 }}
          >
            <div
              className="c-frame"
              style={{
                width: 44,
                height: 44,
                background: "var(--ink-strong)",
                color: "var(--gold-c)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-anton), Anton, sans-serif",
                fontSize: 18,
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              {staff?.photo_url || staff?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={staff.photo_url ?? staff.avatar_url ?? ""}
                  alt={staffName}
                  className="w-full h-full object-cover"
                />
              ) : (
                staffName
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="c-card-t" style={{ fontSize: 16 }}>
                {staffName}
              </p>
              {staff?.role && (
                <p className="c-meta" style={{ fontSize: 11, marginTop: 2, textTransform: "uppercase" }}>
                  {staff.role}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* WHERE */}
      {business && (
        <section className="px-[18px] pt-6">
          <div className="c-kicker mb-2">§ WHERE</div>
          <div className="c-rule mb-3" />
          <div className="c-frame" style={{ padding: 16, background: "var(--paper)" }}>
            <Link
              href={`/business/${business.slug ?? business.id}`}
              className="press"
              style={{
                display: "block",
                fontFamily: "var(--font-anton), Anton, sans-serif",
                fontSize: 22,
                color: "var(--ink-strong)",
                lineHeight: 1.0,
              }}
            >
              {business.name}
            </Link>
            {business.address && (
              <p
                className="c-meta mt-2"
                style={{ fontSize: 13, color: "var(--ink-strong)", opacity: 0.85 }}
              >
                {business.address}
              </p>
            )}
            <div className="flex items-center gap-3 mt-3">
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="press inline-flex items-center gap-1.5"
                  style={{
                    fontFamily: "var(--font-archivo), Archivo, sans-serif",
                    fontWeight: 800,
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    color: "var(--gold-c)",
                    textTransform: "uppercase",
                  }}
                >
                  <Icon name="phone" size={13} />
                  {business.phone}
                </a>
              )}
              {business.address && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(business.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press inline-flex items-center gap-1.5"
                  style={{
                    fontFamily: "var(--font-archivo), Archivo, sans-serif",
                    fontWeight: 800,
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    color: "var(--gold-c)",
                    textTransform: "uppercase",
                  }}
                >
                  <Icon name="pin" size={13} />
                  Directions
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* PAYMENT */}
      <section className="px-[18px] pt-6">
        <div className="c-kicker mb-2">§ PAYMENT</div>
        <div className="c-rule mb-3" />
        <div
          className="c-frame"
          style={{ padding: 0, background: "var(--paper)", overflow: "hidden" }}
        >
          <PayRow label="Service total" value={dollars(totalCents)} />
          <PayRow
            label={booking.stripe_payment_intent_id ? "Deposit paid" : "Deposit due"}
            value={
              booking.stripe_payment_intent_id
                ? `− ${dollars(depositPaidCents)}`
                : depositConfigured > 0
                  ? dollars(depositConfigured)
                  : dollars(totalCents)
            }
            tone={booking.stripe_payment_intent_id ? "credit" : "due"}
          />
          <div
            style={{
              borderTop: "2px solid var(--rule-strong-c)",
              padding: "16px",
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              background: "var(--ink-strong)",
              color: "var(--paper)",
            }}
          >
            <div>
              <p
                className="c-kicker"
                style={{ fontSize: 10, color: "var(--gold-c)", letterSpacing: "0.18em" }}
              >
                {remainingCents > 0 ? "DUE AT APPOINTMENT" : "PAID IN FULL"}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-anton), Anton, sans-serif",
                  fontSize: 32,
                  marginTop: 4,
                  lineHeight: 1,
                }}
              >
                {dollars(remainingCents)}
              </p>
            </div>
            <p
              className="c-serif-it"
              style={{ fontSize: 12, color: "rgba(243,238,220,0.7)", maxWidth: 140, textAlign: "right" }}
            >
              {remainingCents > 0
                ? "Bring a card or cash to settle this balance at your appointment."
                : "No further payment needed."}
            </p>
          </div>
        </div>
      </section>

      {/* NOTES */}
      {booking.notes && (
        <section className="px-[18px] pt-6">
          <div className="c-kicker mb-2">§ NOTES</div>
          <div className="c-rule mb-3" />
          <p
            className="c-serif-it"
            style={{
              fontSize: 14,
              color: "var(--ink-strong)",
              padding: 16,
              border: "2px solid var(--rule-strong-c)",
              background: "var(--paper)",
            }}
          >
            {booking.notes}
          </p>
        </section>
      )}

      {/* Booking reference */}
      <section className="px-[18px] pt-6">
        <div className="c-kicker" style={{ opacity: 0.6 }}>
          § BOOKING #{booking.id.slice(0, 8).toUpperCase()}
        </div>
        <p
          className="c-meta mt-1"
          style={{ fontSize: 11, color: "var(--ink-mute)" }}
        >
          BOOKED {new Date(booking.created_at)
            .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            .toUpperCase()}
        </p>
      </section>

      {/* Cancel CTA */}
      {cancellable && (
        <section className="px-[18px] pt-6">
          <Link
            href={`/bookings/${booking.id}/cancel`}
            className="press inline-flex items-center justify-center w-full"
            style={{
              padding: "12px 16px",
              border: "2px solid var(--rule-strong-c)",
              background: "var(--paper)",
              color: "var(--ink-strong)",
              fontFamily: "var(--font-archivo), Archivo, sans-serif",
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Cancel Appointment
          </Link>
        </section>
      )}
    </div>
  );
}

function PayRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "credit" | "due";
}) {
  return (
    <div
      style={{
        padding: "14px 16px",
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--rule-c)",
      }}
    >
      <span
        className="c-kicker"
        style={{ fontSize: 11, color: "var(--ink-strong)", opacity: 0.85 }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-archivo), Archivo, sans-serif",
          fontWeight: 800,
          fontSize: 16,
          fontVariantNumeric: "tabular-nums",
          color:
            tone === "credit"
              ? "var(--gold-c)"
              : "var(--ink-strong)",
        }}
      >
        {value}
      </span>
    </div>
  );
}
