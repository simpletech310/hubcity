import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import Badge from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import { formatCents } from "@/lib/stripe";
import type { TicketOrder, Event, TicketOrderItem } from "@/types/database";
import Icon from "@/components/ui/Icon";

const categoryAccents: Record<string, string> = {
  city:      "var(--gold-c)",
  sports:    "#22C55E",
  culture:   "#EF4444",
  community: "#06B6D4",
  school:    "#3B82F6",
  youth:     "#8B5CF6",
};

type OrderWithEvent = TicketOrder & {
  event: (Pick<Event, "id" | "title" | "start_date" | "start_time" | "location_name" | "address" | "image_url" | "category">) | null;
  items: (TicketOrderItem & { section_name: string; quantity: number })[];
  ticket_count: number;
};

function statusVariant(status: TicketOrder["status"]) {
  switch (status) {
    case "confirmed": return "emerald" as const;
    case "pending":   return "gold" as const;
    case "cancelled": return "coral" as const;
    case "refunded":  return "cyan" as const;
    default:          return "gold" as const;
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildSectionSummary(items: OrderWithEvent["items"]): string {
  if (!items || items.length === 0) return "";
  return items
    .map((item) => `${item.quantity}\u00D7 ${item.section_name}`)
    .join(", ");
}

export default async function MyTicketsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/profile/tickets");
  }

  const { data: ordersRaw } = await supabase
    .from("ticket_orders")
    .select(`
      *,
      event:events(id, title, start_date, start_time, location_name, address, image_url, category),
      items:ticket_order_items(id, quantity, section_name)
    `)
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  const today = new Date().toISOString().split("T")[0];

  const allOrders: OrderWithEvent[] = (ordersRaw ?? []).map((o: Record<string, unknown>) => ({
    ...o,
    ticket_count: ((o.items as { quantity: number }[]) ?? []).reduce(
      (sum: number, item: { quantity: number }) => sum + (item.quantity ?? 0),
      0
    ),
  })) as OrderWithEvent[];

  const upcoming = allOrders
    .filter((o) => o.event && o.event.start_date >= today)
    .sort((a, b) => (a.event?.start_date ?? "9999").localeCompare(b.event?.start_date ?? "9999"));

  const past = allOrders
    .filter((o) => !o.event || o.event.start_date < today)
    .sort((a, b) => (b.event?.start_date ?? "0000").localeCompare(a.event?.start_date ?? "0000"));

  const sp = await searchParams;
  const activeTab = sp?.tab === "past" ? "past" : "upcoming";
  const shown = activeTab === "past" ? past : upcoming;

  const tabs = [
    { id: "upcoming", label: "UPCOMING", count: upcoming.length },
    { id: "past",     label: "PAST",     count: past.length },
  ] as const;

  return (
    <div className="culture-surface min-h-dvh animate-fade-in pb-24">
      {/* ── Masthead ── */}
      <div className="px-5 pt-6 pb-4" style={{ borderBottom: "3px solid var(--rule-strong-c)" }}>
        <Link
          href="/profile"
          className="press inline-flex items-center gap-1.5 mb-3"
          style={{ color: "var(--ink-strong)", opacity: 0.7 }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M11 14L5 8l6-6" />
          </svg>
          <span
            style={{
              fontFamily: "var(--font-archivo), Archivo, sans-serif",
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Profile
          </span>
        </Link>
        <p className="c-kicker">§ PROFILE · TICKETS</p>
        <h1 className="c-hero" style={{ fontSize: 56, lineHeight: 0.9 }}>MY TICKETS.</h1>
        <p className="c-serif-it mt-2">
          {allOrders.length} order{allOrders.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* ── Tab strip ── */}
      <div style={{ display: "flex", borderBottom: "2px solid var(--rule-strong-c)" }}>
        {tabs.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <Link
              key={tab.id}
              href={`/profile/tickets?tab=${tab.id}`}
              style={{
                flex: 1,
                padding: "13px 0",
                textAlign: "center",
                fontFamily: "var(--font-archivo), Archivo, sans-serif",
                fontWeight: 800,
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase" as const,
                background: active ? "var(--ink-strong)" : "transparent",
                color: active ? "var(--paper)" : "var(--ink-strong)",
                borderRight: "2px solid var(--rule-strong-c)",
                textDecoration: "none",
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  style={{
                    marginLeft: 6,
                    display: "inline-block",
                    minWidth: 18,
                    height: 18,
                    lineHeight: "18px",
                    fontSize: 9,
                    fontWeight: 800,
                    textAlign: "center",
                    background: active ? "var(--gold-c)" : "var(--rule-strong-c)",
                    color: active ? "var(--ink-strong)" : "var(--paper)",
                    padding: "0 4px",
                  }}
                >
                  {tab.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* ── Content ── */}
      {allOrders.length === 0 ? (
        <div className="px-5 pt-16 flex flex-col items-center text-center">
          <div
            className="w-16 h-16 flex items-center justify-center mb-4"
            style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
          >
            <Icon name="ticket" size={28} style={{ color: "var(--gold-c)" }} />
          </div>
          <h2 className="c-card-t mb-1" style={{ fontSize: 18 }}>NO TICKETS YET</h2>
          <p className="c-body-sm mb-6" style={{ opacity: 0.6 }}>
            Browse upcoming events and grab your tickets
          </p>
          <Link href="/events" className="c-btn c-btn-accent c-btn-sm">
            BROWSE EVENTS
          </Link>
        </div>
      ) : shown.length === 0 ? (
        <div className="px-5 pt-12 flex flex-col items-center text-center">
          <p className="c-body-sm" style={{ opacity: 0.55 }}>
            {activeTab === "past" ? "No past events" : "No upcoming events"}
          </p>
          <Link
            href={`/profile/tickets?tab=${activeTab === "past" ? "upcoming" : "past"}`}
            className="c-kicker mt-3 press"
            style={{ color: "var(--gold-c)", fontSize: 11 }}
          >
            {activeTab === "past" ? "VIEW UPCOMING →" : "VIEW PAST →"}
          </Link>
        </div>
      ) : (
        <div className="px-5 pt-5 space-y-3 pb-6">
          {shown.map((order) => (
            <OrderCard key={order.id} order={order} dimmed={activeTab === "past"} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, dimmed }: { order: OrderWithEvent; dimmed?: boolean }) {
  const event = order.event;
  const category = event?.category ?? "community";
  const sectionSummary = buildSectionSummary(order.items);
  const accent = categoryAccents[category] ?? "var(--gold-c)";

  return (
    <Link href={`/tickets/${order.id}`} style={{ display: "block", opacity: dimmed ? 0.75 : 1 }}>
      <div
        className="relative overflow-hidden press"
        style={{
          background: "var(--paper)",
          border: "2px solid var(--rule-strong-c)",
        }}
      >
        {/* Accent top rule */}
        <div style={{ height: 4, background: accent }} />

        {/* Event image */}
        <div className="h-28 relative overflow-hidden">
          {event?.image_url ? (
            <Image
              src={event.image_url}
              alt={event.title ?? ""}
              fill
              className="object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: "var(--ink-strong)" }}
            >
              <Icon name="ticket" size={32} style={{ color: "var(--gold-c)", opacity: 0.5 }} />
            </div>
          )}
          {/* Gradient overlay on image */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)" }} />

          {/* Status badge */}
          <div className="absolute top-2.5 right-2.5">
            <Badge label={order.status} variant={statusVariant(order.status)} />
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          <h3 className="c-card-t mb-0.5" style={{ fontSize: 14 }}>
            {event?.title ?? "Unknown Event"}
          </h3>

          {event?.start_date && (
            <p className="c-meta" style={{ fontSize: 11, color: "var(--ink-strong)", opacity: 0.6 }}>
              {formatDate(event.start_date)}
              {event.start_time ? ` at ${event.start_time.slice(0, 5)}` : ""}
            </p>
          )}

          {(event?.location_name || event?.address) && (
            <p
              className="c-meta flex items-center gap-1 mt-0.5"
              style={{ fontSize: 11, color: "var(--ink-strong)", opacity: 0.55 }}
            >
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5.5 10s-4-4-4-6a4 4 0 018 0c0 2-4 6-4 6z" />
              </svg>
              {event?.location_name || event?.address}
            </p>
          )}

          <div
            className="flex items-center justify-between mt-3 pt-3"
            style={{ borderTop: "2px solid var(--rule-strong-c)" }}
          >
            <span className="c-meta truncate mr-2" style={{ fontSize: 11, color: "var(--ink-strong)", opacity: 0.55 }}>
              {sectionSummary || `${order.ticket_count} ticket${order.ticket_count !== 1 ? "s" : ""}`}
            </span>
            <span className="c-tabnum shrink-0" style={{ color: "var(--gold-c)", fontSize: 14 }}>
              {formatCents(order.total)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
