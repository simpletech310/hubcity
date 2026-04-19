"use client";

import { useState, useEffect } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripeClient } from "@/lib/stripe-client";
import { formatCents } from "@/lib/stripe";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { Stripe } from "@stripe/stripe-js";

interface TicketCheckoutFormProps {
  clientSecret: string;
  orderId: string;
  orderNumber: string;
  eventId: string;
  eventTitle: string;
  total: number;
  onSuccess: () => void;
}

// Inner form rendered inside <Elements>
function CheckoutInner({
  orderId,
  orderNumber,
  eventId,
  eventTitle,
  total,
}: Omit<TicketCheckoutFormProps, "clientSecret" | "onSuccess">) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError(null);
    setSubmitting(true);

    const returnUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/events/${eventId}/tickets/confirmation?order_id=${orderId}`
        : `/events/${eventId}/tickets/confirmation?order_id=${orderId}`;

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    });

    // If we get here Stripe did not redirect (error)
    if (stripeError) {
      setError(stripeError.message ?? "Payment failed. Please try again.");
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Order summary */}
      <Card>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-txt-secondary uppercase tracking-wide font-semibold">
              Order
            </p>
            <p className="text-xs font-mono text-gold">{orderNumber}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold truncate pr-3">{eventTitle}</p>
            <p className="text-sm font-bold text-gold shrink-0">
              {formatCents(total)}
            </p>
          </div>
        </div>
      </Card>

      {/* Stripe Payment Element */}
      <div className="rounded-2xl overflow-hidden">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-coral/10 border border-coral/20">
          <p className="text-coral text-sm">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        fullWidth
        size="lg"
        loading={submitting}
        disabled={!stripe || !elements || submitting}
      >
        Pay {formatCents(total)}
      </Button>

      <p className="text-center text-xs text-txt-secondary">
        Secured by Stripe. Your payment info is never stored by Knect.
      </p>
    </form>
  );
}

export default function TicketCheckoutForm({
  clientSecret,
  orderId,
  orderNumber,
  eventId,
  eventTitle,
  total,
  onSuccess,
}: TicketCheckoutFormProps) {
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);

  useEffect(() => {
    getStripeClient().then(setStripeInstance);
  }, []);

  if (!stripeInstance) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Elements
      stripe={stripeInstance}
      options={{
        clientSecret,
        appearance: {
          theme: "night",
          variables: {
            colorPrimary: "#D4A843",
            colorBackground: "#1a1a2e",
            colorText: "#ffffff",
            colorDanger: "#ff6b6b",
            borderRadius: "12px",
            fontFamily: "system-ui, sans-serif",
          },
        },
      }}
    >
      <div className="mb-5">
        <h2 className="font-heading font-bold text-lg">Complete Payment</h2>
        <p className="text-sm text-txt-secondary">Enter your payment details below</p>
      </div>
      <CheckoutInner
        orderId={orderId}
        orderNumber={orderNumber}
        eventId={eventId}
        eventTitle={eventTitle}
        total={total}
      />
    </Elements>
  );
}
