"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";

interface ChamberAnalytics {
  total_businesses: number;
  paused_businesses: number;
  total_orders: number;
  total_revenue_cents: number;
  orders_by_type: Record<string, number> | null;
  new_businesses_count: number;
  total_loyalty_points_earned: number;
  total_loyalty_points_redeemed: number;
}

export default function ChamberAnalyticsPage() {
  const [analytics, setAnalytics] = useState<ChamberAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const now = new Date();
      let startDate: Date;

      if (period === "month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (period === "quarter") {
        const q = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), q, 1);
      } else {
        startDate = new Date(now.getFullYear(), 0, 1);
      }

      try {
        const res = await fetch(
          `/api/chamber/analytics?start=${startDate.toISOString()}&end=${now.toISOString()}`
        );
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data.analytics);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [period]);

  return (
    <div className="px-4 py-5 space-y-4">
      <h1 className="font-heading text-xl font-bold">Chamber Analytics</h1>

      {/* Period Toggle */}
      <div className="flex gap-2">
        {(["month", "quarter", "year"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
              period === p
                ? "bg-gold text-midnight"
                : "bg-surface text-txt-secondary hover:text-white"
            }`}
          >
            {p === "month" ? "This Month" : p === "quarter" ? "This Quarter" : "This Year"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : analytics ? (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-[3px] h-full bg-gold rounded-r" />
              <p className="text-[10px] text-txt-secondary uppercase tracking-wide mb-1">
                Total Revenue
              </p>
              <p className="text-xl font-heading font-bold text-gold">
                ${((analytics.total_revenue_cents || 0) / 100).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
            </Card>
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-[3px] h-full bg-cyan rounded-r" />
              <p className="text-[10px] text-txt-secondary uppercase tracking-wide mb-1">
                Total Orders
              </p>
              <p className="text-xl font-heading font-bold text-cyan">
                {analytics.total_orders}
              </p>
            </Card>
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-[3px] h-full bg-emerald rounded-r" />
              <p className="text-[10px] text-txt-secondary uppercase tracking-wide mb-1">
                Active Businesses
              </p>
              <p className="text-xl font-heading font-bold text-emerald">
                {analytics.total_businesses}
              </p>
            </Card>
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-[3px] h-full bg-hc-purple rounded-r" />
              <p className="text-[10px] text-txt-secondary uppercase tracking-wide mb-1">
                New Businesses
              </p>
              <p className="text-xl font-heading font-bold text-gold">
                {analytics.new_businesses_count}
              </p>
            </Card>
          </div>

          {/* Orders by Type */}
          {analytics.orders_by_type && Object.keys(analytics.orders_by_type).length > 0 && (
            <Card>
              <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-3">
                Orders by Business Type
              </h3>
              <div className="space-y-3">
                {Object.entries(analytics.orders_by_type).map(([type, count]) => {
                  const total = analytics.total_orders || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs capitalize">{type || "Other"}</span>
                        <span className="text-xs font-semibold">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-deep rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gold rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Loyalty Overview */}
          <Card>
            <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-3">
              Loyalty Program
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-lg font-heading font-bold text-gold">
                  {(analytics.total_loyalty_points_earned || 0).toLocaleString()}
                </p>
                <p className="text-[10px] text-txt-secondary">Points Earned</p>
              </div>
              <div>
                <p className="text-lg font-heading font-bold text-emerald">
                  {(analytics.total_loyalty_points_redeemed || 0).toLocaleString()}
                </p>
                <p className="text-[10px] text-txt-secondary">Points Redeemed</p>
              </div>
            </div>
          </Card>

          {/* Paused Businesses Alert */}
          {analytics.paused_businesses > 0 && (
            <Card className="border border-gold/30">
              <div className="flex items-center gap-3">
                <span className="text-xl"><Icon name="warning" size={20} /></span>
                <div>
                  <p className="text-sm font-semibold text-gold">
                    {analytics.paused_businesses} Paused Business{analytics.paused_businesses > 1 ? "es" : ""}
                  </p>
                  <p className="text-xs text-txt-secondary">
                    These businesses have been paused and may need attention
                  </p>
                </div>
              </div>
            </Card>
          )}
        </>
      ) : (
        <Card className="text-center py-10">
          <p className="text-txt-secondary">Unable to load analytics</p>
        </Card>
      )}
    </div>
  );
}
