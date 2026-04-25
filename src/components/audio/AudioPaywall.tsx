"use client";

import { useState } from "react";

interface Props {
  channelId: string;
  channelName?: string | null;
  priceCents: number | null;
  currency?: string | null;
  /** "Subscribe to listen" vs "Sign in to listen". */
  reason: "auth_required" | "subscription_required";
  /** Optional context for the body copy (e.g. album title). */
  contentLabel?: string | null;
}

function fmt(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

/**
 * Inline paywall block shown in place of the play button when the listener
 * isn't allowed to stream. Tapping starts the same Stripe Checkout the live
 * channel uses (`/api/subscriptions/subscribe`).
 */
export default function AudioPaywall({
  channelId,
  channelName,
  priceCents,
  currency,
  reason,
  contentLabel,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    if (reason === "auth_required") {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/subscriptions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel_id: channelId }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed to start checkout");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  const cta =
    reason === "auth_required"
      ? "SIGN IN TO LISTEN"
      : priceCents
        ? `SUBSCRIBE · ${fmt(priceCents, currency ?? "usd")}/MO`
        : "SUBSCRIBE";

  return (
    <div
      className="mt-5 w-full max-w-[320px] mx-auto"
      style={{
        border: "3px solid var(--rule-strong-c)",
        background: "var(--paper-soft, #DCD3BF)",
        padding: "16px 16px 14px",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-archivo), Archivo, sans-serif",
          fontWeight: 800,
          fontSize: 10,
          letterSpacing: "0.22em",
          background: "var(--ink-strong)",
          color: "var(--paper)",
          display: "inline-block",
          padding: "3px 7px",
          marginBottom: 10,
        }}
      >
        SUBSCRIBERS ONLY
      </div>
      <p
        className="c-serif-it"
        style={{
          fontSize: 13,
          color: "var(--ink-strong)",
          marginBottom: 12,
          lineHeight: 1.45,
        }}
      >
        {channelName ? `${channelName}` : "This channel"} releases
        {contentLabel ? ` "${contentLabel}"` : " this content"} to channel
        subscribers. Join to unlock the full library.
      </p>
      <button
        onClick={go}
        disabled={loading}
        className="press w-full"
        style={{
          background: "var(--gold-c)",
          border: "2px solid var(--ink-strong)",
          color: "var(--ink-strong)",
          fontFamily: "var(--font-archivo), Archivo, sans-serif",
          fontWeight: 800,
          fontSize: 12,
          letterSpacing: "0.18em",
          padding: "10px 12px",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "OPENING CHECKOUT…" : cta}
      </button>
      {error && (
        <p
          className="c-serif-it mt-2 text-center"
          style={{ fontSize: 11, color: "var(--ink-strong)" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
