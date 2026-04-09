"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/client";
import type { TrusteeArea } from "@/lib/districts";

/* ── Types ──────────────────────────────────────────────── */

interface TrusteeDashboardClientProps {
  trusteeArea: TrusteeArea;
  areaName: string;
  areaColor: string;
  userId: string;
  userName: string;
}

interface TrusteePost {
  id: string;
  title: string | null;
  body: string | null;
  post_type: string;
  is_pinned: boolean;
  comment_count: number;
  created_at: string;
}

interface TrusteeMessage {
  id: string;
  sender_id: string;
  subject: string;
  body: string;
  is_read: boolean;
  created_at: string;
  sender?: { display_name: string | null; avatar_url: string | null };
}

interface TrusteeProgram {
  id: string;
  name: string;
  description: string | null;
  category: string;
  schedule: string | null;
  is_active: boolean;
  created_at: string;
}

/* ── Tabs ───────────────────────────────────────────────── */

const TABS = ["Feed", "Messages", "Programs"] as const;
type Tab = (typeof TABS)[number];

/* ── Program Colors ─────────────────────────────────────── */

const PROGRAM_COLORS: Record<string, { text: string; bg: string }> = {
  community: { text: "text-gold", bg: "bg-gold/10" },
  youth: { text: "text-cyan-400", bg: "bg-cyan-400/10" },
  sports: { text: "text-emerald-400", bg: "bg-emerald-400/10" },
  education: { text: "text-blue-400", bg: "bg-blue-400/10" },
  health: { text: "text-red-400", bg: "bg-red-400/10" },
  senior: { text: "text-purple-400", bg: "bg-purple-400/10" },
  arts: { text: "text-pink-400", bg: "bg-pink-400/10" },
};

/* ── Main Component ─────────────────────────────────────── */

export default function TrusteeDashboardClient({
  trusteeArea,
  areaName,
  areaColor,
  userId,
  userName,
}: TrusteeDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Feed");
  const [feedKey, setFeedKey] = useState(0);

  return (
    <div className="min-h-screen bg-midnight text-white pb-28 animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-midnight/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="flex items-center gap-3 px-5 py-3.5">
          <Link href="/officials" className="press">
            <Icon name="back" size={20} className="text-white/60" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-[17px] font-bold">Trustee Dashboard</h1>
            <p className="text-[11px] text-white/40">{areaName}</p>
          </div>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${areaColor}20`, border: `1px solid ${areaColor}40` }}
          >
            <span className="font-heading font-bold text-[12px]" style={{ color: areaColor }}>
              {trusteeArea}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 px-5 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab
                  ? "border-current text-white"
                  : "border-transparent text-white/40 hover:text-white/60"
              }`}
              style={activeTab === tab ? { color: areaColor, borderColor: areaColor } : undefined}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-4 space-y-4">
        {/* Feed Tab */}
        {activeTab === "Feed" && (
          <>
            <PostComposer
              trusteeArea={trusteeArea}
              userId={userId}
              areaColor={areaColor}
              onPost={() => setFeedKey((k) => k + 1)}
            />
            <PostsFeed key={feedKey} trusteeArea={trusteeArea} areaColor={areaColor} />
          </>
        )}

        {/* Messages Tab */}
        {activeTab === "Messages" && <MessagesInbox userId={userId} areaColor={areaColor} />}

        {/* Programs Tab */}
        {activeTab === "Programs" && (
          <ProgramsSection trusteeArea={trusteeArea} userId={userId} areaColor={areaColor} />
        )}
      </div>
    </div>
  );
}

/* ── Post Composer ──────────────────────────────────────── */

function PostComposer({
  trusteeArea,
  userId,
  areaColor,
  onPost,
}: {
  trusteeArea: TrusteeArea;
  userId: string;
  areaColor: string;
  onPost: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [postType, setPostType] = useState<"update" | "alert">("update");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.from("trustee_area_posts").insert({
        trustee_area: trusteeArea,
        author_id: userId,
        post_type: postType,
        title: title.trim() || null,
        body: body.trim(),
      });

      if (!error) {
        setTitle("");
        setBody("");
        setPostType("update");
        setIsOpen(false);
        onPost();
      }
    } catch {}
    setSubmitting(false);
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/10 text-white/40 hover:border-white/20 hover:text-white/60 transition-colors press"
      >
        <Icon name="plus" size={16} />
        <span className="text-xs font-semibold">Create Post</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 space-y-3 hover:border-gold/30 transition-colors"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-white/60">New Post</p>
        <button type="button" onClick={() => setIsOpen(false)} className="text-white/30 hover:text-white/60 press">
          <Icon name="close" size={16} />
        </button>
      </div>

      {/* Post type toggle */}
      <div className="flex gap-2">
        {(["update", "alert"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setPostType(type)}
            className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full transition-colors ${
              postType === type
                ? "bg-white/10 text-white"
                : "text-white/30 hover:text-white/50"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/10"
      />

      <textarea
        placeholder="Share an update with your area..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/10 resize-none"
      />

      <button
        type="submit"
        disabled={!body.trim() || submitting}
        className="w-full py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-30"
        style={{ backgroundColor: areaColor, color: "#0A0A0A" }}
      >
        {submitting ? "Posting..." : "Post"}
      </button>
    </form>
  );
}

/* ── Posts Feed ─────────────────────────────────────────── */

function PostsFeed({
  trusteeArea,
  areaColor,
}: {
  trusteeArea: TrusteeArea;
  areaColor: string;
}) {
  const [posts, setPosts] = useState<TrusteePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("trustee_area_posts")
          .select("id, title, body, post_type, is_pinned, comment_count, created_at")
          .eq("trustee_area", trusteeArea)
          .eq("is_published", true)
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(30);

        setPosts(data ?? []);
      } catch {}
      setLoading(false);
    }
    load();
  }, [trusteeArea]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-white/[0.03] animate-pulse" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-10 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
        <Icon name="chat" size={28} className="text-white/10 mx-auto mb-2" />
        <p className="text-xs text-white/40">No posts yet</p>
        <p className="text-[10px] text-white/30 mt-1">Create your first post for your trustee area</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {posts.map((post) => {
        const date = new Date(post.created_at);
        const isAlert = post.post_type === "alert";
        return (
          <div
            key={post.id}
            className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 hover:border-gold/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {post.is_pinned && (
                    <span className="text-[9px] font-bold uppercase text-gold bg-gold/10 rounded-full px-2 py-0.5">
                      Pinned
                    </span>
                  )}
                  {isAlert && (
                    <span className="text-[9px] font-bold uppercase text-red-400 bg-red-400/10 rounded-full px-2 py-0.5">
                      Alert
                    </span>
                  )}
                </div>
                {post.title && (
                  <p className="text-[14px] font-semibold text-white">{post.title}</p>
                )}
                {post.body && (
                  <p className="text-[12px] text-white/50 mt-1 line-clamp-3">{post.body}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2.5 text-[11px] text-white/30">
              <span>
                {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
              {post.comment_count > 0 && (
                <span className="flex items-center gap-1">
                  <Icon name="chat" size={12} />
                  {post.comment_count}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Messages Inbox ─────────────────────────────────────── */

function MessagesInbox({ userId, areaColor }: { userId: string; areaColor: string }) {
  const [messages, setMessages] = useState<TrusteeMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("trustee_messages")
          .select("id, sender_id, subject, body, is_read, created_at")
          .eq("receiver_id", userId)
          .order("created_at", { ascending: false })
          .limit(50);

        if (data && data.length > 0) {
          // Fetch sender profiles
          const senderIds = [...new Set(data.map((m) => m.sender_id))];
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, display_name, avatar_url")
            .in("id", senderIds);

          const profileMap = new Map(
            (profiles ?? []).map((p) => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url }])
          );

          setMessages(
            data.map((m) => ({
              ...m,
              sender: profileMap.get(m.sender_id) ?? { display_name: null, avatar_url: null },
            }))
          );
        } else {
          setMessages([]);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, [userId]);

  const markAsRead = useCallback(
    async (messageId: string) => {
      const supabase = createClient();
      await supabase.from("trustee_messages").update({ is_read: true }).eq("id", messageId);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, is_read: true } : m))
      );
    },
    []
  );

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-white/[0.03] animate-pulse" />
        ))}
      </div>
    );
  }

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div className="space-y-3">
      {unreadCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-white/40">
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold"
            style={{ backgroundColor: areaColor, color: "#0A0A0A" }}
          >
            {unreadCount}
          </span>
          <span>unread message{unreadCount !== 1 ? "s" : ""}</span>
        </div>
      )}

      {messages.length === 0 ? (
        <div className="text-center py-10 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
          <Icon name="mail" size={28} className="text-white/10 mx-auto mb-2" />
          <p className="text-xs text-white/40">No messages yet</p>
          <p className="text-[10px] text-white/30 mt-1">Resident messages will appear here</p>
        </div>
      ) : (
        messages.map((msg) => (
          <MessageCard
            key={msg.id}
            message={msg}
            areaColor={areaColor}
            onMarkRead={() => markAsRead(msg.id)}
          />
        ))
      )}
    </div>
  );
}

function MessageCard({
  message,
  areaColor,
  onMarkRead,
}: {
  message: TrusteeMessage;
  areaColor: string;
  onMarkRead: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(message.created_at);

  function handleClick() {
    setExpanded(!expanded);
    if (!message.is_read) {
      onMarkRead();
    }
  }

  return (
    <button
      onClick={handleClick}
      className="w-full text-left rounded-2xl bg-zinc-900 border border-zinc-800 p-4 hover:border-gold/30 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold"
          style={{
            backgroundColor: message.is_read ? "rgba(255,255,255,0.05)" : `${areaColor}20`,
            color: message.is_read ? "rgba(255,255,255,0.3)" : areaColor,
          }}
        >
          {(message.sender?.display_name ?? "?")[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-[13px] font-semibold truncate ${message.is_read ? "text-white/60" : "text-white"}`}>
              {message.subject}
            </p>
            {!message.is_read && (
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: areaColor }} />
            )}
          </div>
          <p className="text-[11px] text-white/30 mt-0.5">
            {message.sender?.display_name ?? "Resident"} &middot;{" "}
            {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
          {expanded && (
            <p className="text-[12px] text-white/50 mt-2 whitespace-pre-wrap">{message.body}</p>
          )}
        </div>
      </div>
    </button>
  );
}

/* ── Programs Section ───────────────────────────────────── */

function ProgramsSection({
  trusteeArea,
  userId,
  areaColor,
}: {
  trusteeArea: TrusteeArea;
  userId: string;
  areaColor: string;
}) {
  const [programs, setPrograms] = useState<TrusteeProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const loadPrograms = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("trustee_area_programs")
        .select("id, name, description, category, schedule, is_active, created_at")
        .eq("trustee_area", trusteeArea)
        .order("created_at", { ascending: false });

      setPrograms(data ?? []);
    } catch {}
    setLoading(false);
  }, [trusteeArea]);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  return (
    <div className="space-y-3">
      <button
        onClick={() => setShowForm(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/10 text-white/40 hover:border-white/20 hover:text-white/60 transition-colors press"
      >
        <Icon name="plus" size={16} />
        <span className="text-xs font-semibold">Create Program</span>
      </button>

      {showForm && (
        <ProgramForm
          trusteeArea={trusteeArea}
          userId={userId}
          areaColor={areaColor}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            loadPrograms();
          }}
        />
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : programs.length === 0 ? (
        <div className="text-center py-10 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
          <Icon name="heart-pulse" size={28} className="text-white/10 mx-auto mb-2" />
          <p className="text-xs text-white/40">No programs yet</p>
          <p className="text-[10px] text-white/30 mt-1">Create a program for your trustee area</p>
        </div>
      ) : (
        <div className="space-y-2">
          {programs.map((program) => {
            const colors = PROGRAM_COLORS[program.category] ?? PROGRAM_COLORS.community;
            return (
              <div key={program.id} className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 hover:border-gold/30 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-white">{program.name}</p>
                    {program.description && (
                      <p className="text-[12px] text-white/50 mt-1 line-clamp-2">{program.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!program.is_active && (
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/5 text-white/30">
                        Inactive
                      </span>
                    )}
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${colors?.bg} ${colors?.text}`}>
                      {program.category}
                    </span>
                  </div>
                </div>
                {program.schedule && (
                  <div className="flex items-center gap-1 mt-2 text-[11px] text-white/30">
                    <Icon name="clock" size={12} />
                    <span>{program.schedule}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Program Form ───────────────────────────────────────── */

const CATEGORIES = ["community", "youth", "sports", "education", "health", "senior", "arts"] as const;

function ProgramForm({
  trusteeArea,
  userId,
  areaColor,
  onClose,
  onCreated,
}: {
  trusteeArea: TrusteeArea;
  userId: string;
  areaColor: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("community");
  const [schedule, setSchedule] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.from("trustee_area_programs").insert({
        trustee_area: trusteeArea,
        created_by: userId,
        name: name.trim(),
        description: description.trim() || null,
        category,
        schedule: schedule.trim() || null,
      });

      if (!error) {
        onCreated();
      }
    } catch {}
    setSubmitting(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 space-y-3 hover:border-gold/30 transition-colors"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-white/60">New Program</p>
        <button type="button" onClick={onClose} className="text-white/30 hover:text-white/60 press">
          <Icon name="close" size={16} />
        </button>
      </div>

      <input
        type="text"
        placeholder="Program name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/10"
      />

      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/10 resize-none"
      />

      {/* Category selector */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => {
          const colors = PROGRAM_COLORS[cat] ?? PROGRAM_COLORS.community;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full transition-colors ${
                category === cat
                  ? `${colors?.bg} ${colors?.text}`
                  : "text-white/30 hover:text-white/50"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <input
        type="text"
        placeholder="Schedule (e.g. Mon & Wed 3-5 PM)"
        value={schedule}
        onChange={(e) => setSchedule(e.target.value)}
        className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/10"
      />

      <button
        type="submit"
        disabled={!name.trim() || submitting}
        className="w-full py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-30"
        style={{ backgroundColor: areaColor, color: "#0A0A0A" }}
      >
        {submitting ? "Creating..." : "Create Program"}
      </button>
    </form>
  );
}
