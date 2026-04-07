"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import type { OrderStatus } from "@/types/database";

// Pickup flow (default)
const PICKUP_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "picked_up",
];

// Delivery flow
const DELIVERY_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
];

const STATUS_LABELS: Record<string, string> = {
  pending: "Confirm Order",
  confirmed: "Start Preparing",
  preparing: "Mark Ready",
  ready: "Mark Picked Up",
  out_for_delivery: "Mark Delivered",
};

const DELIVERY_STATUS_LABELS: Record<string, string> = {
  pending: "Confirm Order",
  confirmed: "Start Preparing",
  preparing: "Mark Ready",
  ready: "Out for Delivery",
  out_for_delivery: "Mark Delivered",
};

export default function OrderStatusUpdater({
  orderId,
  currentStatus,
  orderType = "pickup",
}: {
  orderId: string;
  currentStatus: OrderStatus;
  orderType?: "pickup" | "delivery";
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isDelivery = orderType === "delivery";
  const flow = isDelivery ? DELIVERY_FLOW : PICKUP_FLOW;
  const labels = isDelivery ? DELIVERY_STATUS_LABELS : STATUS_LABELS;

  const currentIndex = flow.indexOf(currentStatus);
  const nextStatus = currentIndex >= 0 && currentIndex < flow.length - 1
    ? flow[currentIndex + 1]
    : null;

  if (!nextStatus || currentStatus === "cancelled" || currentStatus === "delivered" || currentStatus === "picked_up") {
    return null;
  }

  async function updateStatus(status: OrderStatus) {
    setLoading(true);
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
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button onClick={() => updateStatus(nextStatus)} loading={loading} fullWidth>
          {labels[currentStatus] || `Move to ${nextStatus}`}
        </Button>
        {currentStatus === "pending" && (
          <Button
            variant="danger"
            loading={loading}
            onClick={() => updateStatus("cancelled")}
          >
            Cancel
          </Button>
        )}
      </div>
      {/* Delivery-specific: Mark Delayed button when order is in transit */}
      {isDelivery && (currentStatus === "out_for_delivery" || currentStatus === "preparing" || currentStatus === "ready") && (
        <Button
          variant="secondary"
          loading={loading}
          fullWidth
          onClick={() => updateStatus("delayed")}
        >
          Mark Delayed
        </Button>
      )}
      {/* Resume from delayed state */}
      {currentStatus === "delayed" && isDelivery && (
        <div className="flex gap-2">
          <Button
            loading={loading}
            fullWidth
            onClick={() => updateStatus("out_for_delivery")}
          >
            Resume Delivery
          </Button>
          <Button
            variant="danger"
            loading={loading}
            onClick={() => updateStatus("cancelled")}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
