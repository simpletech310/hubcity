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
        className="overflow-hidden transition-all duration-300"
        style={{
          background: expanded ? "var(--paper)" : "var(--paper-warm)",
          border: "2px solid var(--rule-strong-c)",
          cursor: expanded ? "default" : "pointer",
        }}
      >
        {/* Header — always visible */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full p-4 flex items-center gap-3.5 press text-left"
        >
          <div
            className="w-12 h-12 flex items-center justify-center shrink-0"
            style={{ background: "var(--gold-c)", border: "2px solid var(--rule-strong-c)" }}
          >
            <Icon name="sparkle" size={24} style={{ color: "var(--ink-strong)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="c-card-t" style={{ fontSize: 14, color: "var(--ink-strong)" }}>AI Resource Assistant</p>
              <Badge label="AI" variant="gold" shine />
            </div>
            <p className="c-meta">
              {expanded ? "Tell me what you need help with" : "Describe your situation — I'll find the right programs"}
            </p>
          </div>
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`shrink-0 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
            style={{ color: "var(--ink-strong)" }}
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
              <div
                className="flex items-center gap-2 px-3 py-2.5 transition-all"
                style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0" style={{ color: "var(--ink-strong)" }}>
                  <circle cx="7" cy="7" r="4" />
                  <path d="M10 10l4 4" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. I need help with rent..."
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "var(--ink-strong)" }}
                />
                <button
                  type="submit"
                  disabled={!query.trim() || loading}
                  className="w-8 h-8 flex items-center justify-center disabled:opacity-30 press shrink-0"
                  style={{ background: "var(--gold-c)", border: "2px solid var(--rule-strong-c)", color: "var(--ink-strong)" }}
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
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--gold-c)" }} />
                  <span className="c-kicker" style={{ color: "var(--ink-strong)" }}>Searching resources for you...</span>
                </div>
                <div className="h-3 w-full" style={{ background: "var(--paper-soft)" }} />
                <div className="h-3 w-4/5" style={{ background: "var(--paper-soft)" }} />
                <div className="h-3 w-3/5" style={{ background: "var(--paper-soft)" }} />
              </div>
            )}

            {/* AI Response */}
            {!loading && response && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <Badge label="AI Recommendation" variant="gold" shine />
                </div>
                <div className="p-3.5 mb-3" style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}>
                  <p className="c-body whitespace-pre-wrap">
                    {response}
                  </p>
                </div>

                {/* Matched Resources */}
                {matchedResources.length > 0 && (
                  <div className="space-y-2 mb-3">
                    <p className="c-kicker">
                      Matching Resources
                    </p>
                    {matchedResources.map((r) => (
                      <Link key={r.id} href={`/resources/${r.id}`}>
                        <div
                          className="flex items-center gap-3 p-3 press transition-colors"
                          style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
                        >
                          <div
                            className="w-8 h-8 flex items-center justify-center shrink-0"
                            style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
                          >
                            <Icon name={categoryIcons[r.category] || "document"} size={16} style={{ color: "var(--ink-strong)" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="c-card-t truncate" style={{ fontSize: 12, color: "var(--ink-strong)" }}>{r.name}</p>
                            <p className="c-meta truncate">{r.organization}</p>
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
                    className="flex items-center gap-2 px-3 py-2.5 text-left press transition-colors"
                    style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
                  >
                    <Icon name={prompt.icon} size={16} style={{ color: "var(--ink-strong)" }} className="shrink-0" />
                    <span className="c-meta leading-tight">{prompt.text}</span>
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
    <div className="culture-surface min-h-dvh animate-fade-in pb-safe">
      <header
        className="px-[18px] pt-5 pb-4"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <div className="c-kicker" style={{ opacity: 0.65 }}>
          § VOL·01 · ISSUE SUPPORT · {activeCity?.name?.toUpperCase() ?? "EVERYWHERE"}
        </div>
        <h1
          className="c-hero mt-2"
          style={{ fontSize: 56, lineHeight: 0.88, letterSpacing: "-0.02em" }}
        >
          Support.
        </h1>
        <p className="c-serif-it mt-2" style={{ fontSize: 13 }}>
          Grants, programs &amp; services for {activeCity?.name ?? "local"} members.
        </p>
      </header>

      {/* ── Quick Stats ── */}
      <div
        className="grid grid-cols-3 mb-6"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        {[
          { label: "RESOURCES", value: resources.length, gold: true },
          { label: "OPEN", value: openCount },
          { label: "FREE", value: freeCount },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="text-center"
            style={{
              padding: "14px 10px",
              borderRight: i < 2 ? "2px solid var(--rule-strong-c)" : "none",
              background: stat.gold ? "var(--gold-c)" : "var(--paper)",
            }}
          >
            <div className="c-display c-tabnum" style={{ fontSize: 22, lineHeight: 1 }}>{stat.value}</div>
            <div className="c-kicker mt-1.5" style={{ fontSize: 9 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── AI Resource Assistant ── */}
      <AIResourceAssistant onResultClick={(cat) => setActiveCategory(cat)} />

      {/* ── Search ── */}
      <div className="px-5 mb-4">
        <div
          className="flex items-center gap-3 px-4 py-3 transition-all"
          style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0" style={{ color: "var(--ink-strong)" }}>
            <circle cx="8" cy="8" r="5" />
            <path d="M12 12l4 4" />
          </svg>
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm w-full outline-none"
            style={{ color: "var(--ink-strong)" }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="press" style={{ color: "var(--ink-strong)" }}>
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
            <div key={i} className="skeleton h-32" style={{ border: "2px solid var(--rule-strong-c)" }} />
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
                <span className="c-kicker" style={{ opacity: 0.65 }}>
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
                      className="group p-3 flex flex-col items-center gap-2 press transition-colors relative"
                      style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
                    >
                      <div
                        className="w-10 h-10 flex items-center justify-center transition-colors"
                        style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
                      >
                        <Icon name={cat.icon} size={18} style={{ color: "var(--ink-strong)" }} />
                      </div>
                      <p className="c-kicker" style={{ color: "var(--ink-strong)" }}>
                        {cat.label}
                      </p>
                      <p className="c-kicker tabular-nums" style={{ fontSize: 9 }}>
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
                <span className="c-kicker" style={{ opacity: 0.65 }}>
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
                <span className="c-kicker" style={{ opacity: 0.65 }}>
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
                <span className="c-kicker" style={{ opacity: 0.65 }}>
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
              <div
                className="w-16 h-16 mx-auto mb-4 flex items-center justify-center"
                style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
              >
                <Icon name="search" size={28} style={{ color: "var(--ink-strong)" }} />
              </div>
              <p className="c-card-t mb-1" style={{ color: "var(--ink-strong)" }}>No resources found</p>
              <p className="c-meta mb-4">Try a different search or category</p>
              <button
                onClick={() => {
                  setSearch("");
                  setActiveCategory("all");
                }}
                className="c-btn c-btn-outline c-btn-sm press"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* ── Need Help CTA ── */}
          <div className="px-5 mt-4 mb-4">
            <div
              className="p-5 relative overflow-hidden"
              style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 flex items-center justify-center shrink-0"
                  style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
                >
                  <Icon name="phone" size={22} style={{ color: "var(--ink-strong)" }} />
                </div>
                <div className="flex-1">
                  <p className="c-card-t" style={{ fontSize: 17, color: "var(--ink-strong)" }}>Need immediate help?</p>
                  <p className="c-meta mt-0.5">Call 211 for free community referrals, 24/7.</p>
                </div>
                <a
                  href="tel:211"
                  className="c-btn c-btn-primary c-btn-sm shrink-0 press"
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
      className="group block press transition-colors overflow-hidden relative"
      style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
    >
      {/* Urgent gets a thin gold rail */}
      {urgent && (
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "var(--gold-c)" }} />
      )}

      <div className="flex items-stretch">
        {/* Paper side panel with ink icon */}
        <div
          className="w-[92px] shrink-0 relative flex items-center justify-center"
          style={{ background: "var(--paper-warm)", borderRight: "2px solid var(--rule-strong-c)" }}
        >
          {r.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.image_url} alt={r.name} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              <div
                className="w-12 h-12 flex items-center justify-center"
                style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
              >
                <Icon name={iconName} size={22} style={{ color: "var(--ink-strong)" }} />
              </div>
              <span className="c-kicker" style={{ fontSize: 8, color: "var(--ink-strong)" }}>
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
          <h3 className="c-card-t line-clamp-1" style={{ fontSize: 17, color: "var(--ink-strong)" }}>
            {r.name}
          </h3>
          {r.organization && (
            <p className="c-meta truncate mt-0.5">
              {r.organization}
            </p>
          )}

          {r.description && (
            <p className="c-body mt-1.5 line-clamp-2">
              {r.description}
            </p>
          )}

          {/* Tag row */}
          <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
            <Tag tone="gold" size="xs">{r.category}</Tag>
            {r.is_free && <Tag tone="emerald" size="xs">Free</Tag>}
            {r.eligibility && (
              <span className="c-badge-ink inline-flex px-2 py-0.5 truncate max-w-[120px]" style={{ fontSize: 9 }}>
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
                <span className="c-badge-gold inline-flex items-center gap-1 px-2.5 py-1">
                  Apply
                  <Icon name="arrow-right-thin" size={11} />
                </span>
              ) : (
                <Icon name="arrow-right-thin" size={14} style={{ color: "var(--ink-strong)" }} />
              )}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
