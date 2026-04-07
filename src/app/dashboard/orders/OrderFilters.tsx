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

type OrderWithRelations = Order & {
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

            return (
              <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
                <Card hover>
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
                    </div>
                    <span className="text-sm font-semibold text-gold">
                      {formatCents(order.total)}
                    </span>
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
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
