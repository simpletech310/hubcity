"use client";

import { useState } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripeClient } from "@/lib/stripe-client";

interface PaymentSheetProps {
  open: boolean;
  onClose: () => void;
  clientSecret: string;
  orderId: string;
  orderNumber: string;
  total: number;
  onSuccess: (orderId: string) => void;
}

function CheckoutForm({
  orderId,
  orderNumber,
  total,
  onSuccess,
  onClose,
}: {
  orderId: string;
  orderNumber: string;
  total: number;
  onSuccess: (orderId: string) => void;
  onClose: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || "Payment failed");
      setLoading(false);
      return;
    }

    const { error: confirmError, paymentIntent } =
      await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

    if (confirmError) {
      setError(confirmError.message || "Payment failed");
      setLoading(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      // Confirm the order on our backend
      try {
        const res = await fetch("/api/orders/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: orderId }),
        });

        if (!res.ok) {
          throw new Error("Failed to confirm order");
        }

        onSuccess(orderId);
      } catch {
        setError("Payment succeeded but order confirmation failed. Contact support.");
        setLoading(false);
      }
    } else {
      setError("Payment was not completed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Order summary */}
      <div className="c-ink-block p-4 flex items-center justify-between">
        <div>
          <p className="c-kicker" style={{ color: "var(--paper)", opacity: 0.7 }}>Order</p>
          <p className="c-card-t mt-1" style={{ color: "var(--paper)", fontSize: "14px" }}>{orderNumber}</p>
        </div>
        <div className="text-right">
          <p className="c-kicker" style={{ color: "var(--paper)", opacity: 0.7 }}>Total</p>
          <p className="c-hero mt-1" style={{ color: "var(--gold-c)", fontSize: "22px" }}>
            ${(total / 100).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="c-frame p-3" style={{ background: "var(--paper)" }}>
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {error && (
        <div
          className="p-3"
          style={{
            background: "var(--paper)",
            border: "2px solid var(--red-c, #c0392b)",
            color: "var(--red-c, #c0392b)",
          }}
        >
          <p className="c-meta" style={{ color: "inherit" }}>{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="c-btn c-btn-outline flex-1"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !stripe || !elements}
          className="c-btn c-btn-primary flex-[2]"
          style={{ opacity: loading ? 0.6 : 1 }}
        >
          {loading ? "Processing..." : `Pay $${(total / 100).toFixed(2)}`}
        </button>
      </div>
    </form>
  );
}

export default function PaymentSheet({
  open,
  onClose,
  clientSecret,
  orderId,
  orderNumber,
  total,
  onSuccess,
}: PaymentSheetProps) {
  if (!open) return null;

  const stripePromise = getStripeClient();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(26,21,18,0.72)" }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 max-w-[430px] mx-auto">
        <div
          style={{
            background: "var(--paper)",
            color: "var(--ink-strong)",
            borderTop: "3px solid var(--rule-strong-c)",
          }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div
              className="w-10 h-1"
              style={{ background: "var(--ink-strong)", opacity: 0.4 }}
            />
          </div>

          {/* Header */}
          <div
            className="px-5 pb-3"
            style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
          >
            <h2 className="c-hero" style={{ fontSize: "24px" }}>Payment</h2>
            <p className="c-kicker mt-1" style={{ opacity: 0.7 }}>
              Secure checkout powered by Stripe
            </p>
          </div>

          {/* Stripe Elements */}
          <div className="px-5 pt-4 pb-8">
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "flat",
                  variables: {
                    colorPrimary: "#1A1512",
                    colorBackground: "#EDE6D6",
                    colorText: "#1A1512",
                    colorTextSecondary: "#5B544D",
                    borderRadius: "0px",
                    fontFamily: "Inter, system-ui, sans-serif",
                  },
                },
              }}
            >
              <CheckoutForm
                orderId={orderId}
                orderNumber={orderNumber}
                total={total}
                onSuccess={onSuccess}
                onClose={onClose}
              />
            </Elements>
          </div>
        </div>
      </div>
    </>
  );
}
