"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function useAvailability(itemId: string, isAvailable: boolean) {
  const [available, setAvailable] = useState(isAvailable);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    if (loading) return;
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

  return { available, loading, toggle };
}

/** Full pill toggle shown in the actions row */
export default function MenuAvailabilityToggle({
  itemId,
  isAvailable,
}: {
  itemId: string;
  isAvailable: boolean;
}) {
  const { available, loading, toggle } = useAvailability(itemId, isAvailable);

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 shrink-0 ${loading ? "opacity-50" : ""}`}
      aria-label={available ? "Mark as 86'd" : "Mark as available"}
    >
      {/* Label */}
      <span
        className={`text-xs font-semibold transition-colors ${
          available ? "text-txt-secondary" : "text-coral"
        }`}
      >
        {available ? "Available" : "86\u2019d"}
      </span>

      {/* Pill track */}
      <div
        className={`relative w-10 h-5 rounded-full transition-colors ${
          available ? "bg-emerald" : "bg-coral/30"
        }`}
      >
        {/* Thumb */}
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
            available
              ? "left-[calc(100%-1.125rem)] bg-white"
              : "left-0.5 bg-coral"
          }`}
        />
      </div>
    </button>
  );
}

/** Tappable "86'd" badge in the card header — tapping restores availability */
export function EightySixBadge({
  itemId,
  isAvailable,
}: {
  itemId: string;
  isAvailable: boolean;
}) {
  const { available, loading, toggle } = useAvailability(itemId, isAvailable);

  if (available) return null;

  return (
    <button
      onClick={(e) => {
        e.preventDefault(); // don't follow the parent Link
        toggle();
      }}
      disabled={loading}
      className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide bg-coral/20 text-coral border border-coral/30 hover:bg-coral/30 transition-colors ${
        loading ? "opacity-50" : ""
      }`}
      aria-label="Un-86 this item"
    >
      86&rsquo;d
    </button>
  );
}
