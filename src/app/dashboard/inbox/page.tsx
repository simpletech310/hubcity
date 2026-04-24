"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Skeleton from "@/components/ui/Skeleton";
import type { BusinessReview, GrantApplication, Resource, Profile } from "@/types/database";

// ── Types ────────────────────────────────────────────────────────────────────

type InboxTab = "all" | "messages" | "reviews" | "applications";

interface MessageThread {
  customerId: string;
  customerName: string;
  customerAvatar: string | null;
  lastMessage: string;
  lastAt: string;
  unread: number;
  businessId: string;
}

// Use Omit + intersection to avoid conflicts with optional parent fields
type ReviewRow = Omit<BusinessReview, "reviewer"> & {
  reviewer: Pick<Profile, "display_name" | "avatar_url"> | null;
};

type ApplicationRow = Omit<GrantApplication, "applicant" | "resource"> & {
  applicant: Pick<Profile, "display_name" | "avatar_url"> | null;
  resource: Pick<Resource, "id" | "name"> | null;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill={n <= rating ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={2}
          className={n <= rating ? "text-gold" : "text-white/20"}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </span>
  );
}

function Avatar({
  url,
  name,
  size = 36,
}: {
  url: string | null;
  name: string;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full bg-gold/15 flex items-center justify-center flex-shrink-0 text-gold font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials || "?"}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    submitted: "bg-blue-500/15 text-blue-300",
    under_review: "bg-yellow-500/15 text-yellow-300",
    approved: "bg-emerald-500/15 text-emerald-300",
    denied: "bg-coral/15 text-coral",
    waitlisted: "bg-purple-500/15 text-purple-300",
    referred: "bg-cyan-500/15 text-cyan-300",
    enrolled: "bg-green-500/15 text-green-300",
    completed: "bg-white/10 text-txt-secondary",
    withdrawn: "bg-white/5 text-txt-secondary",
  };
  const label = status.replace(/_/g, " ");
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${colors[status] ?? "bg-white/10 text-white"}`}
    >
      {label}
    </span>
  );
}

// ── Tab chip ──────────────────────────────────────────────────────────────────

function TabChip({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[44px] px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
        active
          ? "bg-gold text-midnight"
          : "bg-white/6 text-txt-secondary hover:text-white hover:bg-white/10"
      }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            active ? "bg-midnight/20 text-midnight" : "bg-gold/20 text-gold"
          }`}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyInbox({ tab }: { tab: InboxTab }) {
  const copy: Record<InboxTab, { icon: string; headline: string; sub: string }> = {
    all: {
      icon: "📬",
      headline: "The scene is quiet.",
      sub: "Messages, reviews, and applications will show up here.",
    },
    messages: {
      icon: "💬",
      headline: "No messages yet — your inbox is quiet. For now.",
      sub: "When customers reach out, you'll see them here.",
    },
    reviews: {
      icon: "⭐",
      headline: "No reviews to reply to.",
      sub: "Your community hasn't weighed in yet. Keep showing up.",
    },
    applications: {
      icon: "📋",
      headline: "No applications yet.",
      sub: "When someone applies to your resource, they'll land here.",
    },
  };
  const { icon, headline, sub } = copy[tab];
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <span className="text-4xl mb-4">{icon}</span>
      <p className="text-white font-medium text-sm mb-1.5">{headline}</p>
      <p className="text-txt-secondary text-xs leading-relaxed max-w-[240px]">{sub}</p>
    </div>
  );
}

// ── Row skeletons ─────────────────────────────────────────────────────────────

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border-subtle">
      <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-2.5 w-4/5" />
      </div>
      <Skeleton className="h-2.5 w-8 flex-shrink-0" />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState<InboxTab>("all");
  const [loading, setLoading] = useState(true);

  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);

  const [businessId, setBusinessId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const supabase = createClient();

  const loadData = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role ?? null;
    setUserRole(role);

    // ── Messages (business owners) ───────────────────────────────────────────
    const { data: bizRow } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    const bId = bizRow?.id ?? null;
    setBusinessId(bId);

    if (bId) {
      const { data: messages } = await supabase
        .from("messages")
        .select(
          "*, sender:profiles!messages_sender_id_fkey(id, display_name, avatar_url)"
        )
        .eq("business_id", bId)
        .order("created_at", { ascending: false });

      if (messages) {
        const threadMap: Record<string, MessageThread> = {};

        messages.forEach((msg: {
          sender_id: string;
          recipient_id: string;
          sender?: { id: string; display_name: string; avatar_url: string | null } | null;
          body: string;
          created_at: string;
          is_read: boolean;
        }) => {
          const customerId =
            msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
          const customerName =
            msg.sender_id !== user.id
              ? msg.sender?.display_name ?? "Customer"
              : "Customer";
          const customerAvatar =
            msg.sender_id !== user.id ? msg.sender?.avatar_url ?? null : null;

          if (!threadMap[customerId]) {
            threadMap[customerId] = {
              customerId,
              customerName,
              customerAvatar,
              lastMessage: msg.body,
              lastAt: msg.created_at,
              unread: 0,
              businessId: bId,
            };
          }

          if (!msg.is_read && msg.recipient_id === user.id) {
            threadMap[customerId].unread++;
          }
        });

        setThreads(
          Object.values(threadMap).sort(
            (a, b) =>
              new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
          )
        );
      }

      // ── Reviews ────────────────────────────────────────────────────────────
      const { data: reviewData } = await supabase
        .from("business_reviews")
        .select("*, reviewer:profiles!business_reviews_reviewer_id_fkey(display_name, avatar_url)")
        .eq("business_id", bId)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(30);

      if (reviewData) setReviews(reviewData as ReviewRow[]);
    }

    // ── Applications (resource providers / admins) ────────────────────────────
    if (
      role === "admin" ||
      role === "city_official" ||
      role === "resource_provider"
    ) {
      let resourceQuery = supabase.from("resources").select("id");
      if (role !== "admin") {
        resourceQuery = resourceQuery.eq("created_by", user.id);
      }
      const { data: resourceRows } = await resourceQuery;
      const resourceIds = (resourceRows ?? []).map(
        (r: { id: string }) => r.id
      );

      if (resourceIds.length > 0) {
        const { data: appData } = await supabase
          .from("grant_applications")
          .select(
            "*, applicant:profiles(display_name, avatar_url), resource:resources(id, name)"
          )
          .in("resource_id", resourceIds)
          .order("created_at", { ascending: false })
          .limit(30);

        if (appData) setApplications(appData as ApplicationRow[]);
      }
    }

    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Unread counts ──────────────────────────────────────────────────────────
  const totalUnread = threads.reduce((s, t) => s + t.unread, 0);
  const reviewCount = reviews.length;
  const appCount = applications.filter(
    (a) => a.status === "submitted" || a.status === "under_review"
  ).length;

  // ── All tab items (merged, sorted by time) ────────────────────────────────
  type AllItem =
    | { kind: "message"; data: MessageThread; at: string }
    | { kind: "review"; data: ReviewRow; at: string }
    | { kind: "application"; data: ApplicationRow; at: string };

  const allItems: AllItem[] = [
    ...threads.map((t) => ({ kind: "message" as const, data: t, at: t.lastAt })),
    ...reviews.map((r) => ({ kind: "review" as const, data: r, at: r.created_at })),
    ...applications.map((a) => ({ kind: "application" as const, data: a, at: a.created_at })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  // ── Message row ───────────────────────────────────────────────────────────
  function MessageRow({ thread }: { thread: MessageThread }) {
    return (
      <Link
        href={`/dashboard/messages/${thread.customerId}`}
        className="flex items-center gap-3 px-4 py-3.5 border-b border-border-subtle hover:bg-white/3 transition-colors min-h-[64px]"
      >
        <Avatar url={thread.customerAvatar} name={thread.customerName} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {thread.customerName}
          </p>
          <p className="text-xs text-txt-secondary truncate">
            {thread.lastMessage}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className="text-[10px] text-txt-secondary">
            {relativeTime(thread.lastAt)}
          </span>
          {thread.unread > 0 && (
            <span className="w-2 h-2 rounded-full bg-gold" />
          )}
        </div>
      </Link>
    );
  }

  // ── Review row ─────────────────────────────────────────────────────────────
  function ReviewRow({ review }: { review: ReviewRow }) {
    return (
      <div className="flex items-start gap-3 px-4 py-3.5 border-b border-border-subtle min-h-[64px]">
        <Avatar
          url={review.reviewer?.avatar_url ?? null}
          name={review.reviewer?.display_name ?? "Reviewer"}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-medium text-white truncate">
              {review.reviewer?.display_name ?? "Someone"}
            </p>
            <StarRating rating={review.rating} />
          </div>
          {review.body && (
            <p className="text-xs text-txt-secondary line-clamp-2 leading-relaxed">
              {review.body}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className="text-[10px] text-txt-secondary">
            {relativeTime(review.created_at)}
          </span>
          <Link
            href="/dashboard/reviews"
            className="text-[10px] text-gold hover:underline"
          >
            Reply
          </Link>
        </div>
      </div>
    );
  }

  // ── Application row ────────────────────────────────────────────────────────
  function AppRow({ app }: { app: ApplicationRow }) {
    return (
      <Link
        href="/dashboard/applications"
        className="flex items-center gap-3 px-4 py-3.5 border-b border-border-subtle hover:bg-white/3 transition-colors min-h-[64px]"
      >
        <Avatar
          url={app.applicant?.avatar_url ?? null}
          name={app.applicant?.display_name ?? "Applicant"}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {app.applicant?.display_name ?? "Applicant"}
          </p>
          <p className="text-xs text-txt-secondary truncate">
            {app.resource?.name ?? "Resource"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className="text-[10px] text-txt-secondary">
            {relativeTime(app.created_at)}
          </span>
          <StatusBadge status={app.status} />
        </div>
      </Link>
    );
  }

  // ── Render helpers ─────────────────────────────────────────────────────────
  function renderAll() {
    if (allItems.length === 0) return <EmptyInbox tab="all" />;
    return allItems.map((item) => {
      if (item.kind === "message")
        return <MessageRow key={`msg-${item.data.customerId}`} thread={item.data} />;
      if (item.kind === "review")
        return <ReviewRow key={`rev-${item.data.id}`} review={item.data} />;
      return <AppRow key={`app-${item.data.id}`} app={item.data} />;
    });
  }

  function renderMessages() {
    if (threads.length === 0) return <EmptyInbox tab="messages" />;
    return threads.map((t) => <MessageRow key={t.customerId} thread={t} />);
  }

  function renderReviews() {
    if (reviews.length === 0) return <EmptyInbox tab="reviews" />;
    return reviews.map((r) => <ReviewRow key={r.id} review={r} />);
  }

  function renderApplications() {
    if (applications.length === 0) return <EmptyInbox tab="applications" />;
    return applications.map((a) => <AppRow key={a.id} app={a} />);
  }

  // ── Show only relevant tabs based on role ─────────────────────────────────
  const showMessages = !!businessId;
  const showReviews = !!businessId;
  const showApplications =
    userRole === "admin" ||
    userRole === "city_official" ||
    userRole === "resource_provider";

  return (
    <div className="px-0 py-0">
      {/* Page header */}
      <div className="px-4 pt-5 pb-4 border-b border-border-subtle">
        <h1 className="font-heading text-xl font-bold">Inbox</h1>
        <p className="text-xs text-txt-secondary mt-0.5">
          Messages, reviews &amp; applications
        </p>
      </div>

      {/* Tab strip */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide border-b border-border-subtle">
        <TabChip
          label="All"
          active={activeTab === "all"}
          count={totalUnread + appCount}
          onClick={() => setActiveTab("all")}
        />
        {showMessages && (
          <TabChip
            label="Messages"
            active={activeTab === "messages"}
            count={totalUnread}
            onClick={() => setActiveTab("messages")}
          />
        )}
        {showReviews && (
          <TabChip
            label="Reviews"
            active={activeTab === "reviews"}
            count={reviewCount}
            onClick={() => setActiveTab("reviews")}
          />
        )}
        {showApplications && (
          <TabChip
            label="Applications"
            active={activeTab === "applications"}
            count={appCount}
            onClick={() => setActiveTab("applications")}
          />
        )}
      </div>

      {/* Content */}
      <div>
        {loading ? (
          <>
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </>
        ) : (
          <>
            {activeTab === "all" && renderAll()}
            {activeTab === "messages" && renderMessages()}
            {activeTab === "reviews" && renderReviews()}
            {activeTab === "applications" && renderApplications()}
          </>
        )}
      </div>
    </div>
  );
}
