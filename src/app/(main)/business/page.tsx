"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import Tag from "@/components/ui/editorial/Tag";
import HeroBlock from "@/components/ui/editorial/HeroBlock";
import { createClient } from "@/lib/supabase/client";
import { useActiveCity } from "@/hooks/useActiveCity";
import type { Business } from "@/types/database";

// ---------------------------------------------------------------------------
// Category config
//
// NOTE: `color` here is only used by the (wrapped) CityOwnershipFilter chips
// for internal chip tinting — the rainbow values are preserved so the filter
// component's existing behavior is untouched. All business-page chrome uses
// the editorial black + gold palette instead.
// ---------------------------------------------------------------------------

const categories: { label: string; value: string; iconName: IconName }[] = [
  { label: "All", value: "all", iconName: "store" },
  { label: "Barber", value: "barber", iconName: "scissors" },
  { label: "Retail", value: "retail", iconName: "shopping" },
  { label: "Services", value: "services", iconName: "wrench" },
  { label: "Auto", value: "auto", iconName: "car" },
  { label: "Health", value: "health", iconName: "heart-pulse" },
  { label: "Beauty", value: "beauty", iconName: "sparkle" },
  { label: "Entertainment", value: "entertainment", iconName: "theater" },
];

const categoryIcons: Record<string, IconName> = {
  barber: "scissors",
  retail: "shopping",
  services: "wrench",
  auto: "car",
  health: "heart-pulse",
  beauty: "sparkle",
  entertainment: "theater",
  restaurant: "utensils",
  other: "store",
};

const badgeIcons: Record<string, IconName> = {
  black_owned: "verified",
  woman_owned: "person",
  veteran_owned: "shield",
  lgbtq_friendly: "flag",
  family_owned: "family",
  eco_friendly: "tree",
  city_certified: "landmark",
  local_favorite: "star",
  new_business: "sparkle",
  compton_original: "house",
};

function formatBadgeLabel(badge: string): string {
  return badge.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function isLocallyOwnedBadge(badge: string): boolean {
  return badge === "locally_owned" || badge === "compton_original" || badge === "black_owned";
}

// ---------------------------------------------------------------------------
// Hardcoded deals & promos for businesses (until DB has them)
// ---------------------------------------------------------------------------

interface LocalDeal {
  id: string;
  businessName: string;
  businessSlug: string;
  category: string;
  title: string;
  description: string;
  discount: string;
  promoCode?: string;
  validUntil: string;
  iconName: IconName;
}

interface TrendingBiz {
  name: string;
  slug: string;
  category: string;
  tagline: string;
  iconName: IconName;
  stat: string;
  statLabel: string;
}

const localDeals: LocalDeal[] = [
  {
    id: "d1",
    businessName: "Compton Cuts Barbershop",
    businessSlug: "compton-cuts",
    category: "barber",
    title: "Fresh Fade Friday",
    description: "20% off all fades every Friday",
    discount: "20% OFF",
    validUntil: "Every Friday",
    iconName: "scissors",
  },
  {
    id: "d2",
    businessName: "Compton Auto Care",
    businessSlug: "compton-auto-care",
    category: "auto",
    title: "Spring Tune-Up Special",
    description: "Oil change + tire rotation bundle",
    discount: "$49.99",
    promoCode: "SPRING25",
    validUntil: "Apr 30",
    iconName: "car",
  },
  {
    id: "d3",
    businessName: "Glow Up Beauty Lounge",
    businessSlug: "glow-up-beauty",
    category: "beauty",
    title: "New Client Special",
    description: "Full set nails + complimentary brow shape",
    discount: "30% OFF",
    promoCode: "GLOWUP",
    validUntil: "Apr 15",
    iconName: "sparkle",
  },
  {
    id: "d4",
    businessName: "Culture Fitness",
    businessSlug: "hub-city-fitness",
    category: "health",
    title: "No Sign-Up Fee",
    description: "Join this month & skip the enrollment fee",
    discount: "FREE",
    validUntil: "Mar 31",
    iconName: "heart-pulse",
  },
  {
    id: "d5",
    businessName: "Compton Fashion District",
    businessSlug: "compton-fashion",
    category: "retail",
    title: "Spring Collection Drop",
    description: "Buy 2 get 1 free on new arrivals",
    discount: "B2G1",
    validUntil: "Apr 7",
    iconName: "shopping",
  },
  {
    id: "d6",
    businessName: "City Sounds Entertainment",
    businessSlug: "city-sounds",
    category: "entertainment",
    title: "Weekend DJ Packages",
    description: "Book a weekend event & get free lighting",
    discount: "SAVE $200",
    promoCode: "SOUNDS24",
    validUntil: "Apr 30",
    iconName: "music",
  },
];

const trendingBusinesses: TrendingBiz[] = [
  { name: "Compton Cuts", slug: "compton-cuts", category: "barber", tagline: "The freshest fades in the city", iconName: "scissors", stat: "340+", statLabel: "cuts/mo" },
  { name: "Culture Fitness", slug: "hub-city-fitness", category: "health", tagline: "Where Compton gets strong", iconName: "heart-pulse", stat: "1.2K", statLabel: "members" },
  { name: "Glow Up Beauty", slug: "glow-up-beauty", category: "beauty", tagline: "Look good, feel good", iconName: "sparkle", stat: "4.9", statLabel: "rating" },
  { name: "Compton Auto Care", slug: "compton-auto-care", category: "auto", tagline: "Trusted since 2005", iconName: "wrench", stat: "18yrs", statLabel: "serving" },
];

const quickActions: { label: string; iconName: IconName; filter: string }[] = [
  { label: "Deals", iconName: "flame", filter: "deals" },
  { label: "New", iconName: "sparkle", filter: "new" },
  { label: "Top Rated", iconName: "star", filter: "top" },
  { label: "Black Owned", iconName: "verified", filter: "black_owned" },
];

// ---------------------------------------------------------------------------
// Small building block: numbered section header (matches health page pattern)
// ---------------------------------------------------------------------------

function SectionHead({
  num,
  kicker,
  sub,
  meta,
}: {
  num: string;
  kicker: string;
  sub?: string;
  meta?: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-gold text-[22px] leading-none tabular-nums">
          № {num}
        </span>
        <span className="text-[10px] font-bold tracking-editorial uppercase text-white/50">
          {kicker}
        </span>
        <span className="ml-auto rule-hairline flex-1 self-center" />
        {meta && <span className="shrink-0">{meta}</span>}
      </div>
      {sub && <p className="text-[11px] text-ivory/40 mt-1">{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BusinessPage() {
  const activeCity = useActiveCity();
  const [activeCategory, setActiveCategory] = useState("all");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const supabase = createClient();

      // Fetch businesses with city join
      let query = supabase
        .from("businesses")
        .select("*, city:cities(id, slug, name)")
        .eq("is_published", true)
        .neq("category", "restaurant")
        .order("is_featured", { ascending: false })
        .order("rating_avg", { ascending: false });

      if (activeCity?.id) {
        query = query.eq("city_id", activeCity.id);
      }

      if (activeCategory !== "all") {
        query = query.eq("category", activeCategory);
      }

      const { data } = await query;
      setBusinesses((data as Business[]) ?? []);
      setLoading(false);
    }
    fetchData();
  }, [activeCategory, activeCity?.id]);

  const filtered = useMemo(() => {
    let result = businesses;

    if (quickFilter === "new") {
      result = result.filter((b) => b.badges?.includes("new_business"));
    } else if (quickFilter === "top") {
      result = result.filter((b) => b.rating_avg >= 4.5);
    } else if (quickFilter === "black_owned") {
      result = result.filter((b) => b.badges?.includes("black_owned"));
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q) ||
          b.badges?.some((badge) => badge.toLowerCase().includes(q))
      );
    }
    return result;
  }, [businesses, search, quickFilter]);

  const featured = filtered.filter((b) => b.is_featured);
  const regular = filtered.filter((b) => !b.is_featured);
  const editorsPick = featured[0]; // one spotlight per load max
  const otherFeatured = featured.slice(1);
  const newBusinesses = businesses.filter((b) => b.badges?.includes("new_business"));
  const totalCount = businesses.length;

  const allBadges = useMemo(() => {
    const set = new Set<string>();
    businesses.forEach((b) => b.badges?.forEach((badge) => set.add(badge)));
    return Array.from(set).sort();
  }, [businesses]);

  return (
    <div className="culture-surface min-h-dvh animate-fade-in pb-safe">
      <div
        className="px-[18px] pt-5 pb-4"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <div className="c-kicker" style={{ opacity: 0.65 }}>
          § VOL·01 · ISSUE COMMERCE · {activeCity?.name?.toUpperCase() ?? "EVERYWHERE"}
        </div>
        <h1
          className="c-hero mt-2"
          style={{ fontSize: 56, lineHeight: 0.88, letterSpacing: "-0.02em" }}
        >
          Commerce.
        </h1>
        <p className="c-serif-it mt-2 mb-4" style={{ fontSize: 13 }}>
          {activeCity
            ? `Shops, services & makers in ${activeCity.name}.`
            : "Every city, every category."}
        </p>
      </div>

      {/* ── Search + Category strip ─────────────────────────────── */}
      <div
        className="px-5 pt-4 pb-3"
        style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
      >
        {/* Search */}
        <div className="relative mb-3">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--ink-strong)"
            strokeOpacity="0.4"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search businesses, badges, services…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 focus:outline-none"
            style={{
              background: "var(--paper-warm)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--ink-strong)",
              fontSize: 13,
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 press"
              style={{ color: "var(--ink-strong)", opacity: 0.4 }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4l6 6M10 4l-6 6"/></svg>
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => {
                  setActiveCategory(cat.value);
                  setQuickFilter(null);
                }}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 press transition-colors"
                style={{
                  background: isActive ? "var(--gold-c)" : "var(--paper)",
                  color: "var(--ink-strong)",
                  border: "2px solid var(--rule-strong-c)",
                  fontFamily: "var(--font-archivo-narrow), sans-serif",
                  fontSize: 11,
                  fontWeight: isActive ? 800 : 600,
                  letterSpacing: "0.06em",
                }}
              >
                <Icon name={cat.iconName} size={12} style={{ color: "var(--ink-strong)" }} />
                {cat.label.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="px-5 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* ── № 01 · Editor's Pick (single featured spotlight) ── */}
          {activeCategory === "all" && !search && !quickFilter && editorsPick && (
            <section className="px-5 mb-6">
              <SectionHead
                num="01"
                kicker="Editor's Pick"
                sub="Spotlight from the local commerce desk"
              />
              <Link href={`/business/${editorsPick.slug}`} className="block press group">
                <HeroBlock
                  aspect="3/2"
                  image={editorsPick.image_urls?.[0] ?? null}
                  alt={editorsPick.name}
                  className="rounded-2xl"
                >
                  <div className="absolute inset-x-0 bottom-0 p-5 z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag tone="gold" size="xs">Featured</Tag>
                      <Tag tone="ghost" size="xs">{editorsPick.category}</Tag>
                      {editorsPick.rating_avg > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gold tabular-nums">
                          <Icon name="star" size={11} className="text-gold" />
                          {Number(editorsPick.rating_avg).toFixed(1)}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-[28px] leading-[1.05] text-white mb-1.5 line-clamp-2">
                      {editorsPick.name}
                    </h3>
                    {editorsPick.description && (
                      <p className="text-[12px] text-ivory/70 leading-relaxed line-clamp-2 max-w-md mb-3">
                        {editorsPick.description}
                      </p>
                    )}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold text-midnight text-[10px] font-bold uppercase tracking-editorial-tight group-hover:bg-gold-light transition-colors">
                      {editorsPick.accepts_orders
                        ? "Order Now"
                        : editorsPick.accepts_bookings
                        ? "Book"
                        : "Visit"}
                      <Icon name="arrow-right-thin" size={11} />
                    </span>
                  </div>
                </HeroBlock>
              </Link>
            </section>
          )}

          {/* ── № 02 · Today's Deals ──────────────────────────────── */}
          {(quickFilter === null || quickFilter === "deals") && (
            <section className="mb-6">
              <div className="px-5">
                <SectionHead
                  num="02"
                  kicker="Today's Deals"
                  sub="Promos & specials running now"
                  meta={
                    <Tag tone="gold" size="xs">
                      {localDeals.length} active
                    </Tag>
                  }
                />
              </div>
              <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
                {localDeals.map((deal, i) => (
                  <DealCard key={deal.id} deal={deal} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* ── № 03 · Trending ──────────────────────────────────── */}
          {activeCategory === "all" && !search && !quickFilter && (
            <section className="mb-6">
              <div className="px-5">
                <SectionHead
                  num="03"
                  kicker={`Trending in ${activeCity?.name ?? "Your City"}`}
                  sub="Most talked about this week"
                />
              </div>
              <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
                {trendingBusinesses.map((biz, i) => (
                  <Link
                    key={biz.slug}
                    href={`/business/${biz.slug}`}
                    className="shrink-0 w-[170px] animate-slide-in press"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="rounded-2xl panel-editorial p-4 hover:border-gold/30 transition-colors h-full">
                      <div className="w-10 h-10 rounded-xl border border-gold/20 bg-ink flex items-center justify-center mb-3">
                        <Icon name={biz.iconName} size={18} className="text-gold" />
                      </div>
                      <h3 className="font-display text-[15px] leading-tight text-white truncate mb-0.5">
                        {biz.name}
                      </h3>
                      <p className="text-[10px] text-ivory/55 line-clamp-1 mb-2.5">{biz.tagline}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="font-display text-gold text-[18px] leading-none tabular-nums">
                          {biz.stat}
                        </span>
                        <span className="text-[9px] uppercase tracking-editorial-tight text-ivory/45 font-semibold">
                          {biz.statLabel}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── № 04 · Other Featured (horizontal scroller) ─────── */}
          {activeCategory === "all" && otherFeatured.length > 0 && !quickFilter && (
            <section className="mb-6">
              <div className="px-5">
                <SectionHead
                  num="04"
                  kicker="Featured Shops"
                  sub="Hand-picked local standouts"
                  meta={
                    <span className="text-[10px] font-bold tracking-editorial uppercase text-gold tabular-nums">
                      {otherFeatured.length} listed
                    </span>
                  }
                />
              </div>
              <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
                {otherFeatured.map((biz, i) => (
                  <FeaturedCard key={biz.id} biz={biz} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* ── № 05 · Promo Codes ────────────────────────────────── */}
          {activeCategory === "all" && !search && !quickFilter && (
            <section className="mb-6 px-5">
              <SectionHead num="05" kicker="Promo Codes" sub="Use at checkout" />
              <div className="space-y-2.5 stagger">
                {localDeals
                  .filter((d) => d.promoCode)
                  .map((deal) => (
                    <div
                      key={deal.id}
                      className="rounded-2xl panel-editorial p-3.5 hover:border-gold/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg border border-gold/20 bg-ink flex items-center justify-center shrink-0">
                          <Icon name={deal.iconName} size={16} className="text-gold" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-ivory/45 uppercase tracking-editorial-tight font-semibold truncate">
                            {deal.businessName}
                          </p>
                          <p className="font-display text-[14px] leading-tight text-white truncate">
                            {deal.title}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="px-2.5 py-1 rounded-lg bg-ink border border-gold/30 border-dashed">
                            <p className="text-[11px] font-bold text-gold font-mono tracking-wider">
                              {deal.promoCode}
                            </p>
                          </div>
                          <p className="text-[8px] text-ivory/40 mt-0.5 uppercase tracking-editorial-tight">
                            Valid til {deal.validUntil}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* ── № 06 · New Businesses ────────────────────────────── */}
          {activeCategory === "all" && !search && !quickFilter && newBusinesses.length > 0 && (
            <section className="mb-6">
              <div className="px-5">
                <SectionHead
                  num="06"
                  kicker={`New in ${activeCity?.name ?? "Your City"}`}
                  sub="Recently opened"
                  meta={
                    <Tag tone="coral" size="xs">Just opened</Tag>
                  }
                />
              </div>
              <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
                {newBusinesses.slice(0, 6).map((biz, i) => (
                  <FeaturedCard key={biz.id} biz={biz} index={i} isNew />
                ))}
              </div>
            </section>
          )}

          {/* ── № 07 · Shop by Values ────────────────────────────── */}
          {activeCategory === "all" && allBadges.length > 0 && !search && !quickFilter && (
            <section className="mb-6 px-5">
              <SectionHead num="07" kicker="Shop by Values" sub="City-certified labels" />
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {allBadges.map((badge) => {
                  const count = businesses.filter((b) => b.badges?.includes(badge)).length;
                  return (
                    <button
                      key={badge}
                      onClick={() => setSearch(badge.replace(/_/g, " "))}
                      className="shrink-0 rounded-xl panel-editorial px-3 py-2.5 flex items-center gap-2 press hover:border-gold/30 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-md border border-gold/20 bg-ink flex items-center justify-center shrink-0">
                        <Icon name={badgeIcons[badge] || "tag"} size={14} className="text-gold" />
                      </div>
                      <div className="text-left">
                        <p className="text-[11px] font-bold text-white leading-tight">
                          {formatBadgeLabel(badge)}
                        </p>
                        <p className="text-[9px] text-ivory/45 uppercase tracking-editorial-tight font-semibold">
                          {count} business{count !== 1 ? "es" : ""}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── № 08 · Browse by Category ───────────────────────── */}
          {activeCategory === "all" && !search && !quickFilter && (
            <section className="mb-6 px-5">
              <SectionHead num="08" kicker="Browse by Category" />
              <div className="grid grid-cols-2 gap-2.5">
                {categories
                  .filter((c) => c.value !== "all")
                  .map((cat) => {
                    const count = businesses.filter((b) => b.category === cat.value).length;
                    return (
                      <button
                        key={cat.value}
                        onClick={() => {
                          setActiveCategory(cat.value);
                          setQuickFilter(null);
                        }}
                        className="group rounded-xl panel-editorial p-3 flex items-center gap-3 press hover:border-gold/30 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-lg border border-gold/15 bg-ink flex items-center justify-center shrink-0 group-hover:border-gold/40 transition-colors">
                          <Icon name={cat.iconName} size={18} className="text-gold" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-[14px] leading-tight text-white truncate">
                            {cat.label}
                          </p>
                          <p className="text-[9px] text-ivory/45 uppercase tracking-editorial-tight font-semibold mt-0.5">
                            {count} listed
                          </p>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </section>
          )}

          {/* ── № 09 · Why Shop Local ─────────────────────────────── */}
          {activeCategory === "all" && !search && !quickFilter && (
            <section className="px-5 mb-6">
              <div className="rounded-2xl panel-editorial p-5">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl border border-gold/25 bg-ink flex items-center justify-center shrink-0">
                    <Icon name="heart-pulse" size={20} className="text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gold uppercase tracking-editorial font-bold mb-1">
                      Essay · Why Shop Local
                    </p>
                    <h3 className="font-display text-[18px] leading-tight text-white mb-2">
                      Every dollar is a vote for the block.
                    </h3>
                    <ul className="space-y-1.5">
                      <li className="flex items-start gap-2 text-[11px] text-ivory/70 leading-relaxed">
                        <span className="text-gold mt-1.5 block w-1 h-1 rounded-full bg-gold shrink-0" />
                        <span>68¢ of every $1 stays in {activeCity?.name ?? "your city"}</span>
                      </li>
                      <li className="flex items-start gap-2 text-[11px] text-ivory/70 leading-relaxed">
                        <span className="text-gold mt-1.5 block w-1 h-1 rounded-full bg-gold shrink-0" />
                        <span>Creates 2× more local jobs than chains</span>
                      </li>
                      <li className="flex items-start gap-2 text-[11px] text-ivory/70 leading-relaxed">
                        <span className="text-gold mt-1.5 block w-1 h-1 rounded-full bg-gold shrink-0" />
                        <span>Builds a stronger, self-sufficient community</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeCategory === "all" && !search && !quickFilter && (
            <div className="px-5 mb-5">
              <div className="divider-subtle" />
            </div>
          )}

          {/* ── № 10 · The Full Directory ───────────────────────── */}
          <section className="px-5">
            <SectionHead
              num="10"
              kicker={
                activeCategory === "all"
                  ? quickFilter === "top"
                    ? "Top Rated"
                    : quickFilter === "new"
                    ? "New Businesses"
                    : quickFilter === "black_owned"
                    ? "Black Owned"
                    : "The Directory"
                  : categories.find((c) => c.value === activeCategory)?.label ?? "Directory"
              }
              sub="All listings, alphabetical by relevance"
              meta={
                <span className="text-[10px] font-bold tracking-editorial uppercase text-gold tabular-nums">
                  {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                </span>
              }
            />

            <div className="space-y-3 stagger">
              {(activeCategory === "all" && !search && !quickFilter ? regular : filtered).map(
                (biz) => (
                  <BusinessRow key={biz.id} biz={biz} />
                )
              )}

              {/* Include the editors-pick and other featured back into "all" list
                  when no filter is applied, so the directory remains complete. */}
              {activeCategory === "all" && !search && !quickFilter && featured.length > 0 && (
                <>
                  {featured.map((biz) => (
                    <BusinessRow key={biz.id} biz={biz} />
                  ))}
                </>
              )}

              {filtered.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl border border-gold/20 bg-ink mx-auto mb-4 flex items-center justify-center">
                    <Icon name="search" size={28} className="text-gold/60" />
                  </div>
                  <p className="font-display text-[17px] text-white mb-1">No businesses found</p>
                  <p className="text-[11px] text-ivory/50">Try a different search or category</p>
                </div>
              )}
            </div>
          </section>

          {/* ── Promote / Own a Business CTAs ─────────────────────── */}
          <div className="px-5 mt-8 mb-3">
            <div className="rounded-2xl panel-editorial p-5 hover:border-gold/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl border border-gold/25 bg-ink flex items-center justify-center shrink-0">
                  <Icon name="megaphone" size={22} className="text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-[17px] leading-tight text-white">
                    Promote Your Business
                  </p>
                  <p className="text-[11px] text-ivory/55 mt-0.5">
                    Run deals, get featured & reach all of {activeCity?.name ?? "your city"}
                  </p>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-editorial-tight bg-gold text-midnight press">
                  Start
                  <Icon name="arrow-right-thin" size={11} />
                </span>
              </div>
            </div>
          </div>

          <div className="px-5 mb-4">
            <div className="rounded-2xl panel-editorial p-5 hover:border-gold/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl border border-gold/25 bg-ink flex items-center justify-center shrink-0">
                  <Icon name="store" size={22} className="text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-[17px] leading-tight text-white">
                    Own a Business in {activeCity?.name ?? "Your City"}?
                  </p>
                  <p className="text-[11px] text-ivory/55 mt-0.5">
                    Get listed, earn city badges & connect with customers
                  </p>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-editorial-tight bg-gold text-midnight press">
                  Apply
                  <Icon name="arrow-right-thin" size={11} />
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Deal Card (horizontal scroller)
// ---------------------------------------------------------------------------

function DealCard({ deal, index }: { deal: LocalDeal; index: number }) {
  return (
    <Link
      href={`/business/${deal.businessSlug}`}
      className="shrink-0 w-[220px] animate-slide-in press"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="rounded-2xl panel-editorial overflow-hidden hover:border-gold/30 transition-colors h-full">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg border border-gold/20 bg-ink flex items-center justify-center">
              <Icon name={deal.iconName} size={18} className="text-gold" />
            </div>
            <Tag tone="coral" size="xs">{deal.discount}</Tag>
          </div>

          <h3 className="font-display text-[15px] leading-tight text-white mb-1 line-clamp-2">
            {deal.title}
          </h3>
          <p className="text-[10px] text-ivory/55 mb-2 line-clamp-2 leading-relaxed">
            {deal.description}
          </p>

          <div className="flex items-center justify-between gap-2">
            <p className="text-[9px] text-ivory/45 uppercase tracking-editorial-tight font-semibold truncate">
              {deal.businessName}
            </p>
            <p className="text-[9px] text-ivory/45 font-semibold shrink-0 tabular-nums">
              {deal.validUntil}
            </p>
          </div>

          {deal.promoCode && (
            <div className="mt-3 px-2 py-1.5 rounded-md bg-ink border border-gold/30 border-dashed text-center">
              <span className="text-[10px] font-bold text-gold font-mono tracking-wider">
                {deal.promoCode}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Featured Card (horizontal scroller)
// ---------------------------------------------------------------------------

function FeaturedCard({ biz, index, isNew }: { biz: Business; index: number; isNew?: boolean }) {
  const iconName = categoryIcons[biz.category] ?? "store";

  return (
    <Link
      href={`/business/${biz.slug}`}
      className="shrink-0 w-[230px] animate-slide-in press"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="rounded-2xl panel-editorial overflow-hidden hover:border-gold/30 transition-colors h-full">
        {/* Image / Ink fallback */}
        <div className="aspect-video relative overflow-hidden bg-ink border-b border-white/[0.06]">
          {biz.image_urls?.[0] ? (
            <>
              <Image src={biz.image_urls[0]} alt={biz.name} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-xl border border-gold/20 bg-black/50 flex items-center justify-center">
                <Icon name={iconName} size={24} className="text-gold" />
              </div>
            </div>
          )}

          <div className="absolute top-2.5 left-2.5">
            <Tag tone={isNew ? "coral" : "gold"} size="xs">
              {isNew ? "New" : "Featured"}
            </Tag>
          </div>

          {biz.rating_avg > 0 && (
            <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-0.5 flex items-center gap-1 border border-gold/20">
              <Icon name="star" size={11} className="text-gold" />
              <span className="text-[10px] font-bold text-gold tabular-nums">
                {Number(biz.rating_avg).toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-display text-[15px] leading-tight text-white mb-0.5 truncate">
            {biz.name}
          </h3>
          <p className="text-[10px] text-ivory/55 mb-2.5 line-clamp-1 leading-relaxed">
            {biz.description}
          </p>

          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              <Tag tone="ghost" size="xs">{biz.category}</Tag>
              {biz.badges?.slice(0, 1).map((badge) => (
                <Tag
                  key={badge}
                  tone={isLocallyOwnedBadge(badge) ? "gold" : "default"}
                  size="xs"
                >
                  {formatBadgeLabel(badge)}
                </Tag>
              ))}
            </div>
            {(biz.accepts_orders || biz.accepts_bookings) && (
              <Tag tone="gold" size="xs">
                {biz.accepts_orders ? "Order" : "Book"}
              </Tag>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Business Row Card (list view)
// ---------------------------------------------------------------------------

function BusinessRow({ biz }: { biz: Business }) {
  const iconName = categoryIcons[biz.category] ?? "store";

  // Open-now logic (unchanged behavior)
  const dayShort = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const todayKey = dayShort[new Date().getDay()];
  const todayHours = biz.hours?.[todayKey];
  let isOpen = false;
  let hoursLabel = "";
  if (todayHours && typeof todayHours === "object" && "open" in todayHours && "close" in todayHours) {
    hoursLabel = `${todayHours.open} - ${todayHours.close}`;
    const parseT = (t: string) => {
      const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
      if (!m) return -1;
      let h = parseInt(m[1]);
      const mm = parseInt(m[2]);
      const ap = m[3]?.toUpperCase();
      if (ap === "PM" && h < 12) h += 12;
      if (ap === "AM" && h === 12) h = 0;
      return h * 60 + mm;
    };
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    const openMin = parseT(todayHours.open);
    const closeMin = parseT(todayHours.close);
    if (openMin >= 0 && closeMin >= 0) {
      isOpen = closeMin <= openMin
        ? (nowMin >= openMin || nowMin <= closeMin)
        : (nowMin >= openMin && nowMin <= closeMin);
    }
  }

  return (
    <Link
      href={`/business/${biz.slug}`}
      className="group block rounded-2xl panel-editorial press hover:border-gold/30 transition-colors overflow-hidden"
    >
      <div className="flex items-stretch">
        {/* Image / ink side panel with gold icon well */}
        <div className="w-[96px] shrink-0 relative bg-ink border-r border-white/[0.06] flex items-center justify-center">
          {biz.image_urls?.[0] ? (
            <Image src={biz.image_urls[0]} alt={biz.name} fill className="object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="w-11 h-11 rounded-xl border border-gold/20 bg-black/40 flex items-center justify-center">
                <Icon name={iconName} size={20} className="text-gold" />
              </div>
              <span className="text-[8px] font-bold uppercase tracking-editorial-tight text-gold/70">
                {biz.category}
              </span>
            </div>
          )}
          {biz.is_featured && (
            <div className="absolute top-2 left-2">
              <Tag tone="gold" size="xs">Featured</Tag>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 p-3.5">
          {/* Name + Rating */}
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <h3 className="font-display text-[17px] leading-tight text-white group-hover:text-gold transition-colors truncate">
              {biz.name}
            </h3>
            {biz.rating_avg > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                <Icon name="star" size={12} className="text-gold" />
                <span className="text-[11px] font-bold text-gold tabular-nums">
                  {Number(biz.rating_avg).toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Category · City meta */}
          <p className="text-[11px] text-ivory/55 mb-1.5 truncate">
            <span className="uppercase tracking-editorial-tight font-semibold">{biz.category}</span>
            {biz.city?.name && (
              <>
                <span className="mx-1.5 text-ivory/25">·</span>
                <span>{biz.city.name}</span>
              </>
            )}
          </p>

          {/* Description */}
          {biz.description && (
            <p className="text-[11px] text-ivory/50 mb-2 line-clamp-1 leading-relaxed">
              {biz.description}
            </p>
          )}

          {/* Status + Address row */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {hoursLabel && (
              <Tag tone={isOpen ? "emerald" : "coral"} size="xs">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isOpen ? "bg-emerald animate-pulse" : "bg-coral/60"
                  }`}
                />
                {isOpen ? "Open" : "Closed"}
              </Tag>
            )}
            {biz.address && (
              <span className="text-[9px] text-ivory/45 truncate inline-flex items-center gap-1">
                <Icon name="pin" size={10} className="text-gold/60" />
                {biz.address.split(",")[0]}
              </span>
            )}
          </div>

          {/* Tag row + CTA */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {biz.account_type === "ads_only" && (
              <Tag tone="ghost" size="xs">
                <Icon name="globe" size={9} />
                Chain
              </Tag>
            )}
            {biz.badges?.slice(0, 2).map((badge) => (
              <Tag
                key={badge}
                tone={isLocallyOwnedBadge(badge) ? "gold" : "default"}
                size="xs"
              >
                <Icon name={badgeIcons[badge] || "tag"} size={9} />
                {formatBadgeLabel(badge)}
              </Tag>
            ))}

            <span className="ml-auto shrink-0">
              {biz.accepts_orders || biz.accepts_bookings ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-editorial-tight bg-gold/15 text-gold group-hover:bg-gold group-hover:text-midnight transition-colors">
                  <Icon name={biz.accepts_orders ? "cart" : "calendar"} size={11} />
                  {biz.accepts_orders ? "Order" : "Book"}
                  <Icon name="arrow-right-thin" size={11} />
                </span>
              ) : (
                <Icon
                  name="arrow-right-thin"
                  size={14}
                  className="text-gold/60 group-hover:text-gold transition-colors"
                />
              )}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
