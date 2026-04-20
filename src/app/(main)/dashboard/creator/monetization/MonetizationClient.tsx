"use client";

import { useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";

interface Channel {
  id: string;
  name: string;
  slug: string;
  subscription_price_cents: number | null;
  subscription_currency: string | null;
}

interface VideoRow {
  id: string;
  title: string;
  access_type: "free" | "subscribers" | "ppv" | null;
  is_premium: boolean | null;
  price_cents: number | null;
  view_count: number;
  is_published: boolean;
  published_at: string | null;
}

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function MonetizationClient({
  channel,
  stripeReady,
  videos,
}: {
  channel: Channel | null;
  stripeReady: boolean;
  videos: VideoRow[];
}) {
  const [subPrice, setSubPrice] = useState<string>(
    channel?.subscription_price_cents
      ? (channel.subscription_price_cents / 100).toFixed(2)
      : ""
  );
  const [savingSub, setSavingSub] = useState(false);
  const [subMessage, setSubMessage] = useState<string | null>(null);
  const [items, setItems] = useState<VideoRow[]>(videos);

  if (!channel) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-sm text-txt-secondary mb-4">
          You don&apos;t have a channel yet.
        </p>
        <Link href="/creators/dashboard">
          <Button variant="primary">Create your channel</Button>
        </Link>
      </div>
    );
  }

  async function saveSubscriptionPrice() {
    if (!channel) return;
    setSavingSub(true);
    setSubMessage(null);
    try {
      const cents = subPrice ? Math.round(parseFloat(subPrice) * 100) : 0;
      const res = await fetch("/api/creators/channel/subscription-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_id: channel.id,
          price_cents: cents,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save price");
      setSubMessage(
        cents === 0 ? "Subscription disabled." : "Subscription price updated."
      );
    } catch (e) {
      setSubMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingSub(false);
    }
  }

  async function updateVideo(
    id: string,
    accessType: "free" | "subscribers" | "ppv",
    priceCents: number | null
  ) {
    const prev = items;
    setItems((arr) =>
      arr.map((v) =>
        v.id === id
          ? {
              ...v,
              access_type: accessType,
              price_cents: accessType === "ppv" ? priceCents : null,
              is_premium: accessType === "ppv",
            }
          : v
      )
    );
    const res = await fetch(`/api/creators/videos/${id}/access`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_type: accessType,
        price_cents: priceCents,
      }),
    });
    if (!res.ok) {
      // Revert on failure.
      setItems(prev);
    }
  }

  return (
    <div className="animate-fade-in pb-safe">
      <div className="px-5 pt-6 pb-3">
        <Link
          href="/dashboard/creator"
          className="inline-flex items-center gap-1 text-xs text-txt-secondary hover:text-white mb-3"
        >
          <Icon name="back" size={14} /> Back
        </Link>
        <h1 className="font-heading font-bold text-2xl">Monetization</h1>
        <p className="text-xs text-txt-secondary">
          Set the price viewers pay to subscribe to {channel.name} or buy
          individual videos.
        </p>
      </div>

      {!stripeReady && (
        <div className="px-5 mb-5">
          <Card glow>
            <div className="flex items-start gap-3">
              <Icon name="warning" size={18} className="text-gold mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold mb-1">
                  Stripe onboarding required
                </p>
                <p className="text-[11px] text-txt-secondary mb-2">
                  Finish your Stripe setup before you can charge viewers.
                </p>
                <Link href="/dashboard/creator">
                  <Button variant="outline" size="sm">
                    Open Stripe setup
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Subscription price */}
      <section className="px-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full bg-gold" />
          <h2 className="font-heading font-bold text-base">
            Channel subscription
          </h2>
        </div>
        <Card>
          <p className="text-[11px] text-txt-secondary mb-3 leading-relaxed">
            Charge viewers a recurring monthly fee to access subscriber-only
            videos. We collect a {process.env.NEXT_PUBLIC_CREATOR_FEE_LABEL || "10%"}{" "}
            platform fee.
          </p>
          <label className="block text-[11px] font-semibold mb-1.5">
            Monthly price (USD)
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-txt-secondary">
                $
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={subPrice}
                onChange={(e) => setSubPrice(e.target.value)}
                placeholder="4.99"
                disabled={!stripeReady}
                className="w-full bg-white/[0.06] border border-border-subtle rounded-xl pl-7 pr-4 py-3 text-sm focus:outline-none focus:border-gold/40 disabled:opacity-50"
              />
            </div>
            <Button
              onClick={saveSubscriptionPrice}
              loading={savingSub}
              disabled={!stripeReady}
            >
              Save
            </Button>
          </div>
          {subMessage && (
            <p className="text-[11px] text-txt-secondary mt-2">{subMessage}</p>
          )}
        </Card>
      </section>

      {/* Per-video access */}
      <section className="px-5 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full bg-emerald" />
          <h2 className="font-heading font-bold text-base">Per-video pricing</h2>
        </div>
        {items.length === 0 ? (
          <Card>
            <p className="text-xs text-txt-secondary text-center py-4">
              No videos yet — upload some first.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {items.map((v) => (
              <VideoRowEditor
                key={v.id}
                video={v}
                stripeReady={stripeReady}
                onUpdate={updateVideo}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function VideoRowEditor({
  video,
  stripeReady,
  onUpdate,
}: {
  video: VideoRow;
  stripeReady: boolean;
  onUpdate: (
    id: string,
    accessType: "free" | "subscribers" | "ppv",
    priceCents: number | null
  ) => Promise<void>;
}) {
  const accessType = (video.access_type ??
    (video.is_premium ? "ppv" : "free")) as "free" | "subscribers" | "ppv";
  const [type, setType] = useState(accessType);
  const [price, setPrice] = useState(
    video.price_cents ? (video.price_cents / 100).toFixed(2) : ""
  );

  async function handleSave() {
    const cents = price ? Math.round(parseFloat(price) * 100) : null;
    await onUpdate(video.id, type, cents);
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-xs font-bold truncate">{video.title}</p>
          <p className="text-[10px] text-txt-secondary">
            {video.view_count.toLocaleString()} views
          </p>
        </div>
        <Badge
          label={
            accessType === "ppv"
              ? `PPV ${fmt(video.price_cents ?? 0)}`
              : accessType === "subscribers"
                ? "Subscribers"
                : "Free"
          }
          variant={
            accessType === "ppv"
              ? "gold"
              : accessType === "subscribers"
                ? "purple"
                : "blue"
          }
        />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {(["free", "subscribers", "ppv"] as const).map((opt) => (
          <button
            key={opt}
            onClick={() => setType(opt)}
            disabled={!stripeReady && opt !== "free"}
            className={`py-2 rounded-lg text-[11px] font-semibold capitalize transition-all
              ${type === opt ? "bg-gold/15 text-gold border border-gold/30" : "bg-white/[0.04] text-txt-secondary border border-border-subtle"}
              ${!stripeReady && opt !== "free" ? "opacity-40" : ""}
            `}
          >
            {opt}
          </button>
        ))}
      </div>

      {type === "ppv" && (
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-txt-secondary">
              $
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="2.99"
              className="w-full bg-white/[0.06] border border-border-subtle rounded-lg pl-6 pr-3 py-2 text-xs focus:outline-none focus:border-gold/40"
            />
          </div>
        </div>
      )}

      <Button size="sm" variant="outline" fullWidth onClick={handleSave}>
        Save
      </Button>
    </Card>
  );
}
