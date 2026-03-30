"use client";

import { useState } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripeClient } from "@/lib/stripe-client";
import Button from "@/components/ui/Button";

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
      <div className="flex items-center justify-between px-1 mb-2">
        <div>
          <p className="text-xs text-txt-secondary">Order</p>
          <p className="text-sm font-bold">{orderNumber}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-txt-secondary">Total</p>
          <p className="text-lg font-heading font-bold text-gold">
            ${(total / 100).toFixed(2)}
          </p>
        </div>
      </div>

      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      {error && (
        <div className="bg-coral/10 border border-coral/20 rounded-xl p-3">
          <p className="text-xs text-coral">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 text-sm font-medium text-txt-secondary bg-white/5 rounded-xl press"
          disabled={loading}
        >
          Cancel
        </button>
        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={loading}
          disabled={!stripe || !elements}
          className="flex-[2]"
        >
          Pay ${(total / 100).toFixed(2)}
        </Button>
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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 max-w-[430px] mx-auto">
        <div className="bg-deep border-t border-border-subtle rounded-t-3xl">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="px-5 pb-3">
            <h2 className="font-heading text-lg font-bold">Payment</h2>
            <p className="text-xs text-txt-secondary">
              Secure checkout powered by Stripe
            </p>
          </div>

          {/* Stripe Elements */}
          <div className="px-5 pb-8">
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "night",
                  variables: {
                    colorPrimary: "#F2A900",
                    colorBackground: "#1a1a2e",
                    colorText: "#FFFFFF",
                    colorTextSecondary: "#9E9A93",
                    borderRadius: "12px",
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
