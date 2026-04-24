"use client";

import { useEffect, useState } from "react";
import type { Channel } from "@/types/database";

function fmt(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

/**
 * Inline subscribe CTA on the channel page. Hides itself if the channel
 * doesn't sell subscriptions OR if the viewer already subscribes.
 *
 * Subscription state is fetched lazily (instead of pushed via props) so the
 * server-rendered ChannelPage doesn't have to know about Stripe at all.
 */
export default function ChannelSubscribeButton({
  channel,
  userId,
}: {
  channel: Channel;
  userId: string;
}) {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!channel.subscription_price_cents) return;
    fetch(`/api/subscriptions/status?channel_id=${channel.id}`)
      .then((r) => r.json())
      .then((d) => setActive(Boolean(d.active)))
      .catch(() => {});
  }, [channel.id, channel.subscription_price_cents]);

  if (!channel.subscription_price_cents) return null;

  // The creator can't subscribe to themselves.
  if (channel.owner_id === userId) return null;

  if (active) {
    return (
      <a
        href="/profile/subscriptions"
        className="c-btn c-btn-outline block w-full text-center press"
      >
        SUBSCRIBED · MANAGE
      </a>
    );
  }

  async function subscribe() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/subscriptions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel_id: channel.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start checkout");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={subscribe}
        disabled={loading}
        className="c-btn c-btn-primary w-full press disabled:opacity-50"
      >
        {loading
          ? "OPENING CHECKOUT…"
          : `SUBSCRIBE · ${fmt(channel.subscription_price_cents, channel.subscription_currency ?? "usd")}/MO`}
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
