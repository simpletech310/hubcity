"use client";

import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import type { RevenueData, RecentTransaction } from "./page";

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatCents(cents: number): string {
  return "$" + (cents / 100).toFixed(2);
}

function pctChange(current: number, last: number): number | null {
  if (last === 0) return null;
  return Math.round(((current - last) / last) * 100);
}

function ChangeChip({ current, last }: { current: number; last: number }) {
  const pct = pctChange(current, last);
  if (pct === null) {
    return <span className="text-[11px] text-txt-secondary">—</span>;
  }
  const up = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums ${
        up ? "text-emerald-400" : "text-red-400"
      }`}
    >
      {up ? (
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 8V2M2 5l3-3 3 3" />
        </svg>
      ) : (
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 2v6M2 5l3 3 3-3" />
        </svg>
      )}
      {Math.abs(pct)}%
    </span>
  );
}

// ─── stat card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  subtitle,
  color,
  iconBg,
}: {
  label: string;
  value: string;
  subtitle?: string;
  color: string;
  iconBg?: string;
}) {
  return (
    <div
      className="rounded-xl bg-card border border-border-subtle p-4"
      style={{ borderLeftColor: color, borderLeftWidth: 3 }}
    >
      <p className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider mb-1">
        {label}
      </p>
      <p
        className="font-heading text-2xl font-bold tabular-nums"
        style={{ color }}
      >
        {value}
      </p>
      {subtitle && (
        <p className="text-[10px] text-txt-secondary mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}

// ─── stream row ──────────────────────────────────────────────────────────────

function StreamRow({
  label,
  current,
  last,
  bold,
}: {
  label: string;
  current: number;
  last: number;
  bold?: boolean;
}) {
  return (
    <tr
      className={`border-t border-border-subtle ${bold ? "bg-white/5" : "hover:bg-white/3 transition-colors"}`}
    >
      <td
        className={`py-3 px-4 text-sm ${bold ? "font-bold text-white" : "text-txt-secondary"}`}
      >
        {label}
      </td>
      <td
        className={`py-3 px-4 text-sm tabular-nums text-right ${bold ? "font-bold text-gold" : "text-white"}`}
      >
        {formatCents(current)}
      </td>
      <td
        className={`py-3 px-4 text-sm tabular-nums text-right ${bold ? "font-bold text-white" : "text-txt-secondary"}`}
      >
        {formatCents(last)}
      </td>
      <td className="py-3 px-4 text-right">
        <ChangeChip current={current} last={last} />
      </td>
    </tr>
  );
}

// ─── transaction type label ───────────────────────────────────────────────────

const TYPE_LABELS: Record<RecentTransaction["type"], string> = {
  order: "Food Order",
  ticket: "Event Ticket",
  subscription: "Subscription",
  tip: "Tip",
  ad_revenue: "Ad Revenue",
  ppv: "PPV Purchase",
};

const TYPE_COLORS: Record<RecentTransaction["type"], string> = {
  order: "#F2A900",
  ticket: "#22C55E",
  subscription: "#8B5CF6",
  tip: "#FF6B6B",
  ad_revenue: "#06B6D4",
  ppv: "#3B82F6",
};

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── main component ───────────────────────────────────────────────────────────

export default function RevenueClient({ data }: { data: RevenueData }) {
  const {
    currentMonthLabel,
    orders,
    tickets,
    subscriptions,
    tips,
    adRevenue,
    recentTransactions,
  } = data;

  const totalCurrent =
    orders.current +
    tickets.current +
    subscriptions.current +
    tips.current +
    adRevenue.current;

  const totalLast =
    orders.last +
    tickets.last +
    subscriptions.last +
    tips.last +
    adRevenue.last;

  const creatorCurrent = tips.current + adRevenue.current;
  const creatorLast = tips.last + adRevenue.last;

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold mb-0.5">Revenue</h1>
          <p className="text-sm text-txt-secondary">{currentMonthLabel}</p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-txt-secondary shrink-0 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Updated just now
        </div>
      </div>

      {/* ── Top stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard
          label="Total GMV"
          value={formatCents(totalCurrent)}
          subtitle={
            pctChange(totalCurrent, totalLast) !== null
              ? `${pctChange(totalCurrent, totalLast)! >= 0 ? "+" : ""}${pctChange(totalCurrent, totalLast)}% vs last month`
              : undefined
          }
          color="#F2A900"
        />
        <StatCard
          label="Orders"
          value={formatCents(orders.current)}
          subtitle={formatCents(orders.last) + " last month"}
          color="#22C55E"
        />
        <StatCard
          label="Subscriptions"
          value={formatCents(subscriptions.current)}
          subtitle={formatCents(subscriptions.last) + " last month"}
          color="#8B5CF6"
        />
        <StatCard
          label="Creator Earnings"
          value={formatCents(creatorCurrent)}
          subtitle="Tips + PPV + Ads"
          color="#06B6D4"
        />
      </div>

      {/* ── Stream breakdown table ── */}
      <div className="mb-8">
        <h2 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-gold" />
          Revenue Streams
        </h2>
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[420px]">
              <thead>
                <tr className="bg-white/5">
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                    Stream
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-txt-secondary uppercase tracking-wider text-right">
                    This Month
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-txt-secondary uppercase tracking-wider text-right">
                    Last Month
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-txt-secondary uppercase tracking-wider text-right">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody>
                <StreamRow
                  label="Food Orders"
                  current={orders.current}
                  last={orders.last}
                />
                <StreamRow
                  label="Event Tickets"
                  current={tickets.current}
                  last={tickets.last}
                />
                <StreamRow
                  label="Subscriptions"
                  current={subscriptions.current}
                  last={subscriptions.last}
                />
                <StreamRow
                  label="Tips"
                  current={tips.current}
                  last={tips.last}
                />
                <StreamRow
                  label="Ad Revenue"
                  current={adRevenue.current}
                  last={adRevenue.last}
                />
                <StreamRow
                  label="Total"
                  current={totalCurrent}
                  last={totalLast}
                  bold
                />
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ── Recent large transactions ── */}
      <div>
        <h2 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-cyan-400" />
          Recent Large Transactions
          <span className="text-[11px] font-normal text-txt-secondary ml-1">
            (over $50)
          </span>
        </h2>

        {recentTransactions.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center py-8 gap-2 text-txt-secondary">
              <Icon name="receipt" size={32} className="opacity-30" />
              <p className="text-sm">No large transactions yet</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((tx) => (
              <Card key={tx.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: TYPE_COLORS[tx.type] + "1A",
                      }}
                    >
                      <Icon
                        name={
                          tx.type === "order"
                            ? "utensils"
                            : tx.type === "ticket"
                              ? "ticket"
                              : tx.type === "subscription"
                                ? "crown"
                                : tx.type === "tip"
                                  ? "heart-pulse"
                                  : tx.type === "ppv"
                                    ? "film"
                                    : "megaphone"
                        }
                        size={16}
                        style={{ color: TYPE_COLORS[tx.type] }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {tx.name ?? TYPE_LABELS[tx.type]}
                      </p>
                      <p className="text-[11px] text-txt-secondary">
                        {TYPE_LABELS[tx.type]}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold tabular-nums text-gold">
                      {formatCents(tx.amount_cents)}
                    </p>
                    <p className="text-[10px] text-txt-secondary">
                      {formatRelativeDate(tx.created_at)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
