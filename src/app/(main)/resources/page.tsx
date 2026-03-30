"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Chip from "@/components/ui/Chip";
import Badge from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import type { Resource } from "@/types/database";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const categories = [
  { label: "All", value: "all", icon: "📋", color: "#F2A900" },
  { label: "Housing", value: "housing", icon: "🏠", color: "#3B82F6" },
  { label: "Health", value: "health", icon: "❤️", color: "#EF4444" },
  { label: "Jobs", value: "jobs", icon: "💼", color: "#22C55E" },
  { label: "Food", value: "food", icon: "🍎", color: "#FF6B6B" },
  { label: "Youth", value: "youth", icon: "🧒", color: "#8B5CF6" },
  { label: "Business", value: "business", icon: "🏪", color: "#F2A900" },
  { label: "Education", value: "education", icon: "📚", color: "#06B6D4" },
  { label: "Legal", value: "legal", icon: "⚖️", color: "#FF006E" },
  { label: "Senior", value: "senior", icon: "👴", color: "#9E9A93" },
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

const categoryIcons: Record<string, string> = Object.fromEntries(
  categories.filter((c) => c.value !== "all").map((c) => [c.value, c.icon])
);

const statusConfig: Record<string, { variant: "emerald" | "coral" | "cyan" | "gold"; label: string }> = {
  open: { variant: "emerald", label: "Open" },
  closed: { variant: "coral", label: "Closed" },
  upcoming: { variant: "cyan", label: "Coming Soon" },
  limited: { variant: "gold", label: "Limited Spots" },
};

const quickPrompts = [
  { text: "I need help paying rent", icon: "🏠" },
  { text: "Where can I get free food?", icon: "🍎" },
  { text: "Job training programs near me", icon: "💼" },
  { text: "Free health clinics in Compton", icon: "❤️" },
  { text: "Youth after-school programs", icon: "🧒" },
  { text: "Help starting a small business", icon: "🏪" },
];

// ---------------------------------------------------------------------------
// AI Resource Assistant
// ---------------------------------------------------------------------------

function AIResourceAssistant({ onResultClick }: { onResultClick?: (category: string) => void }) {
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
      const { data: resources } = await supabase
        .from("resources")
        .select("*")
        .eq("is_published", true)
        .limit(50);

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
            <span className="text-2xl">🤖</span>
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
                            <span className="text-sm">{categoryIcons[r.category] || "📋"}</span>
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
                    <span className="text-sm">{prompt.icon}</span>
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

      if (activeCategory !== "all") {
        query = query.eq("category", activeCategory);
      }

      const { data } = await query;
      setResources((data as Resource[]) ?? []);
      setLoading(false);
    }
    fetchResources();
  }, [activeCategory]);

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
      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald/8 via-deep to-hc-blue/8 pattern-dots" />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/50 to-transparent" />

        <div className="relative z-10 px-5 pt-6 pb-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald/15 flex items-center justify-center">
              <span className="text-base">🤝</span>
            </div>
            <p className="text-[10px] text-emerald font-bold uppercase tracking-[0.2em]">Community Support</p>
          </div>
          <h1 className="font-heading text-[26px] font-bold leading-tight mb-1.5">
            Resource Center
          </h1>
          <p className="font-display italic text-sm text-txt-secondary">
            Grants, programs & services for Compton residents
          </p>
        </div>
      </div>

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
              className="rounded-xl bg-card border border-border-subtle p-3 text-center relative overflow-hidden"
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
            icon={<span className="text-sm">{cat.icon}</span>}
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
          {/* ── Browse by Category (grid, home view only) ── */}
          {activeCategory === "all" && !search && (
            <section className="px-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 rounded-full bg-hc-blue" />
                <h2 className="font-heading font-bold text-base">Browse by Need</h2>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {categories.filter((c) => c.value !== "all").map((cat) => {
                  const count = resources.filter((r) => r.category === cat.value).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => setActiveCategory(cat.value)}
                      className="rounded-xl bg-card border border-border-subtle p-3 flex flex-col items-center gap-1.5 press hover:border-gold/20 transition-colors relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: cat.color }} />
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${cat.color}15` }}>
                        <span className="text-lg">{cat.icon}</span>
                      </div>
                      <p className="text-[10px] font-bold">{cat.label}</p>
                      <p className="text-[9px] text-txt-secondary">{count}</p>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Urgent / Deadline Resources ── */}
          {urgentResources.length > 0 && (
            <section className="px-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 rounded-full bg-compton-red" />
                <h2 className="font-heading font-bold text-base">Act Now</h2>
                <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-compton-red/10 border border-compton-red/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-compton-red pulse-glow" />
                  <span className="text-[9px] font-bold text-compton-red uppercase">{urgentResources.length} urgent</span>
                </div>
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
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 rounded-full bg-emerald" />
                <h2 className="font-heading font-bold text-base">
                  {activeCategory === "all" ? "Available Now" : categories.find((c) => c.value === activeCategory)?.label}
                </h2>
                <span className="ml-auto text-xs text-txt-secondary">{openResources.length} open</span>
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
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 rounded-full bg-cyan" />
                <h2 className="font-heading font-bold text-base">Coming Soon & More</h2>
                <span className="ml-auto text-xs text-txt-secondary">{otherResources.length}</span>
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
                <span className="text-3xl">🔍</span>
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
            <div className="rounded-2xl bg-gradient-to-r from-emerald/10 via-emerald/5 to-transparent border border-emerald/15 p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald to-transparent" />
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald/15 flex items-center justify-center shrink-0">
                  <span className="text-2xl">📞</span>
                </div>
                <div className="flex-1">
                  <p className="font-heading font-bold text-sm mb-0.5">Need Immediate Help?</p>
                  <p className="text-[11px] text-txt-secondary">Call 211 for free community referrals 24/7</p>
                </div>
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
  const accentColor = categoryColors[r.category] || "#F2A900";
  const status = statusConfig[r.status] ?? { variant: "cyan" as const, label: r.status };
  const variant = categoryBadgeVariant[r.category] || "gold";

  const daysUntilDeadline = r.deadline
    ? Math.ceil((new Date(r.deadline).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <Link href={`/resources/${r.id}`}>
      <div
        className={`rounded-2xl bg-card border overflow-hidden press hover:border-gold/20 transition-colors relative ${
          urgent ? "border-compton-red/20" : "border-border-subtle"
        }`}
      >
        {/* Left accent */}
        <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-2xl" style={{ background: urgent ? "#EF4444" : accentColor }} />

        <div className="p-4 pl-4.5">
          {/* Top row: icon, name, status */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${accentColor}15` }}
              >
                <span className="text-lg">{categoryIcons[r.category] || "📋"}</span>
              </div>
              <div className="min-w-0">
                <h3 className="font-heading font-bold text-[13px] line-clamp-1">{r.name}</h3>
                {r.organization && (
                  <p className="text-[11px] text-txt-secondary font-medium truncate">{r.organization}</p>
                )}
              </div>
            </div>
            <Badge label={status.label} variant={status.variant} />
          </div>

          {/* Description */}
          <p className="text-[11px] text-txt-secondary leading-relaxed mb-3 line-clamp-2 ml-[52px]">
            {r.description}
          </p>

          {/* Bottom row: tags + deadline */}
          <div className="flex items-center justify-between ml-[52px]">
            <div className="flex gap-1.5">
              <Badge label={r.category} variant={variant} />
              {r.is_free && <Badge label="Free" variant="emerald" />}
            </div>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className="text-txt-secondary shrink-0" strokeLinecap="round">
              <path d="M5 2l5 5-5 5" />
            </svg>
          </div>

          {/* Deadline warning */}
          {r.deadline && daysUntilDeadline !== null && daysUntilDeadline > 0 && (
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border-subtle ml-[52px]">
              <span className="text-[10px]">⏰</span>
              <p className={`text-[11px] font-semibold ${daysUntilDeadline <= 7 ? "text-compton-red" : "text-gold"}`}>
                {daysUntilDeadline <= 1
                  ? "Deadline tomorrow!"
                  : daysUntilDeadline <= 7
                  ? `${daysUntilDeadline} days left to apply`
                  : `Deadline: ${new Date(r.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
