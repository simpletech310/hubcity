"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { REACTION_EMOJI_MAP, REACTION_COLORS, ROLE_BADGE_MAP } from "@/lib/constants";
import type { ReactionEmoji } from "@/types/database";

// ── Types ───────────────────────────────────────────────
interface GroupInfo {
  id: string;
  name: string;
  description: string | null;
  category: string;
  image_url: string | null;
  member_count: number;
  is_public: boolean;
  created_by: string;
  created_at: string;
  creator: { display_name: string; avatar_url: string | null } | null;
}

interface GroupPost {
  id: string;
  body: string;
  image_url: string | null;
  is_pinned: boolean;
  comment_count: number;
  reaction_counts: Record<string, number>;
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

interface GroupMemberInfo {
  role: string;
  joined_at: string;
  user: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    handle: string | null;
    role: string;
  } | null;
}

interface GroupEvent {
  id: string;
  title: string;
  description: string | null;
  category: string;
  start_date: string;
  start_time: string | null;
  end_date: string | null;
  end_time: string | null;
  location_name: string | null;
  rsvp_count: number;
}

type GroupTab = "posts" | "events" | "members";

const CATEGORY_ICONS: Record<string, string> = {
  neighborhood: "house",
  interest: "lightbulb",
  school: "graduation",
  faith: "heart-pulse",
  sports: "trophy",
  business: "briefcase",
  other: "handshake",
};

const CATEGORY_BADGE: Record<string, "gold" | "emerald" | "cyan" | "purple" | "coral" | "blue" | "pink"> = {
  neighborhood: "cyan",
  interest: "purple",
  school: "blue",
  faith: "pink",
  sports: "emerald",
  business: "gold",
  other: "coral",
};

const CATEGORY_GRADIENT_COLORS: Record<string, string> = {
  neighborhood: "#06B6D4",
  interest: "#8B5CF6",
  school: "#3B82F6",
  faith: "#EC4899",
  sports: "#10B981",
  business: "#F2A900",
  other: "#F87171",
};

const REACTION_EMOJIS = [
  { key: "heart", display: "\u2764\uFE0F" },
  { key: "fire", display: "\uD83D\uDD25" },
  { key: "clap", display: "\uD83D\uDC4F" },
  { key: "hundred", display: "\uD83D\uDCAF" },
  { key: "pray", display: "\uD83D\uDE4F" },
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

function formatCreatedDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" });
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

// ── Main Component ──────────────────────────────────────
export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  // Post composer
  const [newBody, setNewBody] = useState("");
  const [posting, setPosting] = useState(false);

  // Post state
  const [expandedBodies, setExpandedBodies] = useState<Set<string>>(new Set());

  // Comments
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, PostComment[]>>({});
  const [loadingComments, setLoadingComments] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Reactions
  const [userReactions, setUserReactions] = useState<Record<string, string[]>>({});
  const [reactingPost, setReactingPost] = useState<string | null>(null);

  // UI state
  const [descExpanded, setDescExpanded] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState<GroupMemberInfo[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [postMenu, setPostMenu] = useState<string | null>(null);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<GroupTab>("posts");

  // Events
  const [groupEvents, setGroupEvents] = useState<GroupEvent[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "", description: "", category: "community",
    start_date: "", start_time: "", location_name: "",
  });
  const [creatingEvent, setCreatingEvent] = useState(false);

  // Edit form
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPublic, setEditPublic] = useState(true);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Load group + posts ────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);

      // Fetch group detail
      const groupRes = await fetch(`/api/groups/${id}`);
      if (groupRes.ok) {
        const data = await groupRes.json();
        setGroup(data.group);
        setMyRole(data.my_role);
        setIsMember(!!data.my_role);
      }

      // Fetch posts + members + events in parallel
      const [postsRes, membersRes, eventsRes] = await Promise.all([
        fetch(`/api/groups/${id}/posts`),
        fetch(`/api/groups/${id}/members`),
        fetch(`/api/groups/${id}/events`),
      ]);

      if (postsRes.ok) {
        const data = await postsRes.json();
        setPosts(data.posts ?? []);
        if (data.my_role) setMyRole(data.my_role);
        setUserReactions(data.user_reactions ?? {});
        setUserId(data.user_id ?? null);
        if (data.my_role) setIsMember(true);
      }

      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(data.members ?? []);
      }

      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setGroupEvents(data.events ?? []);
        setEventsLoaded(true);
      }

      setLoading(false);
    }
    load();
  }, [id]);

  // ── Join/Leave ────────────────────────────────────────
  async function handleJoin() {
    setJoining(true);
    const res = await fetch(`/api/groups/${id}/join`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setIsMember(data.joined);
      setMyRole(data.joined ? "member" : null);
      if (group) setGroup({ ...group, member_count: data.member_count });
    }
    setJoining(false);
  }

  // ── Create post ───────────────────────────────────────
  const handlePost = useCallback(async () => {
    if (!newBody.trim()) return;
    setPosting(true);
    const res = await fetch(`/api/groups/${id}/posts`, {
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
  }, [newBody, id]);

  // ── Toggle comments ───────────────────────────────────
  const toggleComments = useCallback(
    async (postId: string) => {
      if (expandedPost === postId) {
        setExpandedPost(null);
        return;
      }
      setExpandedPost(postId);
      if (comments[postId]) return;

      setLoadingComments(postId);
      const res = await fetch(`/api/groups/${id}/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => ({ ...prev, [postId]: data.comments ?? [] }));
      }
      setLoadingComments(null);
    },
    [expandedPost, comments, id]
  );

  // ── Submit comment ────────────────────────────────────
  const handleComment = useCallback(
    async (postId: string) => {
      if (!commentBody.trim()) return;
      setSubmittingComment(true);
      const res = await fetch(`/api/groups/${id}/posts/${postId}/comments`, {
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
          prev.map((p) => (p.id === postId ? { ...p, comment_count: (p.comment_count || 0) + 1 } : p))
        );
        setCommentBody("");
      }
      setSubmittingComment(false);
    },
    [commentBody, id]
  );

  // ── Toggle reaction ───────────────────────────────────
  const handleReact = useCallback(
    async (postId: string, emoji: string) => {
      setReactingPost(postId);
      const res = await fetch(`/api/groups/${id}/posts/${postId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, reaction_counts: data.reaction_counts } : p))
        );
        setUserReactions((prev) => {
          const current = prev[postId] || [];
          if (data.user_reacted) {
            return { ...prev, [postId]: [...current, emoji] };
          } else {
            return { ...prev, [postId]: current.filter((e) => e !== emoji) };
          }
        });
      }
      setReactingPost(null);
    },
    [id]
  );

  // ── Delete post ───────────────────────────────────────
  const handleDeletePost = useCallback(
    async (postId: string) => {
      if (!confirm("Delete this post?")) return;
      const res = await fetch(`/api/groups/${id}/posts/${postId}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      }
      setPostMenu(null);
    },
    [id]
  );

  // ── Pin/unpin post ────────────────────────────────────
  const handlePinPost = useCallback(
    async (postId: string, pin: boolean) => {
      const res = await fetch(`/api/groups/${id}/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_pinned: pin }),
      });
      if (res.ok) {
        setPosts((prev) => {
          const updated = prev.map((p) => (p.id === postId ? { ...p, is_pinned: pin } : p));
          // Re-sort: pinned first
          return updated.sort((a, b) => {
            if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
        });
      }
      setPostMenu(null);
    },
    [id]
  );

  // ── Delete comment ────────────────────────────────────
  const handleDeleteComment = useCallback(
    async (postId: string, commentId: string) => {
      const res = await fetch(`/api/groups/${id}/posts/${postId}/comments/${commentId}`, { method: "DELETE" });
      if (res.ok) {
        setComments((prev) => ({
          ...prev,
          [postId]: (prev[postId] || []).filter((c) => c.id !== commentId),
        }));
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, comment_count: Math.max(0, (p.comment_count || 0) - 1) } : p))
        );
      }
    },
    [id]
  );

  // ── Load members ──────────────────────────────────────
  const loadMembers = useCallback(async () => {
    setShowMembers(true);
    if (members.length > 0) return;
    setLoadingMembers(true);
    const res = await fetch(`/api/groups/${id}/members`);
    if (res.ok) {
      const data = await res.json();
      setMembers(data.members ?? []);
    }
    setLoadingMembers(false);
  }, [id, members.length]);

  // ── Remove member ─────────────────────────────────────
  const handleRemoveMember = useCallback(
    async (memberId: string, name: string) => {
      if (!confirm(`Remove ${name} from the group?`)) return;
      const res = await fetch(`/api/groups/${id}/members/${memberId}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        setMembers((prev) => prev.filter((m) => m.user?.id !== memberId));
        if (group) setGroup({ ...group, member_count: data.member_count });
      }
    },
    [id, group]
  );

  // ── Change role ───────────────────────────────────────
  const handleChangeRole = useCallback(
    async (memberId: string, newRole: string) => {
      const res = await fetch(`/api/groups/${id}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.user?.id === memberId ? { ...m, role: newRole } : m))
        );
      }
    },
    [id]
  );

  // ── Edit group ────────────────────────────────────────
  const openEdit = useCallback(() => {
    if (!group) return;
    setEditName(group.name);
    setEditDesc(group.description || "");
    setEditPublic(group.is_public);
    setEditImagePreview(group.image_url);
    setEditImageFile(null);
    setShowEditModal(true);
  }, [group]);

  const handleSaveEdit = useCallback(async () => {
    setSaving(true);
    let imageUrl = group?.image_url ?? null;

    // Upload new image if selected
    if (editImageFile) {
      const formData = new FormData();
      formData.append("file", editImageFile);
      formData.append("groupId", id);
      const uploadRes = await fetch("/api/upload/group-image", {
        method: "POST",
        body: formData,
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }
    }

    const res = await fetch(`/api/groups/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName.trim(),
        description: editDesc.trim() || null,
        is_public: editPublic,
        image_url: imageUrl,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setGroup((prev) => (prev ? { ...prev, ...data.group } : prev));
      setShowEditModal(false);
    }
    setSaving(false);
  }, [id, editName, editDesc, editPublic, editImageFile, group?.image_url]);

  // ── Share ─────────────────────────────────────────────
  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({ title: group?.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }, [group]);

  // ── Create event ───────────────────────────────────
  const handleCreateEvent = useCallback(async () => {
    if (!eventForm.title.trim() || !eventForm.start_date) return;
    setCreatingEvent(true);
    const res = await fetch(`/api/groups/${id}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventForm),
    });
    if (res.ok) {
      const data = await res.json();
      setGroupEvents((prev) => [...prev, data.event]);
      setShowCreateEvent(false);
      setEventForm({ title: "", description: "", category: "community", start_date: "", start_time: "", location_name: "" });
    }
    setCreatingEvent(false);
  }, [id, eventForm]);

  const isAdminOrMod = myRole === "admin" || myRole === "moderator";

  // ── Loading ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="px-5 py-20 text-center">
        <p className="text-sm text-txt-secondary">Group not found</p>
        <Link href="/groups" className="text-xs text-gold mt-2 inline-block">Back to groups</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-24">
      {/* ═══════ HEADER ═══════ */}
      <div className="relative overflow-hidden">
        {/* Cover image or gradient */}
        {group.image_url ? (
          <div className="h-[140px] relative">
            <img src={group.image_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/60 to-transparent" />
          </div>
        ) : (
          <div
            className="h-[120px]"
            style={{
              background: `linear-gradient(135deg, ${CATEGORY_GRADIENT_COLORS[group.category] || "#8B5CF6"}25 0%, var(--color-midnight) 60%, ${CATEGORY_GRADIENT_COLORS[group.category] || "#8B5CF6"}10 100%)`,
            }}
          />
        )}

        <div className="relative px-5 -mt-8 pb-4">
          {/* Group icon + title row */}
          <div className="flex items-end gap-3">
            <div
              className={`w-16 h-16 rounded-2xl bg-deep border-2 flex items-center justify-center shrink-0 shadow-lg ${
                isAdminOrMod ? "border-gold/30" : "border-border-subtle"
              }`}
            >
              <Icon name={(CATEGORY_ICONS[group.category] || "handshake") as IconName} size={28} />
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-xl font-bold truncate">{group.name}</h1>
                {myRole === "admin" && (
                  <button onClick={openEdit} className="p-1 text-txt-secondary hover:text-gold transition-colors">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {group.description && (
            <div className="mt-2">
              <p
                className={`text-xs text-txt-secondary ${!descExpanded ? "line-clamp-2" : ""}`}
                onClick={() => setDescExpanded(!descExpanded)}
              >
                {group.description}
              </p>
              {group.description.length > 100 && (
                <button
                  onClick={() => setDescExpanded(!descExpanded)}
                  className="text-[10px] text-gold mt-0.5"
                >
                  {descExpanded ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          )}

          {/* Info row */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Badge label={group.category} variant={CATEGORY_BADGE[group.category] || "gold"} />
            <Badge label={group.is_public ? "Public" : "Private"} variant={group.is_public ? "emerald" : "coral"} />
            <span className="text-[10px] text-txt-secondary">Created {formatCreatedDate(group.created_at)}</span>
            {group.creator && (
              <span className="text-[10px] text-txt-secondary">by {group.creator.display_name}</span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-3">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-xs text-txt-secondary">
              <Icon name="users" size={14} />
              {group.member_count} member{group.member_count !== 1 ? "s" : ""}
            </span>
            <button
              onClick={handleJoin}
              disabled={joining}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isMember
                  ? "bg-emerald/20 text-emerald border border-emerald/30"
                  : "bg-gold text-midnight"
              }`}
            >
              {joining ? "..." : isMember ? "Joined" : "Join"}
            </button>
            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg bg-white/5 text-txt-secondary hover:text-white transition-colors"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ═══════ TABS ═══════ */}
      <div className="flex gap-1 px-5 mt-3 mb-3 border-b border-border-subtle">
        {(["posts", "events", "members"] as GroupTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2.5 text-xs font-semibold capitalize transition-all border-b-2 ${
              activeTab === t
                ? "border-gold text-gold"
                : "border-transparent text-txt-secondary hover:text-white"
            }`}
          >
            {t}
            {t === "events" && groupEvents.length > 0 && (
              <span className="ml-1.5 text-[9px] bg-gold/20 text-gold px-1.5 py-0.5 rounded-full">{groupEvents.length}</span>
            )}
            {t === "members" && (
              <span className="ml-1.5 text-[9px] bg-white/10 px-1.5 py-0.5 rounded-full">{group.member_count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════ POSTS TAB ═══════ */}
      {activeTab === "posts" && (
        <>
      {/* ═══════ POST COMPOSER ═══════ */}
      {isMember && (
        <div className="px-5 mt-2 mb-4">
          <Card>
            <div className="space-y-3">
              <textarea
                placeholder="Share something with the group..."
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
        </div>
      )}

      {/* Not a member prompt */}
      {!isMember && !loading && (
        <div className="px-5 mt-4 mb-4">
          <Card>
            <div className="text-center py-4">
              <p className="text-sm text-txt-secondary">Join this group to participate in discussions</p>
              <button
                onClick={handleJoin}
                disabled={joining}
                className="mt-3 px-6 py-2 rounded-xl bg-gradient-to-r from-gold to-gold-light text-midnight font-bold text-sm press"
              >
                {joining ? "Joining..." : "Join Group"}
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* ═══════ POSTS FEED ═══════ */}
      <div className="px-5 space-y-3">
        {posts.length === 0 && (
          <Card>
            <div className="text-center py-8">
              <p className="text-3xl mb-3"><Icon name="chat" size={28} /></p>
              <p className="text-sm font-semibold">No posts yet</p>
              <p className="text-xs text-txt-secondary mt-1">
                {isMember ? "Be the first to post!" : "Join to start the conversation"}
              </p>
            </div>
          </Card>
        )}

        {posts.map((post) => {
          const isMyPost = post.author?.id === userId;
          const canModerate = isAdminOrMod || isMyPost;
          const myPostReactions = userReactions[post.id] || [];
          const reactionEmojis = Object.keys(REACTION_EMOJI_MAP) as ReactionEmoji[];
          const totalReactions = Object.values(post.reaction_counts || {}).reduce((a, b) => a + (b || 0), 0);
          const isLong = post.body.length > 280;

          return (
            <Card key={post.id} className={`!p-0 relative overflow-hidden ${post.is_pinned ? "border-gold/15" : ""}`}>
              {/* Pinned accent bar */}
              {post.is_pinned && (
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-gold to-gold/20 rounded-full z-10" />
              )}

              {/* Author header */}
              <div className="p-4 pb-0">
                {/* Pinned indicator */}
                {post.is_pinned && (
                  <div className="flex items-center gap-1 text-gold text-[10px] font-semibold mb-2">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                    </svg>
                    PINNED
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Link
                    href={post.author?.handle ? `/user/${post.author.handle}` : "#"}
                    className="w-11 h-11 rounded-full bg-white/10 ring-1 ring-white/[0.06] flex items-center justify-center overflow-hidden shrink-0"
                  >
                    {post.author?.avatar_url ? (
                      <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-txt-secondary">
                        {post.author?.display_name?.charAt(0) || "?"}
                      </span>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold truncate">{post.author?.display_name || "Unknown"}</p>
                      {post.author?.role && ROLE_BADGE_MAP[post.author.role] && (
                        <Badge variant={ROLE_BADGE_MAP[post.author.role].variant} size="sm" label={ROLE_BADGE_MAP[post.author.role].label} />
                      )}
                    </div>
                    <p className="text-[11px] text-txt-secondary">
                      {post.author?.handle ? `@${post.author.handle}` : ""}{post.author?.handle ? " · " : ""}{timeAgo(post.created_at)}
                    </p>
                  </div>
                  {/* Three-dot menu */}
                  {canModerate && (
                    <div className="relative">
                      <button
                        onClick={() => setPostMenu(postMenu === post.id ? null : post.id)}
                        className="p-1.5 text-txt-secondary hover:text-white transition-colors rounded-lg hover:bg-white/5"
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="5" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="12" cy="19" r="1.5" />
                        </svg>
                      </button>
                      {postMenu === post.id && (
                        <div className="absolute right-0 top-8 z-20 bg-deep border border-border-subtle rounded-xl shadow-xl py-1 min-w-[140px]">
                          {isAdminOrMod && (
                            <button
                              onClick={() => handlePinPost(post.id, !post.is_pinned)}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors"
                            >
                              {post.is_pinned ? "Unpin Post" : "Pin Post"}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="w-full text-left px-3 py-2 text-xs text-coral hover:bg-white/5 transition-colors"
                          >
                            Delete Post
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Body with read more */}
                <div className="mt-3">
                  <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
                    {isLong && !expandedBodies.has(post.id) ? post.body.slice(0, 280) + "..." : post.body}
                  </p>
                  {isLong && !expandedBodies.has(post.id) && (
                    <button
                      onClick={() => setExpandedBodies((prev) => new Set(prev).add(post.id))}
                      className="text-gold text-xs font-semibold mt-1"
                    >
                      Read more
                    </button>
                  )}
                </div>
              </div>

              {/* Full-bleed image */}
              {post.image_url && (
                <div className="mt-3">
                  <img src={post.image_url} alt="" className="w-full max-h-[400px] object-cover" />
                </div>
              )}

              {/* Reactions + comments */}
              <div className="px-4 pb-3 pt-2.5">
                {/* Reaction summary line */}
                {totalReactions > 0 && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="flex -space-x-1">
                      {reactionEmojis
                        .filter((e) => (post.reaction_counts?.[e] || 0) > 0)
                        .slice(0, 3)
                        .map((e) => (
                          <span key={e} className="text-xs">{REACTION_EMOJI_MAP[e]}</span>
                        ))}
                    </div>
                    <span className="text-[11px] text-white/30 tabular-nums">{totalReactions}</span>
                    {(post.comment_count || 0) > 0 && (
                      <>
                        <span className="text-white/10 mx-1">&middot;</span>
                        <span className="text-[11px] text-white/30 tabular-nums">
                          {post.comment_count} comment{post.comment_count !== 1 ? "s" : ""}
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* Action row — all 5 emojis always visible */}
                <div className="flex items-center gap-0.5 pt-2 border-t border-white/[0.04]">
                  {reactionEmojis.map((emoji) => {
                    const isActive = myPostReactions.includes(emoji);
                    const count = post.reaction_counts?.[emoji] || 0;
                    const colors = REACTION_COLORS[emoji];

                    return (
                      <button
                        key={emoji}
                        onClick={() => isMember && handleReact(post.id, emoji)}
                        disabled={!isMember || reactingPost === post.id}
                        className={`flex items-center gap-1 px-2 py-1.5 rounded-full text-xs transition-all ${
                          isActive
                            ? `${colors.bg} ${colors.text} font-semibold scale-105`
                            : "text-white/40 hover:bg-white/[0.04] hover:text-white/60"
                        } ${!isMember ? "opacity-40 cursor-default" : "press"}`}
                      >
                        <span className={`text-sm ${isActive ? "" : "grayscale opacity-60"}`}>{REACTION_EMOJI_MAP[emoji]}</span>
                        {count > 0 && <span className="tabular-nums text-[11px]">{count}</span>}
                      </button>
                    );
                  })}

                  {/* Comment button */}
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/40 hover:bg-white/[0.04] hover:text-white/60 rounded-full transition-all ml-auto press"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span className="tabular-nums">{post.comment_count || 0}</span>
                  </button>
                </div>

                {/* Expanded Comments */}
                {expandedPost === post.id && (
                  <div className="border-t border-border-subtle pt-3 mt-2 space-y-3">
                    {loadingComments === post.id ? (
                      <div className="flex justify-center py-3">
                        <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <>
                        {(comments[post.id] || []).length === 0 && (
                          <p className="text-[10px] text-txt-secondary text-center py-2">No comments yet</p>
                        )}

                        {(comments[post.id] || []).map((c) => {
                          const canDeleteComment = isAdminOrMod || c.author?.id === userId;
                          return (
                            <div key={c.id} className="flex gap-2.5 group">
                              <div className="w-7 h-7 rounded-full bg-white/10 ring-1 ring-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
                                {c.author?.avatar_url ? (
                                  <img src={c.author.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[9px] font-bold text-txt-secondary">
                                    {c.author?.display_name?.charAt(0) || "?"}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0 bg-white/[0.03] rounded-xl px-3 py-2">
                                <p className="text-xs">
                                  <span className="font-bold">{c.author?.display_name || "Unknown"}</span>
                                  <span className="text-txt-secondary ml-1.5 text-[10px]">{timeAgo(c.created_at)}</span>
                                </p>
                                <p className="text-xs text-white/80 mt-0.5 leading-relaxed">{c.body}</p>
                              </div>
                              {canDeleteComment && (
                                <button
                                  onClick={() => handleDeleteComment(post.id, c.id)}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-txt-secondary hover:text-coral transition-all shrink-0 self-center"
                                  title="Delete comment"
                                >
                                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          );
                        })}

                        {/* Comment input */}
                        {isMember && (
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
                              className="flex-1 bg-white/5 border border-border-subtle rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40"
                            />
                            <button
                              onClick={() => handleComment(post.id)}
                              disabled={!commentBody.trim() || submittingComment}
                              className="px-3 py-2.5 rounded-xl bg-gold/20 text-gold text-xs font-semibold disabled:opacity-40 transition-opacity press"
                            >
                              {submittingComment ? "..." : "Reply"}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

        </>
      )}

      {/* ═══════ EVENTS TAB ═══════ */}
      {activeTab === "events" && (
        <div className="px-5 space-y-3">
          {/* Create Event button for admin/mod */}
          {isAdminOrMod && (
            <button
              onClick={() => setShowCreateEvent(!showCreateEvent)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-gold/30 text-gold text-xs font-semibold hover:bg-gold/5 transition-colors"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create Event
            </button>
          )}

          {/* Create Event Form */}
          {showCreateEvent && isAdminOrMod && (
            <Card>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">New Event</h3>
                <input
                  type="text"
                  placeholder="Event title"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  rows={2}
                  className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40 resize-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-txt-secondary uppercase tracking-wider font-semibold">Date</label>
                    <input
                      type="date"
                      value={eventForm.start_date}
                      onChange={(e) => setEventForm({ ...eventForm, start_date: e.target.value })}
                      className="w-full mt-1 bg-white/5 border border-border-subtle rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/40"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-txt-secondary uppercase tracking-wider font-semibold">Time</label>
                    <input
                      type="time"
                      value={eventForm.start_time}
                      onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
                      className="w-full mt-1 bg-white/5 border border-border-subtle rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/40"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Location (optional)"
                  value={eventForm.location_name}
                  onChange={(e) => setEventForm({ ...eventForm, location_name: e.target.value })}
                  className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40"
                />
                <select
                  value={eventForm.category}
                  onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                  className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold/40"
                >
                  <option value="community">Community</option>
                  <option value="sports">Sports</option>
                  <option value="business">Business</option>
                  <option value="networking">Networking</option>
                  <option value="culture">Culture</option>
                  <option value="youth">Youth</option>
                </select>
                <div className="flex gap-2">
                  <Button onClick={handleCreateEvent} loading={creatingEvent} disabled={!eventForm.title.trim() || !eventForm.start_date}>
                    Create Event
                  </Button>
                  <button
                    onClick={() => setShowCreateEvent(false)}
                    className="px-4 py-2 text-xs text-txt-secondary hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Events list */}
          {groupEvents.length === 0 && eventsLoaded && (
            <Card>
              <div className="text-center py-8">
                <p className="text-3xl mb-2">📅</p>
                <p className="text-sm font-semibold">No events yet</p>
                <p className="text-xs text-txt-secondary mt-1">
                  {isAdminOrMod ? "Create your first event above!" : "Events will appear here"}
                </p>
              </div>
            </Card>
          )}

          {groupEvents.map((ev) => {
            const d = formatEventDate(ev.start_date);
            return (
              <Link key={ev.id} href={`/events/${ev.id}`}>
                <Card hover className="relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
                  <div className="flex gap-3">
                    <div className="w-12 h-14 rounded-xl bg-gold/10 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-gold tracking-wider">{d.month}</span>
                      <span className="text-lg font-bold text-white leading-tight">{d.day}</span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <h3 className="text-sm font-semibold truncate">{ev.title}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge label={ev.category} variant={CATEGORY_BADGE[ev.category] || "gold"} />
                        {ev.location_name && (
                          <span className="text-[10px] text-txt-secondary truncate">{ev.location_name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {ev.start_time && (
                          <span className="text-[10px] text-txt-secondary">{formatTime(ev.start_time)}</span>
                        )}
                        {ev.rsvp_count > 0 && (
                          <span className="text-[10px] text-emerald">{ev.rsvp_count} going</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* ═══════ MEMBERS TAB ═══════ */}
      {activeTab === "members" && (
        <div className="px-5 space-y-2">
          {members.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            members.map((m) => (
              <div key={m.user?.id} className="flex items-center gap-3 py-2.5 border-b border-border-subtle last:border-0">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                  {m.user?.avatar_url ? (
                    <img src={m.user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-txt-secondary">
                      {m.user?.display_name?.charAt(0) || "?"}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold truncate">{m.user?.display_name || "Unknown"}</p>
                    {m.role === "admin" && <Badge label="Admin" variant="gold" />}
                    {m.role === "moderator" && <Badge label="Mod" variant="purple" />}
                  </div>
                  {m.user?.handle && (
                    <p className="text-[10px] text-txt-secondary">@{m.user.handle}</p>
                  )}
                </div>
                {/* Admin actions */}
                {myRole === "admin" && m.user?.id !== userId && (
                  <div className="flex items-center gap-1">
                    {m.role === "member" && (
                      <button
                        onClick={() => handleChangeRole(m.user!.id, "moderator")}
                        className="px-2 py-1 text-[9px] bg-purple/10 text-hc-purple rounded-lg hover:bg-purple/20 transition-colors flex items-center gap-1"
                      >
                        <Icon name="crown" size={10} /> Mod
                      </button>
                    )}
                    {m.role === "moderator" && (
                      <button
                        onClick={() => handleChangeRole(m.user!.id, "member")}
                        className="px-2 py-1 text-[9px] bg-white/5 text-txt-secondary rounded-lg hover:bg-white/10 transition-colors"
                      >
                        Demote
                      </button>
                    )}
                    {m.role !== "admin" && (
                      <button
                        onClick={() => handleRemoveMember(m.user!.id, m.user!.display_name)}
                        className="px-2 py-1 text-[9px] bg-coral/10 text-coral rounded-lg hover:bg-coral/20 transition-colors flex items-center gap-1"
                      >
                        <Icon name="trash" size={10} /> Remove
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ═══════ MEMBERS MODAL (kept for backward compat) ═══════ */}
      {showMembers && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowMembers(false)} />
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 bg-deep border-t border-border-subtle rounded-t-2xl max-h-[70vh] overflow-y-auto">
            <div className="sticky top-0 bg-deep/95 backdrop-blur-md px-5 py-3 border-b border-border-subtle flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm">Members ({group.member_count})</h3>
              <button onClick={() => setShowMembers(false)} className="p-1 text-txt-secondary hover:text-white">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-5 py-3 space-y-2">
              {loadingMembers ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                members.map((m) => (
                  <div key={m.user?.id} className="flex items-center gap-3 py-2">
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                      {m.user?.avatar_url ? (
                        <img src={m.user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-txt-secondary">
                          {m.user?.display_name?.charAt(0) || "?"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold truncate">{m.user?.display_name || "Unknown"}</p>
                        {m.role === "admin" && <Badge label="Admin" variant="gold" />}
                        {m.role === "moderator" && <Badge label="Mod" variant="purple" />}
                      </div>
                      {m.user?.handle && (
                        <p className="text-[10px] text-txt-secondary">@{m.user.handle}</p>
                      )}
                    </div>
                    {/* Admin actions */}
                    {myRole === "admin" && m.user?.id !== userId && (
                      <div className="flex items-center gap-1">
                        {m.role === "member" && (
                          <button
                            onClick={() => handleChangeRole(m.user!.id, "moderator")}
                            className="px-2 py-1 text-[9px] bg-purple/10 text-hc-purple rounded-lg hover:bg-purple/20 transition-colors flex items-center gap-1"
                          >
                            <Icon name="crown" size={10} /> Mod
                          </button>
                        )}
                        {m.role === "moderator" && (
                          <button
                            onClick={() => handleChangeRole(m.user!.id, "member")}
                            className="px-2 py-1 text-[9px] bg-white/5 text-txt-secondary rounded-lg hover:bg-white/10 transition-colors"
                          >
                            Demote
                          </button>
                        )}
                        {m.role !== "admin" && (
                          <button
                            onClick={() => handleRemoveMember(m.user!.id, m.user!.display_name)}
                            className="px-2 py-1 text-[9px] bg-coral/10 text-coral rounded-lg hover:bg-coral/20 transition-colors flex items-center gap-1"
                          >
                            <Icon name="trash" size={10} /> Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* ═══════ EDIT GROUP MODAL ═══════ */}
      {showEditModal && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowEditModal(false)} />
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 bg-deep border-t border-border-subtle rounded-t-2xl">
            <div className="px-5 py-3 border-b border-border-subtle flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm">Edit Group</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 text-txt-secondary hover:text-white">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
              {/* Group Image */}
              <div>
                <label className="text-[10px] font-semibold text-txt-secondary uppercase tracking-wider">Group Image</label>
                <div
                  onClick={() => document.getElementById("group-image-input")?.click()}
                  className="mt-1.5 relative w-full h-32 rounded-xl bg-white/5 border border-dashed border-border-subtle overflow-hidden cursor-pointer hover:border-gold/30 transition-colors group"
                >
                  {editImagePreview ? (
                    <>
                      <img src={editImagePreview} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs font-semibold text-white">Change Image</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-1.5">
                      <Icon name="photo" size={20} className="text-txt-secondary" />
                      <span className="text-[11px] text-txt-secondary">Tap to upload</span>
                    </div>
                  )}
                </div>
                <input
                  id="group-image-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setEditImageFile(file);
                    const reader = new FileReader();
                    reader.onload = (ev) => setEditImagePreview(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }}
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-txt-secondary uppercase tracking-wider">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full mt-1 bg-white/5 border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold/40"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-txt-secondary uppercase tracking-wider">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full mt-1 bg-white/5 border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold/40 resize-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-txt-secondary">Public Group</span>
                <button
                  onClick={() => setEditPublic(!editPublic)}
                  className={`w-10 h-5 rounded-full transition-colors ${editPublic ? "bg-emerald" : "bg-white/20"}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${editPublic ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
              <Button onClick={handleSaveEdit} loading={saving} disabled={!editName.trim()} className="w-full">
                {editImageFile ? "Upload & Save" : "Save Changes"}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Close post menu on outside click */}
      {postMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setPostMenu(null)} />
      )}
    </div>
  );
}
