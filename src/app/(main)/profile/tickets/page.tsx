import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import { formatCents } from "@/lib/stripe";
import type { TicketOrder, Event, TicketOrderItem } from "@/types/database";

const categoryGradients: Record<string, string> = {
  city: "from-gold/20 to-deep",
  sports: "from-emerald/20 to-deep",
  culture: "from-coral/20 to-deep",
  community: "from-cyan/20 to-deep",
  school: "from-royal/20 to-deep",
  youth: "from-hc-purple/20 to-deep",
};

const categoryEmojis: Record<string, string> = {
  city: "landmark",
  sports: "trophy",
  culture: "theater",
  community: "handshake",
  school: "book",
  youth: "star",
};

type OrderWithEvent = TicketOrder & {
  event: (Pick<Event, "id" | "title" | "start_date" | "start_time" | "location_name" | "address" | "image_url" | "category"> ) | null;
  items: (TicketOrderItem & { section_name: string; quantity: number })[];
  ticket_count: number;
};

function statusVariant(status: TicketOrder["status"]) {
  switch (status) {
    case "confirmed": return "emerald" as const;
    case "pending": return "gold" as const;
    case "cancelled": return "coral" as const;
    case "refunded": return "cyan" as const;
    default: return "gold" as const;
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

export default async function MyTicketsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/profile/tickets");
  }

  const { data: ordersRaw } = await supabase
    .from("ticket_orders")
    .select(
      `
      *,
      event:events(id, title, start_date, start_time, location_name, address, image_url, category),
      items:ticket_order_items(id, quantity, section_name)
    `
    )
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  const today = new Date().toISOString().split("T")[0];

  const orders: OrderWithEvent[] = (ordersRaw ?? []).map((o: Record<string, unknown>) => ({
    ...o,
    ticket_count: ((o.items as { quantity: number }[]) ?? []).reduce(
      (sum: number, item: { quantity: number }) => sum + (item.quantity ?? 0),
      0
    ),
  })) as OrderWithEvent[];

  // Sort by event start_date (upcoming first)
  orders.sort((a, b) => {
    const dateA = a.event?.start_date ?? "9999-12-31";
    const dateB = b.event?.start_date ?? "9999-12-31";
    return dateA.localeCompare(dateB);
  });

  const upcoming = orders.filter(
    (o) => o.event && o.event.start_date >= today
  );
  const past = orders
    .filter((o) => !o.event || o.event.start_date < today)
    .sort((a, b) => {
      const dateA = a.event?.start_date ?? "0000-01-01";
      const dateB = b.event?.start_date ?? "0000-01-01";
      return dateB.localeCompare(dateA);
    });

  return (
    <div className="culture-surface min-h-dvh animate-fade-in pb-24">
      {/* Header */}
      <div className="px-5 pt-6 pb-4" style={{ borderBottom: "3px solid var(--rule-strong-c)" }}>
        <Link href="/profile" className="press inline-flex items-center gap-1.5 mb-3" style={{ color: "var(--ink-strong)" }}>
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span className="text-sm font-semibold">Profile</span>
        </Link>
        <p className="c-kicker">§ PROFILE · TICKETS</p>
        <h1 className="c-hero">My Tickets.</h1>
        <p className="c-serif-it">
          {orders.length} order{orders.length !== 1 ? "s" : ""}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="px-5 pt-16 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gold/10 flex items-center justify-center mb-4 c-frame">
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gold">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
            </svg>
          </div>
          <p className="font-heading font-bold text-lg mb-1">No tickets yet</p>
          <p className="text-sm text-txt-secondary mb-6">
            Browse upcoming events and grab your tickets
          </p>
          <Link
            href="/events"
            className="c-btn c-btn-accent c-btn-sm"
          >
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="px-5 pt-5 space-y-6">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-emerald uppercase tracking-wider">Upcoming</span>
                <span className="text-[10px] text-txt-secondary bg-emerald/10 px-2 py-0.5 rounded-full font-medium">
                  {upcoming.length}
                </span>
              </div>
              <div className="space-y-3">
                {upcoming.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </section>
          )}

          {/* Past */}
          {past.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="c-kicker" style={{ color: "var(--ink-strong)", opacity: 0.6 }}>Past</span>
                <span className="c-meta px-2 py-0.5 rounded-full" style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}>
                  {past.length}
                </span>
              </div>
              <div className="space-y-3 opacity-75">
                {past.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: OrderWithEvent }) {
  const event = order.event;
  const category = event?.category ?? "community";
  const sectionSummary = buildSectionSummary(order.items);

  return (
    <Link href={`/tickets/${order.id}`}>
      <Card hover className="relative overflow-hidden p-0">
        {/* Event image or gradient placeholder */}
        <div className="h-24 relative overflow-hidden">
          {event?.image_url ? (
            <Image
              src={event.image_url}
              alt={event.title ?? ""}
              fill
              className="object-cover"
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${
                categoryGradients[category] || "from-deep to-midnight"
              } flex items-center justify-center`}
            >
              <span className="text-3xl">{categoryEmojis[category] || "calendar"}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          {/* Status badge overlaid */}
          <div className="absolute top-2.5 right-2.5">
            <Badge
              label={order.status}
              variant={statusVariant(order.status)}
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-4 -mt-2 relative z-[1]">
          {/* Event title */}
          <p className="font-semibold text-sm leading-tight truncate mb-0.5">
            {event?.title ?? "Unknown Event"}
          </p>

          {/* Date */}
          {event?.start_date && (
            <p className="text-xs text-txt-secondary">
              {formatDate(event.start_date)}
              {event.start_time ? ` at ${event.start_time.slice(0, 5)}` : ""}
            </p>
          )}

          {/* Location */}
          {(event?.location_name || event?.address) && (
            <p className="text-[11px] text-txt-secondary mt-1 flex items-center gap-1">
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5.5 10s-4-4-4-6a4 4 0 018 0c0 2-4 6-4 6z" />
              </svg>
              {event?.location_name || event?.address}
            </p>
          )}

          {/* Section summary + price */}
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border-subtle">
            <span className="text-[11px] text-txt-secondary truncate mr-2">
              {sectionSummary || `${order.ticket_count} ticket${order.ticket_count !== 1 ? "s" : ""}`}
            </span>
            <span className="text-sm font-bold text-gold shrink-0">
              {formatCents(order.total)}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
