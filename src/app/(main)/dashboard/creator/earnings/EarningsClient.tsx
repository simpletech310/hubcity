"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";

interface SeriesPoint {
  month: string;
  subscriptions: number;
  ppv: number;
  tickets: number;
  ads: number;
  other: number;
}

interface Earning {
  id: string;
  date: string;
  source: string;
  description: string | null;
  amount: number;
  gross: number | null;
  fee: number | null;
  status: "pending" | "paid" | "cancelled";
}

interface Payout {
  id: string;
  amount_cents: number;
  arrival_date: string;
  status: string;
}

interface EarningsResponse {
  total_earnings: number;
  this_month: number;
  pending_payout: number;
  subscribers: number;
  content_count: number;
  total_views: number;
  by_source: Record<string, number>;
  series: SeriesPoint[];
  payouts: Payout[];
  recent_earnings: Earning[];
  channel_id: string | null;
}

function fmt(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function downloadCsv(rows: Earning[]) {
  const header = ["date", "source", "description", "gross", "fee", "net", "status"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        new Date(r.date).toISOString(),
        r.source,
        JSON.stringify(r.description ?? ""),
        ((r.gross ?? r.amount) / 100).toFixed(2),
        ((r.fee ?? 0) / 100).toFixed(2),
        (r.amount / 100).toFixed(2),
        r.status,
      ].join(",")
    );
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `creator-earnings-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function EarningsClient() {
  const [data, setData] = useState<EarningsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/creators/earnings")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="px-5 py-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white/[0.04] rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-sm text-txt-secondary">Couldn&apos;t load earnings.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-safe">
      {/* Header */}
      <div className="px-5 pt-6 pb-3">
        <Link
          href="/dashboard/creator"
          className="inline-flex items-center gap-1 text-xs text-txt-secondary hover:text-white mb-3"
        >
          <Icon name="back" size={14} /> Back
        </Link>
        <h1 className="font-heading font-bold text-2xl">Earnings</h1>
        <p className="text-xs text-txt-secondary">
          Subscription, pay-per-view, and event ticket revenue.
        </p>
      </div>

      {/* KPI strip */}
      <section className="px-5 mb-6">
        <div className="grid grid-cols-3 gap-2">
          <Card variant="glass" className="text-center">
            <p className="text-[9px] uppercase text-txt-secondary font-semibold">
              Total
            </p>
            <p className="font-heading font-bold text-base text-gold mt-1">
              {fmt(data.total_earnings)}
            </p>
          </Card>
          <Card variant="glass" className="text-center">
            <p className="text-[9px] uppercase text-txt-secondary font-semibold">
              This month
            </p>
            <p className="font-heading font-bold text-base text-emerald mt-1">
              {fmt(data.this_month)}
            </p>
          </Card>
          <Card variant="glass" className="text-center">
            <p className="text-[9px] uppercase text-txt-secondary font-semibold">
              Pending
            </p>
            <p className="font-heading font-bold text-base text-hc-purple mt-1">
              {fmt(data.pending_payout)}
            </p>
          </Card>
        </div>
      </section>

      {/* Chart */}
      <section className="px-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full bg-gold" />
          <h2 className="font-heading font-bold text-base">Last 6 months</h2>
        </div>
        <Card>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.series}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="rgba(255,255,255,0.4)"
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.4)"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `$${(v / 100).toFixed(0)}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#11131A",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v) => fmt(Number(v) || 0)}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="subscriptions" stackId="a" fill="#F2A900" />
                <Bar dataKey="ppv" stackId="a" fill="#8B5CF6" />
                <Bar dataKey="tickets" stackId="a" fill="#3B82F6" />
                <Bar dataKey="ads" stackId="a" fill="#22C55E" />
                <Bar dataKey="other" stackId="a" fill="#475569" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      {/* Source breakdown */}
      <section className="px-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full bg-emerald" />
          <h2 className="font-heading font-bold text-base">By source</h2>
        </div>
        <Card padding={false}>
          <div className="divide-y divide-border-subtle">
            {Object.entries(data.by_source).length === 0 ? (
              <p className="text-xs text-txt-secondary p-4 text-center">
                No earnings yet.
              </p>
            ) : (
              Object.entries(data.by_source).map(([source, amount]) => (
                <div
                  key={source}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <span className="text-xs font-medium capitalize">
                    {source.replace("_", " ")}
                  </span>
                  <span className="font-heading font-bold text-sm">
                    {fmt(amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      {/* Payouts */}
      <section className="px-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full bg-hc-blue" />
          <h2 className="font-heading font-bold text-base">Payout history</h2>
        </div>
        {data.payouts.length === 0 ? (
          <Card>
            <p className="text-xs text-txt-secondary text-center py-4">
              No payouts yet. Stripe pays out automatically once you have a
              balance.
            </p>
          </Card>
        ) : (
          <Card padding={false}>
            <div className="divide-y divide-border-subtle">
              {data.payouts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-xs font-semibold">
                      {fmt(p.amount_cents)}
                    </p>
                    <p className="text-[10px] text-txt-secondary">
                      Arrives{" "}
                      {new Date(p.arrival_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge
                    label={p.status}
                    variant={
                      p.status === "paid"
                        ? "emerald"
                        : p.status === "in_transit"
                          ? "blue"
                          : "gold"
                    }
                  />
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>

      {/* Recent activity + CSV export */}
      <section className="px-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-hc-purple" />
            <h2 className="font-heading font-bold text-base">Recent activity</h2>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadCsv(data.recent_earnings)}
          >
            Export CSV
          </Button>
        </div>
        {data.recent_earnings.length === 0 ? (
          <Card>
            <p className="text-xs text-txt-secondary text-center py-4">
              No transactions yet.
            </p>
          </Card>
        ) : (
          <Card padding={false}>
            <div className="divide-y divide-border-subtle">
              {data.recent_earnings.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold capitalize">
                      {e.source.replace("_", " ")}
                      {e.description ? (
                        <span className="text-txt-secondary font-normal">
                          {" "}
                          · {e.description}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-[10px] text-txt-secondary">
                      {new Date(e.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-heading font-bold text-sm text-emerald">
                      {fmt(e.amount)}
                    </span>
                    <Badge
                      label={e.status}
                      variant={
                        e.status === "paid"
                          ? "emerald"
                          : e.status === "cancelled"
                            ? "coral"
                            : "gold"
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
