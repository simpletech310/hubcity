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
    <div
      className="aspect-video relative overflow-hidden"
      style={{
        background: "var(--ink-strong)",
        border: "2px solid var(--rule-strong-c)",
      }}
    >
      {/* Blurred thumbnail backdrop */}
      {thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-40"
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, var(--ink-strong) 0%, rgba(10,10,10,0.85) 50%, rgba(10,10,10,0.55) 100%)",
        }}
      />
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-5 text-center">
        <div
          className="w-12 h-12 flex items-center justify-center mb-3"
          style={{
            background: "var(--gold-c)",
            border: "2px solid var(--gold-c)",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--ink-strong)" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
        <h3
          className="c-hero mb-1"
          style={{ fontSize: 22, color: "var(--paper)", lineHeight: 1 }}
        >
          {reason === "auth_required" ? "SIGN IN TO WATCH" : "PREMIUM VIDEO"}
        </h3>
        <p
          className="c-serif-it mb-4 max-w-xs"
          style={{ fontSize: 12, color: "var(--paper)", opacity: 0.75 }}
        >
          {reason === "auth_required"
            ? "Create a free account, then choose how you want to access this video."
            : reason === "subscription_required"
              ? "This video is available to channel subscribers."
              : "Subscribe for full access or buy this one video."}
        </p>

        {error && (
          <p
            className="c-kicker mb-3"
            style={{ fontSize: 10, color: "var(--gold-c)", letterSpacing: "0.14em" }}
          >
            {error.toUpperCase()}
          </p>
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
