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

export default function GroupsPage() {
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [myGroups, setMyGroups] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [category, setCategory] = useState("all");
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

      {/* Category Filters */}
      <div className="px-5 mb-5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
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

        {!loading && groups.length === 0 && (
          <Card>
            <div className="text-center py-8">
              <p className="text-3xl mb-3"><Icon name="handshake" size={28} /></p>
              <p className="text-sm font-semibold">No groups yet</p>
              <p className="text-xs text-txt-secondary mt-1">
                Be the first to create one!
              </p>
            </div>
          </Card>
        )}

        {groups.map((group) => {
          const isMember = myGroups.includes(group.id);
          return (
            <Card key={group.id} hover>
              <div className="flex items-start gap-3">
                <Link href={`/groups/${group.id}`} className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  <Icon name={(CATEGORY_ICONS[group.category] || "handshake") as IconName} size={24} />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Link href={`/groups/${group.id}`} className="text-sm font-bold truncate hover:text-gold transition-colors">{group.name}</Link>
                    <Badge label={group.category} variant="purple" />
                  </div>
                  {group.description && (
                    <p className="text-xs text-txt-secondary line-clamp-2 mb-2">
                      {group.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-txt-secondary">
                      <Icon name="users" size={16} /> {group.member_count} member{group.member_count !== 1 ? "s" : ""}
                    </span>
                    <button
                      onClick={() => handleJoin(group.id)}
                      disabled={joining === group.id}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold press transition-all ${
                        isMember
                          ? "bg-emerald/20 text-emerald border border-emerald/30"
                          : "bg-gold/20 text-gold border border-gold/30"
                      }`}
                    >
                      {joining === group.id
                        ? "..."
                        : isMember
                          ? "check Joined"
                          : "Join"}
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
