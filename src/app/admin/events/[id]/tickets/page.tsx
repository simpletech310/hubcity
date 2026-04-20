import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import { formatCents } from "@/lib/stripe";
import type { Event } from "@/types/database";

function statusVariant(status: string) {
  switch (status) {
    case "confirmed": return "emerald" as const;
    case "pending": return "gold" as const;
    case "cancelled": return "coral" as const;
    case "refunded": return "cyan" as const;
    default: return "gold" as const;
  }
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function EventTicketSalesDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Auth check (admin layout handles redirect, but double-check role)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "city_official", "city_ambassador"].includes(profile.role)) {
    redirect("/");
  }

  // Fetch event
  const { data: eventData } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (!eventData) notFound();
  const event = eventData as Event;

  // Fetch all orders for this event (confirmed + refunded)
  const { data: orders } = await supabase
    .from("ticket_orders")
    .select(
      `
      id,
      order_number,
      status,
      total,
      platform_fee,
      customer_name,
      customer_email,
      created_at,
      customer_id
    `
    )
    .eq("event_id", id)
    .in("status", ["confirmed", "refunded"])
    .order("created_at", { ascending: false });

  const orderList = orders ?? [];
  const totalRevenue = orderList.reduce((sum, o) => sum + (o.total ?? 0), 0);
  const totalFees = orderList.reduce((sum, o) => sum + (o.platform_fee ?? 0), 0);
  const netRevenue = totalRevenue - totalFees;

  // Per-section breakdown
  const orderIds = orderList.map((o) => o.id);
  type SectionData = { quantity_sold: number; total_revenue: number };
  const sectionMap = new Map<string, SectionData>();

  if (orderIds.length > 0) {
    const { data: items } = await supabase
      .from("ticket_order_items")
      .select("section_name, price, quantity")
      .in("order_id", orderIds);

    for (const item of items ?? []) {
      const existing = sectionMap.get(item.section_name) ?? {
        quantity_sold: 0,
        total_revenue: 0,
      };
      sectionMap.set(item.section_name, {
        quantity_sold: existing.quantity_sold + (item.quantity ?? 0),
        total_revenue:
          existing.total_revenue + (item.price ?? 0) * (item.quantity ?? 0),
      });
    }
  }

  const bySection = Array.from(sectionMap.entries()).map(
    ([section_name, d]) => ({ section_name, ...d })
  );
  const ticketsSold = bySection.reduce((sum, s) => sum + s.quantity_sold, 0);

  // Fetch section capacities for progress bars
  const { data: configs } = await supabase
    .from("event_ticket_config")
    .select(
      `
      capacity,
      venue_section:venue_sections(name)
    `
    )
    .eq("event_id", id);

  const capacityMap = new Map<string, number>();
  for (const config of configs ?? []) {
    const section = Array.isArray(config.venue_section)
      ? config.venue_section[0]
      : config.venue_section;
    if (section?.name) {
      const current = capacityMap.get(section.name) ?? 0;
      capacityMap.set(section.name, current + (config.capacity ?? 0));
    }
  }

  // Fetch customer display names for recent orders
  const customerIds = orderList
    .map((o) => o.customer_id)
    .filter(Boolean) as string[];
  const customerMap = new Map<string, string>();

  if (customerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", customerIds);
    for (const p of profiles ?? []) {
      customerMap.set(p.id, p.display_name);
    }
  }

  // Recent 20 orders
  const recentOrders = orderList.slice(0, 20).map((o) => ({
    ...o,
    display_name: o.customer_id
      ? (customerMap.get(o.customer_id) ?? o.customer_name ?? "Unknown")
      : (o.customer_name ?? "Unknown"),
  }));

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link
          href="/admin/events"
          className="text-txt-secondary hover:text-white transition-colors flex items-center gap-1"
        >
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M9 12l-4-4 4-4" />
          </svg>
          Events
        </Link>
        <span className="text-txt-secondary/30">/</span>
        <span className="text-txt-secondary truncate max-w-[180px]">
          {event.title}
        </span>
        <span className="text-txt-secondary/30">/</span>
        <span className="text-white">Sales</span>
      </div>

      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold mb-1">{event.title}</h1>
        <p className="text-sm text-txt-secondary">
          Ticket Sales Dashboard ·{" "}
          {new Date(event.start_date).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard
          label="Total Revenue"
          value={formatCents(totalRevenue)}
          sub={`Net ${formatCents(netRevenue)}`}
          color="gold"
        />
        <StatCard
          label="Platform Fees"
          value={formatCents(totalFees)}
          sub="5% platform fee"
          color="cyan"
        />
        <StatCard
          label="Tickets Sold"
          value={String(ticketsSold)}
          sub={`Across ${bySection.length} section${bySection.length !== 1 ? "s" : ""}`}
          color="emerald"
        />
        <StatCard
          label="Orders"
          value={String(orderList.length)}
          sub="Confirmed & refunded"
          color="purple"
        />
      </div>

      {/* Section Breakdown */}
      {bySection.length > 0 && (
        <div className="mb-6">
          <h2 className="font-heading font-bold text-base mb-3">
            Section Breakdown
          </h2>
          <div className="space-y-3">
            {bySection.map((section) => {
              const capacity = capacityMap.get(section.section_name) ?? 0;
              const pct =
                capacity > 0
                  ? Math.min(
                      100,
                      Math.round((section.quantity_sold / capacity) * 100)
                    )
                  : 0;
              return (
                <Card key={section.section_name}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-sm">
                        {section.section_name}
                      </p>
                      {capacity > 0 && (
                        <p className="text-xs text-txt-secondary mt-0.5">
                          {section.quantity_sold} / {capacity} sold
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gold">
                        {formatCents(section.total_revenue)}
                      </p>
                      {capacity > 0 && (
                        <p className="text-[10px] text-txt-secondary mt-0.5">
                          {pct}% capacity
                        </p>
                      )}
                    </div>
                  </div>
                  {capacity > 0 && (
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="mb-6">
        <h2 className="font-heading font-bold text-base mb-3">
          Recent Orders
        </h2>
        {recentOrders.length === 0 ? (
          <Card>
            <div className="text-center py-6">
              <p className="text-sm text-txt-secondary">
                No ticket sales yet for this event.
              </p>
            </div>
          </Card>
        ) : (
          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border-subtle">
                    {["Order", "Customer", "Amount", "Status", "Date"].map(
                      (h) => (
                        <th
                          key={h}
                          className={`text-txt-secondary font-semibold px-4 py-3 uppercase tracking-wider text-[10px] ${
                            h === "Amount" || h === "Date"
                              ? "text-right"
                              : h === "Status"
                              ? "text-center"
                              : "text-left"
                          }`}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order, i) => (
                    <tr
                      key={order.id}
                      className={`border-b border-border-subtle last:border-0 hover:bg-white/[0.02] transition-colors ${
                        i % 2 !== 0 ? "bg-white/[0.01]" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-gold">
                          {order.order_number}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium truncate max-w-[120px]">
                          {order.display_name}
                        </p>
                        {order.customer_email && (
                          <p className="text-txt-secondary truncate max-w-[120px]">
                            {order.customer_email}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatCents(order.total)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          label={order.status}
                          variant={statusVariant(order.status)}
                        />
                      </td>
                      <td className="px-4 py-3 text-right text-txt-secondary">
                        {formatDateTime(order.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color: "gold" | "emerald" | "cyan" | "purple";
}) {
  const styles = {
    gold: { text: "text-gold", border: "border-gold/15", from: "from-gold/[0.06]" },
    emerald: { text: "text-emerald", border: "border-emerald/15", from: "from-emerald/[0.06]" },
    cyan: { text: "text-cyan", border: "border-cyan/15", from: "from-cyan/[0.06]" },
    purple: { text: "text-gold", border: "border-gold/15", from: "from-hc-purple/[0.06]" },
  };

  const s = styles[color];

  return (
    <div
      className={`bg-card rounded-2xl border ${s.border} overflow-hidden p-4 relative`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${s.from} to-transparent pointer-events-none`}
      />
      <div className="relative">
        <p className="text-[10px] text-txt-secondary font-semibold uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className={`font-heading font-bold text-xl ${s.text}`}>{value}</p>
        {sub && (
          <p className="text-[10px] text-txt-secondary mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  );
}
