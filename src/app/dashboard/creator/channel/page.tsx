"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

interface ChannelRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  type: string;
  is_active: boolean;
  is_verified: boolean;
  follower_count: number;
  subscription_price_cents: number | null;
  subscription_currency: string | null;
}

/**
 * /dashboard/creator/channel — single-page editor for the signed-in
 * creator's channel. Channels auto-create on signup (migration 079);
 * this surface lets the owner rename, swap avatar/banner, edit
 * description, toggle active, and set the monthly subscription price.
 *
 * Subscription pricing routes through /api/creators/channel/subscription-price
 * which manages the Stripe Product + Price under the hood. Plain
 * metadata (name/description/avatar/banner/active) PATCHes /api/channels/[id].
 */
export default function CreatorChannelPage() {
  const supabase = useMemo(() => createClient(), []);

  const [channel, setChannel] = useState<ChannelRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [priceDollars, setPriceDollars] = useState("");

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("channels")
        .select(
          "id, name, slug, description, avatar_url, banner_url, type, is_active, is_verified, follower_count, subscription_price_cents, subscription_currency",
        )
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (data) {
        const c = data as ChannelRow;
        setChannel(c);
        setName(c.name);
        setDescription(c.description ?? "");
        setAvatarUrl(c.avatar_url ?? "");
        setBannerUrl(c.banner_url ?? "");
        setIsActive(c.is_active);
        setPriceDollars(
          c.subscription_price_cents
            ? (c.subscription_price_cents / 100).toFixed(2)
            : "",
        );
      }
      setLoading(false);
    })();
  }, [supabase]);

  async function handleSaveMetadata() {
    if (!channel) return;
    setSaving(true);
    setError("");
    setSavedAt(null);
    try {
      const res = await fetch(`/api/channels/${channel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          avatar_url: avatarUrl.trim() || null,
          banner_url: bannerUrl.trim() || null,
          is_active: isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
      } else {
        setSavedAt(Date.now());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePrice() {
    if (!channel) return;
    setSavingPrice(true);
    setError("");
    try {
      const cents = priceDollars
        ? Math.round(parseFloat(priceDollars) * 100)
        : null;
      const res = await fetch("/api/creators/channel/subscription-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_id: channel.id,
          price_cents: cents,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update subscription price");
      } else {
        setSavedAt(Date.now());
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to update subscription price",
      );
    } finally {
      setSavingPrice(false);
    }
  }

  if (loading) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="c-kicker" style={{ color: "var(--ink-mute)" }}>
          LOADING…
        </p>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="px-5 py-10">
        <p className="c-card-t" style={{ color: "var(--ink-strong)" }}>
          You don&rsquo;t have a channel yet.
        </p>
        <p
          className="c-serif-it mt-1"
          style={{ fontSize: 13, color: "var(--ink-mute)" }}
        >
          Channels auto-create when you become a content creator. Ping ops
          if yours is missing.
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 pb-12 pt-6 mx-auto max-w-2xl">
      <div className="mb-5">
        <Link
          href="/dashboard/creator/content"
          className="c-kicker"
          style={{ color: "var(--ink-mute)" }}
        >
          ← CREATOR
        </Link>
        <h1
          className="c-hero mt-2"
          style={{ fontSize: 32, color: "var(--ink-strong)" }}
        >
          Your Channel
        </h1>
        <p
          className="c-serif-it mt-1"
          style={{ fontSize: 13, color: "var(--ink-mute)" }}
        >
          {channel.follower_count} follower
          {channel.follower_count === 1 ? "" : "s"} · /channel/
          {channel.slug}
          {channel.is_verified ? " · ✓ verified" : ""}
        </p>
      </div>

      {error && (
        <div
          className="mb-4 px-4 py-3 rounded-lg"
          style={{
            background: "rgba(232,72,85,0.08)",
            color: "var(--red-c, #E84855)",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
      {savedAt && (
        <div
          className="mb-4 px-4 py-3 rounded-lg"
          style={{
            background: "rgba(34,197,94,0.08)",
            color: "#0e7434",
            fontSize: 13,
          }}
        >
          Saved.
        </div>
      )}

      <Card className="p-5 mb-4 space-y-4">
        <p
          className="c-kicker"
          style={{ color: "var(--ink-mute)", fontSize: 11 }}
        >
          § BRANDING
        </p>
        <Input
          label="Channel name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--ink-mute)" }}
          >
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full border rounded-xl px-4 py-3 text-sm"
            style={{
              borderColor: "var(--rule-c)",
              background: "var(--paper)",
              color: "var(--ink-strong)",
            }}
            placeholder="A line about what your channel covers."
          />
        </div>
        <Input
          label="Avatar URL"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://…/avatar.jpg"
        />
        <Input
          label="Banner URL"
          value={bannerUrl}
          onChange={(e) => setBannerUrl(e.target.value)}
          placeholder="https://…/banner.jpg"
        />
        <div
          className="flex items-start justify-between gap-3 py-2 px-3"
          style={{
            background: isActive ? "rgba(34,197,94,0.08)" : "rgba(232,72,85,0.08)",
            border: "1px solid var(--rule-c)",
            borderRadius: 8,
          }}
        >
          <div className="min-w-0">
            <p
              className="text-sm font-medium"
              style={{ color: "var(--ink-strong)" }}
            >
              {isActive ? "Channel is ON" : "Channel is OFF"}
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--ink-mute)" }}
            >
              {isActive
                ? `Visible on /live, /creators cards, and /channel/${channel.slug}.`
                : "Hidden from /live, /creators rails, profile cards, and the channel page. Posts + reels still publish to your profile."}
            </p>
          </div>
          <label className="flex items-center gap-2 shrink-0">
            <span className="text-xs" style={{ color: "var(--ink-mute)" }}>
              {isActive ? "ON" : "OFF"}
            </span>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-5 h-5"
              aria-label="Channel active"
            />
          </label>
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={handleSaveMetadata} disabled={saving}>
            {saving ? "SAVING…" : "SAVE BRANDING"}
          </Button>
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <p
          className="c-kicker"
          style={{ color: "var(--ink-mute)", fontSize: 11 }}
        >
          § MONTHLY SUBSCRIPTION
        </p>
        <p
          className="c-serif-it"
          style={{ fontSize: 13, color: "var(--ink-mute)" }}
        >
          Set a monthly price for fans to subscribe to your channel. Leave
          empty to keep your channel free. Stripe Connect onboarding is
          required before a paid subscription can go live.
        </p>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Input
              label="Price (USD per month)"
              type="number"
              step="0.01"
              min="0"
              value={priceDollars}
              onChange={(e) => setPriceDollars(e.target.value)}
              placeholder="e.g. 4.99"
            />
          </div>
          <Button onClick={handleSavePrice} disabled={savingPrice}>
            {savingPrice ? "SAVING…" : "SAVE PRICE"}
          </Button>
        </div>
        {channel.subscription_price_cents ? (
          <p
            className="c-meta"
            style={{ color: "var(--ink-mute)" }}
          >
            Currently $
            {(channel.subscription_price_cents / 100).toFixed(2)} /
            month
          </p>
        ) : (
          <p
            className="c-meta"
            style={{ color: "var(--ink-mute)" }}
          >
            Currently free.
          </p>
        )}
        <Link
          href="/dashboard/creator/settings/stripe"
          className="c-kicker inline-block"
          style={{ color: "var(--gold-c)" }}
        >
          STRIPE STATUS →
        </Link>
      </Card>
    </div>
  );
}
