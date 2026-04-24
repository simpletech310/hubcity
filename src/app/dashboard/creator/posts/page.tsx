"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

// ── Types ────────────────────────────────────────────────

interface FanPost {
  id: string;
  body: string;
  image_url: string | null;
  author_id: string;
  is_published: boolean;
  created_at: string;
  like_count: number;
}

interface PollOption {
  id: string;
  text: string;
  vote_count: number;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  channel_id: string | null;
  author_id: string;
  ends_at: string | null;
  created_at: string;
}

type ComposeMode = "none" | "post" | "poll";

// ── Helpers ──────────────────────────────────────────────

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function totalVotes(options: PollOption[]): number {
  return options.reduce((sum, o) => sum + (o.vote_count ?? 0), 0);
}

function votePercent(option: PollOption, total: number): number {
  if (total === 0) return 0;
  return Math.round(((option.vote_count ?? 0) / total) * 100);
}

// ── Skeleton ─────────────────────────────────────────────

function SkeletonPost() {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-2.5">
      <div className="h-3 skeleton rounded w-3/4" />
      <div className="h-3 skeleton rounded w-full" />
      <div className="h-3 skeleton rounded w-1/2" />
      <div className="flex items-center justify-between mt-3">
        <div className="h-2.5 skeleton rounded w-16" />
        <div className="h-2.5 skeleton rounded w-10" />
      </div>
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────

function Toast({
  message,
  type,
  onDismiss,
}: {
  message: string;
  type: "success" | "error";
  onDismiss: () => void;
}) {
  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl flex items-center gap-2 max-w-[340px] w-[calc(100%-32px)] ${
        type === "success"
          ? "bg-emerald/20 border border-emerald/30 text-emerald"
          : "bg-coral/20 border border-coral/30 text-coral"
      }`}
    >
      <span className="flex-1">{message}</span>
      <button
        onClick={onDismiss}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────

export default function FanPostsPage() {
  const [posts, setPosts] = useState<FanPost[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeMode, setComposeMode] = useState<ComposeMode>("none");
  const [channelId, setChannelId] = useState<string | null>(null);

  // Post compose state
  const [postBody, setPostBody] = useState("");
  const [postImageUrl, setPostImageUrl] = useState("");
  const [postSubmitting, setPostSubmitting] = useState(false);

  // Poll compose state
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollEndsAt, setPollEndsAt] = useState("");
  const [pollSubmitting, setPollSubmitting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string, type: "success" | "error") {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }

  // ── Data Fetch ────────────────────────────────────────

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Get channel id for polls
        const { data: channelData } = await supabase
          .from("channels")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        setChannelId(channelData?.id ?? null);

        // Fetch posts
        const { data: postsData } = await supabase
          .from("posts")
          .select("id, body, image_url, author_id, is_published, created_at, like_count")
          .eq("author_id", user.id)
          .order("created_at", { ascending: false });
        setPosts((postsData ?? []) as FanPost[]);

        // Fetch polls gracefully
        try {
          const { data: pollsData, error: pollsError } = await supabase
            .from("polls")
            .select("id, question, options, channel_id, author_id, ends_at, created_at")
            .eq("author_id", user.id)
            .order("created_at", { ascending: false });
          if (!pollsError) {
            setPolls((pollsData ?? []) as Poll[]);
          }
        } catch {
          // polls table may not exist — silently ignore
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // ── Compose Handlers ──────────────────────────────────

  function openCompose(mode: ComposeMode) {
    setComposeMode((prev) => (prev === mode ? "none" : mode));
    // Reset the other form when switching
    if (mode === "post") {
      setPollQuestion("");
      setPollOptions(["", ""]);
      setPollEndsAt("");
    } else if (mode === "poll") {
      setPostBody("");
      setPostImageUrl("");
    }
  }

  async function submitPost() {
    if (!postBody.trim()) return;
    setPostSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("posts")
        .insert({
          body: postBody.trim(),
          image_url: postImageUrl.trim() || null,
          author_id: user.id,
          is_published: true,
          like_count: 0,
        })
        .select("id, body, image_url, author_id, is_published, created_at, like_count")
        .single();

      if (error) throw error;

      setPosts((prev) => [data as FanPost, ...prev]);
      setPostBody("");
      setPostImageUrl("");
      setComposeMode("none");
      showToast("Post published to your fans!", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to publish post", "error");
    } finally {
      setPostSubmitting(false);
    }
  }

  async function submitPoll() {
    const validOptions = pollOptions.filter((o) => o.trim().length > 0);
    if (!pollQuestion.trim() || validOptions.length < 2) {
      showToast("Add a question and at least 2 options", "error");
      return;
    }
    setPollSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const options: PollOption[] = validOptions.map((text, i) => ({
        id: `opt_${i + 1}`,
        text: text.trim(),
        vote_count: 0,
      }));

      const { data, error } = await supabase
        .from("polls")
        .insert({
          question: pollQuestion.trim(),
          options,
          channel_id: channelId,
          author_id: user.id,
          ends_at: pollEndsAt || null,
        })
        .select("id, question, options, channel_id, author_id, ends_at, created_at")
        .single();

      if (error) {
        // 42P01 = relation does not exist (polls table not yet created)
        if (error.code === "42P01") {
          showToast("Poll feature coming soon", "error");
        } else {
          showToast(error.message ?? "Failed to launch poll", "error");
        }
        setComposeMode("none");
        return;
      }

      setPolls((prev) => [data as Poll, ...prev]);
      setPollQuestion("");
      setPollOptions(["", ""]);
      setPollEndsAt("");
      setComposeMode("none");
      showToast("Poll launched!", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to launch poll", "error");
    } finally {
      setPollSubmitting(false);
    }
  }

  async function deletePost(id: string) {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    const supabase = createClient();
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) {
      showToast("Could not delete post", "error");
    } else {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      showToast("Post deleted", "success");
    }
  }

  async function deletePoll(id: string) {
    if (!confirm("Delete this poll? This cannot be undone.")) return;
    const supabase = createClient();
    const { error } = await supabase.from("polls").delete().eq("id", id);
    if (error) {
      showToast("Could not delete poll", "error");
    } else {
      setPolls((prev) => prev.filter((p) => p.id !== id));
      showToast("Poll deleted", "success");
    }
  }

  // ── Render ────────────────────────────────────────────

  const isEmpty = !loading && posts.length === 0 && polls.length === 0;

  return (
    <div className="px-4 py-5 space-y-5 pb-28">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading font-bold text-lg text-white">Fan Posts</h1>
          <p className="text-xs text-white/40 mt-0.5">Connect with your subscribers</p>
        </div>
        <Link
          href="/dashboard/creator/content"
          className="text-xs text-white/40 hover:text-white/70 transition-colors pt-1"
        >
          Content
        </Link>
      </div>

      {/* Compose Action Row */}
      <div className="flex gap-2.5">
        <button
          onClick={() => openCompose("post")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
            composeMode === "post"
              ? "bg-gold/15 border-gold/40 text-gold"
              : "bg-white/[0.04] border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.07]"
          }`}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Write a post
        </button>
        <button
          onClick={() => openCompose("poll")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
            composeMode === "poll"
              ? "bg-gold/15 border-gold/40 text-gold"
              : "bg-white/[0.04] border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.07]"
          }`}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Create a poll
        </button>
      </div>

      {/* Compose: Write Post */}
      {composeMode === "post" && (
        <div className="bg-white/[0.04] rounded-2xl border border-white/[0.08] p-4 space-y-3">
          <textarea
            rows={4}
            placeholder="Share something with your fans..."
            value={postBody}
            onChange={(e) => setPostBody(e.target.value)}
            className="bg-transparent text-white placeholder:text-white/30 outline-none resize-none w-full text-sm leading-relaxed"
            autoFocus
          />
          <div className="border-t border-white/[0.06] pt-3">
            <input
              type="url"
              placeholder="Image URL (optional)"
              value={postImageUrl}
              onChange={(e) => setPostImageUrl(e.target.value)}
              className="w-full bg-white/[0.04] rounded-lg border border-white/[0.08] px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-gold/30 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setComposeMode("none")}
              className="flex-1 py-2.5 rounded-xl bg-white/[0.06] text-white/50 text-sm font-semibold hover:bg-white/[0.09] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submitPost}
              disabled={!postBody.trim() || postSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-gold to-gold-light text-midnight text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {postSubmitting ? "Publishing…" : "Post"}
            </button>
          </div>
        </div>
      )}

      {/* Compose: Create Poll */}
      {composeMode === "poll" && (
        <div className="bg-white/[0.04] rounded-2xl border border-white/[0.08] p-4 space-y-3">
          <input
            type="text"
            placeholder="Ask your fans something..."
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
            className="w-full bg-transparent text-white placeholder:text-white/30 outline-none text-sm font-semibold border-b border-white/[0.08] pb-3"
            autoFocus
          />

          <div className="space-y-2">
            {pollOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white/30 w-5 shrink-0 text-center">
                  {String.fromCharCode(65 + i)}
                </span>
                <input
                  type="text"
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const updated = [...pollOptions];
                    updated[i] = e.target.value;
                    setPollOptions(updated);
                  }}
                  className="flex-1 bg-white/[0.04] rounded-lg border border-white/[0.08] px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-gold/30 transition-colors"
                />
                {pollOptions.length > 2 && (
                  <button
                    onClick={() => setPollOptions((prev) => prev.filter((_, idx) => idx !== i))}
                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-coral hover:bg-coral/10 transition-colors"
                    aria-label="Remove option"
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {pollOptions.length < 4 && (
            <button
              onClick={() => setPollOptions((prev) => [...prev, ""])}
              className="text-xs font-semibold text-gold/70 hover:text-gold transition-colors flex items-center gap-1.5"
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add option
            </button>
          )}

          <div className="border-t border-white/[0.06] pt-3">
            <label className="text-xs font-semibold text-white/40 block mb-1.5">
              End date (optional)
            </label>
            <input
              type="datetime-local"
              value={pollEndsAt}
              onChange={(e) => setPollEndsAt(e.target.value)}
              className="w-full bg-white/[0.04] rounded-lg border border-white/[0.08] px-3 py-2 text-sm text-white/70 outline-none focus:border-gold/30 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setComposeMode("none")}
              className="flex-1 py-2.5 rounded-xl bg-white/[0.06] text-white/50 text-sm font-semibold hover:bg-white/[0.09] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submitPoll}
              disabled={!pollQuestion.trim() || pollOptions.filter((o) => o.trim()).length < 2 || pollSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-gold to-gold-light text-midnight text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {pollSubmitting ? "Launching…" : "Launch poll"}
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <SkeletonPost key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {isEmpty && (
        <Card className="text-center py-8 border-border-subtle">
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
                d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
              />
            </svg>
          </div>
          <p className="text-sm font-semibold text-white mb-1">No posts yet</p>
          <p className="text-xs text-white/40 max-w-[220px] mx-auto leading-relaxed">
            Your fans are waiting — post something to get the conversation started
          </p>
          <button
            onClick={() => openCompose("post")}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gold to-gold-light text-midnight text-sm font-semibold rounded-xl"
          >
            Write your first post
          </button>
        </Card>
      )}

      {/* Polls List */}
      {!loading && polls.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            Polls
          </h2>
          {polls.map((poll) => {
            const total = totalVotes(poll.options ?? []);
            const isEnded = poll.ends_at ? new Date(poll.ends_at) < new Date() : false;
            return (
              <div
                key={poll.id}
                className="bg-white/[0.04] rounded-2xl border border-white/[0.08] p-4"
              >
                {/* Poll header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-sm font-semibold text-white leading-snug flex-1">
                    {poll.question}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      label={isEnded ? "Ended" : "Active"}
                      variant={isEnded ? "purple" : "emerald"}
                      size="sm"
                    />
                    <button
                      onClick={() => deletePoll(poll.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-white/25 hover:text-coral hover:bg-coral/10 transition-colors"
                      aria-label="Delete poll"
                    >
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Options with vote bars */}
                <div className="space-y-2.5">
                  {(poll.options ?? []).map((option) => {
                    const pct = votePercent(option, total);
                    return (
                      <div key={option.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-white/70 leading-tight truncate max-w-[75%]">
                            {option.text}
                          </span>
                          <span className="text-xs font-semibold text-white/50 ml-2 shrink-0">
                            {pct}%
                          </span>
                        </div>
                        <div className="bg-white/[0.06] rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Poll footer */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
                  <span className="text-xs text-white/35">
                    {total} vote{total !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs text-white/35">
                    {poll.ends_at
                      ? isEnded
                        ? `Ended ${timeAgo(poll.ends_at)}`
                        : `Ends ${new Date(poll.ends_at).toLocaleDateString()}`
                      : `Created ${timeAgo(poll.created_at)}`}
                  </span>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Posts List */}
      {!loading && posts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            Posts
          </h2>
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white/[0.04] rounded-2xl border border-white/[0.08] p-4"
            >
              {/* Image preview */}
              {post.image_url && (
                <div className="mb-3 rounded-xl overflow-hidden">
                  <img
                    src={post.image_url}
                    alt="Post image"
                    className="w-full max-h-48 object-cover"
                  />
                </div>
              )}

              {/* Body */}
              <p className="text-sm text-white/85 leading-relaxed whitespace-pre-wrap">
                {post.body}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <Badge
                    label={post.is_published ? "Published" : "Draft"}
                    variant={post.is_published ? "emerald" : "purple"}
                    size="sm"
                  />
                  <span className="flex items-center gap-1 text-xs text-white/35">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {post.like_count ?? 0}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/30">{timeAgo(post.created_at)}</span>
                  <button
                    onClick={() => deletePost(post.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-white/25 hover:text-coral hover:bg-coral/10 transition-colors"
                    aria-label="Delete post"
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
