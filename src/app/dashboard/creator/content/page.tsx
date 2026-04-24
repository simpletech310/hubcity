"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Badge from "@/components/ui/Badge";

type VerificationStatus = "verified" | "pending" | "unverified" | null;

type ContentType = "reel" | "post";
type ContentStatus = "published" | "processing" | "scheduled" | "draft";
type FilterTab = "all" | "reels" | "posts" | "live" | "scheduled";

interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  status: ContentStatus;
  view_count: number;
  thumbnail_url?: string | null;
  created_at: string;
  scheduled_publish_at?: string | null;
}

const statusVariants: Record<ContentStatus, "emerald" | "gold" | "cyan" | "purple"> = {
  published: "emerald",
  processing: "gold",
  scheduled: "cyan",
  draft: "purple",
};

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-card border border-border-subtle">
      <div className="aspect-[9/16] skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-3 skeleton rounded w-3/4" />
        <div className="h-2.5 skeleton rounded w-1/2" />
      </div>
    </div>
  );
}

function formatScheduledDate(val: string) {
  return new Date(val).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ContentPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(null);
  const [scheduledTimes, setScheduledTimes] = useState<Record<string, string>>({});
  const [openScheduler, setOpenScheduler] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSchedule(itemId: string) {
    const timeValue = scheduledTimes[itemId];
    if (!timeValue) return;

    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const supabase = createClient();
    const table = item.type === "reel" ? "reels" : "posts";

    const { error } = await supabase
      .from(table)
      .update({ scheduled_publish_at: new Date(timeValue).toISOString() })
      .eq("id", itemId);

    if (!error) {
      // Update local item with the scheduled time so badge appears
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? { ...i, scheduled_publish_at: new Date(timeValue).toISOString(), status: "scheduled" }
            : i
        )
      );
      setOpenScheduler(null);
      showToast(`Scheduled for ${formatScheduledDate(timeValue)}`);
    } else {
      // DB column may not exist — store locally only
      showToast("Saved locally");
      setOpenScheduler(null);
    }
  }

  useEffect(() => {
    async function fetchContent() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch verification status from profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("verification_status")
          .eq("id", user.id)
          .single();
        if (profileData) {
          setVerificationStatus(profileData.verification_status as VerificationStatus);
        }

        // Fetch reels via channels join
        const { data: reelsData } = await supabase
          .from("reels")
          .select(
            "id, title, status, view_count, thumbnail_url, created_at, scheduled_publish_at, channel:channels!inner(user_id)"
          )
          .eq("channel.user_id", user.id)
          .order("created_at", { ascending: false });

        // Fetch posts
        const { data: postsData } = await supabase
          .from("posts")
          .select("id, title, status, view_count, thumbnail_url, created_at, scheduled_publish_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        const reels: ContentItem[] = (reelsData ?? []).map((r) => ({
          id: r.id,
          title: r.title ?? "Untitled Reel",
          type: "reel" as ContentType,
          status: (r.status as ContentStatus) ?? "draft",
          view_count: r.view_count ?? 0,
          thumbnail_url: r.thumbnail_url,
          created_at: r.created_at,
          scheduled_publish_at: r.scheduled_publish_at ?? null,
        }));

        const posts: ContentItem[] = (postsData ?? []).map((p) => ({
          id: p.id,
          title: p.title ?? "Untitled Post",
          type: "post" as ContentType,
          status: (p.status as ContentStatus) ?? "draft",
          view_count: p.view_count ?? 0,
          thumbnail_url: p.thumbnail_url,
          created_at: p.created_at,
          scheduled_publish_at: p.scheduled_publish_at ?? null,
        }));

        // Merge and sort by date
        const all = [...reels, ...posts].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setItems(all);
      } finally {
        setLoading(false);
      }
    }

    fetchContent();
  }, []);

  // Resolve a scheduled time for an item: prefer DB value, fall back to local state
  function getScheduledTime(item: ContentItem): string | null {
    return item.scheduled_publish_at ?? scheduledTimes[item.id] ?? null;
  }

  const filtered = items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "reels") return item.type === "reel";
    if (filter === "posts") return item.type === "post";
    if (filter === "live") return false; // live streams handled separately
    if (filter === "scheduled") {
      return item.status !== "published" && getScheduledTime(item) !== null;
    }
    return true;
  });

  const tabs: { id: FilterTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "reels", label: "Reels" },
    { id: "posts", label: "Posts" },
    { id: "scheduled", label: "Scheduled" },
    { id: "live", label: "Live" },
  ];

  return (
    <div className="px-4 py-5 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading font-bold text-lg text-white">Content</h1>
          <p className="text-xs text-white/40 mt-0.5">Your videos, reels &amp; posts</p>
        </div>
        <Link
          href="/dashboard/creator/posts"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.05] border border-white/[0.09] rounded-lg text-xs font-semibold text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          Posts
        </Link>
      </div>

      {/* Verification status banner */}
      {!loading && verificationStatus === "verified" ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-gold/10 border border-gold/25 self-start w-fit">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-gold shrink-0">
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span className="text-xs font-semibold text-gold">Verified Creator</span>
        </div>
      ) : !loading && verificationStatus !== "verified" ? (
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gold shrink-0">
            <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.4l-4.8 2.5.9-5.4L4.2 7.7l5.4-.8L12 2z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Get Verified</p>
            <p className="text-xs text-white/40">Verified creators get a badge + priority in feeds</p>
          </div>
          <Link href="/claim-your-city" className="text-xs font-semibold text-gold shrink-0">
            Apply →
          </Link>
        </div>
      ) : null}

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filter === tab.id
                ? "bg-gold/15 border-gold/40 text-gold"
                : "bg-white/5 border-white/10 text-white/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center border border-border-subtle">
          <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
            <svg
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              className="text-gold"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <p className="text-sm font-semibold text-white mb-1">
            {filter === "scheduled" ? "No scheduled content" : "No content yet"}
          </p>
          <p className="text-xs text-white/40 mb-5">
            {filter === "scheduled"
              ? "Use the clock icon on a draft to schedule it."
              : "Start creating — your audience is waiting."}
          </p>
          {filter !== "scheduled" && (
            <Link
              href="/reels/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gold to-gold-light text-midnight text-sm font-semibold rounded-xl"
            >
              Create Reel
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((item) => {
            const scheduledTime = getScheduledTime(item);
            const isDraft = item.status === "draft";
            const isSchedulerOpen = openScheduler === item.id;

            return (
              <div
                key={item.id}
                className="rounded-2xl overflow-hidden bg-card border border-border-subtle"
              >
                {/* Thumbnail */}
                <div className="aspect-[9/16] bg-white/5 relative">
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg
                        width="28"
                        height="28"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        className="text-white/20"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
                        />
                      </svg>
                    </div>
                  )}
                  {/* Type badge overlay */}
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded-full bg-black/60 text-[9px] font-bold uppercase tracking-wide text-white/80">
                      {item.type === "reel" ? "Reel" : "Post"}
                    </span>
                  </div>
                  {/* Clock button for drafts */}
                  {isDraft && (
                    <button
                      onClick={() => setOpenScheduler(isSchedulerOpen ? null : item.id)}
                      className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                        isSchedulerOpen
                          ? "bg-gold text-midnight"
                          : "bg-black/60 text-white/70 hover:text-white"
                      }`}
                      aria-label="Schedule post"
                    >
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                      </svg>
                    </button>
                  )}
                  {/* Views overlay */}
                  {item.view_count > 0 && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 rounded-full px-2 py-0.5">
                      <svg
                        width="10"
                        height="10"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        className="text-white/70"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="text-[9px] font-semibold text-white/80">
                        {item.view_count >= 1000
                          ? `${(item.view_count / 1000).toFixed(1)}k`
                          : item.view_count}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-xs font-semibold text-white leading-tight truncate">
                    {item.title}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <Badge
                      label={item.status}
                      variant={statusVariants[item.status] ?? "gold"}
                      size="sm"
                    />
                    {/* Scheduled badge */}
                    {scheduledTime && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/10 border border-gold/25 text-[9px] font-semibold text-gold">
                        🕐 {formatScheduledDate(scheduledTime)}
                      </span>
                    )}
                  </div>

                  {/* Inline scheduler UI */}
                  {isSchedulerOpen && (
                    <div className="mt-2">
                      <input
                        type="datetime-local"
                        className="bg-white/5 border border-white/10 rounded-lg text-white text-sm px-3 py-2 w-full mt-2"
                        value={scheduledTimes[item.id] ?? ""}
                        onChange={(e) =>
                          setScheduledTimes((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                      />
                      <button
                        onClick={() => handleSchedule(item.id)}
                        className="mt-2 w-full py-2 rounded-lg bg-gradient-to-r from-gold to-gold-light text-midnight text-xs font-semibold"
                      >
                        Schedule
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky create button */}
      <div className="fixed bottom-20 right-4 z-20">
        <Link
          href="/reels/create"
          className="w-14 h-14 rounded-full bg-gradient-to-br from-gold to-gold-light shadow-lg flex items-center justify-center text-midnight"
          aria-label="Create new content"
        >
          <svg
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </Link>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-36 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs font-semibold shadow-xl whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}
