"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MenuAvailabilityToggle({
  itemId,
  isAvailable,
}: {
  itemId: string;
  isAvailable: boolean;
}) {
  const [available, setAvailable] = useState(isAvailable);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    setLoading(true);
    const newValue = !available;
    setAvailable(newValue);

    try {
      const res = await fetch(`/api/menu-items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_available: newValue }),
      });

      if (!res.ok) {
        setAvailable(!newValue); // revert
      } else {
        router.refresh();
      }
    } catch {
      setAvailable(!newValue); // revert
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`w-10 h-5 rounded-full transition-colors shrink-0 ${
        available ? "bg-emerald" : "bg-white/20"
      } ${loading ? "opacity-50" : ""}`}
    >
      <div
        className={`w-4 h-4 bg-white rounded-full transition-transform mx-0.5 ${
          available ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
