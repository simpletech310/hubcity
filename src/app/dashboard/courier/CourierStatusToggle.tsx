"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

/**
 * Lets a courier toggle between offline / available from the inbox header.
 * Writes directly to `couriers` via the authed client — the couriers_self_update
 * RLS policy gates this.
 */
export default function CourierStatusToggle({
  courierId,
  initialStatus,
}: {
  courierId: string;
  initialStatus: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function toggle(next: string) {
    setLoading(true);
    await supabase
      .from("couriers")
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq("id", courierId);
    setStatus(next);
    setLoading(false);
    router.refresh();
  }

  const isAvailable = status === "available";
  const isOnDelivery = status === "on_delivery";

  return (
    <button
      onClick={() => toggle(isAvailable ? "offline" : "available")}
      disabled={loading || isOnDelivery}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
        isOnDelivery
          ? "bg-cyan-500/20 text-cyan-400 cursor-not-allowed"
          : isAvailable
            ? "bg-emerald-500/20 text-emerald-400"
            : "bg-white/5 text-txt-secondary hover:bg-white/10"
      }`}
    >
      {isOnDelivery ? "On delivery" : isAvailable ? "Available" : "Offline"}
    </button>
  );
}
