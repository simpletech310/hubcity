"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Chip from "@/components/ui/Chip";
import Button from "@/components/ui/Button";
import type { CommunityGroup } from "@/types/database";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { useSearchParams } from "next/navigation";
import { useKnownCities } from "@/hooks/useActiveCity";
import CityFilterChip from "@/components/ui/CityFilterChip";

const CATEGORY_ICONS: Record<string, string> = {
  neighborhood: "house",
  interest: "lightbulb",
  school: "graduation",
  faith: "heart-pulse",
  sports: "trophy",
  business: "briefcase",
  other: "handshake",
};

// Display labels for category chips — keeps data keys stable
const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  neighborhood: "Scene",
  interest: "Interest",
  school: "School",
  faith: "Faith",
  sports: "Sports",
  business: "Business",
  other: "Other",
};

const CATEGORIES = [
  "all", "neighborhood", "interest", "school", "faith", "sports", "business",
];

const CATEGORY_BADGE_VARIANT: Record<string, "gold" | "blue" | "coral" | "emerald" | "cyan" | "purple" | "pink"> = {
  // All category accents collapse to gold in the Culture palette
  neighborhood: "gold",
  interest: "gold",
  school: "gold",
  faith: "gold",
  sports: "emerald",
  business: "gold",
  other: "gold",
};

export default function GroupsPage() {
  // Default scope = ALL cities. Listener narrows via the CityFilterChip.
  const sp = useSearchParams();
  const cities = useKnownCities();
  const filterCitySlug = sp.get("city");
  const filterCity = filterCitySlug
    ? cities.find((c) => c.slug === filterCitySlug) ?? null
    : null;
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
      if (filterCitySlug) params.set("city", filterCitySlug);
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
  }, [category, filterCitySlug]);

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
    <div className="culture-surface min-h-dvh animate-fade-in pb-24">
      <header
        className="px-[18px] pt-5 pb-4"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <div className="c-kicker" style={{ opacity: 0.65 }}>
          § VOL·01 · ISSUE COMMUNITY · {filterCity?.name?.toUpperCase() ?? "EVERYWHERE"}
        </div>
        <h1
          className="c-hero mt-2"
          style={{ fontSize: 56, lineHeight: 0.88, letterSpacing: "-0.02em" }}
        >
          Community.
        </h1>
        <p className="c-serif-it mt-2" style={{ fontSize: 13 }}>
          Neighbors, interests, and the people organizing it.
        </p>
        <div className="mt-3"><CityFilterChip /></div>
      </header>

      {/* Create CTA - only for officials */}
      {userRole && ["city_ambassador", "city_official", "admin"].includes(userRole) && (
        <div className="px-5 mt-4 mb-5">
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="c-btn c-btn-primary w-full press"
          >
            {showCreate ? "CLOSE FORM" : "+ CREATE A GROUP"}
          </button>
        </div>
      )}

      {/* Create Form */}
      {showCreate && (
        <div className="px-5 mb-5">
          <div
            className="p-4 space-y-3"
            style={{
              background: "var(--paper)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            <input
              type="text"
              placeholder="Group name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-4 py-2.5 focus:outline-none"
              style={{
                background: "var(--paper-warm)",
                border: "2px solid var(--rule-strong-c)",
                color: "var(--ink-strong)",
                fontFamily: "var(--font-body), Inter, sans-serif",
                fontSize: 14,
              }}
            />
            <textarea
              placeholder="Description (optional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-4 py-2.5 focus:outline-none min-h-[60px] resize-none"
              style={{
                background: "var(--paper-warm)",
                border: "2px solid var(--rule-strong-c)",
                color: "var(--ink-strong)",
                fontFamily: "var(--font-body), Inter, sans-serif",
                fontSize: 14,
              }}
            />
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.filter((c) => c !== "all").map((c) => (
                <Chip
                  key={c}
                  label={CATEGORY_LABELS[c] ?? c}
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
        </div>
      )}

      {/* Search */}
      <div className="px-5 mt-4 mb-4">
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: "var(--ink-strong)", opacity: 0.6 }}
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
            placeholder="Search communities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 focus:outline-none"
            style={{
              background: "var(--paper-warm)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--ink-strong)",
              fontFamily: "var(--font-body), Inter, sans-serif",
              fontSize: 14,
            }}
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="px-5 mb-5">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={CATEGORY_LABELS[c] ?? c}
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
            <div
              className="w-8 h-8 rounded-full animate-spin"
              style={{ border: "2px solid var(--gold-c)", borderTopColor: "transparent" }}
            />
          </div>
        )}

        {!loading && filteredGroups.length === 0 && (
          <div
            className="p-8 text-center"
            style={{
              background: "var(--paper)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            <Icon name="handshake" size={28} className="mx-auto mb-3" style={{ color: "var(--ink-strong)", opacity: 0.45 }} />
            <p className="c-kicker" style={{ fontSize: 11, color: "var(--ink-strong)" }}>
              NO COMMUNITIES FOUND
            </p>
            <p className="c-serif-it mt-1" style={{ fontSize: 12 }}>
              {search.trim() ? "Try adjusting your search." : "Be the first to create one."}
            </p>
          </div>
        )}

        {filteredGroups.map((group) => {
          const isMember = myGroups.includes(group.id);
          const badgeVariant = CATEGORY_BADGE_VARIANT[group.category] || "gold";

          return (
            <div
              key={group.id}
              className="relative overflow-hidden"
              style={{
                background: "var(--paper)",
                border: "2px solid var(--rule-strong-c)",
              }}
            >
              {/* Cover image or gold foil bar */}
              <Link href={`/groups/${group.id}`} className="block relative">
                {group.image_url ? (
                  <div
                    className="relative h-20 w-full"
                    style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
                  >
                    <img
                      src={group.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <>
                    <div style={{ height: 4, background: "var(--gold-c)" }} />
                    <div
                      className="h-16 w-full flex items-center justify-center"
                      style={{
                        background: "var(--paper-soft)",
                        borderBottom: "2px solid var(--rule-strong-c)",
                      }}
                    >
                      <Icon name={(CATEGORY_ICONS[group.category] || "handshake") as IconName} size={24} style={{ color: "var(--ink-strong)", opacity: 0.5 }} />
                    </div>
                  </>
                )}
              </Link>

              {/* Avatar overlapping cover bottom-left */}
              <div className="relative px-4">
                <div className="-mt-5 mb-2 flex items-end gap-3">
                  {group.avatar_url ? (
                    <Link
                      href={`/groups/${group.id}`}
                      className="w-10 h-10 rounded-full overflow-hidden shrink-0"
                      style={{
                        background: "var(--paper)",
                        border: "2px solid var(--rule-strong-c)",
                      }}
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
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: "var(--gold-c)",
                        border: "2px solid var(--rule-strong-c)",
                        color: "var(--ink-strong)",
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
                  <Link
                    href={`/groups/${group.id}`}
                    className="c-card-t truncate"
                    style={{ fontSize: 14, color: "var(--ink-strong)" }}
                  >
                    {group.name}
                  </Link>
                  <Badge label={group.category} variant={badgeVariant} />
                </div>

                {group.description && (
                  <p
                    className="c-body line-clamp-2 mb-3"
                    style={{ fontSize: 12, color: "var(--ink-strong)", opacity: 0.75, lineHeight: 1.45 }}
                  >
                    {group.description}
                  </p>
                )}

                <div
                  className="flex items-center justify-between pt-2"
                  style={{ borderTop: "2px solid var(--rule-strong-c)" }}
                >
                  <span
                    className="c-kicker flex items-center gap-1.5"
                    style={{ fontSize: 10, color: "var(--ink-strong)" }}
                  >
                    <Icon name="users" size={14} /> {group.member_count} MEMBER{group.member_count !== 1 ? "S" : ""}
                  </span>
                  <button
                    onClick={() => handleJoin(group.id)}
                    disabled={joining === group.id}
                    className={`c-btn c-btn-sm press flex items-center gap-1.5 ${isMember ? "c-btn-outline" : "c-btn-primary"}`}
                  >
                    {joining === group.id ? (
                      "…"
                    ) : isMember ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        JOINED
                      </>
                    ) : (
                      "JOIN"
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
