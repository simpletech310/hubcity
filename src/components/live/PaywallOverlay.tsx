"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

interface PaywallOverlayProps {
  videoId: string;
  channelId: string;
  thumbnailUrl: string | null;
  ppvPriceCents: number | null;
  subscriptionPriceCents: number | null;
  currency?: string;
  reason: "ppv_required" | "subscription_required" | "auth_required";
}

function fmt(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

/**
 * Renders a blurred preview + paywall offers for a gated video. Calls the
 * /api/subscriptions/subscribe and /api/ppv/purchase endpoints which return
 * a Stripe Checkout URL we redirect to.
 */
export default function PaywallOverlay({
  videoId,
  channelId,
  thumbnailUrl,
  ppvPriceCents,
  subscriptionPriceCents,
  currency = "usd",
  reason,
}: PaywallOverlayProps) {
  const [loading, setLoading] = useState<"sub" | "ppv" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkout(kind: "sub" | "ppv") {
    setLoading(kind);
    setError(null);
    try {
      const url =
        kind === "sub"
          ? "/api/subscriptions/subscribe"
          : "/api/ppv/purchase";
      const body = kind === "sub" ? { channel_id: channelId } : { video_id: videoId };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.status === 401) {
        window.location.href = `/login?redirect=/live/watch/${videoId}`;
        return;
      }
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(null);
    }
  }

  return (
    <div className="aspect-video relative overflow-hidden rounded-2xl bg-gradient-to-br from-midnight to-deep border border-border-subtle">
      {/* Blurred thumbnail backdrop */}
      {thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-40"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/85 to-midnight/40" />
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-5 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gold/15 flex items-center justify-center mb-3">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
        <h3 className="font-heading font-bold text-base mb-1">
          {reason === "auth_required" ? "Sign in to watch" : "Premium video"}
        </h3>
        <p className="text-[11px] text-txt-secondary mb-4 max-w-xs">
          {reason === "auth_required"
            ? "Create a free account, then choose how you want to access this video."
            : reason === "subscription_required"
              ? "This video is available to channel subscribers."
              : "Subscribe for full access or buy this one video."}
        </p>

        {error && (
          <p className="text-[11px] text-coral mb-3">{error}</p>
        )}

        <div className="flex flex-col gap-2 w-full max-w-xs">
          {subscriptionPriceCents ? (
            <Button
              variant="primary"
              fullWidth
              loading={loading === "sub"}
              onClick={() => checkout("sub")}
            >
              Subscribe {fmt(subscriptionPriceCents, currency)}/mo
            </Button>
          ) : null}
          {ppvPriceCents ? (
            <Button
              variant="outline"
              fullWidth
              loading={loading === "ppv"}
              onClick={() => checkout("ppv")}
            >
              Buy this video — {fmt(ppvPriceCents, currency)}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
