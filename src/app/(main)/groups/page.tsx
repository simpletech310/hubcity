"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Chip from "@/components/ui/Chip";
import Button from "@/components/ui/Button";
import type { CommunityGroup } from "@/types/database";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { CATEGORY_COLORS } from "@/lib/constants";

const CATEGORY_ICONS: Record<string, string> = {
  neighborhood: "house",
  interest: "lightbulb",
  school: "graduation",
  faith: "heart-pulse",
  sports: "trophy",
  business: "briefcase",
  other: "handshake",
};

const CATEGORIES = [
  "all", "neighborhood", "interest", "school", "faith", "sports", "business",
];

const CATEGORY_BADGE_VARIANT: Record<string, "gold" | "blue" | "coral" | "emerald" | "cyan" | "purple" | "pink"> = {
  neighborhood: "cyan",
  interest: "purple",
  school: "blue",
  faith: "pink",
  sports: "emerald",
  business: "gold",
  other: "coral",
};

export default function GroupsPage() {
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [myGroups, setMyGroups] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  // Create group state
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("other");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      const res = await fetch(`/api/groups?${params}`);
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups);
        setMyGroups(data.my_groups);
        setUserRole(data.user_role);
      }
      setLoading(false);
    }
    load();
  }, [category]);

  // Filter out private groups client-side
  const publicGroups = groups.filter((g) => g.is_public !== false);

  const filteredGroups = search.trim()
    ? publicGroups.filter(
        (g) =>
          g.name.toLowerCase().includes(search.toLowerCase()) ||
          (g.description && g.description.toLowerCase().includes(search.toLowerCase()))
      )
    : publicGroups;

  async function handleJoin(groupId: string) {
    setJoining(groupId);
    const res = await fetch(`/api/groups/${groupId}/join`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      if (data.joined) {
        setMyGroups((prev) => [...prev, groupId]);
      } else {
        setMyGroups((prev) => prev.filter((id) => id !== groupId));
      }
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId ? { ...g, member_count: data.member_count } : g
        )
      );
    }
    setJoining(null);
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        description: newDesc.trim() || null,
        category: newCategory,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setGroups((prev) => [data.group, ...prev]);
      setMyGroups((prev) => [...prev, data.group.id]);
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
    }
    setCreating(false);
  }

  return (
    <div className="animate-fade-in pb-24">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple/20 via-midnight to-midnight" />
        <div className="relative px-5 pt-6 pb-8">
          <h1 className="font-heading text-2xl font-bold mb-1">Community Groups</h1>
          <p className="text-sm text-txt-secondary">
            Connect with neighbors, share interests, organize together.
          </p>
        </div>
      </div>

      {/* Create CTA - only for officials */}
      {userRole && ["city_ambassador", "city_official", "admin"].includes(userRole) && (
        <div className="px-5 -mt-3 mb-5">
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-gold to-gold-light text-midnight font-bold text-sm press"
          >
            + Create a Group
          </button>
        </div>
      )}

      {/* Create Form */}
      {showCreate && (
        <div className="px-5 mb-5">
          <Card>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Group name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40"
              />
              <textarea
                placeholder="Description (optional)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40 min-h-[60px] resize-none"
              />
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.filter((c) => c !== "all").map((c) => (
                  <Chip
                    key={c}
                    label={c}
                    iconName={(CATEGORY_ICONS[c] || "handshake") as IconName}
                    active={newCategory === c}
                    onClick={() => setNewCategory(c)}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} loading={creating}>Create</Button>
                <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="px-5 mb-4">
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-secondary"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.05] border border-border-subtle rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40 transition-colors"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="px-5 mb-5">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={c === "all" ? "All" : c}
              iconName={c !== "all" ? (CATEGORY_ICONS[c] || "handshake") as IconName : undefined}
              active={category === c}
              onClick={() => setCategory(c)}
            />
          ))}
        </div>
      </div>

      {/* Groups List */}
      <div className="px-5 space-y-3">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && filteredGroups.length === 0 && (
          <Card>
            <div className="text-center py-8">
              <p className="text-3xl mb-3"><Icon name="handshake" size={28} /></p>
              <p className="text-sm font-semibold">No groups found</p>
              <p className="text-xs text-txt-secondary mt-1">
                {search.trim() ? "Try adjusting your search." : "Be the first to create one!"}
              </p>
            </div>
          </Card>
        )}

        {filteredGroups.map((group) => {
          const isMember = myGroups.includes(group.id);
          const color = CATEGORY_COLORS[group.category] || "coral";
          const badgeVariant = CATEGORY_BADGE_VARIANT[group.category] || "coral";

          return (
            <Card key={group.id} hover padding={false} className="relative overflow-hidden">
              {/* Cover image or category accent header */}
              <Link href={`/groups/${group.id}`} className="block relative">
                {group.image_url ? (
                  <div className="relative h-20 w-full">
                    <img
                      src={group.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                  </div>
                ) : (
                  <div
                    className="h-20 w-full"
                    style={{
                      background: `linear-gradient(135deg, color-mix(in srgb, var(--color-${color}) 18%, transparent) 0%, transparent 100%)`,
                    }}
                  />
                )}
              </Link>

              {/* Avatar overlapping cover bottom-left */}
              <div className="relative px-4">
                <div className="-mt-5 mb-2 flex items-end gap-3">
                  {group.avatar_url ? (
                    <Link
                      href={`/groups/${group.id}`}
                      className="w-10 h-10 rounded-full overflow-hidden border-2 border-card shrink-0 bg-card"
                    >
                      <img
                        src={group.avatar_url}
                        alt={group.name}
                        className="w-full h-full object-cover"
                      />
                    </Link>
                  ) : (
                    <Link
                      href={`/groups/${group.id}`}
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 border-card"
                      style={{
                        background: `color-mix(in srgb, var(--color-${color}) 20%, var(--color-card))`,
                      }}
                    >
                      <Icon name={(CATEGORY_ICONS[group.category] || "handshake") as IconName} size={18} />
                    </Link>
                  )}
                </div>
              </div>

              {/* Card body */}
              <div className="px-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Link href={`/groups/${group.id}`} className="text-sm font-bold truncate hover:text-gold transition-colors">
                    {group.name}
                  </Link>
                  <Badge label={group.category} variant={badgeVariant} />
                </div>

                {group.description && (
                  <p className="text-xs text-txt-secondary line-clamp-2 mb-3">
                    {group.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-txt-secondary flex items-center gap-1">
                    <Icon name="users" size={14} /> {group.member_count} member{group.member_count !== 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={() => handleJoin(group.id)}
                    disabled={joining === group.id}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold press transition-all flex items-center gap-1.5 ${
                      isMember
                        ? "bg-emerald/20 text-emerald border border-emerald/30"
                        : "bg-gold/20 text-gold border border-gold/30"
                    }`}
                  >
                    {joining === group.id ? (
                      "..."
                    ) : isMember ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        Joined
                      </>
                    ) : (
                      "Join"
                    )}
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
