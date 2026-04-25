import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Order, Business } from "@/types/database";

const STATUS_LABEL: Record<string, string> = {
  pending: "PENDING",
  confirmed: "CONFIRMED",
  preparing: "PREPARING",
  ready: "READY",
  picked_up: "PICKED UP",
  delivered: "DELIVERED",
  cancelled: "CANCELLED",
};

const STATUS_TONE: Record<string, { bg: string; fg: string; dot: string }> = {
  pending: { bg: "var(--paper-soft, #DCD3BF)", fg: "var(--ink-strong)", dot: "var(--gold-c)" },
  confirmed: { bg: "var(--gold-c)", fg: "var(--ink-strong)", dot: "var(--ink-strong)" },
  preparing: { bg: "var(--gold-c)", fg: "var(--ink-strong)", dot: "var(--ink-strong)" },
  ready: { bg: "var(--ink-strong)", fg: "var(--paper)", dot: "var(--gold-c)" },
  picked_up: { bg: "var(--ink-strong)", fg: "var(--paper)", dot: "var(--gold-c)" },
  delivered: { bg: "var(--ink-strong)", fg: "var(--paper)", dot: "var(--gold-c)" },
  cancelled: { bg: "var(--paper)", fg: "var(--ink-mute)", dot: "var(--ink-mute)" },
};

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function MyOrdersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/orders");

  const { data: orders } = await supabase
    .from("orders")
    .select("*, business:businesses(id, name, slug, category)")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  const orderList = (orders ?? []) as (Order & { business: Business })[];

  const openStatuses = new Set([
    "pending",
    "confirmed",
    "preparing",
    "ready",
  ]);
  const open = orderList.filter((o) => openStatuses.has(o.status));
  const past = orderList.filter((o) => !openStatuses.has(o.status));

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
          § COMMERCE · ORDERS
        </div>
        <h1
          className="c-hero mt-2"
          style={{ fontSize: 56, lineHeight: 0.88, letterSpacing: "-0.02em" }}
        >
          Orders.
        </h1>
        <p className="c-serif-it mt-2" style={{ fontSize: 13 }}>
          Receipts and pickup tickets from local businesses.
        </p>
      </header>

      {orderList.length === 0 ? (
        <div className="px-[18px] pt-12 text-center">
          <div className="c-kicker" style={{ opacity: 0.65 }}>
            § NO ORDERS YET
          </div>
          <p
            className="c-serif-it mt-3"
            style={{ fontSize: 14, color: "var(--ink-strong)", opacity: 0.85 }}
          >
            Tap a business to shop the block. Hats, lemonade, hair products —
            everything stays with the people who built it.
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
          {open.length > 0 && (
            <OrderSection title="Open" count={open.length} orders={open} />
          )}
          {past.length > 0 && (
            <OrderSection title="History" count={past.length} orders={past} />
          )}
        </>
      )}
    </div>
  );
}

function OrderSection({
  title,
  count,
  orders,
}: {
  title: string;
  count: number;
  orders: (Order & { business: Business })[];
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
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
      </div>
    </section>
  );
}

function OrderCard({ order }: { order: Order & { business: Business } }) {
  const tone = STATUS_TONE[order.status] ?? STATUS_TONE.pending;
  const placed = new Date(order.created_at);
  const monthShort = placed
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();
  const day = placed.getDate();
  const time = placed.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Link
      href={`/orders/${order.id}`}
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
            style={{
              fontSize: 9,
              marginTop: 4,
              color: "rgba(243,238,220,0.7)",
              letterSpacing: "0.18em",
            }}
          >
            {time}
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
            {order.business?.name ?? "Order"}
          </div>
          <div
            className="c-meta mt-1"
            style={{
              fontSize: 11,
              color: "var(--ink-strong)",
              opacity: 0.65,
              fontFamily: "var(--font-dm-mono), monospace",
              letterSpacing: "0.08em",
            }}
          >
            #{order.order_number}
          </div>
          <div
            className="c-meta mt-1"
            style={{
              fontSize: 11,
              color: "var(--ink-strong)",
              opacity: 0.85,
              textTransform: "uppercase",
            }}
          >
            {order.type === "delivery" ? "Delivery" : "Pickup"}
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
            {STATUS_LABEL[order.status] ?? order.status.toUpperCase()}
          </span>
          <span
            style={{
              fontFamily: "var(--font-anton), Anton, sans-serif",
              fontSize: 18,
              color: "var(--gold-c)",
              lineHeight: 1,
            }}
          >
            {dollars(order.total)}
          </span>
        </div>
      </div>
    </Link>
  );
}
