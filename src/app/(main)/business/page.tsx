"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import HeroBlock from "@/components/ui/editorial/HeroBlock";
import CityFilterChip from "@/components/ui/CityFilterChip";
import { createClient } from "@/lib/supabase/client";
import { useKnownCities } from "@/hooks/useActiveCity";
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
// Real deals shape — sourced from the `business_deals` table joined to
// `businesses`. The page only renders deals/promo codes/trending if real
// rows come back; no hardcoded placeholders.
// ---------------------------------------------------------------------------

interface RealDeal {
  id: string;
  business_id: string;
  business_name: string;
  business_slug: string;
  business_category: string;
  title: string;
  description: string;
  discount_label: string;
  promo_code: string | null;
  valid_until: string;
}

function formatValidUntil(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

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
        <span
          className="c-hero tabular-nums"
          style={{ fontSize: 22, lineHeight: 1, color: "var(--gold-c)" }}
        >
          № {num}
        </span>
        <span
          className="c-kicker"
          style={{ fontSize: 10, color: "var(--ink-strong)", opacity: 0.7 }}
        >
          {kicker}
        </span>
        <span className="ml-auto rule-hairline flex-1 self-center" />
        {meta && <span className="shrink-0">{meta}</span>}
      </div>
      {sub && (
        <p
          className="c-meta mt-1"
          style={{ fontSize: 11, color: "var(--ink-strong)", opacity: 0.6 }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BusinessPage() {
  const searchParams = useSearchParams();
  const cities = useKnownCities();
  const filterSlug = searchParams.get("city");
  const filterCity = useMemo(
    () => (filterSlug ? cities.find((c) => c.slug === filterSlug) ?? null : null),
    [filterSlug, cities],
  );
  const [activeCategory, setActiveCategory] = useState("all");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [deals, setDeals] = useState<RealDeal[]>([]);
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const supabase = createClient();

      // Fetch businesses with city join. Food businesses live on /food (Eat),
      // so exclude them here. Excludes both legacy `category='restaurant'` and
      // the broader `category='food'` plus anything self-identified as food
      // via `business_type='food'`.
      let query = supabase
        .from("businesses")
        .select("*, city:cities(id, slug, name)")
        .eq("is_published", true)
        .not("category", "in", "(restaurant,food,coffee,grocery)")
        .or("business_type.is.null,business_type.neq.food")
        .order("is_featured", { ascending: false })
        .order("rating_avg", { ascending: false });

      // Default scope = ALL cities. Listener narrows via the CityFilterChip
      // which writes ?city=<slug> into the URL.
      if (filterCity?.id) {
        query = query.eq("city_id", filterCity.id);
      }

      if (activeCategory !== "all") {
        query = query.eq("category", activeCategory);
      }

      // Real deals — current window, joined to the parent business so the
      // card can show a link + the business's name/category.
      const dealsQ = supabase
        .from("business_deals")
        .select(
          "id, business_id, title, description, discount_label, promo_code, valid_until, business:businesses!inner(id, name, slug, category, is_published)"
        )
        .eq("is_active", true)
        .lte("valid_from", new Date().toISOString())
        .gte("valid_until", new Date().toISOString())
        .order("valid_until", { ascending: true })
        .limit(24);

      const [bizR, dealsR] = await Promise.all([query, dealsQ]);
      setBusinesses((bizR.data as Business[]) ?? []);

      // Hydrate deals into a flat shape for rendering. Drop deals whose
      // parent business isn't published (RLS will already do this for
      // anonymous users, but keep the guard for service-role contexts).
      type JoinedBiz = {
        id: string;
        name: string;
        slug: string;
        category: string;
        is_published: boolean;
      };
      type DealRow = {
        id: string;
        business_id: string;
        title: string;
        description: string;
        discount_label: string;
        promo_code: string | null;
        valid_until: string;
        // Supabase client returns joined relations as either an object
        // or array depending on the relationship cardinality. We coerce
        // to the first row regardless.
        business: JoinedBiz | JoinedBiz[] | null;
      };
      const flatDeals: RealDeal[] = ((dealsR.data ?? []) as unknown as DealRow[])
        .map((d) => {
          const b = Array.isArray(d.business) ? d.business[0] : d.business;
          if (!b || !b.is_published) return null;
          return {
            id: d.id,
            business_id: d.business_id,
            business_name: b.name,
            business_slug: b.slug,
            business_category: b.category,
            title: d.title,
            description: d.description,
            discount_label: d.discount_label,
            promo_code: d.promo_code,
            valid_until: d.valid_until,
          } satisfies RealDeal;
        })
        .filter((x): x is RealDeal => x !== null);
      setDeals(flatDeals);
      setLoading(false);
    }
    fetchData();
  }, [activeCategory, filterCity?.id]);

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

  // Real "trending" — score by featured first, then activity signals
  // (vote_count, rating_count, rating_avg). Pulls from the same
  // businesses fetch so it always reflects the current city scope.
  const trending = useMemo(() => {
    return [...businesses]
      .map((b) => {
        const ratingScore = (b.rating_avg ?? 0) * Math.log((b.rating_count ?? 0) + 1);
        const featureBonus = b.is_featured ? 100 : 0;
        const voteScore = (b.vote_count ?? 0);
        return { biz: b, score: featureBonus + ratingScore + voteScore };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((x) => x.biz);
  }, [businesses]);

  const promoDeals = deals.filter((d) => !!d.promo_code);

  const allBadges = useMemo(() => {
    const set = new Set<string>();
    businesses.forEach((b) => b.badges?.forEach((badge) => set.add(badge)));
    return Array.from(set).sort();
  }, [businesses]);

  // ── Section numbering ───────────────────────────────────────
  // Compute which sections will render so we can number sequentially
  // (so the eye sees № 01 → № 02 → № 03 instead of № 01 → № 03 → № 07).
  const isHomeView = activeCategory === "all" && !search && !quickFilter;
  const showEditorsPick = isHomeView && !!editorsPick;
  const showDeals = (quickFilter === null || quickFilter === "deals") && deals.length > 0;
  const showTrending = isHomeView && trending.length > 0;
  const showFeatured = activeCategory === "all" && !quickFilter && otherFeatured.length > 0;
  const showPromos = isHomeView && promoDeals.length > 0;
  const showNew = isHomeView && newBusinesses.length > 0;
  const showValues = isHomeView && allBadges.length > 0;
  const showBrowseCats = isHomeView;

  // Counter that issues the next two-digit number when called.
  let _n = 0;
  const next = () => String(++_n).padStart(2, "0");
  const nEditors = showEditorsPick ? next() : null;
  const nDeals = showDeals ? next() : null;
  const nTrending = showTrending ? next() : null;
  const nFeatured = showFeatured ? next() : null;
  const nPromos = showPromos ? next() : null;
  const nNew = showNew ? next() : null;
  const nValues = showValues ? next() : null;
  const nBrowseCats = showBrowseCats ? next() : null;
  const nDirectory = next(); // always shown

  return (
    <div className="culture-surface min-h-dvh animate-fade-in pb-safe">
      <div
        className="px-[18px] pt-5 pb-4"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <div className="c-kicker" style={{ opacity: 0.65 }}>
          § VOL·01 · ISSUE COMMERCE · {filterCity?.name?.toUpperCase() ?? "EVERYWHERE"}
        </div>
        <h1
          className="c-hero mt-2"
          style={{ fontSize: 56, lineHeight: 0.88, letterSpacing: "-0.02em" }}
        >
          Commerce.
        </h1>
        <p className="c-serif-it mt-2 mb-4" style={{ fontSize: 13 }}>
          {filterCity
            ? `Shops, services & makers in ${filterCity.name}.`
            : "Every city, every category."}
        </p>
        <div className="mb-4"><CityFilterChip /></div>
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
            <div key={i} className="skeleton h-28" />
          ))}
        </div>
      ) : (
        <>
          {/* ── Editor's Pick (single featured spotlight) ── */}
          {showEditorsPick && nEditors && (
            <section className="px-5 mb-6">
              <SectionHead
                num={nEditors}
                kicker="Editor's Pick"
                sub="Spotlight from the local commerce desk"
              />
              <Link href={`/business/${editorsPick.slug}`} className="block press group">
                <HeroBlock
                  aspect="3/2"
                  image={editorsPick.image_urls?.[0] ?? null}
                  alt={editorsPick.name}
                >
                  <div className="absolute inset-x-0 bottom-0 p-5 z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="c-badge c-badge-gold">FEATURED</span>
                      <span
                        className="c-badge"
                        style={{
                          background: "rgba(0,0,0,0.5)",
                          color: "var(--gold-c)",
                          border: "1px solid rgba(212,175,55,0.4)",
                        }}
                      >
                        {editorsPick.category}
                      </span>
                      {editorsPick.rating_avg > 0 && (editorsPick.rating_count ?? 0) > 0 && (
                        <span
                          className="inline-flex items-center gap-1 tabular-nums"
                          style={{
                            fontFamily: "var(--font-archivo), Archivo, sans-serif",
                            fontWeight: 800,
                            fontSize: 11,
                            color: "var(--gold-c)",
                          }}
                        >
                          <Icon name="star" size={11} className="text-gold" />
                          {Number(editorsPick.rating_avg).toFixed(1)}
                        </span>
                      )}
                    </div>
                    <h3
                      className="c-hero mb-1.5 line-clamp-2"
                      style={{
                        fontSize: 30,
                        lineHeight: 0.95,
                        letterSpacing: "-0.012em",
                        color: "#fff",
                      }}
                    >
                      {editorsPick.name.toUpperCase()}.
                    </h3>
                    {editorsPick.description && (
                      <p
                        className="c-serif-it line-clamp-2 max-w-md mb-3"
                        style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}
                      >
                        {editorsPick.description}
                      </p>
                    )}
                    <span
                      className="c-badge c-badge-gold inline-flex items-center gap-1.5"
                      style={{ padding: "6px 12px", fontSize: 10 }}
                    >
                      {editorsPick.accepts_orders
                        ? "ORDER NOW"
                        : editorsPick.accepts_bookings
                        ? "BOOK"
                        : "VISIT"}
                      <Icon name="arrow-right-thin" size={11} />
                    </span>
                  </div>
                </HeroBlock>
              </Link>
            </section>
          )}

          {/* ── Today's Deals — real DB rows only ──────────── */}
          {showDeals && nDeals && (
            <section className="mb-6">
              <div className="px-5">
                <SectionHead
                  num={nDeals}
                  kicker="Today's Deals"
                  sub="Live promotions from local businesses"
                  meta={
                    <span className="c-badge c-badge-gold">
                      {deals.length} ACTIVE
                    </span>
                  }
                />
              </div>
              <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
                {deals.map((deal, i) => (
                  <DealCard key={deal.id} deal={deal} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* ── Trending — real biz scored by activity ─────── */}
          {showTrending && nTrending && (
            <section className="mb-6">
              <div className="px-5">
                <SectionHead
                  num={nTrending}
                  kicker={`Trending in ${filterCity?.name ?? "Your City"}`}
                  sub="Featured shops + most-rated this week"
                />
              </div>
              <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
                {trending.map((biz, i) => {
                  const iconName = categoryIcons[biz.category] ?? "store";
                  const cover = biz.image_urls?.[0];
                  return (
                    <Link
                      key={biz.id}
                      href={`/business/${biz.slug}`}
                      className="shrink-0 w-[200px] animate-slide-in press"
                      style={{ animationDelay: `${i * 80}ms` }}
                    >
                      <div
                        className="overflow-hidden h-full"
                        style={{
                          background: "var(--paper-warm)",
                          border: "2px solid var(--rule-strong-c)",
                        }}
                      >
                        <div
                          className="aspect-square relative overflow-hidden"
                          style={{
                            background: "var(--ink-strong)",
                            borderBottom: "2px solid var(--rule-strong-c)",
                          }}
                        >
                          {cover ? (
                            <Image src={cover} alt={biz.name} fill className="object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Icon name={iconName} size={28} style={{ color: "var(--gold-c)" }} />
                            </div>
                          )}
                          {biz.is_featured && (
                            <div className="absolute top-2 left-2">
                              <span className="c-badge c-badge-gold">FEATURED</span>
                            </div>
                          )}
                          {biz.rating_avg > 0 && (biz.rating_count ?? 0) > 0 && (
                            <div
                              className="absolute top-2 right-2 px-2 py-0.5 flex items-center gap-1"
                              style={{
                                background: "rgba(0,0,0,0.6)",
                                border: "1px solid rgba(212,175,55,0.35)",
                              }}
                            >
                              <Icon name="star" size={11} className="text-gold" />
                              <span
                                className="tabular-nums"
                                style={{
                                  fontFamily: "var(--font-archivo), Archivo, sans-serif",
                                  fontWeight: 800,
                                  fontSize: 10,
                                  color: "var(--gold-c)",
                                }}
                              >
                                {Number(biz.rating_avg).toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h3
                            className="c-card-t truncate"
                            style={{ fontSize: 14, color: "var(--ink-strong)" }}
                          >
                            {biz.name}
                          </h3>
                          <p
                            className="c-kicker mt-0.5"
                            style={{
                              fontSize: 9,
                              color: "var(--ink-strong)",
                              opacity: 0.65,
                              letterSpacing: "0.14em",
                            }}
                          >
                            {biz.category}
                            {biz.city?.name && (
                              <>
                                <span className="mx-1.5" style={{ opacity: 0.5 }}>·</span>
                                <span style={{ textTransform: "none", letterSpacing: 0 }}>
                                  {biz.city.name}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Featured Shops (horizontal scroller) ─────── */}
          {showFeatured && nFeatured && (
            <section className="mb-6">
              <div className="px-5">
                <SectionHead
                  num={nFeatured}
                  kicker="Featured Shops"
                  sub="Hand-picked local standouts"
                  meta={
                    <span className="c-badge c-badge-gold tabular-nums">
                      {otherFeatured.length} LISTED
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

          {/* ── Promo Codes — real DB only ──────────────────── */}
          {showPromos && nPromos && (
            <section className="mb-6 px-5">
              <SectionHead
                num={nPromos}
                kicker="Promo Codes"
                sub="Tap to copy, then use at checkout"
              />
              <div className="space-y-2.5 stagger">
                {promoDeals.map((deal) => {
                  const iconName = categoryIcons[deal.business_category] ?? "store";
                  return (
                    <Link
                      key={deal.id}
                      href={`/business/${deal.business_slug}`}
                      className="block press"
                    >
                      <div
                        className="p-3.5 transition-colors"
                        style={{
                          background: "var(--paper-warm)",
                          border: "2px solid var(--rule-strong-c)",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 flex items-center justify-center shrink-0"
                            style={{ background: "var(--ink-strong)" }}
                          >
                            <Icon name={iconName} size={16} style={{ color: "var(--gold-c)" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className="c-kicker truncate"
                              style={{
                                fontSize: 9,
                                letterSpacing: "0.16em",
                                color: "var(--ink-strong)",
                                opacity: 0.65,
                              }}
                            >
                              {deal.business_name}
                            </p>
                            <p
                              className="c-card-t truncate"
                              style={{
                                fontSize: 14,
                                color: "var(--ink-strong)",
                                lineHeight: 1.15,
                                marginTop: 2,
                              }}
                            >
                              {deal.title}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <div
                              className="px-2.5 py-1"
                              style={{
                                background: "var(--paper)",
                                border: "2px dashed var(--rule-strong-c)",
                              }}
                            >
                              <p
                                className="font-mono tabular-nums"
                                style={{
                                  fontSize: 11,
                                  fontWeight: 800,
                                  letterSpacing: "0.08em",
                                  color: "var(--gold-c)",
                                }}
                              >
                                {deal.promo_code}
                              </p>
                            </div>
                            <p
                              className="c-kicker mt-1"
                              style={{
                                fontSize: 9,
                                letterSpacing: "0.14em",
                                color: "var(--ink-strong)",
                                opacity: 0.55,
                              }}
                            >
                              VALID TIL {formatValidUntil(deal.valid_until).toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── New Businesses ────────────────────────────── */}
          {showNew && nNew && (
            <section className="mb-6">
              <div className="px-5">
                <SectionHead
                  num={nNew}
                  kicker={`New in ${filterCity?.name ?? "Your City"}`}
                  sub="Recently opened"
                  meta={
                    <span
                      className="c-badge"
                      style={{ background: "var(--red-c, #c0392b)", color: "#fff" }}
                    >
                      JUST OPENED
                    </span>
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

          {/* ── Shop by Values ────────────────────────────── */}
          {showValues && nValues && (
            <section className="mb-6 px-5">
              <SectionHead num={nValues} kicker="Shop by Values" sub="City-certified labels" />
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {allBadges.map((badge) => {
                  const count = businesses.filter((b) => b.badges?.includes(badge)).length;
                  return (
                    <button
                      key={badge}
                      onClick={() => setSearch(badge.replace(/_/g, " "))}
                      className="shrink-0 px-3 py-2.5 flex items-center gap-2 press transition-colors"
                      style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
                    >
                      <div className="w-7 h-7 flex items-center justify-center shrink-0" style={{ background: "var(--ink-strong)" }}>
                        <Icon name={badgeIcons[badge] || "tag"} size={14} style={{ color: "var(--gold-c)" }} />
                      </div>
                      <div className="text-left">
                        <p
                          className="c-card-t"
                          style={{ fontSize: 12, color: "var(--ink-strong)", lineHeight: 1.15 }}
                        >
                          {formatBadgeLabel(badge)}
                        </p>
                        <p
                          className="c-kicker"
                          style={{
                            fontSize: 9,
                            letterSpacing: "0.14em",
                            color: "var(--ink-strong)",
                            opacity: 0.6,
                          }}
                        >
                          {count} BUSINESS{count !== 1 ? "ES" : ""}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Browse by Category ───────────────────────── */}
          {showBrowseCats && nBrowseCats && (
            <section className="mb-6 px-5">
              <SectionHead num={nBrowseCats} kicker="Browse by Category" />
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
                        className="group p-3 flex items-center gap-3 press transition-colors text-left"
                        style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
                      >
                        <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ background: "var(--ink-strong)" }}>
                          <Icon name={cat.iconName} size={18} style={{ color: "var(--gold-c)" }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className="c-card-t truncate"
                            style={{ fontSize: 14, color: "var(--ink-strong)", lineHeight: 1.15 }}
                          >
                            {cat.label}
                          </p>
                          <p
                            className="c-kicker mt-0.5"
                            style={{
                              fontSize: 9,
                              letterSpacing: "0.14em",
                              color: "var(--ink-strong)",
                              opacity: 0.6,
                            }}
                          >
                            {count} LISTED
                          </p>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </section>
          )}

          {isHomeView && (
            <div className="px-5 mb-5">
              <div className="divider-subtle" />
            </div>
          )}

          {/* ── The Full Directory ───────────────────────── */}
          <section className="px-5">
            <SectionHead
              num={nDirectory}
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
                <span className="c-badge c-badge-gold tabular-nums">
                  {filtered.length} RESULT{filtered.length !== 1 ? "S" : ""}
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
                  <div
                    className="w-16 h-16 mx-auto mb-4 flex items-center justify-center"
                    style={{ background: "var(--ink-strong)" }}
                  >
                    <Icon name="search" size={28} style={{ color: "var(--gold-c)" }} />
                  </div>
                  <p
                    className="c-card-t mb-1"
                    style={{ fontSize: 16, color: "var(--ink-strong)" }}
                  >
                    NO BUSINESSES FOUND
                  </p>
                  <p
                    className="c-meta"
                    style={{ fontSize: 12, color: "var(--ink-strong)", opacity: 0.65 }}
                  >
                    Try a different search or category
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ── Promote / Own a Business CTAs ─────────────────────── */}
          <div className="px-5 mt-8 mb-3">
            <div className="p-5 transition-colors" style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ background: "var(--ink-strong)" }}>
                  <Icon name="megaphone" size={22} style={{ color: "var(--gold-c)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="c-card-t leading-tight"
                    style={{ fontSize: 15, color: "var(--ink-strong)" }}
                  >
                    PROMOTE YOUR BUSINESS
                  </p>
                  <p
                    className="c-serif-it mt-0.5"
                    style={{ fontSize: 12, color: "var(--ink-strong)", opacity: 0.7 }}
                  >
                    Run deals, get featured &amp; reach all of {filterCity?.name ?? "your city"}
                  </p>
                </div>
                <span className="shrink-0 c-badge c-badge-gold inline-flex items-center gap-1 press">
                  START
                  <Icon name="arrow-right-thin" size={11} />
                </span>
              </div>
            </div>
          </div>

          <div className="px-5 mb-4">
            <div className="p-5 transition-colors" style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ background: "var(--ink-strong)" }}>
                  <Icon name="store" size={22} style={{ color: "var(--gold-c)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="c-card-t leading-tight"
                    style={{ fontSize: 15, color: "var(--ink-strong)" }}
                  >
                    OWN A BUSINESS IN {(filterCity?.name ?? "Your City").toUpperCase()}?
                  </p>
                  <p
                    className="c-serif-it mt-0.5"
                    style={{ fontSize: 12, color: "var(--ink-strong)", opacity: 0.7 }}
                  >
                    Get listed, earn city badges &amp; connect with customers
                  </p>
                </div>
                <span className="shrink-0 c-badge c-badge-gold inline-flex items-center gap-1 press">
                  APPLY
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

function DealCard({ deal, index }: { deal: RealDeal; index: number }) {
  const iconName = categoryIcons[deal.business_category] ?? "store";
  return (
    <Link
      href={`/business/${deal.business_slug}`}
      className="shrink-0 w-[220px] animate-slide-in press"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div
        className="overflow-hidden h-full"
        style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div
              className="w-10 h-10 flex items-center justify-center"
              style={{ background: "var(--ink-strong)" }}
            >
              <Icon name={iconName} size={18} style={{ color: "var(--gold-c)" }} />
            </div>
            <span className="c-badge c-badge-gold">{deal.discount_label}</span>
          </div>

          <h3
            className="c-card-t mb-1 line-clamp-2"
            style={{ fontSize: 14, lineHeight: 1.2, color: "var(--ink-strong)" }}
          >
            {deal.title}
          </h3>
          <p
            className="c-body mb-3 line-clamp-2"
            style={{ fontSize: 12, lineHeight: 1.45, color: "var(--ink-strong)", opacity: 0.75 }}
          >
            {deal.description}
          </p>

          <div className="flex items-center justify-between gap-2">
            <p
              className="c-kicker truncate"
              style={{
                fontSize: 9,
                letterSpacing: "0.16em",
                color: "var(--ink-strong)",
                opacity: 0.65,
              }}
            >
              {deal.business_name}
            </p>
            <p
              className="c-kicker shrink-0 tabular-nums"
              style={{
                fontSize: 9,
                letterSpacing: "0.14em",
                color: "var(--ink-strong)",
                opacity: 0.55,
              }}
            >
              {formatValidUntil(deal.valid_until).toUpperCase()}
            </p>
          </div>

          {deal.promo_code && (
            <div
              className="mt-3 px-2 py-1.5 text-center"
              style={{
                background: "var(--paper)",
                border: "2px dashed var(--rule-strong-c)",
              }}
            >
              <span
                className="font-mono"
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  color: "var(--gold-c)",
                }}
              >
                {deal.promo_code}
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
      <div className="overflow-hidden h-full" style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}>
        {/* Image fallback */}
        <div className="aspect-video relative overflow-hidden" style={{ background: "var(--ink-strong)", borderBottom: "2px solid var(--rule-strong-c)" }}>
          {biz.image_urls?.[0] ? (
            <>
              <Image src={biz.image_urls[0]} alt={biz.name} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon name={iconName} size={32} style={{ color: "var(--gold-c)" }} />
            </div>
          )}

          <div className="absolute top-2.5 left-2.5">
            {isNew ? (
              <span
                className="c-badge"
                style={{ background: "var(--red-c, #c0392b)", color: "#fff" }}
              >
                NEW
              </span>
            ) : (
              <span className="c-badge c-badge-gold">FEATURED</span>
            )}
          </div>

          {biz.rating_avg > 0 && (biz.rating_count ?? 0) > 0 && (
            <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-sm px-2 py-0.5 flex items-center gap-1 border border-gold/20">
              <Icon name="star" size={11} className="text-gold" />
              <span
                className="tabular-nums"
                style={{
                  fontFamily: "var(--font-archivo), Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: 10,
                  color: "var(--gold-c)",
                }}
              >
                {Number(biz.rating_avg).toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3
            className="c-card-t mb-0.5 truncate"
            style={{ fontSize: 14, color: "var(--ink-strong)", lineHeight: 1.15 }}
          >
            {biz.name}
          </h3>
          <p
            className="c-body mb-2.5 line-clamp-1"
            style={{ fontSize: 12, lineHeight: 1.4, color: "var(--ink-strong)", opacity: 0.75 }}
          >
            {biz.description}
          </p>

          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              <span
                className="c-badge"
                style={{
                  background: "var(--paper)",
                  color: "var(--ink-strong)",
                  border: "1px solid var(--rule-strong-c)",
                }}
              >
                {biz.category.toUpperCase()}
              </span>
              {biz.badges?.slice(0, 1).map((badge) => (
                <span
                  key={badge}
                  className={isLocallyOwnedBadge(badge) ? "c-badge c-badge-gold" : "c-badge c-badge-ink"}
                >
                  {formatBadgeLabel(badge).toUpperCase()}
                </span>
              ))}
            </div>
            {(biz.accepts_orders || biz.accepts_bookings) && (
              <span className="c-badge c-badge-gold">
                {biz.accepts_orders ? "ORDER" : "BOOK"}
              </span>
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
      className="group block press transition-colors overflow-hidden"
      style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
    >
      <div className="flex items-stretch">
        {/* Image / ink side panel with gold icon well */}
        <div className="w-[96px] shrink-0 relative flex items-center justify-center" style={{ background: "var(--ink-strong)", borderRight: "2px solid var(--rule-strong-c)" }}>
          {biz.image_urls?.[0] ? (
            <Image src={biz.image_urls[0]} alt={biz.name} fill className="object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Icon name={iconName} size={24} style={{ color: "var(--gold-c)" }} />
              <span className="text-[8px] font-bold uppercase tracking-editorial-tight" style={{ color: "var(--gold-c)" }}>
                {biz.category}
              </span>
            </div>
          )}
          {biz.is_featured && (
            <div className="absolute top-2 left-2">
              <span className="c-badge c-badge-gold">FEATURED</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 p-3.5">
          {/* Name + Rating */}
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <h3
              className="c-card-t group-hover:text-gold transition-colors truncate"
              style={{ fontSize: 16, color: "var(--ink-strong)", lineHeight: 1.15 }}
            >
              {biz.name}
            </h3>
            {biz.rating_avg > 0 && (biz.rating_count ?? 0) > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                <Icon name="star" size={12} className="text-gold" />
                <span
                  className="tabular-nums"
                  style={{
                    fontFamily: "var(--font-archivo), Archivo, sans-serif",
                    fontWeight: 800,
                    fontSize: 11,
                    color: "var(--gold-c)",
                  }}
                >
                  {Number(biz.rating_avg).toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Category · City meta */}
          <p
            className="c-kicker mb-1.5 truncate"
            style={{
              fontSize: 9,
              letterSpacing: "0.16em",
              color: "var(--ink-strong)",
              opacity: 0.7,
            }}
          >
            {biz.category.toUpperCase()}
            {biz.city?.name && (
              <>
                <span className="mx-1.5" style={{ opacity: 0.5 }}>·</span>
                <span style={{ textTransform: "none", letterSpacing: 0 }}>
                  {biz.city.name}
                </span>
              </>
            )}
          </p>

          {/* Description */}
          {biz.description && (
            <p
              className="c-body mb-2 line-clamp-1"
              style={{
                fontSize: 12,
                lineHeight: 1.4,
                color: "var(--ink-strong)",
                opacity: 0.75,
              }}
            >
              {biz.description}
            </p>
          )}

          {/* Status + Address row */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {hoursLabel && (
              <span
                className={isOpen ? "c-badge c-badge-ok" : "c-badge c-badge-live"}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    isOpen ? "bg-white animate-pulse" : "bg-white/70"
                  }`}
                />
                {isOpen ? "OPEN" : "CLOSED"}
              </span>
            )}
            {biz.address && (
              <span
                className="c-kicker truncate inline-flex items-center gap-1"
                style={{
                  fontSize: 9,
                  letterSpacing: "0.12em",
                  color: "var(--ink-strong)",
                  opacity: 0.65,
                }}
              >
                <Icon name="pin" size={10} className="text-gold/60" />
                <span style={{ textTransform: "none", letterSpacing: 0 }}>
                  {biz.address.split(",")[0]}
                </span>
              </span>
            )}
          </div>

          {/* Tag row + CTA */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {biz.account_type === "ads_only" && (
              <span
                className="c-badge"
                style={{
                  background: "var(--paper)",
                  color: "var(--ink-strong)",
                  border: "1px solid var(--rule-strong-c)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Icon name="globe" size={9} />
                CHAIN
              </span>
            )}
            {biz.badges?.slice(0, 2).map((badge) => (
              <span
                key={badge}
                className={
                  isLocallyOwnedBadge(badge) ? "c-badge c-badge-gold" : "c-badge c-badge-ink"
                }
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <Icon name={badgeIcons[badge] || "tag"} size={9} />
                {formatBadgeLabel(badge).toUpperCase()}
              </span>
            ))}

            <span className="ml-auto shrink-0">
              {biz.accepts_orders || biz.accepts_bookings ? (
                <span
                  className="c-badge c-badge-gold inline-flex items-center gap-1.5"
                  style={{ padding: "5px 10px", fontSize: 9 }}
                >
                  <Icon name={biz.accepts_orders ? "cart" : "calendar"} size={10} />
                  {biz.accepts_orders ? "ORDER" : "BOOK"}
                  <Icon name="arrow-right-thin" size={10} />
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
