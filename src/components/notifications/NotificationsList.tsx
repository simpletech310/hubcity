"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
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

const typeBadgeVariant: Record<string, "purple" | "gold" | "cyan" | "blue" | "emerald" | "coral" | "pink"> = {
  event: "purple",
  resource: "gold",
  district: "cyan",
  system: "blue",
  business: "emerald",
  order: "coral",
  booking: "pink",
  application: "gold",
  message: "purple",
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
          <h1 className="font-heading text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-gold font-semibold press hover:opacity-80 transition-opacity"
            >
              Mark all read
            </button>
          )}
        </div>
        <p className="text-sm text-txt-secondary">Stay in the loop</p>
      </div>

      {/* Unread count */}
      {unreadCount > 0 && (
        <div className="px-5 mb-4">
          <div className="flex items-center gap-2 bg-gold/10 rounded-full px-4 py-2 border border-gold/20 w-fit">
            <div className="w-2 h-2 rounded-full bg-gold pulse-gold" />
            <span className="text-xs font-semibold text-gold">{unreadCount} new</span>
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

      {/* Notification List */}
      <div className="px-5 space-y-2 stagger">
        {filtered.map((notif) => (
          <div key={notif.id} onClick={() => handleClick(notif)} className="cursor-pointer">
            <Card
              hover
              className={`transition-all ${
                notif.is_read ? "opacity-60" : "border-gold/15"
              }`}
            >
              <div className="flex gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                    notif.is_read
                      ? "bg-white/[0.03]"
                      : "bg-gradient-to-br from-white/[0.08] to-white/[0.02]"
                  } border border-border-subtle`}
                >
                  {typeIcons[notif.type] || "\u{1F514}"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-[13px] font-bold truncate">
                      {notif.title}
                    </h3>
                    {!notif.is_read && (
                      <div className="w-2 h-2 rounded-full bg-gold shrink-0" />
                    )}
                  </div>
                  {notif.body && (
                    <p className="text-[11px] text-txt-secondary leading-relaxed mb-1.5">
                      {notif.body}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge
                      label={notif.type}
                      variant={typeBadgeVariant[notif.type] ?? "blue"}
                    />
                    <span className="text-[10px] text-txt-secondary">
                      {timeAgo(notif.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <span className="text-5xl block mb-3">{"\u{1F514}"}</span>
            <p className="text-sm font-medium mb-1">No notifications</p>
            <p className="text-xs text-txt-secondary">You&apos;re all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}
