"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import type { OrderStatus } from "@/types/database";

const STATUS_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "picked_up",
];

const STATUS_LABELS: Record<string, string> = {
  pending: "Confirm Order",
  confirmed: "Start Preparing",
  preparing: "Mark Ready",
  ready: "Mark Picked Up",
};

export default function OrderStatusUpdater({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const currentIndex = STATUS_FLOW.indexOf(currentStatus);
  const nextStatus = currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1
    ? STATUS_FLOW[currentIndex + 1]
    : null;

  if (!nextStatus || currentStatus === "cancelled" || currentStatus === "delivered") {
    return null;
  }

  async function advanceStatus() {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
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
    <div className="flex gap-2">
      <Button onClick={advanceStatus} loading={loading} fullWidth>
        {STATUS_LABELS[currentStatus] || `Move to ${nextStatus}`}
      </Button>
      {currentStatus === "pending" && (
        <Button
          variant="danger"
          loading={loading}
          onClick={async () => {
            setLoading(true);
            try {
              await fetch(`/api/orders/${orderId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "cancelled" }),
              });
              router.refresh();
            } catch {
              // Silently fail
            } finally {
              setLoading(false);
            }
          }}
        >
          Cancel
        </Button>
      )}
    </div>
  );
}
