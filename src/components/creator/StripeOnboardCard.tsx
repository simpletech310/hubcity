"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";

interface Status {
  connected: boolean;
  onboarding_complete: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
}

export default function StripeOnboardCard({ initial }: { initial: Status }) {
  const [status] = useState<Status>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/creator/connect", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start onboarding");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  if (status.onboarding_complete && status.charges_enabled) {
    return (
      <Card>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald/15 flex items-center justify-center shrink-0">
            <Icon name="check" size={20} className="text-emerald" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">Stripe connected</p>
            <p className="text-[11px]" style={{ color: "var(--ink-mute)" }}>
              {status.charges_enabled ? "Charges enabled" : "Charges pending"} ·{" "}
              {status.payouts_enabled ? "Payouts enabled" : "Payouts pending"}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card glow>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-gold/15 flex items-center justify-center shrink-0">
          <Icon name="dollar" size={20} className="text-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold mb-1">
            {status.connected
              ? "Finish your Stripe setup"
              : "Connect Stripe to get paid"}
          </p>
          <p className="text-[11px] text-txt-secondary leading-relaxed">
            We use Stripe to send your subscription and pay-per-view earnings
            straight to your bank. Setup takes about 5 minutes.
          </p>
        </div>
      </div>
      <Button onClick={start} loading={loading} fullWidth>
        {status.connected ? "Continue Onboarding" : "Connect Stripe"}
      </Button>
      {error && <p className="text-xs text-coral mt-2">{error}</p>}
    </Card>
  );
}
