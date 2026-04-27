"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import type { Business, BusinessCategory } from "@/types/database";

const CATEGORIES: BusinessCategory[] = [
  "restaurant",
  "retail",
  "beauty",
  "health",
  "services",
  "entertainment",
  "other",
];

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

/**
 * Business owner edit form. Lets the signed-in business_owner update
 * the editable fields on their single business via PATCH /api/business/[id].
 * Image management defers to ImageGallery elsewhere — here we surface
 * the cover URL list as a textarea so owners can paste storage URLs
 * without us writing a full uploader for v1.
 */
export default function BusinessEditPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<BusinessCategory>("other");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [imageUrls, setImageUrls] = useState("");
  const [hours, setHours] = useState<
    Record<string, { open: string; close: string }>
  >({});
  const [acceptsOrders, setAcceptsOrders] = useState(false);
  const [acceptsBookings, setAcceptsBookings] = useState(false);
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?redirect=/dashboard/business/edit");
        return;
      }
      const { data, error: bizErr } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (bizErr) {
        setError(bizErr.message);
        setLoading(false);
        return;
      }
      if (!data) {
        setError("No business linked to your account.");
        setLoading(false);
        return;
      }
      const b = data as Business;
      setBusiness(b);
      setName(b.name);
      setDescription(b.description ?? "");
      setCategory(b.category);
      setAddress(b.address ?? "");
      setPhone(b.phone ?? "");
      setWebsite(b.website ?? "");
      setImageUrls((b.image_urls ?? []).join("\n"));
      setHours(b.hours ?? {});
      setAcceptsOrders(b.accepts_orders);
      setAcceptsBookings(b.accepts_bookings);
      setDeliveryEnabled(b.delivery_enabled);
      setIsPublished(b.is_published);
      setLoading(false);
    })();
  }, [router, supabase]);

  function setDayHours(day: string, key: "open" | "close", value: string) {
    setHours((prev) => {
      const next = { ...prev };
      const cur = next[day] ?? { open: "", close: "" };
      next[day] = { ...cur, [key]: value };
      return next;
    });
  }

  async function handleSave() {
    if (!business) return;
    setSaving(true);
    setError("");
    setSavedAt(null);
    try {
      const cleanedImageUrls = imageUrls
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const cleanedHours = Object.fromEntries(
        Object.entries(hours).filter(
          ([, v]) => v && v.open && v.close,
        ),
      );
      const res = await fetch(`/api/business/${business.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          category,
          address: address.trim(),
          phone: phone.trim() || null,
          website: website.trim() || null,
          image_urls: cleanedImageUrls,
          hours: cleanedHours,
          accepts_orders: acceptsOrders,
          accepts_bookings: acceptsBookings,
          delivery_enabled: deliveryEnabled,
          is_published: isPublished,
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

  if (loading) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="c-kicker" style={{ color: "var(--ink-mute)" }}>
          LOADING…
        </p>
      </div>
    );
  }
  if (error && !business) {
    return (
      <div className="px-5 py-10">
        <p className="c-card-t" style={{ color: "var(--ink-strong)" }}>
          {error}
        </p>
        <Link href="/dashboard" className="c-kicker mt-3 inline-block">
          ← BACK TO DASHBOARD
        </Link>
      </div>
    );
  }
  if (!business) return null;

  return (
    <div className="px-5 pb-12 pt-6 mx-auto max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="c-kicker" style={{ color: "var(--ink-mute)" }}>
            § BUSINESS EDIT
          </p>
          <h1
            className="c-hero mt-1"
            style={{ fontSize: 32, color: "var(--ink-strong)" }}
          >
            {business.name}
          </h1>
        </div>
        <Link
          href={`/business/${business.slug}`}
          className="c-kicker"
          style={{ color: "var(--gold-c)" }}
        >
          VIEW PUBLIC →
        </Link>
      </div>

      <Card className="p-5 mb-4 space-y-4">
        <Input
          label="Business name"
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
            placeholder="Tell the city what you're about."
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--ink-mute)" }}
          >
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as BusinessCategory)}
            className="w-full border rounded-xl px-4 py-3 text-sm"
            style={{
              borderColor: "var(--rule-c)",
              background: "var(--paper)",
              color: "var(--ink-strong)",
            }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(310) 555-0100"
          />
          <Input
            label="Website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://"
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--ink-mute)" }}
          >
            Image URLs (one per line) — first URL is the cover
          </label>
          <textarea
            value={imageUrls}
            onChange={(e) => setImageUrls(e.target.value)}
            rows={3}
            className="w-full border rounded-xl px-4 py-3 text-sm font-mono"
            style={{
              borderColor: "var(--rule-c)",
              background: "var(--paper)",
              color: "var(--ink-strong)",
              fontSize: 12,
            }}
            placeholder="https://…/cover.jpg"
          />
        </div>
      </Card>

      <Card className="p-5 mb-4">
        <p
          className="c-kicker mb-3"
          style={{ color: "var(--ink-mute)", fontSize: 11 }}
        >
          § HOURS
        </p>
        <div className="space-y-2">
          {DAYS.map((day) => {
            const h = hours[day] ?? { open: "", close: "" };
            return (
              <div key={day} className="flex items-center gap-2">
                <span
                  className="c-kicker w-24 shrink-0"
                  style={{ color: "var(--ink-strong)", fontSize: 11 }}
                >
                  {day.toUpperCase()}
                </span>
                <input
                  type="time"
                  value={h.open}
                  onChange={(e) => setDayHours(day, "open", e.target.value)}
                  className="border rounded-lg px-2 py-1.5 text-xs flex-1"
                  style={{
                    borderColor: "var(--rule-c)",
                    background: "var(--paper)",
                  }}
                />
                <span style={{ color: "var(--ink-mute)" }}>–</span>
                <input
                  type="time"
                  value={h.close}
                  onChange={(e) => setDayHours(day, "close", e.target.value)}
                  className="border rounded-lg px-2 py-1.5 text-xs flex-1"
                  style={{
                    borderColor: "var(--rule-c)",
                    background: "var(--paper)",
                  }}
                />
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5 mb-4">
        <p
          className="c-kicker mb-3"
          style={{ color: "var(--ink-mute)", fontSize: 11 }}
        >
          § COMMERCE TOGGLES
        </p>
        <div className="space-y-2.5">
          {[
            {
              label: "Accepts orders",
              value: acceptsOrders,
              set: setAcceptsOrders,
            },
            {
              label: "Accepts bookings",
              value: acceptsBookings,
              set: setAcceptsBookings,
            },
            {
              label: "Delivery enabled",
              value: deliveryEnabled,
              set: setDeliveryEnabled,
            },
            {
              label: "Published (visible on /business)",
              value: isPublished,
              set: setIsPublished,
            },
          ].map((row) => (
            <label
              key={row.label}
              className="flex items-center justify-between gap-3 py-1.5"
            >
              <span
                className="text-sm"
                style={{ color: "var(--ink-strong)" }}
              >
                {row.label}
              </span>
              <input
                type="checkbox"
                checked={row.value}
                onChange={(e) => row.set(e.target.checked)}
                className="w-5 h-5"
              />
            </label>
          ))}
        </div>
      </Card>

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

      <div className="flex items-center justify-between gap-3">
        <Link
          href="/dashboard"
          className="c-kicker"
          style={{ color: "var(--ink-mute)" }}
        >
          ← CANCEL
        </Link>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "SAVING…" : "SAVE CHANGES"}
        </Button>
      </div>
    </div>
  );
}
