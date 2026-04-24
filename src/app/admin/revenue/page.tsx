import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RevenueClient from "./RevenueClient";

// ─── helpers ─────────────────────────────────────────────────────────────────

function monthBounds(offset: number = 0) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + offset; // JS months are 0-based; offset -1 = last month
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 1));
  return { start: start.toISOString(), end: end.toISOString() };
}

function sumCents(rows: { total?: number | null; amount_cents?: number | null }[]) {
  return rows.reduce(
    (acc, r) => acc + (r.total ?? r.amount_cents ?? 0),
    0,
  );
}

// ─── types ───────────────────────────────────────────────────────────────────

export interface RecentTransaction {
  id: string;
  amount_cents: number;
  type: "order" | "ticket" | "subscription" | "tip" | "ad_revenue" | "ppv";
  name: string | null;
  created_at: string;
}

export interface RevenueData {
  currentMonthLabel: string;
  // totals by stream (cents)
  orders: { current: number; last: number };
  tickets: { current: number; last: number };
  subscriptions: { current: number; last: number };
  tips: { current: number; last: number };
  adRevenue: { current: number; last: number };
  recentTransactions: RecentTransaction[];
}

// ─── page ────────────────────────────────────────────────────────────────────

export default async function AdminRevenuePage() {
  const supabase = await createClient();

  // Auth guard (mirrors other admin pages)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    !["city_official", "admin", "city_ambassador"].includes(profile.role)
  ) {
    redirect("/");
  }

  // Date ranges
  const current = monthBounds(0);
  const last = monthBounds(-1);

  // ── Fetch all revenue data in parallel ──────────────────────────────────
  const [
    ordersCurrentRes,
    ordersLastRes,
    ticketsCurrentRes,
    ticketsLastRes,
    subsCurrentRes,
    subsLastRes,
    earningsCurrentRes,
    earningsLastRes,
    recentOrdersRes,
    recentTicketsRes,
  ] = await Promise.all([
    // orders — status 'delivered' or 'picked_up' counts as completed
    supabase
      .from("orders")
      .select("total")
      .in("status", ["delivered", "picked_up", "completed"])
      .gte("created_at", current.start)
      .lt("created_at", current.end),

    supabase
      .from("orders")
      .select("total")
      .in("status", ["delivered", "picked_up", "completed"])
      .gte("created_at", last.start)
      .lt("created_at", last.end),

    // ticket_orders — status 'confirmed'
    supabase
      .from("ticket_orders")
      .select("total")
      .eq("status", "confirmed")
      .gte("created_at", current.start)
      .lt("created_at", current.end),

    supabase
      .from("ticket_orders")
      .select("total")
      .eq("status", "confirmed")
      .gte("created_at", last.start)
      .lt("created_at", last.end),

    // channel_subscriptions — status 'active' or 'past_due'
    supabase
      .from("channel_subscriptions")
      .select("amount_cents")
      .in("status", ["active", "past_due"])
      .gte("created_at", current.start)
      .lt("created_at", current.end),

    supabase
      .from("channel_subscriptions")
      .select("amount_cents")
      .in("status", ["active", "past_due"])
      .gte("created_at", last.start)
      .lt("created_at", last.end),

    // creator_earnings — tips + ad_revenue + ppv
    supabase
      .from("creator_earnings")
      .select("amount_cents, source")
      .in("source", ["tip", "ad_revenue", "ppv", "sponsorship"])
      .gte("created_at", current.start)
      .lt("created_at", current.end),

    supabase
      .from("creator_earnings")
      .select("amount_cents, source")
      .in("source", ["tip", "ad_revenue", "ppv", "sponsorship"])
      .gte("created_at", last.start)
      .lt("created_at", last.end),

    // Recent large transactions — orders over $50
    supabase
      .from("orders")
      .select("id, total, created_at, business_id")
      .in("status", ["delivered", "picked_up", "completed"])
      .gte("total", 5000)
      .order("created_at", { ascending: false })
      .limit(5),

    // Recent large transactions — tickets over $50
    supabase
      .from("ticket_orders")
      .select("id, total, created_at, event_id")
      .eq("status", "confirmed")
      .gte("total", 5000)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // ── Aggregate ───────────────────────────────────────────────────────────
  const ordersRows = (ordersCurrentRes.data ?? []) as { total: number }[];
  const ordersLastRows = (ordersLastRes.data ?? []) as { total: number }[];
  const ticketsRows = (ticketsCurrentRes.data ?? []) as { total: number }[];
  const ticketsLastRows = (ticketsLastRes.data ?? []) as { total: number }[];
  const subsRows = (subsCurrentRes.data ?? []) as { amount_cents: number }[];
  const subsLastRows = (subsLastRes.data ?? []) as { amount_cents: number }[];
  const earningsRows = (earningsCurrentRes.data ?? []) as {
    amount_cents: number;
    source: string;
  }[];
  const earningsLastRows = (earningsLastRes.data ?? []) as {
    amount_cents: number;
    source: string;
  }[];

  const tipsCurrent = earningsRows
    .filter((r) => r.source === "tip")
    .reduce((s, r) => s + (r.amount_cents ?? 0), 0);
  const tipsLast = earningsLastRows
    .filter((r) => r.source === "tip")
    .reduce((s, r) => s + (r.amount_cents ?? 0), 0);

  const adCurrent = earningsRows
    .filter((r) => r.source !== "tip")
    .reduce((s, r) => s + (r.amount_cents ?? 0), 0);
  const adLast = earningsLastRows
    .filter((r) => r.source !== "tip")
    .reduce((s, r) => s + (r.amount_cents ?? 0), 0);

  // ── Recent transactions ──────────────────────────────────────────────────
  const recentOrders: RecentTransaction[] = (
    (recentOrdersRes.data ?? []) as {
      id: string;
      total: number;
      created_at: string;
      business_id: string;
    }[]
  ).map((r) => ({
    id: r.id,
    amount_cents: r.total,
    type: "order" as const,
    name: null, // business name would require a join — omitted for now
    created_at: r.created_at,
  }));

  const recentTickets: RecentTransaction[] = (
    (recentTicketsRes.data ?? []) as {
      id: string;
      total: number;
      created_at: string;
      event_id: string;
    }[]
  ).map((r) => ({
    id: r.id,
    amount_cents: r.total,
    type: "ticket" as const,
    name: null,
    created_at: r.created_at,
  }));

  const recentTransactions: RecentTransaction[] = [
    ...recentOrders,
    ...recentTickets,
  ]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 10);

  // ── Current month label ──────────────────────────────────────────────────
  const currentMonthLabel = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const data: RevenueData = {
    currentMonthLabel,
    orders: {
      current: sumCents(ordersRows),
      last: sumCents(ordersLastRows),
    },
    tickets: {
      current: sumCents(ticketsRows),
      last: sumCents(ticketsLastRows),
    },
    subscriptions: {
      current: subsRows.reduce((s, r) => s + (r.amount_cents ?? 0), 0),
      last: subsLastRows.reduce((s, r) => s + (r.amount_cents ?? 0), 0),
    },
    tips: { current: tipsCurrent, last: tipsLast },
    adRevenue: { current: adCurrent, last: adLast },
    recentTransactions,
  };

  return <RevenueClient data={data} />;
}
