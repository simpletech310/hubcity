"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabId = "saved" | "rsvps" | "orders" | "subscriptions";

interface SavedItem {
  id: string;
  item_id: string;
  item_type: string;
  created_at: string;
}

interface EventRsvp {
  id: string;
  event_id: string;
  status: string;
  events: {
    id: string;
    title: string;
    starts_at: string;
    cover_image_url: string | null;
  } | null;
}

interface Order {
  id: string;
  status: string;
  total: number;
  created_at: string;
  businesses: { name: string } | null;
}

interface ChannelSubscription {
  id: string;
  status: string;
  channel_id: string;
  channels: {
    id: string;
    name: string;
    slug: string | null;
  } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatEventDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function SkeletonCards() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="c-frame overflow-hidden animate-pulse"
          style={{ animationDelay: `${i * 80}ms`, background: "var(--paper-soft)" }}
        >
          <div className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-black/10 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-black/10 rounded-full w-3/4" />
              <div className="h-2.5 bg-black/5 rounded-full w-1/2" />
            </div>
            <div className="w-14 h-5 bg-black/10 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({
  iconName,
  message,
  cta,
}: {
  iconName: Parameters<typeof Icon>[0]["name"];
  message: string;
  cta: { label: string; href: string };
}) {
  return (
    <div className="text-center py-16 flex flex-col items-center gap-3">
      <div className="w-14 h-14 rounded-full border border-black/20 flex items-center justify-center" style={{ background: "var(--paper-soft)" }}>
        <Icon name={iconName} size={24} style={{ color: "var(--ink-strong)" }} />
      </div>
      <p className="c-body max-w-[220px] leading-relaxed">
        {message}
      </p>
      <Link
        href={cta.href}
        className="text-[12px] font-bold text-gold press hover:underline"
      >
        {cta.label} →
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badge helpers
// ---------------------------------------------------------------------------

type BadgeVariant = "gold" | "cyan" | "coral" | "purple" | "emerald";

function savedBadge(itemType: string): { variant: BadgeVariant; label: string } {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    business: { variant: "gold", label: "Business" },
    event: { variant: "cyan", label: "Event" },
    post: { variant: "coral", label: "Post" },
    reel: { variant: "purple", label: "Reel" },
  };
  return map[itemType] ?? { variant: "gold", label: itemType };
}

function rsvpBadgeVariant(status: string): "emerald" | "gold" | "coral" {
  if (status === "confirmed" || status === "going") return "emerald";
  if (status === "cancelled") return "coral";
  return "gold";
}

function orderBadgeVariant(status: string): "emerald" | "gold" | "coral" {
  if (status === "completed" || status === "delivered") return "emerald";
  if (status === "cancelled" || status === "refunded") return "coral";
  return "gold";
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HubPage() {
  const [activeTab, setActiveTab] = useState<TabId>("saved");
  const [loading, setLoading] = useState(true);

  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [rsvps, setRsvps] = useState<EventRsvp[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<ChannelSubscription[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const [savedRes, rsvpRes, ordersRes, subsRes] = await Promise.all([
          supabase
            .from("saved_items")
            .select("id, item_id, item_type, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(30),

          supabase
            .from("event_rsvps")
            .select(
              "id, event_id, status, events(id, title, starts_at, cover_image_url)"
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20),

          supabase
            .from("orders")
            .select("id, status, total, created_at, businesses(name)")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20),

          supabase
            .from("channel_subscriptions")
            .select("id, status, channel_id, channels(id, name, slug)")
            .eq("user_id", user.id)
            .eq("status", "active")
            .limit(20),
        ]);

        if (cancelled) return;

        setSavedItems((savedRes.data as SavedItem[]) ?? []);
        setRsvps((rsvpRes.data as unknown as EventRsvp[]) ?? []);
        setOrders((ordersRes.data as unknown as Order[]) ?? []);
        setSubscriptions(
          (subsRes.data as unknown as ChannelSubscription[]) ?? []
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "saved", label: "Saved", count: savedItems.length },
    { id: "rsvps", label: "RSVPs", count: rsvps.length },
    { id: "orders", label: "Orders", count: orders.length },
    { id: "subscriptions", label: "Subscriptions", count: subscriptions.length },
  ];

  return (
    <div className="culture-surface min-h-dvh animate-fade-in pb-safe">
      {/* ------------------------------------------------------------------ */}
      {/* Page header                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="px-5 pt-6 pb-4" style={{ borderBottom: "3px solid var(--rule-strong-c)" }}>
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 text-sm font-semibold press mb-3"
          style={{ color: "var(--ink-strong)" }}
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M10 12L6 8l4-4" />
          </svg>
          Profile
        </Link>
        <p className="c-kicker">§ PROFILE · HUB</p>
        <h1 className="c-hero">Your Hub.</h1>
        <p className="c-serif-it">
          All your activity in one place.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Tab pills                                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex gap-2 px-5 py-4 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`c-chip ${isActive ? "active gold" : ""}`}
            >
              {tab.label}
              {!loading && tab.count > 0 && (
                <span
                  className={`
                    inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold ml-1.5
                    ${isActive ? "bg-black/20" : "bg-black/10"}
                  `}
                  style={{ color: "var(--ink-strong)" }}
                >
                  {tab.count > 99 ? "99+" : tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Tab content                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="px-5">
        {loading ? (
          <SkeletonCards />
        ) : (
          <>
            {/* ---- Saved ---- */}
            {activeTab === "saved" && (
              <div className="animate-fade-in">
                {savedItems.length === 0 ? (
                  <EmptyState
                    iconName="bookmark"
                    message="Nothing saved yet — explore the scene"
                    cta={{ label: "Explore", href: "/" }}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {savedItems.map((item) => {
                      const badge = savedBadge(item.item_type);
                      return (
                        <Link key={item.id} href="#">
                          <Card
                            variant="glass"
                            hover
                            className="relative overflow-hidden h-full"
                          >
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gold/30" />
                            <div className="flex flex-col gap-2 h-full min-h-[80px]">
                              <Badge
                                label={badge.label}
                                variant={badge.variant}
                              />
                              <p className="text-[12px] font-semibold leading-snug flex-1 capitalize">
                                Item &middot; {item.item_type}
                              </p>
                              <p className="text-[10px] text-txt-secondary mt-auto">
                                {timeAgo(item.created_at)}
                              </p>
                            </div>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ---- RSVPs ---- */}
            {activeTab === "rsvps" && (
              <div className="animate-fade-in space-y-3">
                {rsvps.length === 0 ? (
                  <EmptyState
                    iconName="calendar"
                    message="No upcoming events — find something to do"
                    cta={{ label: "Browse Events", href: "/events" }}
                  />
                ) : (
                  rsvps.map((rsvp) => {
                    const event = rsvp.events;
                    const badgeVariant = rsvpBadgeVariant(rsvp.status);
                    const badgeLabel =
                      rsvp.status.charAt(0).toUpperCase() +
                      rsvp.status.slice(1);
                    return (
                      <Card
                        key={rsvp.id}
                        variant="glass"
                        className="relative overflow-hidden"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-hc-blue rounded-l-xl" />
                        <div className="flex items-center gap-3">
                          {/* Cover thumbnail */}
                          {event?.cover_image_url ? (
                            <img
                              src={event.cover_image_url}
                              alt={event.title}
                              className="w-10 h-10 rounded-lg object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-hc-blue/10 flex items-center justify-center shrink-0">
                              <Icon
                                name="calendar"
                                size={18}
                                className="text-hc-blue"
                              />
                            </div>
                          )}
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold truncate">
                              {event?.title ?? "Event"}
                            </p>
                            <p className="text-[10px] text-txt-secondary mt-0.5">
                              {event?.starts_at
                                ? formatEventDate(event.starts_at)
                                : "Date TBD"}
                            </p>
                          </div>
                          <Badge label={badgeLabel} variant={badgeVariant} />
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            )}

            {/* ---- Orders ---- */}
            {activeTab === "orders" && (
              <div className="animate-fade-in space-y-3">
                {orders.length === 0 ? (
                  <EmptyState
                    iconName="receipt"
                    message="No orders yet — support a local independent"
                    cta={{ label: "Find Businesses", href: "/business" }}
                  />
                ) : (
                  orders.map((order) => {
                    const badgeVariant = orderBadgeVariant(order.status);
                    const badgeLabel =
                      order.status.charAt(0).toUpperCase() +
                      order.status.slice(1);
                    const total = `$${(order.total / 100).toFixed(2)}`;
                    return (
                      <Card
                        key={order.id}
                        variant="glass"
                        className="relative overflow-hidden"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gold/50 rounded-l-xl" />
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                            <Icon
                              name="receipt"
                              size={18}
                              className="text-gold"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold truncate">
                              {order.businesses?.name ?? "Order"}
                            </p>
                            <p className="text-[10px] text-txt-secondary mt-0.5">
                              {timeAgo(order.created_at)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="font-heading font-bold text-[13px] text-gold">
                              {total}
                            </span>
                            <Badge label={badgeLabel} variant={badgeVariant} />
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            )}

            {/* ---- Subscriptions ---- */}
            {activeTab === "subscriptions" && (
              <div className="animate-fade-in space-y-3">
                {subscriptions.length === 0 ? (
                  <EmptyState
                    iconName="bell"
                    message="Not subscribed to any channels — discover creators"
                    cta={{ label: "Discover Channels", href: "/live" }}
                  />
                ) : (
                  subscriptions.map((sub) => {
                    const channel = sub.channels;
                    const href = channel?.slug
                      ? `/live/channel/${channel.slug}`
                      : `/live/channel/${sub.channel_id}`;
                    return (
                      <Card
                        key={sub.id}
                        variant="glass"
                        className="relative overflow-hidden"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald/60 rounded-l-xl" />
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald/10 flex items-center justify-center shrink-0">
                            <Icon
                              name="video"
                              size={18}
                              className="text-emerald"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold truncate">
                              {channel?.name ?? "Channel"}
                            </p>
                            <Badge label="Active" variant="emerald" />
                          </div>
                          <Link
                            href={href}
                            className="shrink-0 text-[11px] font-bold text-gold press hover:underline"
                          >
                            Watch →
                          </Link>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {!loading && (
        <div className="px-5 pt-10 pb-6 text-center">
          <p className="c-meta" style={{ opacity: 0.5 }}>
            Made with love in Compton
          </p>
        </div>
      )}
    </div>
  );
}
