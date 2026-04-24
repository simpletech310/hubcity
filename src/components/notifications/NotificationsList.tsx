"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Chip from "@/components/ui/Chip";
import type { Notification, NotificationType } from "@/types/database";

const typeIcons: Record<string, string> = {
  event: "\u{1F4C5}",
  resource: "\u{1F4A1}",
  district: "\u{1F3DB}\uFE0F",
  system: "\u{1F514}",
  business: "\u{1F3EA}",
  order: "\u{1F4E6}",
  booking: "\u{1F4C6}",
  application: "\u{1F4DD}",
  message: "\u{1F4AC}",
};

// Culture sweep: all badges collapse to gold on ink borders. The type label
// itself carries the meaning — no need for rainbow tone variants.
const typeBadgeVariant: Record<string, "gold"> = {
  event: "gold",
  resource: "gold",
  district: "gold",
  system: "gold",
  business: "gold",
  order: "gold",
  booking: "gold",
  application: "gold",
  message: "gold",
};

const filters: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Events", value: "event" },
  { label: "Resources", value: "resource" },
  { label: "District", value: "district" },
  { label: "Orders", value: "order" },
  { label: "Messages", value: "message" },
];

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getNotificationLink(n: Notification): string | null {
  if (!n.link_type || !n.link_id) return null;
  switch (n.link_type) {
    case "event": return `/events/${n.link_id}`;
    case "resource": return `/resources/${n.link_id}`;
    case "business": return `/business/${n.link_id}`;
    case "order": return `/orders/${n.link_id}`;
    case "booking": return `/dashboard/bookings`;
    case "message": return `/dashboard/messages`;
    default: return null;
  }
}

interface Props {
  notifications: Notification[];
  userId: string;
}

export default function NotificationsList({ notifications: initial, userId }: Props) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initial);
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered =
    activeFilter === "all"
      ? notifications
      : notifications.filter((n) => n.type === activeFilter);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_id: id }),
      });
    } catch {
      // Revert on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: false } : n))
      );
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const previousNotifications = notifications;
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
    } catch {
      // Revert on failure
      setNotifications(previousNotifications);
    }
  }, [notifications]);

  const handleClick = (n: Notification) => {
    if (!n.is_read) markRead(n.id);
    const link = getNotificationLink(n);
    if (link) router.push(link);
  };

  return (
    <div className="animate-fade-in">
      <div className="px-5 pt-4 mb-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="c-hero" style={{ fontSize: 32, color: "var(--ink-strong)" }}>
            Notifications
          </h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="c-kicker press hover:opacity-80 transition-opacity"
              style={{
                fontSize: 10,
                color: "var(--ink-strong)",
                letterSpacing: "0.14em",
                background: "var(--gold-c)",
                border: "2px solid var(--rule-strong-c)",
                padding: "4px 10px",
              }}
            >
              MARK ALL READ
            </button>
          )}
        </div>
        <p
          className="c-serif-it"
          style={{ fontSize: 13, color: "var(--ink-strong)", opacity: 0.7 }}
        >
          Stay in the loop
        </p>
      </div>

      {/* Unread count */}
      {unreadCount > 0 && (
        <div className="px-5 mb-4">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 c-kicker w-fit"
            style={{
              background: "var(--ink-strong)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--gold-c)",
              fontSize: 10,
              letterSpacing: "0.14em",
            }}
          >
            <div
              className="pulse-gold"
              style={{ width: 6, height: 6, background: "var(--gold-c)" }}
            />
            <span>{unreadCount} NEW</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 px-5 mb-5 overflow-x-auto scrollbar-hide pb-1">
        {filters.map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            active={activeFilter === f.value}
            onClick={() => setActiveFilter(f.value)}
          />
        ))}
      </div>

      {/* Notification List — 2px ink row dividers, no cards */}
      <div className="px-5 stagger">
        {filtered.map((notif, i) => (
          <div
            key={notif.id}
            onClick={() => handleClick(notif)}
            className="cursor-pointer py-3 press"
            style={{
              borderTop: i === 0 ? "2px solid var(--rule-strong-c)" : undefined,
              borderBottom: "2px solid var(--rule-strong-c)",
              opacity: notif.is_read ? 0.55 : 1,
              transition: "opacity 150ms",
            }}
          >
            <div className="flex gap-3">
              <div
                className="w-10 h-10 flex items-center justify-center text-lg shrink-0"
                style={{
                  background: notif.is_read ? "var(--paper)" : "var(--gold-c)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                {typeIcons[notif.type] || "\u{1F514}"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3
                    className="c-card-t truncate"
                    style={{ fontSize: 13, color: "var(--ink-strong)" }}
                  >
                    {notif.title}
                  </h3>
                  {!notif.is_read && (
                    <div
                      className="shrink-0"
                      style={{ width: 6, height: 6, background: "var(--gold-c)" }}
                    />
                  )}
                </div>
                {notif.body && (
                  <p
                    className="c-body mb-1.5"
                    style={{ fontSize: 12, color: "var(--ink-strong)", opacity: 0.75, lineHeight: 1.45 }}
                  >
                    {notif.body}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Badge
                    label={notif.type}
                    variant={typeBadgeVariant[notif.type] ?? "gold"}
                  />
                  <span
                    className="c-kicker"
                    style={{ fontSize: 9, color: "var(--ink-strong)", opacity: 0.55, letterSpacing: "0.1em" }}
                  >
                    {timeAgo(notif.created_at).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div
            className="text-center py-12 px-5 mt-4"
            style={{
              background: "var(--paper)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            <span className="text-5xl block mb-3">{"\u{1F514}"}</span>
            <p
              className="c-serif-it mb-1"
              style={{ fontSize: 14, color: "var(--ink-strong)" }}
            >
              No notifications
            </p>
            <p
              className="c-kicker"
              style={{ fontSize: 10, color: "var(--ink-strong)", opacity: 0.55, letterSpacing: "0.14em" }}
            >
              YOU&apos;RE ALL CAUGHT UP
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
