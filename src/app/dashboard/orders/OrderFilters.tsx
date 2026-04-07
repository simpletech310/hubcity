"use client";

import { useState } from "react";
import Link from "next/link";
import Chip from "@/components/ui/Chip";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { Order } from "@/types/database";

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

const statusColors: Record<string, "gold" | "emerald" | "cyan" | "coral" | "purple"> = {
  pending: "gold",
  confirmed: "cyan",
  preparing: "purple",
  ready: "emerald",
  picked_up: "emerald",
  delivered: "emerald",
  cancelled: "coral",
};

const ACTIVE_STATUSES = ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delayed"];

export type OrderWithRelations = Order & {
  customer: { display_name: string } | null;
  items: { id: string; name: string; quantity: number }[];
};

const FILTERS = ["All", "Pending", "Active", "Ready", "Completed", "Cancelled"] as const;

const FILTER_STATUSES: Record<string, string[]> = {
  All: [],
  Pending: ["pending"],
  Active: ["confirmed", "preparing"],
  Ready: ["ready"],
  Completed: ["picked_up", "delivered"],
  Cancelled: ["cancelled"],
};

export default function OrderFilters({
  orders,
}: {
  orders: OrderWithRelations[];
}) {
  const [filter, setFilter] = useState<string>("All");

  const filtered =
    filter === "All"
      ? orders
      : orders.filter((o) =>
          FILTER_STATUSES[filter]?.includes(o.status)
        );

  return (
    <>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {FILTERS.map((f) => (
          <Chip
            key={f}
            label={f}
            active={filter === f}
            onClick={() => setFilter(f)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-txt-secondary text-sm">No orders found</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => {
            const itemSummary =
              order.items
                .slice(0, 3)
                .map((i) => `${i.quantity}x ${i.name}`)
                .join(", ") + (order.items.length > 3 ? "..." : "");

            const isActive = ACTIVE_STATUSES.includes(order.status);

            return (
              <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
                <div
                  className={`rounded-2xl border p-4 transition-all duration-150 active:scale-[0.97] active:brightness-90 ${
                    isActive
                      ? "bg-white/[0.05] border-gold/20 hover:border-gold/40"
                      : "bg-white/[0.03] border-border-subtle hover:border-white/10"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        #{order.order_number}
                      </span>
                      <Badge
                        label={order.status}
                        variant={statusColors[order.status] || "gold"}
                        size="sm"
                      />
                      {order.type === "delivery" && (
                        <span className="text-[10px] text-cyan-400 font-medium uppercase tracking-wider">
                          Delivery
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gold">
                        {formatCents(order.total)}
                      </span>
                      {/* Chevron indicator */}
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        className="text-txt-secondary/50 flex-shrink-0"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-txt-secondary">
                    {order.customer?.display_name || "Customer"} &middot;{" "}
                    {timeAgo(order.created_at)}
                  </p>
                  {itemSummary && (
                    <p className="text-xs text-txt-secondary mt-1 truncate">
                      {itemSummary}
                    </p>
                  )}
                  {/* Action hint for active orders */}
                  {isActive && (
                    <p className="text-[10px] text-gold/70 mt-2 font-medium">
                      Tap to manage order
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
