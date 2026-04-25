"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { OrderStatus } from "@/types/database";

const STATUS_STEPS: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "picked_up",
];

const STATUS_LABEL: Record<string, string> = {
  pending: "PENDING",
  confirmed: "CONFIRMED",
  preparing: "PREPARING",
  ready: "READY",
  picked_up: "PICKED UP",
  delivered: "DELIVERED",
  cancelled: "CANCELLED",
};

interface OrderTrackerProps {
  orderId: string;
  initialStatus: OrderStatus;
  /** Kept for back-compat; the page renders its own order number now. */
  orderNumber?: string;
  /** Same — kept so the existing call site doesn't have to change. */
  businessName?: string;
}

/**
 * Newsprint-style horizontal status stepper. The page wrapper renders the
 * order number + business + status pill above this component, so the
 * tracker's job is purely the visual progress timeline. Re-subscribes to
 * Supabase realtime for live status flips during pickup / delivery.
 */
export default function OrderTracker({
  orderId,
  initialStatus,
}: OrderTrackerProps) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to both the parent order row AND the deliveries row for this
    // order. Deliveries status changes are what drive the text-based "live"
    // feel during the courier handoff (picked_up -> delivered).
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
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deliveries",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const delStatus = (payload.new as { status?: string } | null)?.status;
          if (delStatus === "picked_up") {
            setStatus("out_for_delivery" as OrderStatus);
          } else if (delStatus === "delivered") {
            setStatus("delivered" as OrderStatus);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, supabase]);

  const currentStepIndex = STATUS_STEPS.indexOf(status);

  if (status === "cancelled") {
    return (
      <div
        className="px-4 py-3"
        style={{
          background: "var(--paper)",
          border: "2px solid var(--rule-strong-c)",
        }}
      >
        <div
          className="c-kicker"
          style={{ fontSize: 11, color: "var(--ink-mute)", letterSpacing: "0.18em" }}
        >
          § ORDER CANCELLED — ANY CHARGE IS BEING REFUNDED.
        </div>
      </div>
    );
  }

  return (
    <div
      className="c-kicker"
      style={{
        background: "var(--paper)",
        border: "2px solid var(--rule-strong-c)",
        padding: "16px 14px 12px",
      }}
    >
      <div className="flex items-center justify-between gap-1">
        {STATUS_STEPS.map((step, i) => {
          const isActive = i <= currentStepIndex;
          const isCurrent = i === currentStepIndex;
          return (
            <div
              key={step}
              className="flex-1 flex flex-col items-center"
              style={{ minWidth: 0 }}
            >
              <div className="flex items-center w-full">
                {i > 0 && (
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      background: isActive ? "var(--ink-strong)" : "var(--rule-c)",
                    }}
                  />
                )}
                <div
                  style={{
                    width: isCurrent ? 16 : 12,
                    height: isCurrent ? 16 : 12,
                    flexShrink: 0,
                    background: isCurrent
                      ? "var(--gold-c)"
                      : isActive
                        ? "var(--ink-strong)"
                        : "var(--paper-soft, #DCD3BF)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                />
                {i < STATUS_STEPS.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      background:
                        i < currentStepIndex ? "var(--ink-strong)" : "var(--rule-c)",
                    }}
                  />
                )}
              </div>
              <span
                style={{
                  marginTop: 8,
                  fontFamily: "var(--font-archivo), Archivo, sans-serif",
                  fontWeight: isCurrent ? 800 : 700,
                  fontSize: 9,
                  letterSpacing: "0.14em",
                  color: isActive ? "var(--ink-strong)" : "var(--ink-mute)",
                  textAlign: "center",
                  textTransform: "uppercase",
                  // wrap long labels (e.g. "PICKED UP")
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  width: "100%",
                  display: "inline-block",
                }}
              >
                {STATUS_LABEL[step]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
