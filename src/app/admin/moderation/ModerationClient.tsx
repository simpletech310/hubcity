"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type FlaggedPost = {
  id: string;
  body: string;
  image_url: string | null;
  author_id: string;
  created_at: string;
  is_published: boolean;
  author: { display_name: string; handle: string; avatar_url: string | null } | null;
};

type FlaggedReel = {
  id: string;
  caption: string | null;
  poster_url: string | null;
  author_id: string;
  created_at: string;
  is_published: boolean;
  author: { display_name: string; handle: string } | null;
};

type TabValue = "all" | "posts" | "reels";

interface ModerationClientProps {
  posts: FlaggedPost[];
  reels: FlaggedReel[];
}

function timeAgo(d: string): string {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  return s < 60 ? "just now" : s < 3600 ? Math.floor(s / 60) + "m ago" : Math.floor(s / 3600) + "h ago";
}

export default function ModerationClient({ posts: initialPosts, reels: initialReels }: ModerationClientProps) {
  const [posts, setPosts] = useState<FlaggedPost[]>(initialPosts);
  const [reels, setReels] = useState<FlaggedReel[]>(initialReels);
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const supabase = createClient();
  const totalCount = posts.length + reels.length;

  const visiblePosts = activeTab === "reels" ? [] : posts;
  const visibleReels = activeTab === "posts" ? [] : reels;

  async function handleApprove(id: string, type: "post" | "reel") {
    setActionLoading(id);
    const table = type === "post" ? "posts" : "reels";
    await supabase.from(table).update({ is_published: true }).eq("id", id);
    // Dismiss the pending reports for this content
    await supabase
      .from("content_reports")
      .update({ status: "dismissed" })
      .eq("content_id", id)
      .eq("content_type", type)
      .eq("status", "pending");
    if (type === "post") {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } else {
      setReels((prev) => prev.filter((r) => r.id !== id));
    }
    setActionLoading(null);
  }

  async function handleRemove(id: string, type: "post" | "reel") {
    setActionLoading(id);
    const table = type === "post" ? "posts" : "reels";
    await supabase.from(table).update({ is_published: false }).eq("id", id);
    // Mark reports as action_taken
    await supabase
      .from("content_reports")
      .update({ status: "action_taken", action_taken: "Content removed by admin" })
      .eq("content_id", id)
      .eq("content_type", type)
      .eq("status", "pending");
    if (type === "post") {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } else {
      setReels((prev) => prev.filter((r) => r.id !== id));
    }
    setActionLoading(null);
  }

  async function handleSuspend(userId: string) {
    if (!confirm("Suspend this user? They will lose access to the app.")) return;
    await fetch(`/api/admin/users/${userId}/suspend`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspended: true, reason: "Suspended via moderation queue" }),
    });
  }

  const tabs: { label: string; value: TabValue }[] = [
    { label: "All", value: "all" },
    { label: "Posts", value: "posts" },
    { label: "Reels", value: "reels" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-heading text-2xl font-bold">Moderation</h1>
            {totalCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-coral/20 border border-coral/30 text-coral text-xs font-bold tabular-nums">
                {totalCount}
              </span>
            )}
          </div>
          <p className="text-sm text-txt-secondary">
            {totalCount === 0
              ? "All clear — no flagged content"
              : `${totalCount} item${totalCount !== 1 ? "s" : ""} pending review`}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
        {tabs.map((tab) => {
          const count =
            tab.value === "all"
              ? totalCount
              : tab.value === "posts"
              ? posts.length
              : reels.length;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === tab.value
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.value ? "bg-white/10 text-white/60" : "bg-white/5 text-white/30"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {totalCount === 0 && (
        <div className="text-center py-16">
          <p className="text-2xl mb-2">🎉</p>
          <p className="text-sm text-white/40">Queue is clear</p>
        </div>
      )}

      {/* Content list */}
      {totalCount > 0 && (
        <div className="space-y-3">
          {/* Posts */}
          {visiblePosts.map((post) => (
            <div
              key={post.id}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-coral/10 text-coral border border-coral/20">
                  post
                </span>
                <span className="text-xs text-white/40">
                  @{post.author?.handle ?? "unknown"} · {timeAgo(post.created_at)}
                </span>
              </div>

              {post.body && (
                <p className="text-sm text-white/70 line-clamp-3 mb-3">{post.body}</p>
              )}

              {post.image_url && (
                <img
                  src={post.image_url}
                  alt="Post image"
                  className="w-24 h-24 object-cover rounded-lg mb-3"
                />
              )}

              {!post.is_published && (
                <p className="text-[10px] text-white/30 mb-3 italic">Already hidden</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(post.id, "post")}
                  disabled={actionLoading === post.id}
                  className="flex-1 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold disabled:opacity-40 transition-opacity"
                >
                  ✓ Clear
                </button>
                <button
                  onClick={() => handleRemove(post.id, "post")}
                  disabled={actionLoading === post.id}
                  className="flex-1 py-1.5 rounded-lg bg-coral/10 border border-coral/20 text-coral text-xs font-semibold disabled:opacity-40 transition-opacity"
                >
                  Remove
                </button>
                <button
                  onClick={() => handleSuspend(post.author_id)}
                  disabled={actionLoading === post.id}
                  className="py-1.5 px-3 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs font-semibold disabled:opacity-40 transition-opacity"
                >
                  Suspend
                </button>
              </div>
            </div>
          ))}

          {/* Reels */}
          {visibleReels.map((reel) => (
            <div
              key={reel.id}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple/10 text-purple border border-purple/20">
                  reel
                </span>
                <span className="text-xs text-white/40">
                  @{reel.author?.handle ?? "unknown"} · {timeAgo(reel.created_at)}
                </span>
              </div>

              {reel.poster_url && (
                <img
                  src={reel.poster_url}
                  alt="Reel thumbnail"
                  className="w-16 h-24 object-cover rounded-lg mb-3"
                />
              )}

              {reel.caption && (
                <p className="text-sm text-white/70 line-clamp-3 mb-3">{reel.caption}</p>
              )}

              {!reel.is_published && (
                <p className="text-[10px] text-white/30 mb-3 italic">Already hidden</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(reel.id, "reel")}
                  disabled={actionLoading === reel.id}
                  className="flex-1 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold disabled:opacity-40 transition-opacity"
                >
                  ✓ Clear
                </button>
                <button
                  onClick={() => handleRemove(reel.id, "reel")}
                  disabled={actionLoading === reel.id}
                  className="flex-1 py-1.5 rounded-lg bg-coral/10 border border-coral/20 text-coral text-xs font-semibold disabled:opacity-40 transition-opacity"
                >
                  Remove
                </button>
                <button
                  onClick={() => handleSuspend(reel.author_id)}
                  disabled={actionLoading === reel.id}
                  className="py-1.5 px-3 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs font-semibold disabled:opacity-40 transition-opacity"
                >
                  Suspend
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
