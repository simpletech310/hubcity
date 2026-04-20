"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

export default function OpenPortalButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to open billing portal");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div>
      <Button onClick={open} loading={loading} fullWidth variant="outline">
        Manage billing on Stripe
      </Button>
      {error && <p className="text-xs text-coral mt-2">{error}</p>}
    </div>
  );
}
