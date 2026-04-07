"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";

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

export default function ChamberOverviewPage() {
  const [analytics, setAnalytics] = useState<ChamberAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/chamber/analytics");
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
  }, []);

  return (
    <div className="px-4 py-5 space-y-5">
      <h1 className="font-heading text-xl font-bold">Chamber of Commerce</h1>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : analytics ? (
        <>
          {/* Key Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="text-center">
              <p className="text-2xl font-heading font-bold text-gold">
                {analytics.total_businesses}
              </p>
              <p className="text-[10px] text-txt-secondary mt-0.5">Active Businesses</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-heading font-bold text-coral">
                {analytics.paused_businesses}
              </p>
              <p className="text-[10px] text-txt-secondary mt-0.5">Paused</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-heading font-bold text-emerald">
                ${((analytics.total_revenue_cents || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-txt-secondary mt-0.5">Revenue (This Month)</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-heading font-bold text-cyan">
                {analytics.total_orders}
              </p>
              <p className="text-[10px] text-txt-secondary mt-0.5">Orders (This Month)</p>
            </Card>
          </div>

          {/* Orders by Type */}
          {analytics.orders_by_type && (
            <Card>
              <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-3">
                Orders by Business Type
              </h3>
              <div className="space-y-2">
                {Object.entries(analytics.orders_by_type).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{type || "Other"}</span>
                    <span className="text-sm font-semibold text-gold">{count}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Loyalty Stats */}
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

          {/* New Businesses */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">New Businesses</p>
                <p className="text-xs text-txt-secondary">This month</p>
              </div>
              <span className="text-2xl font-heading font-bold text-cyan">
                {analytics.new_businesses_count}
              </span>
            </div>
          </Card>
        </>
      ) : (
        <Card className="text-center py-10">
          <p className="text-txt-secondary">Unable to load analytics</p>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-txt-secondary mb-3">Management</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/dashboard/chamber/businesses">
            <Card hover className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-sm font-medium">Businesses</span>
            </Card>
          </Link>
          <Link href="/dashboard/chamber/updates">
            <Card hover className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan/10 flex items-center justify-center text-cyan">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <span className="text-sm font-medium">Updates</span>
            </Card>
          </Link>
          <Link href="/dashboard/chamber/updates/new">
            <Card hover className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald/10 flex items-center justify-center text-emerald">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm font-medium">New Update</span>
            </Card>
          </Link>
          <Link href="/dashboard/chamber/analytics">
            <Card hover className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-hc-purple/10 flex items-center justify-center text-hc-purple">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-sm font-medium">Analytics</span>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
