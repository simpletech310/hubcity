"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import GroupHeader from "@/components/groups/GroupHeader";
import GroupPostComposer from "@/components/groups/GroupPostComposer";
import GroupPostCard from "@/components/groups/GroupPostCard";
import GroupCommentsSheet from "@/components/groups/GroupCommentsSheet";
import GroupEditModal from "@/components/groups/GroupEditModal";
import GroupEventForm from "@/components/groups/GroupEventForm";
import GroupGallery from "@/components/groups/GroupGallery";

// ── Types ───────────────────────────────────────────────
interface GroupInfo {
  id: string;
  name: string;
  description: string | null;
  category: string;
  image_url: string | null;
  avatar_url: string | null;
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
  video_url: string | null;
  media_type: string | null;
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
  location_name: string | null;
  rsvp_count: number;
  visibility: string | null;
}

type GroupTab = "posts" | "events" | "gallery" | "members";

const CATEGORY_BADGE: Record<string, "gold" | "emerald" | "cyan" | "purple" | "coral" | "blue" | "pink"> = {
  // All category variants collapse to gold/emerald in the Culture palette
  neighborhood: "gold", interest: "gold", school: "gold",
  faith: "gold", sports: "emerald", business: "gold", other: "gold",
};

// ── Helpers ─────────────────────────────────────────────
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

  // Comments
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  // Reactions
  const [userReactions, setUserReactions] = useState<Record<string, string[]>>({});

  // Tab navigation
  const [activeTab, setActiveTab] = useState<GroupTab>("posts");

  // Members
  const [members, setMembers] = useState<GroupMemberInfo[]>([]);

  // Events
  const [groupEvents, setGroupEvents] = useState<GroupEvent[]>([]);
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  // Edit
  const [showEditModal, setShowEditModal] = useState(false);

  const isAdminOrMod = myRole === "admin" || myRole === "moderator";

  // ── Load all data ────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      const [groupRes, postsRes, membersRes, eventsRes] = await Promise.all([
        fetch(`/api/groups/${id}`),
        fetch(`/api/groups/${id}/posts`),
        fetch(`/api/groups/${id}/members`),
        fetch(`/api/groups/${id}/events`),
      ]);

      if (groupRes.ok) {
        const data = await groupRes.json();
        setGroup(data.group);
        setMyRole(data.my_role);
        setIsMember(!!data.my_role);
      }
      if (postsRes.ok) {
        const data = await postsRes.json();
        setPosts(data.posts ?? []);
        if (data.my_role) { setMyRole(data.my_role); setIsMember(true); }
        setUserReactions(data.user_reactions ?? {});
        setUserId(data.user_id ?? null);
        // Init comment counts
        const counts: Record<string, number> = {};
        for (const p of data.posts ?? []) counts[p.id] = p.comment_count || 0;
        setCommentCounts(counts);
      }
      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(data.members ?? []);
      }
      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setGroupEvents(data.events ?? []);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  // ── Join/Leave ────────────────────────────────────────
  const handleJoin = useCallback(async () => {
    setJoining(true);
    const res = await fetch(`/api/groups/${id}/join`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setIsMember(data.joined);
      setMyRole(data.joined ? "member" : null);
      if (group) setGroup({ ...group, member_count: data.member_count });
    }
    setJoining(false);
  }, [id, group]);

  // ── Create post ───────────────────────────────────────
  const handleNewPost = useCallback((post: Record<string, unknown>) => {
    setPosts((prev) => [post as unknown as GroupPost, ...prev]);
  }, []);

  // ── Delete post ───────────────────────────────────────
  const handleDeletePost = useCallback(async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`/api/groups/${id}/posts/${postId}`, { method: "DELETE" });
    if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, [id]);

  // ── Pin/unpin ─────────────────────────────────────────
  const handlePinPost = useCallback(async (postId: string, pin: boolean) => {
    const res = await fetch(`/api/groups/${id}/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_pinned: pin }),
    });
    if (res.ok) {
      setPosts((prev) => {
        const updated = prev.map((p) => (p.id === postId ? { ...p, is_pinned: pin } : p));
        return updated.sort((a, b) => {
          if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      });
    }
  }, [id]);

  // ── React ─────────────────────────────────────────────
  const handleReact = useCallback(async (postId: string, emoji: string) => {
    const res = await fetch(`/api/groups/${id}/posts/${postId}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    if (res.ok) {
      const data = await res.json();
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, reaction_counts: data.reaction_counts } : p)));
      setUserReactions((prev) => {
        const current = prev[postId] || [];
        if (data.user_reacted) return { ...prev, [postId]: [...current, emoji] };
        else return { ...prev, [postId]: current.filter((e) => e !== emoji) };
      });
    }
  }, [id]);

  // ── Share ─────────────────────────────────────────────
  const handleShare = useCallback(() => {
    const url = window.location.href;
    if (navigator.share) navigator.share({ title: group?.name, url });
    else navigator.clipboard.writeText(url);
  }, [group]);

  // ── Members management ────────────────────────────────
  const handleRemoveMember = useCallback(async (memberId: string, name: string) => {
    if (!confirm(`Remove ${name} from the group?`)) return;
    const res = await fetch(`/api/groups/${id}/members/${memberId}`, { method: "DELETE" });
    if (res.ok) {
      const data = await res.json();
      setMembers((prev) => prev.filter((m) => m.user?.id !== memberId));
      if (group) setGroup({ ...group, member_count: data.member_count });
    }
  }, [id, group]);

  const handleChangeRole = useCallback(async (memberId: string, newRole: string) => {
    const res = await fetch(`/api/groups/${id}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setMembers((prev) => prev.map((m) => (m.user?.id === memberId ? { ...m, role: newRole } : m)));
    }
  }, [id]);

  // ── Loading ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="culture-surface min-h-dvh flex justify-center py-20">
        <div
          className="w-8 h-8 rounded-full animate-spin"
          style={{ border: "2px solid var(--gold-c)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="culture-surface min-h-dvh px-5 py-20 text-center">
        <p className="c-kicker" style={{ color: "var(--ink-strong)", opacity: 0.65 }}>
          GROUP NOT FOUND
        </p>
        <Link
          href="/groups"
          className="c-kicker mt-2 inline-block"
          style={{ color: "var(--ink-strong)" }}
        >
          ← BACK TO COMMUNITY
        </Link>
      </div>
    );
  }

  return (
    <div className="culture-surface min-h-dvh animate-fade-in pb-24">
      {/* ═══════ HEADER ═══════ */}
      <GroupHeader
        group={group}
        isMember={isMember}
        myRole={myRole}
        joining={joining}
        onJoin={handleJoin}
        onEdit={() => setShowEditModal(true)}
        onShare={handleShare}
      />

      {/* ═══════ TABS ═══════ */}
      <div
        className="flex gap-1 px-5 mt-3 mb-3"
        style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
      >
        {(["posts", "events", "gallery", "members"] as GroupTab[]).map((t) => {
          const active = activeTab === t;
          return (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className="px-4 py-2.5 c-kicker transition-all"
              style={{
                fontSize: 11,
                color: "var(--ink-strong)",
                opacity: active ? 1 : 0.55,
                borderBottom: active ? "3px solid var(--gold-c)" : "3px solid transparent",
                marginBottom: -2,
              }}
            >
              {t.toUpperCase()}
              {t === "events" && groupEvents.length > 0 && (
                <span
                  className="ml-1.5 c-kicker"
                  style={{
                    fontSize: 9,
                    background: "var(--gold-c)",
                    color: "var(--ink-strong)",
                    padding: "1px 6px",
                  }}
                >
                  {groupEvents.length}
                </span>
              )}
              {t === "members" && (
                <span
                  className="ml-1.5 c-kicker"
                  style={{
                    fontSize: 9,
                    background: "var(--paper-soft)",
                    color: "var(--ink-strong)",
                    border: "1.5px solid var(--rule-strong-c)",
                    padding: "1px 6px",
                  }}
                >
                  {group.member_count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ═══════ POSTS TAB ═══════ */}
      {activeTab === "posts" && (
        <>
          {isMember && (
            <div className="px-5 mt-2 mb-4">
              <GroupPostComposer groupId={id} userId={userId!} onPost={handleNewPost} />
            </div>
          )}

          {!isMember && !loading && (
            <div className="px-5 mt-4 mb-4">
              <div
                className="p-4 text-center"
                style={{
                  background: "var(--paper-warm)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                <p className="c-serif-it" style={{ fontSize: 14, color: "var(--ink-strong)" }}>
                  Join this scene to join the conversation.
                </p>
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="c-btn c-btn-primary c-btn-sm mt-3 press disabled:opacity-40"
                >
                  {joining ? "JOINING…" : "JOIN GROUP"}
                </button>
              </div>
            </div>
          )}

          <div className="px-5 space-y-3">
            {posts.length === 0 && (
              <div
                className="p-6 text-center"
                style={{
                  background: "var(--paper)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                <Icon name="chat" size={28} className="mx-auto mb-2" style={{ color: "var(--ink-strong)", opacity: 0.35 }} />
                <p className="c-kicker" style={{ fontSize: 11, color: "var(--ink-strong)" }}>
                  NO POSTS YET
                </p>
                <p className="c-serif-it mt-1" style={{ fontSize: 12 }}>
                  {isMember ? "Be the first to post." : "Join to start the conversation."}
                </p>
              </div>
            )}

            {posts.map((post) => (
              <GroupPostCard
                key={post.id}
                post={{ ...post, comment_count: commentCounts[post.id] ?? post.comment_count }}
                groupId={id}
                userId={userId}
                isMember={isMember}
                isAdminOrMod={isAdminOrMod}
                userReactions={userReactions[post.id] || []}
                onDelete={handleDeletePost}
                onPin={handlePinPost}
                onReact={handleReact}
                onCommentOpen={(postId) => setCommentsPostId(postId)}
                onReactionCountsChange={(postId, counts) =>
                  setPosts((prev) =>
                    prev.map((p) => (p.id === postId ? { ...p, reaction_counts: counts } : p))
                  )
                }
                onUserReactionsChange={(postId, emojis) =>
                  setUserReactions((prev) => ({ ...prev, [postId]: emojis }))
                }
              />
            ))}
          </div>
        </>
      )}

      {/* ═══════ EVENTS TAB ═══════ */}
      {activeTab === "events" && (
        <div className="px-5 space-y-3">
          {isAdminOrMod && (
            <button
              onClick={() => setShowCreateEvent(!showCreateEvent)}
              className="w-full flex items-center justify-center gap-2 py-3 c-kicker press"
              style={{
                fontSize: 11,
                color: "var(--ink-strong)",
                border: "2px dashed var(--rule-strong-c)",
                background: "var(--paper-warm)",
              }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {showCreateEvent ? "CLOSE FORM" : "CREATE EVENT"}
            </button>
          )}

          <GroupEventForm
            groupId={id}
            isOpen={showCreateEvent}
            onClose={() => setShowCreateEvent(false)}
            onCreated={(event) => setGroupEvents((prev) => [...prev, event as unknown as GroupEvent])}
          />

          {groupEvents.length === 0 && (
            <div
              className="p-6 text-center"
              style={{
                background: "var(--paper)",
                border: "2px solid var(--rule-strong-c)",
              }}
            >
              <p className="c-kicker" style={{ fontSize: 11, color: "var(--ink-strong)" }}>
                NO EVENTS YET
              </p>
              <p className="c-serif-it mt-1" style={{ fontSize: 12 }}>
                {isAdminOrMod ? "Create your first event above." : "Events will appear here."}
              </p>
            </div>
          )}

          {groupEvents.map((ev) => {
            const d = formatEventDate(ev.start_date);
            return (
              <Link key={ev.id} href={`/events/${ev.id}`} className="block">
                <div
                  className="relative overflow-hidden p-3"
                  style={{
                    background: "var(--paper)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  <div style={{ height: 3, background: "var(--gold-c)", marginLeft: -12, marginRight: -12, marginTop: -12, marginBottom: 10 }} />
                  <div className="flex gap-3">
                    <div
                      className="w-14 h-14 flex flex-col items-center justify-center shrink-0"
                      style={{
                        background: "var(--ink-strong)",
                        color: "var(--gold-c)",
                      }}
                    >
                      <span className="c-kicker" style={{ fontSize: 9, color: "var(--gold-c)" }}>{d.month}</span>
                      <span
                        className="c-hero"
                        style={{ fontSize: 22, lineHeight: 1, color: "var(--paper)" }}
                      >
                        {d.day}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <h3 className="c-card-t truncate" style={{ fontSize: 13, color: "var(--ink-strong)" }}>
                        {ev.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge label={ev.category} variant={CATEGORY_BADGE[ev.category] || "gold"} />
                        {ev.visibility === "group" && (
                          <Badge label="Group Only" variant="gold" />
                        )}
                        {ev.location_name && (
                          <span className="c-kicker truncate" style={{ fontSize: 9, opacity: 0.6 }}>
                            {ev.location_name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {ev.start_time && (
                          <span className="c-kicker" style={{ fontSize: 9, opacity: 0.6 }}>
                            {formatTime(ev.start_time).toUpperCase()}
                          </span>
                        )}
                        {ev.rsvp_count > 0 && (
                          <span className="c-kicker" style={{ fontSize: 9, color: "var(--ink-strong)", fontWeight: 700 }}>
                            {ev.rsvp_count} GOING
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ═══════ GALLERY TAB ═══════ */}
      {activeTab === "gallery" && (
        <GroupGallery groupId={id} />
      )}

      {/* ═══════ MEMBERS TAB ═══════ */}
      {activeTab === "members" && (
        <div className="px-5">
          {members.length === 0 ? (
            <div className="flex justify-center py-8">
              <div
                className="w-6 h-6 rounded-full animate-spin"
                style={{ border: "2px solid var(--gold-c)", borderTopColor: "transparent" }}
              />
            </div>
          ) : (
            members.map((m, i) => (
              <div
                key={m.user?.id}
                className="flex items-center gap-3 py-3"
                style={{
                  borderTop: i === 0 ? "2px solid var(--rule-strong-c)" : undefined,
                  borderBottom: "2px solid var(--rule-strong-c)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0"
                  style={{
                    background: "var(--gold-c)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  {m.user?.avatar_url ? (
                    <img src={m.user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span
                      className="c-card-t"
                      style={{ fontSize: 13, color: "var(--ink-strong)" }}
                    >
                      {m.user?.display_name?.charAt(0) || "?"}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p
                      className="c-card-t truncate"
                      style={{ fontSize: 13, color: "var(--ink-strong)" }}
                    >
                      {m.user?.display_name || "Unknown"}
                    </p>
                    {m.role === "admin" && <Badge label="Admin" variant="gold" />}
                    {m.role === "moderator" && <Badge label="Mod" variant="gold" />}
                  </div>
                  {m.user?.handle && (
                    <p className="c-kicker" style={{ fontSize: 9, opacity: 0.6 }}>
                      @{m.user.handle.toUpperCase()}
                    </p>
                  )}
                </div>
                {myRole === "admin" && m.user?.id !== userId && (
                  <div className="flex items-center gap-1">
                    {m.role === "member" && (
                      <button
                        onClick={() => handleChangeRole(m.user!.id, "moderator")}
                        className="px-2 py-1 c-kicker flex items-center gap-1 press"
                        style={{
                          fontSize: 9,
                          background: "var(--gold-c)",
                          color: "var(--ink-strong)",
                          border: "1.5px solid var(--rule-strong-c)",
                        }}
                      >
                        <Icon name="crown" size={10} /> MOD
                      </button>
                    )}
                    {m.role === "moderator" && (
                      <button
                        onClick={() => handleChangeRole(m.user!.id, "member")}
                        className="px-2 py-1 c-kicker press"
                        style={{
                          fontSize: 9,
                          background: "var(--paper-soft)",
                          color: "var(--ink-strong)",
                          border: "1.5px solid var(--rule-strong-c)",
                        }}
                      >
                        DEMOTE
                      </button>
                    )}
                    {m.role !== "admin" && (
                      <button
                        onClick={() => handleRemoveMember(m.user!.id, m.user!.display_name)}
                        className="px-2 py-1 c-kicker flex items-center gap-1 press"
                        style={{
                          fontSize: 9,
                          background: "var(--ink-strong)",
                          color: "var(--paper)",
                          border: "1.5px solid var(--rule-strong-c)",
                        }}
                      >
                        <Icon name="trash" size={10} /> REMOVE
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ═══════ COMMENTS SHEET ═══════ */}
      {commentsPostId && (
        <GroupCommentsSheet
          groupId={id}
          postId={commentsPostId}
          isOpen={!!commentsPostId}
          onClose={() => setCommentsPostId(null)}
          userId={userId}
          isMember={isMember}
          isAdminOrMod={isAdminOrMod}
          commentCount={commentCounts[commentsPostId] || 0}
          onCountChange={(count) => {
            setCommentCounts((prev) => ({ ...prev, [commentsPostId]: count }));
            setPosts((prev) => prev.map((p) => p.id === commentsPostId ? { ...p, comment_count: count } : p));
          }}
        />
      )}

      {/* ═══════ EDIT GROUP MODAL ═══════ */}
      <GroupEditModal
        groupId={id}
        group={{
          name: group.name,
          description: group.description,
          image_url: group.image_url,
          avatar_url: group.avatar_url,
          is_public: group.is_public,
        }}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={(updated) => setGroup((prev) => prev ? { ...prev, ...updated } : prev)}
      />
    </div>
  );
}
