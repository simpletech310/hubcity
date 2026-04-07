"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import type { BookingStatus } from "@/types/database";

const STATUS_ACTIONS: Record<BookingStatus, { label: string; status: BookingStatus; variant?: "primary" | "danger" }[]> = {
  pending: [
    { label: "Confirm Booking", status: "confirmed" },
    { label: "Cancel", status: "cancelled", variant: "danger" },
  ],
  confirmed: [
    { label: "Mark Completed", status: "completed" },
    { label: "Cancel", status: "cancelled", variant: "danger" },
    { label: "No Show", status: "no_show", variant: "danger" },
  ],
  completed: [],
  cancelled: [],
  no_show: [],
};

export default function BookingStatusActions({
  bookingId,
  currentStatus,
  hasPayment,
}: {
  bookingId: string;
  currentStatus: BookingStatus;
  hasPayment: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const actions = STATUS_ACTIONS[currentStatus] ?? [];

  if (actions.length === 0) return null;

  async function updateStatus(status: BookingStatus) {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
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

  // Primary action is the first non-danger action
  const primaryAction = actions.find((a) => a.variant !== "danger");
  const dangerActions = actions.filter((a) => a.variant === "danger");

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {primaryAction && (
          <Button
            onClick={() => updateStatus(primaryAction.status)}
            loading={loading}
            fullWidth
          >
            {primaryAction.label}
          </Button>
        )}
        {dangerActions.map((action) => (
          <Button
            key={action.status}
            variant="danger"
            onClick={() => updateStatus(action.status)}
            loading={loading}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
