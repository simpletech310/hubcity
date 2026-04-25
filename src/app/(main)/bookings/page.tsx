import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Booking, Business } from "@/types/database";

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
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${m} ${ampm}`;
}

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function MyBookingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/bookings");

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "*, business:businesses(id, name, slug, category, address)"
    )
    .eq("customer_id", user.id)
    .order("date", { ascending: false })
    .order("start_time", { ascending: false });

  const all = (bookings ?? []) as (Booking & { business: Business })[];
  const todayIso = new Date().toISOString().split("T")[0];
  const upcoming = all.filter(
    (b) => b.date >= todayIso && (b.status === "confirmed" || b.status === "pending"),
  );
  const past = all.filter(
    (b) => !(b.date >= todayIso && (b.status === "confirmed" || b.status === "pending")),
  );

  return (
    <div className="culture-surface min-h-dvh animate-fade-in pb-24">
      {/* Masthead */}
      <header
        className="px-[18px] pt-5 pb-5"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <Link
          href="/profile"
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
          ← Profile
        </Link>
        <div className="c-kicker" style={{ opacity: 0.65 }}>
          § COMMERCE · APPOINTMENTS
        </div>
        <h1 className="c-hero mt-2" style={{ fontSize: 56, lineHeight: 0.88, letterSpacing: "-0.02em" }}>
          Bookings.
        </h1>
        <p className="c-serif-it mt-2" style={{ fontSize: 13 }}>
          Your appointments and reservations across the Hub City.
        </p>
      </header>

      {all.length === 0 ? (
        <div className="px-[18px] pt-12 text-center">
          <div className="c-kicker" style={{ opacity: 0.65 }}>
            § NO BOOKINGS YET
          </div>
          <p
            className="c-serif-it mt-3"
            style={{ fontSize: 14, color: "var(--ink-strong)", opacity: 0.85 }}
          >
            Tap a business to schedule a service. Lace installs, fades, lashes
            — the block delivers.
          </p>
          <Link
            href="/business"
            className="press inline-flex items-center justify-center mt-6"
            style={{
              padding: "12px 18px",
              background: "var(--gold-c)",
              border: "2px solid var(--ink-strong)",
              color: "var(--ink-strong)",
              fontFamily: "var(--font-archivo), Archivo, sans-serif",
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Browse Businesses
          </Link>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <BookingSection title="Upcoming" count={upcoming.length} bookings={upcoming} />
          )}
          {past.length > 0 && (
            <BookingSection title="History" count={past.length} bookings={past} />
          )}
        </>
      )}
    </div>
  );
}

function BookingSection({
  title,
  count,
  bookings,
}: {
  title: string;
  count: number;
  bookings: (Booking & { business: Business })[];
}) {
  return (
    <section className="px-[18px] pt-6">
      <div className="flex items-baseline justify-between mb-3">
        <div className="c-kicker">§ {title.toUpperCase()}</div>
        <span
          className="c-meta"
          style={{
            fontFamily: "var(--font-archivo), Archivo, sans-serif",
            fontWeight: 800,
            fontSize: 11,
            letterSpacing: "0.14em",
            color: "var(--ink-strong)",
            opacity: 0.6,
          }}
        >
          {count.toString().padStart(2, "0")}
        </span>
      </div>
      <div className="c-rule mb-3" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {bookings.map((b) => (
          <BookingCard key={b.id} booking={b} />
        ))}
      </div>
    </section>
  );
}

function BookingCard({ booking }: { booking: Booking & { business: Business } }) {
  const tone = STATUS_TONE[booking.status] ?? STATUS_TONE.pending;
  const dateObj = new Date(booking.date + "T00:00:00");
  const monthShort = dateObj
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();
  const day = dateObj.getDate();
  const weekday = dateObj
    .toLocaleDateString("en-US", { weekday: "short" })
    .toUpperCase();

  return (
    <Link
      href={`/bookings/${booking.id}`}
      className="press"
      style={{
        display: "block",
        background: "var(--paper)",
        border: "2px solid var(--rule-strong-c)",
        textDecoration: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "stretch" }}>
        {/* Date strap */}
        <div
          style={{
            width: 76,
            flexShrink: 0,
            background: "var(--ink-strong)",
            color: "var(--paper)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px 6px",
            borderRight: "2px solid var(--rule-strong-c)",
          }}
        >
          <span
            className="c-kicker"
            style={{ fontSize: 9, color: "var(--gold-c)", letterSpacing: "0.18em" }}
          >
            {monthShort}
          </span>
          <span
            style={{
              fontFamily: "var(--font-anton), Anton, sans-serif",
              fontSize: 32,
              lineHeight: 1,
              marginTop: 2,
            }}
          >
            {day}
          </span>
          <span
            className="c-kicker"
            style={{ fontSize: 9, marginTop: 4, color: "rgba(243,238,220,0.7)", letterSpacing: "0.18em" }}
          >
            {weekday}
          </span>
        </div>

        {/* Body */}
        <div style={{ flex: 1, minWidth: 0, padding: "12px 14px" }}>
          <div
            className="c-card-t"
            style={{
              fontSize: 15,
              lineHeight: 1.2,
              color: "var(--ink-strong)",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {booking.service_name}
          </div>
          <div
            className="c-meta mt-1"
            style={{ fontSize: 12, color: "var(--ink-strong)", opacity: 0.75 }}
          >
            {booking.business?.name ?? "—"}
          </div>
          <div
            className="c-meta mt-2"
            style={{
              fontSize: 11,
              color: "var(--ink-strong)",
              opacity: 0.85,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatTime(booking.start_time)}
            {booking.staff_name ? ` · with ${booking.staff_name}` : ""}
          </div>
        </div>

        {/* Status + price column */}
        <div
          style={{
            flexShrink: 0,
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 6,
            borderLeft: "1px solid var(--rule-c)",
          }}
        >
          <span
            className="inline-flex items-center gap-1"
            style={{
              background: tone.bg,
              color: tone.fg,
              border: "1.5px solid var(--rule-strong-c)",
              padding: "3px 7px",
              fontFamily: "var(--font-archivo), Archivo, sans-serif",
              fontWeight: 800,
              fontSize: 9,
              letterSpacing: "0.16em",
              whiteSpace: "nowrap",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: tone.dot,
                display: "inline-block",
              }}
            />
            {STATUS_LABEL[booking.status] ?? booking.status}
          </span>
          {booking.price != null && (
            <span
              style={{
                fontFamily: "var(--font-anton), Anton, sans-serif",
                fontSize: 18,
                color: "var(--gold-c)",
                lineHeight: 1,
              }}
            >
              {dollars(booking.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
