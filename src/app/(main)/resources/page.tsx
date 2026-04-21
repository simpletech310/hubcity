"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Chip from "@/components/ui/Chip";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import Tag from "@/components/ui/editorial/Tag";
import { createClient } from "@/lib/supabase/client";
import { useActiveCity } from "@/hooks/useActiveCity";
import type { Resource } from "@/types/database";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const categories: { label: string; value: string; icon: IconName; color: string }[] = [
  { label: "All", value: "all", icon: "document", color: "#F2A900" },
  { label: "Housing", value: "housing", icon: "house", color: "#3B82F6" },
  { label: "Health", value: "health", icon: "heart-pulse", color: "#EF4444" },
  { label: "Jobs", value: "jobs", icon: "briefcase", color: "#22C55E" },
  { label: "Food", value: "food", icon: "apple", color: "#FF6B6B" },
  { label: "Youth", value: "youth", icon: "baby", color: "#8B5CF6" },
  { label: "Business", value: "business", icon: "store", color: "#F2A900" },
  { label: "Education", value: "education", icon: "education", color: "#06B6D4" },
  { label: "Legal", value: "legal", icon: "gavel", color: "#FF006E" },
  { label: "Senior", value: "senior", icon: "elder", color: "#9E9A93" },
];

const categoryColors: Record<string, string> = Object.fromEntries(
  categories.filter((c) => c.value !== "all").map((c) => [c.value, c.color])
);

const categoryBadgeVariant: Record<string, "gold" | "blue" | "coral" | "emerald" | "pink" | "purple" | "cyan"> = {
  housing: "blue",
  health: "coral",
  jobs: "emerald",
  food: "coral",
  youth: "purple",
  business: "gold",
  education: "cyan",
  legal: "pink",
  senior: "gold",
  veterans: "emerald",
  utilities: "cyan",
};

const categoryIcons: Record<string, IconName> = Object.fromEntries(
  categories.filter((c) => c.value !== "all").map((c) => [c.value, c.icon])
);

const statusConfig: Record<string, { variant: "emerald" | "coral" | "cyan" | "gold"; label: string }> = {
  open: { variant: "emerald", label: "Open" },
  closed: { variant: "coral", label: "Closed" },
  upcoming: { variant: "cyan", label: "Coming Soon" },
  limited: { variant: "gold", label: "Limited Spots" },
};

const quickPrompts: { text: string; icon: IconName }[] = [
  { text: "I need help paying rent", icon: "house" },
  { text: "Where can I get free food?", icon: "apple" },
  { text: "Job training programs near me", icon: "briefcase" },
  { text: "Free health clinics near me", icon: "heart-pulse" },
  { text: "Youth after-school programs", icon: "baby" },
  { text: "Help starting a small business", icon: "store" },
];

// ---------------------------------------------------------------------------
// AI Resource Assistant
// ---------------------------------------------------------------------------

function AIResourceAssistant({ onResultClick }: { onResultClick?: (category: string) => void }) {
  const activeCity = useActiveCity();
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [matchedResources, setMatchedResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expanded) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [expanded]);

  async function handleSearch(q?: string) {
    const searchQuery = q || query;
    if (!searchQuery.trim() || loading) return;

    setLoading(true);
    setResponse("");
    setMatchedResources([]);

    try {
      // Fetch AI response
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery.trim(), context_type: "resource" }),
      });

      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResponse(data.response || "");

      // Also do a local search for matching resources
      const supabase = createClient();
      const words = searchQuery.toLowerCase().split(/\s+/);
      let resourcesQuery = supabase
        .from("resources")
        .select("*")
        .eq("is_published", true)
        .limit(50);
      if (activeCity?.id) resourcesQuery = resourcesQuery.eq("city_id", activeCity.id);
      const { data: resources } = await resourcesQuery;

      if (resources) {
        const scored = (resources as Resource[]).map((r) => {
          let score = 0;
          const text = `${r.name} ${r.description} ${r.category} ${r.organization || ""} ${r.eligibility || ""} ${(r.match_tags || []).join(" ")}`.toLowerCase();
          for (const word of words) {
            if (text.includes(word)) score += 1;
            if (r.match_tags?.some((t) => t.toLowerCase().includes(word))) score += 2;
            if (r.category.toLowerCase().includes(word)) score += 2;
          }
          return { resource: r, score };
        });

        const matches = scored
          .filter((s) => s.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .map((s) => s.resource);

        setMatchedResources(matches);
      }
    } catch {
      setResponse("Sorry, I couldn't search right now. Try browsing the categories below.");
    } finally {
      setLoading(false);
    }
  }

  function handleQuickPrompt(text: string) {
    setQuery(text);
    handleSearch(text);
  }

  function handleReset() {
    setResponse("");
    setMatchedResources([]);
    setQuery("");
    inputRef.current?.focus();
  }

  return (
    <div className="px-5 mb-6">
      <div
        className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
          expanded
            ? "bg-card border-gold/20"
            : "bg-gradient-to-r from-gold/8 via-gold/4 to-hc-purple/8 border-gold/15 cursor-pointer"
        }`}
      >
        {/* Header — always visible */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full p-4 flex items-center gap-3.5 press text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-hc-purple/10 flex items-center justify-center shrink-0 animate-float">
            <Icon name="sparkle" size={24} className="text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-heading font-bold text-sm">AI Resource Assistant</p>
              <Badge label="AI" variant="gold" shine />
            </div>
            <p className="text-[11px] text-txt-secondary">
              {expanded ? "Tell me what you need help with" : "Describe your situation — I'll find the right programs"}
            </p>
          </div>
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`text-gold shrink-0 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
            strokeLinecap="round"
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="px-4 pb-4 animate-fade-in">
            {/* Gold accent line */}
            <div className="divider-gold mb-4" />

            {/* Search input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="mb-4"
            >
              <div className="flex items-center gap-2 bg-surface border border-border-subtle rounded-xl px-3 py-2.5 focus-within:border-gold/30 transition-all">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-txt-secondary shrink-0">
                  <circle cx="7" cy="7" r="4" />
                  <path d="M10 10l4 4" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. I need help with rent..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-txt-secondary/50 outline-none"
                />
                <button
                  type="submit"
                  disabled={!query.trim() || loading}
                  className="w-8 h-8 rounded-lg bg-gradient-to-r from-gold to-gold-light flex items-center justify-center text-midnight disabled:opacity-30 press shrink-0"
                >
                  {loading ? (
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M5 7h4M7 5v4M3 7a4 4 0 108 0 4 4 0 00-8 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </form>

            {/* Loading state */}
            {loading && (
              <div className="space-y-2 animate-pulse py-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-gold animate-bounce" />
                  <span className="text-[11px] text-gold font-medium">Searching resources for you...</span>
                </div>
                <div className="h-3 bg-white/5 rounded w-full" />
                <div className="h-3 bg-white/5 rounded w-4/5" />
                <div className="h-3 bg-white/5 rounded w-3/5" />
              </div>
            )}

            {/* AI Response */}
            {!loading && response && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <Badge label="AI Recommendation" variant="gold" shine />
                </div>
                <div className="bg-surface rounded-xl p-3.5 mb-3">
                  <p className="text-[12px] text-txt-secondary leading-relaxed whitespace-pre-wrap">
                    {response}
                  </p>
                </div>

                {/* Matched Resources */}
                {matchedResources.length > 0 && (
                  <div className="space-y-2 mb-3">
                    <p className="text-[10px] text-txt-secondary font-semibold uppercase tracking-wider">
                      Matching Resources
                    </p>
                    {matchedResources.map((r) => (
                      <Link key={r.id} href={`/resources/${r.id}`}>
                        <div className="flex items-center gap-3 bg-surface rounded-xl p-3 press hover:bg-elevated transition-colors">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${categoryColors[r.category] || "#F2A900"}15` }}>
                            <Icon name={categoryIcons[r.category] || "document"} size={16} className="text-white/70" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold truncate">{r.name}</p>
                            <p className="text-[10px] text-txt-secondary truncate">{r.organization}</p>
                          </div>
                          <Badge
                            label={statusConfig[r.status]?.label ?? r.status}
                            variant={statusConfig[r.status]?.variant ?? "cyan"}
                          />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                <button onClick={handleReset} className="text-[11px] text-gold font-semibold press">
                  ← Ask another question
                </button>
              </div>
            )}

            {/* Quick prompts (initial state) */}
            {!loading && !response && (
              <div className="grid grid-cols-2 gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt.text}
                    onClick={() => handleQuickPrompt(prompt.text)}
                    className="flex items-center gap-2 bg-surface rounded-xl px-3 py-2.5 text-left press hover:bg-elevated transition-colors"
                  >
                    <Icon name={prompt.icon} size={16} className="text-white/70 shrink-0" />
                    <span className="text-[11px] text-txt-secondary leading-tight">{prompt.text}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ResourcesPage() {
  const activeCity = useActiveCity();
  const [activeCategory, setActiveCategory] = useState("all");
  const [resources, setResources] = useState<Resource[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResources() {
      setLoading(true);
      const supabase = createClient();
      let query = supabase
        .from("resources")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (activeCity?.id) {
        query = query.eq("city_id", activeCity.id);
      }

      if (activeCategory !== "all") {
        query = query.eq("category", activeCategory);
      }

      const { data } = await query;
      setResources((data as Resource[]) ?? []);
      setLoading(false);
    }
    fetchResources();
  }, [activeCategory, activeCity?.id]);

  const filtered = useMemo(() => {
    if (!search) return resources;
    const q = search.toLowerCase();
    return resources.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.organization?.toLowerCase().includes(q) ||
        r.match_tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [resources, search]);

  const openCount = resources.filter((r) => r.status === "open").length;
  const freeCount = resources.filter((r) => r.is_free).length;
  const urgentResources = filtered.filter(
    (r) => r.status === "limited" || (r.deadline && new Date(r.deadline) < new Date(Date.now() + 14 * 86400000))
  );
  const openResources = filtered.filter((r) => r.status === "open" && !urgentResources.includes(r));
  const otherResources = filtered.filter((r) => !urgentResources.includes(r) && !openResources.includes(r));

  return (
    <div className="animate-fade-in pb-safe">
      {/* ── Editorial Masthead ── */}
      <header className="relative px-5 pt-6 pb-6 border-b border-white/[0.08] panel-editorial">
        <div className="absolute inset-0 pattern-dots opacity-15" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-editorial text-gold tabular-nums">
              VOL · 01 · ISSUE SUPPORT
            </span>
            <span className="block w-1 h-1 rounded-full bg-gold/60" />
            <span className="text-[10px] font-bold uppercase tracking-editorial text-white/40">
              {activeCity?.name?.toUpperCase() ?? "EVERYWHERE"}
            </span>
          </div>
          <h1 className="masthead text-white text-[44px]">SUPPORT.</h1>
          <div className="mt-3 flex items-center gap-3">
            <span className="block h-[2px] w-8 bg-gold" />
            <span className="text-[10px] font-bold uppercase tracking-editorial text-ivory/60">
              Grants, programs & services for {activeCity?.name ?? "local"} residents
            </span>
          </div>
        </div>
      </header>

      {/* ── Quick Stats ── */}
      <div className="px-5 -mt-1 mb-5">
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: "Resources", value: resources.length, color: "#F2A900" },
            { label: "Open Now", value: openCount, color: "#22C55E" },
            { label: "Free", value: freeCount, color: "#06B6D4" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl glass-card border border-border-subtle glass-inner-light p-3 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: stat.color }} />
              <p className="font-heading font-bold text-lg leading-none mb-0.5" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-[9px] text-txt-secondary font-semibold uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── AI Resource Assistant ── */}
      <AIResourceAssistant onResultClick={(cat) => setActiveCategory(cat)} />

      {/* ── Search ── */}
      <div className="px-5 mb-4">
        <div className="flex items-center gap-3 bg-surface border border-border-subtle rounded-2xl px-4 py-3 focus-within:border-gold/30 transition-all">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-txt-secondary shrink-0">
            <circle cx="8" cy="8" r="5" />
            <path d="M12 12l4 4" />
          </svg>
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-white placeholder:text-txt-secondary/60 w-full outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-txt-secondary hover:text-white press">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Category Filters ── */}
      <div className="flex gap-2 px-5 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {categories.map((cat) => (
          <Chip
            key={cat.value}
            label={cat.label}
            icon={<Icon name={cat.icon} size={16} className="text-white/70" />}
            active={activeCategory === cat.value}
            onClick={() => setActiveCategory(cat.value)}
          />
        ))}
      </div>

      {loading ? (
        <div className="px-5 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* ── Browse by Need (grid, home view only) ── */}
          {activeCategory === "all" && !search && (
            <section className="px-5 mb-6">
              <div className="flex items-baseline gap-3 mb-3">
                <span className="font-display text-gold text-[22px] leading-none tabular-nums">
                  № 01
                </span>
                <span className="text-[10px] font-bold tracking-editorial uppercase text-white/50">
                  Browse by Need
                </span>
                <span className="ml-auto rule-hairline flex-1 self-center" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {categories.filter((c) => c.value !== "all").map((cat) => {
                  const count = resources.filter((r) => r.category === cat.value).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => setActiveCategory(cat.value)}
                      className="group rounded-xl panel-editorial p-3 flex flex-col items-center gap-2 press hover:border-gold/30 transition-colors relative"
                    >
                      <div className="w-10 h-10 rounded-lg border border-gold/15 bg-ink flex items-center justify-center group-hover:border-gold/40 transition-colors">
                        <Icon name={cat.icon} size={18} className="text-gold" />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-editorial-tight text-ivory/90">
                        {cat.label}
                      </p>
                      <p className="text-[9px] text-gold/70 font-semibold tabular-nums">
                        {count}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Urgent / Deadline Resources ── */}
          {urgentResources.length > 0 && (
            <section className="px-5 mb-6">
              <div className="flex items-baseline gap-3 mb-3">
                <span className="font-display text-gold text-[22px] leading-none tabular-nums">
                  № 02
                </span>
                <span className="text-[10px] font-bold tracking-editorial uppercase text-white/50">
                  Act Now
                </span>
                <Tag tone="coral" size="xs">
                  <span className="w-1 h-1 rounded-full bg-coral animate-pulse" />
                  {urgentResources.length} urgent
                </Tag>
                <span className="ml-auto rule-hairline flex-1 self-center" />
              </div>
              <div className="space-y-3">
                {urgentResources.map((r) => (
                  <ResourceCard key={r.id} resource={r} urgent />
                ))}
              </div>
            </section>
          )}

          {/* ── Open Resources ── */}
          {openResources.length > 0 && (
            <section className="px-5 mb-6">
              <div className="flex items-baseline gap-3 mb-3">
                <span className="font-display text-gold text-[22px] leading-none tabular-nums">
                  № 03
                </span>
                <span className="text-[10px] font-bold tracking-editorial uppercase text-white/50">
                  {activeCategory === "all" ? "Available Now" : categories.find((c) => c.value === activeCategory)?.label}
                </span>
                <span className="ml-auto rule-hairline flex-1 self-center" />
                <span className="text-[10px] font-bold tracking-editorial uppercase text-gold tabular-nums whitespace-nowrap">
                  {openResources.length} open
                </span>
              </div>
              <div className="space-y-3 stagger">
                {openResources.map((r) => (
                  <ResourceCard key={r.id} resource={r} />
                ))}
              </div>
            </section>
          )}

          {/* ── Other Resources ── */}
          {otherResources.length > 0 && (
            <section className="px-5 mb-6">
              <div className="flex items-baseline gap-3 mb-3">
                <span className="font-display text-gold text-[22px] leading-none tabular-nums">
                  № 04
                </span>
                <span className="text-[10px] font-bold tracking-editorial uppercase text-white/50">
                  Coming Soon &amp; More
                </span>
                <span className="ml-auto rule-hairline flex-1 self-center" />
                <span className="text-[10px] font-bold tracking-editorial uppercase text-ivory/50 tabular-nums whitespace-nowrap">
                  {otherResources.length}
                </span>
              </div>
              <div className="space-y-3 stagger">
                {otherResources.map((r) => (
                  <ResourceCard key={r.id} resource={r} />
                ))}
              </div>
            </section>
          )}

          {/* ── Empty State ── */}
          {filtered.length === 0 && (
            <div className="px-5 text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-card mx-auto mb-4 flex items-center justify-center">
                <Icon name="search" size={28} className="text-white/30" />
              </div>
              <p className="text-sm font-bold mb-1">No resources found</p>
              <p className="text-xs text-txt-secondary mb-4">Try a different search or category</p>
              <button
                onClick={() => {
                  setSearch("");
                  setActiveCategory("all");
                }}
                className="text-xs text-gold font-semibold press"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* ── Need Help CTA ── */}
          <div className="px-5 mt-4 mb-4">
            <div className="rounded-2xl panel-editorial p-5 relative overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl border border-gold/25 bg-ink flex items-center justify-center shrink-0">
                  <Icon name="phone" size={22} className="text-gold" />
                </div>
                <div className="flex-1">
                  <p className="font-display text-[17px] leading-tight text-white">Need immediate help?</p>
                  <p className="text-[11px] text-ivory/60 mt-0.5">Call 211 for free community referrals, 24/7.</p>
                </div>
                <a
                  href="tel:211"
                  className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-editorial-tight bg-gold text-midnight press"
                >
                  Call 211
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Resource Card
// ---------------------------------------------------------------------------

function ResourceCard({ resource: r, urgent }: { resource: Resource; urgent?: boolean }) {
  const status = statusConfig[r.status] ?? { variant: "cyan" as const, label: r.status };
  const statusToneMap: Record<string, "emerald" | "coral" | "cyan" | "gold" | "default"> = {
    emerald: "emerald",
    coral: "coral",
    cyan: "cyan",
    gold: "gold",
  };
  const statusTone = statusToneMap[status.variant] ?? "default";

  const daysUntilDeadline = r.deadline
    ? Math.ceil((new Date(r.deadline).getTime() - Date.now()) / 86400000)
    : null;

  const spotsUsed = r.filled_spots ?? 0;
  const spotsTotal = r.max_spots ?? 0;
  const spotsPct = spotsTotal > 0 ? Math.min((spotsUsed / spotsTotal) * 100, 100) : 0;
  const spotsLeft = spotsTotal > 0 ? spotsTotal - spotsUsed : 0;
  const iconName = (categoryIcons[r.category] as IconName) ?? "document";

  return (
    <Link
      href={`/resources/${r.id}`}
      className={`group block rounded-2xl panel-editorial press hover:border-gold/30 transition-colors overflow-hidden relative ${
        urgent ? "border-coral/25" : ""
      }`}
    >
      {/* Urgent gets a thin coral rail; everything else gets a gold hairline */}
      {urgent && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-coral" />
      )}

      <div className="flex items-stretch">
        {/* Ink side panel with gold icon — no more rainbow category color */}
        <div className="w-[92px] shrink-0 relative bg-ink border-r border-white/[0.06] flex items-center justify-center">
          {r.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.image_url} alt={r.name} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="w-12 h-12 rounded-xl border border-gold/20 bg-black/40 flex items-center justify-center">
                <Icon name={iconName} size={22} className="text-gold" />
              </div>
              <span className="text-[8px] font-bold uppercase tracking-editorial-tight text-gold/70">
                {r.category}
              </span>
            </div>
          )}
          {/* Status pill top-left */}
          <div className="absolute top-2 left-2">
            <Tag tone={statusTone} size="xs">{status.label}</Tag>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 p-3.5">
          <h3 className="font-display text-[17px] leading-tight text-white group-hover:text-gold transition-colors line-clamp-1">
            {r.name}
          </h3>
          {r.organization && (
            <p className="text-[11px] text-ivory/55 font-medium truncate mt-0.5">
              {r.organization}
            </p>
          )}

          {r.description && (
            <p className="text-[11px] text-ivory/50 leading-relaxed mt-1.5 line-clamp-2">
              {r.description}
            </p>
          )}

          {/* Tag row */}
          <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
            <Tag tone="gold" size="xs">{r.category}</Tag>
            {r.is_free && <Tag tone="emerald" size="xs">Free</Tag>}
            {r.eligibility && (
              <span className="text-[9px] font-semibold uppercase tracking-editorial-tight text-ivory/50 bg-white/[0.03] border border-white/[0.06] rounded-full px-2 py-0.5 truncate max-w-[120px]">
                {r.eligibility}
              </span>
            )}
          </div>

          {/* Spots progress — gold / coral only */}
          {spotsTotal > 0 && (
            <div className="mt-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-ivory/40 font-medium uppercase tracking-editorial-tight">
                  {spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left` : "Full"}
                </span>
                <span
                  className={`text-[9px] font-bold tabular-nums ${
                    spotsPct >= 90 ? "text-coral" : "text-gold"
                  }`}
                >
                  {spotsUsed}/{spotsTotal}
                </span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    spotsPct >= 90 ? "bg-coral" : "bg-gold"
                  }`}
                  style={{ width: `${spotsPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Contact + CTA row */}
          <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
            {r.phone && (
              <span className="inline-flex items-center gap-1 text-[10px] text-gold font-semibold tabular-nums">
                <Icon name="phone" size={10} />
                {r.phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3").slice(0, 14)}
              </span>
            )}
            {r.website && (
              <span className="inline-flex items-center gap-1 text-[10px] text-ivory/50 font-semibold">
                <Icon name="globe" size={10} />
                Website
              </span>
            )}

            {r.deadline && daysUntilDeadline !== null && daysUntilDeadline > 0 && (
              <Tag
                tone={daysUntilDeadline <= 7 ? "coral" : "gold"}
                size="xs"
              >
                <Icon name="clock" size={9} />
                {daysUntilDeadline <= 1 ? "Tomorrow" : `${daysUntilDeadline}d`}
              </Tag>
            )}

            <span className="ml-auto shrink-0">
              {r.accepts_applications && r.status === "open" ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-editorial-tight bg-gold/15 text-gold group-hover:bg-gold group-hover:text-midnight transition-colors">
                  Apply
                  <Icon name="arrow-right-thin" size={11} />
                </span>
              ) : (
                <Icon name="arrow-right-thin" size={14} className="text-gold/60 group-hover:text-gold transition-colors" />
              )}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
