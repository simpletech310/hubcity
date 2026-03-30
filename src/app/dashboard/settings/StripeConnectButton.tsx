"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

export default function StripeConnectButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConnect() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to start Stripe setup");
        setLoading(false);
        return;
      }

      // Redirect to Stripe onboarding
      window.location.href = data.url;
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div>
      <Button onClick={handleConnect} loading={loading} fullWidth>
        Set Up Stripe Payments
      </Button>
      {error && (
        <p className="text-xs text-coral mt-2">{error}</p>
      )}
    </div>
  );
}
