"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { OrderWithRelations } from "./OrderFilters";

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function timeAgo(date: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const ACTIVE_DELIVERY_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delayed",
];

const statusColors: Record<string, "gold" | "emerald" | "cyan" | "coral" | "purple"> = {
  pending: "gold",
  confirmed: "cyan",
  preparing: "purple",
  ready: "emerald",
  out_for_delivery: "cyan",
  delayed: "coral",
  delivered: "emerald",
  cancelled: "coral",
};

const NEXT_STATUS: Record<string, { label: string; status: string }> = {
  pending: { label: "Confirm", status: "confirmed" },
  confirmed: { label: "Prepare", status: "preparing" },
  preparing: { label: "Ready", status: "ready" },
  ready: { label: "Out for Delivery", status: "out_for_delivery" },
  out_for_delivery: { label: "Delivered", status: "delivered" },
};

export default function DeliveryOrders({
  orders,
}: {
  orders: OrderWithRelations[];
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const deliveryOrders = orders.filter(
    (o) =>
      o.type === "delivery" &&
      ACTIVE_DELIVERY_STATUSES.includes(o.status)
  );

  async function quickUpdate(orderId: string, status: string) {
    setLoadingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingId(null);
    }
  }

  if (deliveryOrders.length === 0) {
    return (
      <div className="rounded-2xl bg-white/[0.03] border border-border-subtle p-8 text-center">
        <svg
          width="40"
          height="40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          className="mx-auto text-txt-secondary/30 mb-3"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
        <p className="text-txt-secondary text-sm">No active deliveries</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {deliveryOrders.map((order) => {
        const next = NEXT_STATUS[order.status];
        const isLoading = loadingId === order.id;

        return (
          <div
            key={order.id}
            className="rounded-2xl bg-white/[0.05] border border-cyan-500/20 p-4 space-y-3"
          >
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  #{order.order_number}
                </span>
                <Badge
                  label={order.status.replace(/_/g, " ")}
                  variant={statusColors[order.status] || "gold"}
                  size="sm"
                />
              </div>
              <Link
                href={`/dashboard/orders/${order.id}`}
                className="text-[10px] text-gold font-medium uppercase tracking-wider hover:underline"
              >
                Details
              </Link>
            </div>

            {/* Large status indicator */}
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  order.status === "delayed"
                    ? "bg-coral animate-pulse"
                    : order.status === "out_for_delivery"
                    ? "bg-cyan-400 animate-pulse"
                    : "bg-gold"
                }`}
              />
              <span className="text-base font-semibold capitalize">
                {order.status === "out_for_delivery"
                  ? "Out for Delivery"
                  : order.status === "delayed"
                  ? "Delayed"
                  : order.status.replace(/_/g, " ")}
              </span>
              <span className="text-xs text-txt-secondary ml-auto">
                {timeAgo(order.created_at)}
              </span>
            </div>

            {/* Customer + address */}
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {order.customer?.display_name || "Customer"}
              </p>
              {order.delivery_address && (
                <div className="flex items-start gap-2">
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="text-txt-secondary mt-0.5 flex-shrink-0"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm text-txt-secondary">
                    {order.delivery_address}
                  </p>
                </div>
              )}
            </div>

            {/* Items summary */}
            <p className="text-xs text-txt-secondary truncate">
              {order.items
                .slice(0, 3)
                .map((i) => `${i.quantity}x ${i.name}`)
                .join(", ")}
              {order.items.length > 3 ? "..." : ""}{" "}
              &middot; {formatCents(order.total)}
            </p>

            {/* Quick action buttons */}
            {next && (
              <div className="flex gap-2">
                <Button
                  onClick={() => quickUpdate(order.id, next.status)}
                  loading={isLoading}
                  fullWidth
                  size="sm"
                >
                  {next.label}
                </Button>
                {order.status === "pending" && (
                  <Button
                    variant="danger"
                    size="sm"
                    loading={isLoading}
                    onClick={() => quickUpdate(order.id, "cancelled")}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            )}

            {/* Delayed state actions */}
            {order.status === "delayed" && (
              <div className="flex gap-2">
                <Button
                  onClick={() => quickUpdate(order.id, "out_for_delivery")}
                  loading={isLoading}
                  fullWidth
                  size="sm"
                >
                  Resume Delivery
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  loading={isLoading}
                  onClick={() => quickUpdate(order.id, "cancelled")}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
