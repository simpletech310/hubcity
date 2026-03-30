"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function BookingActions({
  bookingId,
}: {
  bookingId: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function updateStatus(status: string) {
    setLoading(true);
    try {
      await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={() => updateStatus("confirmed")}
        loading={loading}
        className="flex-1"
      >
        Confirm
      </Button>
      <Button
        size="sm"
        variant="danger"
        onClick={() => updateStatus("cancelled")}
        loading={loading}
      >
        Cancel
      </Button>
    </div>
  );
}
