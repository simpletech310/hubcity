"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

interface PayoutRow {
  id: string;
  amount: number;
  currency: string;
  status: string;
  arrival_date: string;
  created: string;
  method: string;
  type: string;
  description: string | null;
  statement_descriptor: string | null;
  failure_message: string | null;
}

interface PayoutSchedule {
  interval: string;
  delay_days: number | string;
  weekly_anchor?: string | null;
  monthly_anchor?: number | null;
}

const statusVariant: Record<string, "gold" | "emerald" | "cyan" | "coral" | "purple"> = {
  paid: "emerald",
  pending: "gold",
  in_transit: "cyan",
  canceled: "coral",
  failed: "coral",
};

function formatMoney(cents: number, currency: string): string {
  const amount = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function describeSchedule(s: PayoutSchedule | null): string {
  if (!s) return "Standard payout schedule";
  if (s.interval === "manual") return "Manual payouts (you trigger them)";
  if (s.interval === "daily") return `Daily payouts (${s.delay_days}-day rolling delay)`;
  if (s.interval === "weekly") {
    const day = s.weekly_anchor ? s.weekly_anchor[0].toUpperCase() + s.weekly_anchor.slice(1) : "weekly";
    return `Weekly payouts on ${day}`;
  }
  if (s.interval === "monthly") {
    const ord = (n: number) => {
      const j = n % 10, k = n % 100;
      if (j === 1 && k !== 11) return `${n}st`;
      if (j === 2 && k !== 12) return `${n}nd`;
      if (j === 3 && k !== 13) return `${n}rd`;
      return `${n}th`;
    };
    return `Monthly payouts on the ${s.monthly_anchor ? ord(s.monthly_anchor) : ""}`;
  }
  return `${s.interval} payouts`;
}

function csvEscape(value: string | number | null): string {
  if (value == null) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildCsv(payouts: PayoutRow[]): string {
  const header = [
    "id",
    "created",
    "arrival_date",
    "amount",
    "currency",
    "status",
    "method",
    "type",
    "description",
    "statement_descriptor",
    "failure_message",
  ];
  const rows = payouts.map((p) =>
    [
      p.id,
      p.created,
      p.arrival_date,
      (p.amount / 100).toFixed(2),
      p.currency.toUpperCase(),
      p.status,
      p.method,
      p.type,
      p.description,
      p.statement_descriptor,
      p.failure_message,
    ]
      .map(csvEscape)
      .join(",")
  );
  return [header.join(","), ...rows].join("\n");
}

function currentMonthOption(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function buildMonthOptions(): { value: string; label: string }[] {
  const opts: { value: string; label: string }[] = [{ value: "", label: "All time" }];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    opts.push({ value, label });
  }
  return opts;
}

export default function PayoutsClient({ payoutsEnabled }: { payoutsEnabled: boolean }) {
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [schedule, setSchedule] = useState<PayoutSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState<string>("");

  const monthOptions = useMemo(buildMonthOptions, []);

  const load = useCallback(async (m: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (m) params.set("month", m);
      const res = await fetch(`/api/stripe/payouts?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to load payouts");
      }
      const data = await res.json();
      setPayouts(data.payouts ?? []);
      setSchedule(data.schedule ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(month);
  }, [month, load]);

  const totalAmount = payouts
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const inTransit = payouts
    .filter((p) => p.status === "in_transit" || p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);
  const currency = payouts[0]?.currency ?? "usd";

  function downloadCsv() {
    if (!payouts.length) return;
    const csv = buildCsv(payouts);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const monthSuffix = month || currentMonthOption();
    link.download = `payouts-${monthSuffix}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      {/* Schedule */}
      <Card>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center shrink-0">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-cyan">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-txt-secondary uppercase tracking-wide">Payout schedule</p>
            <p className="text-sm font-semibold mt-0.5">{describeSchedule(schedule)}</p>
            {!payoutsEnabled && (
              <p className="text-[11px] text-coral mt-1">
                Payouts are paused. Complete identity verification in Stripe to enable them.
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center">
          <p className="text-2xl font-heading font-bold text-emerald">
            {formatMoney(totalAmount, currency)}
          </p>
          <p className="text-[10px] text-txt-secondary mt-0.5">Paid out</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-heading font-bold text-gold">
            {formatMoney(inTransit, currency)}
          </p>
          <p className="text-[10px] text-txt-secondary mt-0.5">In transit / pending</p>
        </Card>
      </div>

      {/* Filter + export */}
      <div className="flex items-center gap-2">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="bg-card border border-border-subtle rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/40"
          aria-label="Filter by month"
        >
          {monthOptions.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={downloadCsv}
          disabled={!payouts.length}
        >
          Export CSV
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <Card className="text-center py-10">
          <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
        </Card>
      ) : error ? (
        <Card className="text-center py-8">
          <p className="text-sm text-coral">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => load(month)}>
            Retry
          </Button>
        </Card>
      ) : payouts.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-sm text-txt-secondary">No payouts in this period.</p>
          <p className="text-xs text-txt-secondary/70 mt-1">
            Payouts appear here once Stripe pays out funds to your bank account.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {payouts.map((p) => (
            <Card key={p.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">
                      {formatMoney(p.amount, p.currency)}
                    </p>
                    <Badge
                      label={p.status.replace("_", " ")}
                      variant={statusVariant[p.status] || "gold"}
                      size="sm"
                    />
                  </div>
                  <p className="text-[11px] text-txt-secondary mt-0.5">
                    Arrives {formatDate(p.arrival_date)}
                    <span className="text-txt-secondary/50"> · </span>
                    {p.method === "instant" ? "Instant" : "Standard"} {p.type}
                  </p>
                  {p.description && (
                    <p className="text-[11px] text-txt-secondary mt-1 truncate">
                      {p.description}
                    </p>
                  )}
                  {p.failure_message && (
                    <p className="text-[11px] text-coral mt-1">{p.failure_message}</p>
                  )}
                  <p className="text-[10px] text-txt-secondary/60 mt-1 font-mono">
                    {p.id}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
