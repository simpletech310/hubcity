"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

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

interface GroupInfo {
  id: string;
  name: string;
  description: string | null;
  category: string;
  member_count: number;
  image_url: string | null;
  created_by: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  neighborhood: "🏘️",
  interest: "💡",
  school: "🎓",
  faith: "⛪",
  sports: "⚽",
  business: "💼",
  other: "🤝",
};

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

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  // New post state
  const [newBody, setNewBody] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      // Fetch group info + membership
      const groupRes = await fetch(`/api/groups?category=all`);
      if (groupRes.ok) {
        const data = await groupRes.json();
        const found = data.groups.find((g: GroupInfo) => g.id === id);
        if (found) setGroup(found);
        setIsMember(data.my_groups.includes(id));
      }

      // Fetch posts
      const postsRes = await fetch(`/api/groups/${id}/posts`);
      if (postsRes.ok) {
        const data = await postsRes.json();
        setPosts(data.posts);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleJoin() {
    setJoining(true);
    const res = await fetch(`/api/groups/${id}/join`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setIsMember(data.joined);
      if (group) {
        setGroup({ ...group, member_count: data.member_count });
      }
    }
    setJoining(false);
  }

  async function handlePost() {
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
  }

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
        <Link href="/groups" className="text-xs text-gold mt-2 inline-block">
          ← Back to groups
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple/20 via-midnight to-midnight" />
        <div className="relative px-5 pt-6 pb-6">
          <Link href="/groups" className="text-xs text-txt-secondary hover:text-white mb-3 inline-block">
            ← All Groups
          </Link>
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <span className="text-2xl">
                {CATEGORY_ICONS[group.category] || "🤝"}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="font-heading text-xl font-bold">{group.name}</h1>
              {group.description && (
                <p className="text-xs text-txt-secondary mt-1 line-clamp-2">{group.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-txt-secondary">
                  👥 {group.member_count} member{group.member_count !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className={`px-4 py-1 rounded-lg text-xs font-bold press transition-all ${
                    isMember
                      ? "bg-emerald/20 text-emerald border border-emerald/30"
                      : "bg-gold/20 text-gold border border-gold/30"
                  }`}
                >
                  {joining ? "..." : isMember ? "✓ Joined" : "Join"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Post Composer (members only) */}
      {isMember && (
        <div className="px-5 mt-4 mb-4">
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
      {!isMember && (
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

      {/* Posts Feed */}
      <div className="px-5 space-y-3">
        {posts.length === 0 && (
          <Card>
            <div className="text-center py-8">
              <p className="text-3xl mb-3">💬</p>
              <p className="text-sm font-semibold">No posts yet</p>
              <p className="text-xs text-txt-secondary mt-1">
                {isMember ? "Be the first to post!" : "Join to start the conversation"}
              </p>
            </div>
          </Card>
        )}

        {posts.map((post) => (
          <Card key={post.id}>
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
                    {post.author?.handle ? `@${post.author.handle}` : ""} · {timeAgo(post.created_at)}
                  </p>
                </div>
              </div>

              {/* Body */}
              <p className="text-sm text-white/90 whitespace-pre-wrap">{post.body}</p>

              {/* Image */}
              {post.image_url && (
                <img
                  src={post.image_url}
                  alt=""
                  className="w-full rounded-xl max-h-64 object-cover"
                />
              )}

              {/* Footer */}
              <div className="flex items-center gap-4 pt-1">
                <span className="text-xs text-txt-secondary">
                  💬 {post.comment_count || 0} comment{(post.comment_count || 0) !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
