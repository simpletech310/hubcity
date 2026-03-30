"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface AnalyticsData {
  stats: {
    total_orders: number;
    orders_this_month: number;
    total_revenue: number;
    revenue_this_month: number;
    revenue_last_month: number;
    avg_order_value: number;
    total_bookings: number;
    bookings_this_month: number;
    unique_customers: number;
  };
  top_items: { name: string; count: number }[];
  review_stats: {
    avg_rating: number;
    count: number;
    distribution: Record<number, number>;
  };
  recent_orders: {
    id: string;
    order_number: string;
    status: string;
    total: number;
    created_at: string;
    customer?: { display_name: string } | null;
  }[];
}

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const statusColors: Record<string, "gold" | "emerald" | "cyan" | "coral" | "purple"> = {
  pending: "gold",
  confirmed: "cyan",
  preparing: "purple",
  ready: "emerald",
  picked_up: "emerald",
  delivered: "emerald",
  cancelled: "coral",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const supabase = createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Please sign in to view analytics.");
          setLoading(false);
          return;
        }

        // Get user's business
        const { data: business } = await supabase
          .from("businesses")
          .select("id")
          .eq("owner_id", user.id)
          .single();

        if (!business) {
          setError("No business found for your account.");
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/analytics/business/${business.id}`);
        if (!res.ok) {
          const errData = await res.json();
          setError(errData.error || "Failed to load analytics");
          setLoading(false);
          return;
        }

        const analyticsData = await res.json();
        setData(analyticsData);
      } catch {
        setError("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-5 space-y-4">
        <h1 className="font-heading font-bold text-lg">Analytics</h1>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border-subtle p-4 animate-pulse">
              <div className="h-8 bg-white/5 rounded mb-2" />
              <div className="h-3 bg-white/5 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-5">
        <h1 className="font-heading font-bold text-lg mb-4">Analytics</h1>
        <Card className="text-center py-8">
          <p className="text-txt-secondary text-sm">{error}</p>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { stats, top_items, review_stats, recent_orders } = data;

  // Revenue trend
  const revenueChange =
    stats.revenue_last_month > 0
      ? Math.round(((stats.revenue_this_month - stats.revenue_last_month) / stats.revenue_last_month) * 100)
      : stats.revenue_this_month > 0
        ? 100
        : 0;

  const maxItemCount = top_items.length > 0 ? top_items[0].count : 1;

  return (
    <div className="px-4 py-5 space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-lg">Analytics</h1>
        <p className="text-xs text-txt-secondary mt-0.5">Business performance overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-[10px] text-txt-secondary uppercase tracking-wide mb-1">Total Orders</p>
          <p className="text-2xl font-heading font-bold text-gold">{stats.total_orders}</p>
          <p className="text-[10px] text-txt-secondary mt-1">
            {stats.orders_this_month} this month
          </p>
        </Card>
        <Card>
          <p className="text-[10px] text-txt-secondary uppercase tracking-wide mb-1">Revenue</p>
          <p className="text-2xl font-heading font-bold text-emerald">
            {formatCents(stats.total_revenue)}
          </p>
          <p className="text-[10px] text-txt-secondary mt-1">
            {formatCents(stats.revenue_this_month)} this month
          </p>
        </Card>
        <Card>
          <p className="text-[10px] text-txt-secondary uppercase tracking-wide mb-1">Avg Order</p>
          <p className="text-2xl font-heading font-bold text-cyan">
            {formatCents(stats.avg_order_value)}
          </p>
          <p className="text-[10px] text-txt-secondary mt-1">per order</p>
        </Card>
        <Card>
          <p className="text-[10px] text-txt-secondary uppercase tracking-wide mb-1">Customers</p>
          <p className="text-2xl font-heading font-bold text-hc-purple">{stats.unique_customers}</p>
          <p className="text-[10px] text-txt-secondary mt-1">unique buyers</p>
        </Card>
      </div>

      {/* Revenue Trend */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Revenue Trend</p>
          {revenueChange !== 0 && (
            <Badge
              label={`${revenueChange > 0 ? "+" : ""}${revenueChange}%`}
              variant={revenueChange >= 0 ? "emerald" : "coral"}
              size="sm"
            />
          )}
        </div>
        <div className="flex items-end gap-3 h-16">
          {/* Last month bar */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t-lg bg-white/5 relative" style={{
              height: `${Math.max(8, stats.revenue_last_month > 0 ? (stats.revenue_last_month / Math.max(stats.revenue_this_month, stats.revenue_last_month, 1)) * 100 : 8)}%`,
            }}>
              <div className="absolute inset-0 rounded-t-lg bg-txt-secondary/20" />
            </div>
            <span className="text-[9px] text-txt-secondary">Last mo</span>
            <span className="text-[10px] font-semibold">{formatCents(stats.revenue_last_month)}</span>
          </div>
          {/* This month bar */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t-lg relative" style={{
              height: `${Math.max(8, stats.revenue_this_month > 0 ? (stats.revenue_this_month / Math.max(stats.revenue_this_month, stats.revenue_last_month, 1)) * 100 : 8)}%`,
            }}>
              <div className="absolute inset-0 rounded-t-lg bg-gradient-to-t from-gold/40 to-gold/20" />
            </div>
            <span className="text-[9px] text-txt-secondary">This mo</span>
            <span className="text-[10px] font-semibold text-gold">{formatCents(stats.revenue_this_month)}</span>
          </div>
        </div>
      </Card>

      {/* Bookings Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-[10px] text-txt-secondary uppercase tracking-wide mb-1">Bookings</p>
          <p className="text-2xl font-heading font-bold text-cyan">{stats.total_bookings}</p>
          <p className="text-[10px] text-txt-secondary mt-1">
            {stats.bookings_this_month} this month
          </p>
        </Card>
        <Card>
          <p className="text-[10px] text-txt-secondary uppercase tracking-wide mb-1">Reviews</p>
          <p className="text-2xl font-heading font-bold text-gold">
            {review_stats.avg_rating > 0 ? review_stats.avg_rating.toFixed(1) : "--"}
          </p>
          <p className="text-[10px] text-txt-secondary mt-1">
            {review_stats.count} review{review_stats.count !== 1 ? "s" : ""}
          </p>
        </Card>
      </div>

      {/* Top Menu Items */}
      {top_items.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-txt-secondary mb-3">Top Menu Items</h2>
          <Card padding={false}>
            <div className="divide-y divide-border-subtle">
              {top_items.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xs font-bold text-txt-secondary w-5 text-center">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <div className="mt-1.5 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light"
                        style={{ width: `${(item.count / maxItemCount) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-gold shrink-0">
                    {item.count} orders
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Reviews Distribution */}
      {review_stats.count > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-txt-secondary mb-3">Rating Distribution</h2>
          <Card>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = review_stats.distribution[star] || 0;
                const pct = review_stats.count > 0 ? (count / review_stats.count) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs font-medium w-8 text-right">{star} ★</span>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gold"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-txt-secondary w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Recent Orders */}
      {recent_orders.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-txt-secondary mb-3">Recent Orders</h2>
          <div className="space-y-2">
            {recent_orders.map((order) => (
              <Card key={order.id} className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">#{order.order_number}</span>
                    <Badge
                      label={order.status}
                      variant={statusColors[order.status] || "gold"}
                      size="sm"
                    />
                  </div>
                  <p className="text-xs text-txt-secondary mt-0.5">
                    {order.customer?.display_name || "Customer"} &middot; {timeAgo(order.created_at)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gold">{formatCents(order.total)}</span>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
