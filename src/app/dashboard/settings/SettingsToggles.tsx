"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function SettingsToggles({
  businessId,
  initialAcceptsOrders,
  initialAcceptsBookings,
  initialDeliveryEnabled,
  initialDeliveryRadius,
  initialMinOrder,
}: {
  businessId: string;
  initialAcceptsOrders: boolean;
  initialAcceptsBookings: boolean;
  initialDeliveryEnabled: boolean;
  initialDeliveryRadius: number | null;
  initialMinOrder: number;
}) {
  const [acceptsOrders, setAcceptsOrders] = useState(initialAcceptsOrders);
  const [acceptsBookings, setAcceptsBookings] = useState(initialAcceptsBookings);
  const [deliveryEnabled, setDeliveryEnabled] = useState(initialDeliveryEnabled);
  const [deliveryRadius, setDeliveryRadius] = useState(
    initialDeliveryRadius?.toString() ?? ""
  );
  const [minOrder, setMinOrder] = useState(
    initialMinOrder ? (initialMinOrder / 100).toFixed(2) : ""
  );
  const [loading, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  async function save() {
    setSaving(true);
    setSaved(false);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      await supabase
        .from("businesses")
        .update({
          accepts_orders: acceptsOrders,
          accepts_bookings: acceptsBookings,
          delivery_enabled: deliveryEnabled,
          delivery_radius: deliveryRadius ? parseFloat(deliveryRadius) : null,
          min_order: minOrder ? Math.round(parseFloat(minOrder) * 100) : 0,
        })
        .eq("id", businessId);

      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Silently fail
    } finally {
      setSaving(false);
    }
  }

  function Toggle({
    label,
    description,
    checked,
    onChange,
  }: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) {
    return (
      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-txt-secondary">{description}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`w-10 h-5 rounded-full transition-colors shrink-0 ${
            checked ? "bg-gold" : "bg-white/20"
          }`}
        >
          <div
            className={`w-4 h-4 bg-white rounded-full transition-transform mx-0.5 ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    );
  }

  return (
    <Card>
      <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-3">
        Features & Delivery
      </h3>

      <div className="space-y-1 divide-y divide-border-subtle">
        <Toggle
          label="Accept Orders"
          description="Allow customers to place orders"
          checked={acceptsOrders}
          onChange={setAcceptsOrders}
        />
        <Toggle
          label="Accept Bookings"
          description="Allow customers to book appointments"
          checked={acceptsBookings}
          onChange={setAcceptsBookings}
        />
        <Toggle
          label="Delivery"
          description="Offer delivery to customers"
          checked={deliveryEnabled}
          onChange={setDeliveryEnabled}
        />
      </div>

      {deliveryEnabled && (
        <div className="mt-3 space-y-3">
          <Input
            label="Delivery Radius (miles)"
            placeholder="5"
            type="number"
            min="0"
            step="0.5"
            value={deliveryRadius}
            onChange={(e) => setDeliveryRadius(e.target.value)}
          />
        </div>
      )}

      <div className="mt-3">
        <Input
          label="Minimum Order ($)"
          placeholder="0.00"
          type="number"
          min="0"
          step="0.01"
          value={minOrder}
          onChange={(e) => setMinOrder(e.target.value)}
        />
      </div>

      <div className="mt-4">
        <Button onClick={save} loading={loading} fullWidth size="sm">
          {saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>
    </Card>
  );
}
