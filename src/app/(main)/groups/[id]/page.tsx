"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
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
  neighborhood: "cyan", interest: "purple", school: "blue",
  faith: "pink", sports: "emerald", business: "gold", other: "coral",
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
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="culture-surface min-h-dvh px-5 py-20 text-center">
        <p className="text-sm text-txt-secondary">Group not found</p>
        <Link href="/groups" className="text-xs text-gold mt-2 inline-block">Back to groups</Link>
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
      <div className="flex gap-1 px-5 mt-3 mb-3 border-b border-border-subtle">
        {(["posts", "events", "gallery", "members"] as GroupTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2.5 text-xs font-semibold capitalize transition-all border-b-2 ${
              activeTab === t ? "border-gold text-gold" : "border-transparent text-txt-secondary hover:text-black"
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
          {isMember && (
            <div className="px-5 mt-2 mb-4">
              <GroupPostComposer groupId={id} userId={userId!} onPost={handleNewPost} />
            </div>
          )}

          {!isMember && !loading && (
            <div className="px-5 mt-4 mb-4">
              <Card>
                <div className="text-center py-4">
                  <p className="text-sm text-txt-secondary">Join this group to participate in discussions</p>
                  <button onClick={handleJoin} disabled={joining}
                    className="mt-3 px-6 py-2 rounded-xl bg-gradient-to-r from-gold to-gold-light text-midnight font-bold text-sm press"
                  >
                    {joining ? "Joining..." : "Join Group"}
                  </button>
                </div>
              </Card>
            </div>
          )}

          <div className="px-5 space-y-3">
            {posts.length === 0 && (
              <Card>
                <div className="text-center py-8">
                  <Icon name="chat" size={28} className="mx-auto text-black/20 mb-2" />
                  <p className="text-sm font-semibold">No posts yet</p>
                  <p className="text-xs text-txt-secondary mt-1">
                    {isMember ? "Be the first to post!" : "Join to start the conversation"}
                  </p>
                </div>
              </Card>
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
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-gold/30 text-gold text-xs font-semibold hover:bg-gold/5 transition-colors"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create Event
            </button>
          )}

          <GroupEventForm
            groupId={id}
            isOpen={showCreateEvent}
            onClose={() => setShowCreateEvent(false)}
            onCreated={(event) => setGroupEvents((prev) => [...prev, event as unknown as GroupEvent])}
          />

          {groupEvents.length === 0 && (
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
                      <span className="text-lg font-bold leading-tight" style={{ color: "var(--ink-strong)" }}>{d.day}</span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <h3 className="text-sm font-semibold truncate">{ev.title}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge label={ev.category} variant={CATEGORY_BADGE[ev.category] || "gold"} />
                        {ev.visibility === "group" && (
                          <Badge label="Group Only" variant="purple" />
                        )}
                        {ev.location_name && (
                          <span className="text-[10px] text-txt-secondary truncate">{ev.location_name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {ev.start_time && <span className="text-[10px] text-txt-secondary">{formatTime(ev.start_time)}</span>}
                        {ev.rsvp_count > 0 && <span className="text-[10px] text-emerald">{ev.rsvp_count} going</span>}
                      </div>
                    </div>
                  </div>
                </Card>
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
                    <span className="text-sm font-bold text-txt-secondary">{m.user?.display_name?.charAt(0) || "?"}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold truncate">{m.user?.display_name || "Unknown"}</p>
                    {m.role === "admin" && <Badge label="Admin" variant="gold" />}
                    {m.role === "moderator" && <Badge label="Mod" variant="purple" />}
                  </div>
                  {m.user?.handle && <p className="text-[10px] text-txt-secondary">@{m.user.handle}</p>}
                </div>
                {myRole === "admin" && m.user?.id !== userId && (
                  <div className="flex items-center gap-1">
                    {m.role === "member" && (
                      <button onClick={() => handleChangeRole(m.user!.id, "moderator")}
                        className="px-2 py-1 text-[9px] bg-purple/10 text-gold rounded-lg hover:bg-purple/20 transition-colors flex items-center gap-1"
                      >
                        <Icon name="crown" size={10} /> Mod
                      </button>
                    )}
                    {m.role === "moderator" && (
                      <button onClick={() => handleChangeRole(m.user!.id, "member")}
                        className="px-2 py-1 text-[9px] bg-white/5 text-txt-secondary rounded-lg hover:bg-white/10 transition-colors"
                      >
                        Demote
                      </button>
                    )}
                    {m.role !== "admin" && (
                      <button onClick={() => handleRemoveMember(m.user!.id, m.user!.display_name)}
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
