"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import type { OrderStatus } from "@/types/database";

const statusSteps: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "picked_up",
];

const statusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  picked_up: "Picked Up",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const statusVariant: Record<string, "gold" | "emerald" | "coral" | "cyan" | "purple"> = {
  pending: "gold",
  confirmed: "cyan",
  preparing: "purple",
  ready: "emerald",
  picked_up: "emerald",
  delivered: "emerald",
  cancelled: "coral",
};

interface OrderTrackerProps {
  orderId: string;
  initialStatus: OrderStatus;
  orderNumber: string;
  businessName?: string;
}

export default function OrderTracker({
  orderId,
  initialStatus,
  orderNumber,
  businessName,
}: OrderTrackerProps) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          if (payload.new?.status) {
            setStatus(payload.new.status as OrderStatus);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, supabase]);

  const currentStepIndex = statusSteps.indexOf(status);

  return (
    <>
      {/* Order Header */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-heading text-xl font-bold">{orderNumber}</h1>
          <Badge
            label={statusLabels[status] ?? status}
            variant={statusVariant[status] ?? "gold"}
            size="md"
          />
        </div>
        {businessName && (
          <p className="text-sm text-txt-secondary">{businessName}</p>
        )}
      </div>

      {/* Status Stepper */}
      {status !== "cancelled" && (
        <Card>
          <div className="flex items-center justify-between">
            {statusSteps.map((step, i) => {
              const isActive = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <div key={step} className="flex-1 flex flex-col items-center">
                  <div className="flex items-center w-full">
                    {i > 0 && (
                      <div
                        className={`flex-1 h-0.5 ${
                          isActive ? "bg-gold" : "bg-white/10"
                        }`}
                      />
                    )}
                    <div
                      className={`w-4 h-4 rounded-full shrink-0 border-2 transition-all ${
                        isCurrent
                          ? "bg-gold border-gold shadow-lg shadow-gold/30"
                          : isActive
                          ? "bg-gold/60 border-gold/60"
                          : "bg-white/5 border-white/20"
                      }`}
                    />
                    {i < statusSteps.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 ${
                          i < currentStepIndex ? "bg-gold" : "bg-white/10"
                        }`}
                      />
                    )}
                  </div>
                  <span
                    className={`text-[9px] mt-1.5 font-semibold ${
                      isActive ? "text-gold" : "text-txt-secondary"
                    }`}
                  >
                    {statusLabels[step]}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {status === "cancelled" && (
        <Card>
          <div className="text-center py-2">
            <Badge label="Cancelled" variant="coral" size="md" />
          </div>
        </Card>
      )}
    </>
  );
}
