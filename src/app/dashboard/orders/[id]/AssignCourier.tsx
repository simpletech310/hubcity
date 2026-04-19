"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

interface CourierOption {
  id: string;
  display_name: string | null;
  phone: string | null;
  vehicle_type: string | null;
}

interface AssignCourierProps {
  orderId: string;
  couriers: CourierOption[];
}

/**
 * Minimal vendor-side courier assignment. Lists available couriers in the
 * order's city, lets the vendor pick one, and calls /api/deliveries/assign.
 *
 * If no couriers are available, shows a "None available" message rather than
 * silently hiding the panel — vendors need explicit feedback.
 */
export default function AssignCourier({ orderId, couriers }: AssignCourierProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAssign() {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/deliveries/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, courier_id: selected }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error || "Assignment failed");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assignment failed");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-cyan-500/[0.08] border border-cyan-500/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
          Assign Courier
        </h3>
      </div>

      {couriers.length === 0 ? (
        <p className="text-sm text-txt-secondary">
          No couriers available in this city right now. Check back soon.
        </p>
      ) : (
        <>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full rounded-lg bg-midnight/40 border border-border-subtle px-3 py-2 text-sm text-white"
            disabled={loading}
          >
            <option value="">Select a courier…</option>
            {couriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.display_name || "Unnamed courier"}
                {c.vehicle_type ? ` · ${c.vehicle_type}` : ""}
              </option>
            ))}
          </select>
          {error && (
            <p className="text-xs text-coral-400">{error}</p>
          )}
          <Button onClick={handleAssign} disabled={!selected || loading}>
            {loading ? "Assigning…" : "Assign"}
          </Button>
        </>
      )}
    </div>
  );
}
