"use client";

import { useEffect, useState, useCallback } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

// ── Types ───────────────────────────────────────────────
interface GroupPost {
  id: string;
  body: string;
  image_url: string | null;
  comment_count: number;
  created_at: string;
  author: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    handle: string | null;
    role: string;
  } | null;
}

interface PostComment {
  id: string;
  body: string;
  created_at: string;
  author: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    handle: string | null;
  } | null;
}

interface ChamberResource {
  id: string;
  name: string;
  description: string | null;
  organization: string | null;
  status: string;
  deadline: string | null;
  accepts_applications: boolean;
  spots_remaining: number | null;
  category: string;
}

interface ChamberEvent {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  start_time: string | null;
  location: string | null;
  category: string;
  is_free: boolean;
}

interface ChamberUpdate {
  id: string;
  title: string;
  body: string;
  category: string | null;
  is_pinned: boolean;
  target_business_types: string[] | null;
  created_at: string;
  author: {
    display_name: string;
    avatar_url: string | null;
  } | null;
}

type Tab = "community" | "resources" | "events" | "grants" | "updates";

const TABS: { key: Tab; label: string }[] = [
  { key: "community", label: "Community" },
  { key: "resources", label: "Resources" },
  { key: "events", label: "Events" },
  { key: "grants", label: "Grants" },
  { key: "updates", label: "Updates" },
];

// ── Helpers ─────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Ended";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return {
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: d.getDate().toString(),
  };
}

function formatTime(time: string) {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:${m} ${ampm}`;
}

const STATUS_BADGE: Record<string, "emerald" | "gold" | "cyan" | "coral"> = {
  open: "emerald",
  limited: "gold",
  upcoming: "cyan",
  closed: "coral",
};

const EVENT_BADGE: Record<string, "gold" | "purple" | "cyan"> = {
  business: "gold",
  networking: "purple",
  community: "cyan",
};

// ── Main Component ──────────────────────────────────────
export default function ChamberHubPage() {
  const [tab, setTab] = useState<Tab>("community");
  const [loading, setLoading] = useState(true);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [memberCount, setMemberCount] = useState(0);

  // Data from /api/chamber-hub
  const [resources, setResources] = useState<ChamberResource[]>([]);
  const [grants, setGrants] = useState<ChamberResource[]>([]);
  const [events, setEvents] = useState<ChamberEvent[]>([]);
  const [updates, setUpdates] = useState<ChamberUpdate[]>([]);
  const [businessType, setBusinessType] = useState<string | null>(null);

  // Community tab state
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [newBody, setNewBody] = useState("");
  const [posting, setPosting] = useState(false);

  // Comments state
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, PostComment[]>>({});
  const [loadingComments, setLoadingComments] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // RSVP state
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);
  const [rsvpDone, setRsvpDone] = useState<Set<string>>(new Set());

  // ── Load hub data + auto-enroll ─────────────────────
  useEffect(() => {
    async function init() {
      setLoading(true);

      // Auto-enroll in chamber group
      const enrollRes = await fetch("/api/chamber-hub/enroll", { method: "POST" });
      if (enrollRes.ok) {
        const enrollData = await enrollRes.json();
        setGroupId(enrollData.group_id);
      }

      // Fetch all hub data
      const hubRes = await fetch("/api/chamber-hub");
      if (hubRes.ok) {
        const data = await hubRes.json();
        if (data.group) {
          setGroupId(data.group.id);
          setMemberCount(data.group.member_count ?? 0);
        }
        setResources(data.resources ?? []);
        setGrants(data.grants ?? []);
        setEvents(data.events ?? []);
        setUpdates(data.updates ?? []);
        setBusinessType(data.business_type ?? null);
      }

      setLoading(false);
    }
    init();
  }, []);

  // ── Load posts when community tab is active ─────────
  useEffect(() => {
    if (tab !== "community" || !groupId || postsLoaded) return;

    async function loadPosts() {
      const res = await fetch(`/api/groups/${groupId}/posts`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts ?? []);
      }
      setPostsLoaded(true);
    }
    loadPosts();
  }, [tab, groupId, postsLoaded]);

  // ── Create post ─────────────────────────────────────
  const handlePost = useCallback(async () => {
    if (!newBody.trim() || !groupId) return;
    setPosting(true);
    const res = await fetch(`/api/groups/${groupId}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: newBody.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      setPosts((prev) => [data.post, ...prev]);
      setNewBody("");
    }
    setPosting(false);
  }, [newBody, groupId]);

  // ── Load comments for a post ────────────────────────
  const toggleComments = useCallback(
    async (postId: string) => {
      if (expandedPost === postId) {
        setExpandedPost(null);
        return;
      }
      setExpandedPost(postId);

      if (comments[postId]) return; // already loaded

      setLoadingComments(postId);
      const res = await fetch(`/api/groups/${groupId}/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => ({ ...prev, [postId]: data.comments ?? [] }));
      }
      setLoadingComments(null);
    },
    [expandedPost, comments, groupId]
  );

  // ── Submit comment ──────────────────────────────────
  const handleComment = useCallback(
    async (postId: string) => {
      if (!commentBody.trim() || !groupId) return;
      setSubmittingComment(true);
      const res = await fetch(`/api/groups/${groupId}/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentBody.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), data.comment],
        }));
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, comment_count: (p.comment_count || 0) + 1 } : p
          )
        );
        setCommentBody("");
      }
      setSubmittingComment(false);
    },
    [commentBody, groupId]
  );

  // ── RSVP to event ──────────────────────────────────
  const handleRsvp = useCallback(async (eventId: string) => {
    setRsvpLoading(eventId);
    const res = await fetch(`/api/events/${eventId}/rsvp`, { method: "POST" });
    if (res.ok) {
      setRsvpDone((prev) => new Set(prev).add(eventId));
    }
    setRsvpLoading(null);
  }, []);

  // ── Filter updates by business type ─────────────────
  const filteredUpdates = updates.filter(
    (u) =>
      !u.target_business_types ||
      u.target_business_types.length === 0 ||
      (businessType && u.target_business_types.includes(businessType))
  );

  // ── Loading state ───────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-4 py-5 space-y-4">
      {/* Header */}
      <div>
        <h1 className="font-heading text-xl font-bold">Chamber of Commerce</h1>
        <p className="text-xs text-txt-secondary mt-0.5">
          {memberCount} member{memberCount !== 1 ? "s" : ""} &middot; Compton Business Community
        </p>
      </div>

      {/* Tab Pills */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              tab === t.key
                ? "bg-gold text-midnight"
                : "bg-white/5 text-txt-secondary hover:bg-white/10"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════ COMMUNITY TAB ═══════ */}
      {tab === "community" && (
        <div className="space-y-3">
          {/* Post Composer */}
          <Card className="glass-card-elevated">
            <div className="space-y-3">
              <textarea
                placeholder="Share something with the chamber..."
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40 min-h-[80px] resize-none"
              />
              <div className="flex justify-end">
                <Button onClick={handlePost} loading={posting} disabled={!newBody.trim()}>
                  Post
                </Button>
              </div>
            </div>
          </Card>

          {/* Posts Feed */}
          {posts.length === 0 && postsLoaded && (
            <Card className="glass-card-elevated">
              <div className="text-center py-8">
                <p className="text-3xl mb-2">💬</p>
                <p className="text-sm font-semibold">No posts yet</p>
                <p className="text-xs text-txt-secondary mt-1">Be the first to share with the chamber!</p>
              </div>
            </Card>
          )}

          {posts.map((post) => (
            <Card key={post.id} className="glass-card-elevated">
              <div className="space-y-2">
                {/* Author */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    {post.author?.avatar_url ? (
                      <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-txt-secondary">
                        {post.author?.display_name?.charAt(0) || "?"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{post.author?.display_name || "Unknown"}</p>
                    <p className="text-[10px] text-txt-secondary">
                      {post.author?.handle ? `@${post.author.handle}` : ""} &middot; {timeAgo(post.created_at)}
                    </p>
                  </div>
                </div>

                {/* Body */}
                <p className="text-sm text-white/90 whitespace-pre-wrap">{post.body}</p>

                {/* Image */}
                {post.image_url && (
                  <img src={post.image_url} alt="" className="w-full rounded-xl max-h-64 object-cover" />
                )}

                {/* Comment toggle */}
                <button
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-1.5 text-xs text-txt-secondary hover:text-white transition-colors pt-1"
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {post.comment_count || 0} comment{(post.comment_count || 0) !== 1 ? "s" : ""}
                </button>

                {/* Expanded Comments */}
                {expandedPost === post.id && (
                  <div className="border-t border-border-subtle pt-3 mt-1 space-y-3">
                    {loadingComments === post.id ? (
                      <div className="flex justify-center py-3">
                        <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <>
                        {(comments[post.id] || []).map((c) => (
                          <div key={c.id} className="flex gap-2">
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                              {c.author?.avatar_url ? (
                                <img src={c.author.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <span className="text-[9px] font-bold text-txt-secondary">
                                  {c.author?.display_name?.charAt(0) || "?"}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs">
                                <span className="font-semibold">{c.author?.display_name || "Unknown"}</span>
                                <span className="text-txt-secondary ml-1.5">{timeAgo(c.created_at)}</span>
                              </p>
                              <p className="text-xs text-white/80 mt-0.5">{c.body}</p>
                            </div>
                          </div>
                        ))}

                        {/* Comment input */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Write a reply..."
                            value={commentBody}
                            onChange={(e) => setCommentBody(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleComment(post.id);
                              }
                            }}
                            className="flex-1 bg-white/5 border border-border-subtle rounded-lg px-3 py-2 text-xs text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40"
                          />
                          <button
                            onClick={() => handleComment(post.id)}
                            disabled={!commentBody.trim() || submittingComment}
                            className="px-3 py-2 rounded-lg bg-gold/20 text-gold text-xs font-semibold disabled:opacity-40 transition-opacity"
                          >
                            {submittingComment ? "..." : "Reply"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ═══════ RESOURCES TAB ═══════ */}
      {tab === "resources" && (
        <div className="space-y-3">
          {resources.length === 0 ? (
            <Card className="glass-card-elevated">
              <div className="text-center py-8">
                <p className="text-3xl mb-2">📦</p>
                <p className="text-sm font-semibold">No resources yet</p>
                <p className="text-xs text-txt-secondary mt-1">Business resources will appear here</p>
              </div>
            </Card>
          ) : (
            resources.map((r) => (
              <Card key={r.id} className="glass-card-elevated">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate">{r.name}</h3>
                      {r.organization && (
                        <p className="text-[10px] text-txt-secondary mt-0.5">{r.organization}</p>
                      )}
                    </div>
                    <Badge
                      label={r.status}
                      variant={STATUS_BADGE[r.status] || "gold"}
                    />
                  </div>
                  {r.description && (
                    <p className="text-xs text-txt-secondary line-clamp-2">{r.description}</p>
                  )}
                  {r.deadline && (
                    <p className="text-[10px] text-gold">
                      Deadline: {new Date(r.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ═══════ EVENTS TAB ═══════ */}
      {tab === "events" && (
        <div className="space-y-3">
          {events.length === 0 ? (
            <Card className="glass-card-elevated">
              <div className="text-center py-8">
                <p className="text-3xl mb-2">📅</p>
                <p className="text-sm font-semibold">No upcoming events</p>
                <p className="text-xs text-txt-secondary mt-1">Business events will appear here</p>
              </div>
            </Card>
          ) : (
            events.map((ev) => {
              const d = formatEventDate(ev.start_date);
              return (
                <Card key={ev.id} className="glass-card-elevated">
                  <div className="flex gap-3">
                    {/* Date block */}
                    <div className="w-12 h-14 rounded-xl bg-gold/10 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-gold tracking-wider">{d.month}</span>
                      <span className="text-lg font-bold text-white leading-tight">{d.day}</span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold truncate">{ev.title}</h3>
                        <Badge
                          label={ev.category}
                          variant={EVENT_BADGE[ev.category] || "cyan"}
                        />
                      </div>
                      {ev.location && (
                        <p className="text-[10px] text-txt-secondary truncate">{ev.location}</p>
                      )}
                      <div className="flex items-center gap-2">
                        {ev.start_time && (
                          <span className="text-[10px] text-txt-secondary">{formatTime(ev.start_time)}</span>
                        )}
                        {ev.is_free && (
                          <Badge label="Free" variant="emerald" />
                        )}
                      </div>
                      <button
                        onClick={() => handleRsvp(ev.id)}
                        disabled={rsvpLoading === ev.id || rsvpDone.has(ev.id)}
                        className={`mt-1 px-3 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                          rsvpDone.has(ev.id)
                            ? "bg-emerald/20 text-emerald"
                            : "bg-gold/15 text-gold hover:bg-gold/25"
                        }`}
                      >
                        {rsvpLoading === ev.id ? "..." : rsvpDone.has(ev.id) ? "RSVP'd" : "RSVP"}
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* ═══════ GRANTS TAB ═══════ */}
      {tab === "grants" && (
        <div className="space-y-3">
          {grants.length === 0 ? (
            <Card className="glass-card-elevated">
              <div className="text-center py-8">
                <p className="text-3xl mb-2">💰</p>
                <p className="text-sm font-semibold">No grants available</p>
                <p className="text-xs text-txt-secondary mt-1">Grant opportunities will appear here</p>
              </div>
            </Card>
          ) : (
            grants.map((g) => (
              <Card key={g.id} className="glass-card-elevated">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate">{g.name}</h3>
                      {g.organization && (
                        <p className="text-[10px] text-txt-secondary mt-0.5">{g.organization}</p>
                      )}
                    </div>
                    {g.deadline && (
                      <span className="text-[10px] font-semibold text-gold whitespace-nowrap">
                        {daysUntil(g.deadline)}
                      </span>
                    )}
                  </div>
                  {g.description && (
                    <p className="text-xs text-txt-secondary line-clamp-2">{g.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        label={g.status}
                        variant={STATUS_BADGE[g.status] || "gold"}
                      />
                      {g.spots_remaining !== null && (
                        <span className="text-[10px] text-txt-secondary">
                          {g.spots_remaining} spot{g.spots_remaining !== 1 ? "s" : ""} left
                        </span>
                      )}
                    </div>
                    <button className="px-3 py-1 rounded-lg bg-gold/15 text-gold text-[10px] font-semibold hover:bg-gold/25 transition-all">
                      Apply
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ═══════ UPDATES TAB ═══════ */}
      {tab === "updates" && (
        <div className="space-y-3">
          {filteredUpdates.length === 0 ? (
            <Card className="glass-card-elevated">
              <div className="text-center py-8">
                <p className="text-3xl mb-2">📢</p>
                <p className="text-sm font-semibold">No updates</p>
                <p className="text-xs text-txt-secondary mt-1">Chamber updates will appear here</p>
              </div>
            </Card>
          ) : (
            filteredUpdates.map((u) => (
              <Card key={u.id} className="glass-card-elevated">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    {u.is_pinned && (
                      <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" className="text-gold shrink-0 mt-0.5">
                        <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                      </svg>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold truncate">{u.title}</h3>
                        {u.category && (
                          <Badge label={u.category} variant="purple" />
                        )}
                      </div>
                      <p className="text-xs text-txt-secondary line-clamp-2 mt-1">{u.body}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {u.author && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                              {u.author.avatar_url ? (
                                <img src={u.author.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[7px] font-bold text-txt-secondary">
                                  {u.author.display_name?.charAt(0) || "?"}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-txt-secondary">{u.author.display_name}</span>
                          </div>
                        )}
                        <span className="text-[10px] text-txt-secondary">&middot; {timeAgo(u.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
