"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Chip from "@/components/ui/Chip";
import Badge from "@/components/ui/Badge";
import EditorialHeader from "@/components/ui/EditorialHeader";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/client";
import { useActiveCity } from "@/hooks/useActiveCity";
import type { Business, FoodSpecial, FoodPromotion } from "@/types/database";
import CityOwnershipFilter, {
  DEFAULT_OWNERSHIP_OPTIONS,
  type CityOption,
} from "@/components/filters/CityOwnershipFilter";

// ---------------------------------------------------------------------------
// Category config
// ---------------------------------------------------------------------------

const categories: { label: string; value: string; iconName: IconName; color: string }[] = [
  { label: "All", value: "all", iconName: "store", color: "#F2A900" },
  { label: "Barber", value: "barber", iconName: "scissors", color: "#8B5CF6" },
  { label: "Retail", value: "retail", iconName: "shopping", color: "#3B82F6" },
  { label: "Services", value: "services", iconName: "wrench", color: "#06B6D4" },
  { label: "Auto", value: "auto", iconName: "car", color: "#EF4444" },
  { label: "Health", value: "health", iconName: "heart-pulse", color: "#22C55E" },
  { label: "Beauty", value: "beauty", iconName: "sparkle", color: "#FF006E" },
  { label: "Entertainment", value: "entertainment", iconName: "theater", color: "#F2A900" },
];

const categoryColors: Record<string, string> = {
  barber: "#8B5CF6",
  retail: "#3B82F6",
  services: "#06B6D4",
  auto: "#EF4444",
  health: "#22C55E",
  beauty: "#FF006E",
  entertainment: "#F2A900",
  restaurant: "#FF6B6B",
  other: "#9E9A93",
};

const categoryBadgeVariant: Record<string, "purple" | "blue" | "cyan" | "coral" | "emerald" | "pink" | "gold"> = {
  barber: "purple",
  retail: "blue",
  services: "cyan",
  auto: "coral",
  health: "emerald",
  beauty: "pink",
  entertainment: "gold",
  other: "gold",
};

const categoryArt: Record<string, string> = {
  barber: "art-classic",
  retail: "art-city",
  services: "art-aviation",
  auto: "art-school3",
  health: "art-school1",
  beauty: "art-mural",
  entertainment: "art-stream",
  other: "art-city",
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

const badgeVariants: Record<string, "gold" | "emerald" | "cyan" | "pink" | "purple" | "coral" | "blue"> = {
  black_owned: "gold",
  woman_owned: "pink",
  veteran_owned: "emerald",
  lgbtq_friendly: "purple",
  family_owned: "cyan",
  eco_friendly: "emerald",
  city_certified: "gold",
  local_favorite: "gold",
  new_business: "coral",
  compton_original: "gold",
};

function formatBadgeLabel(badge: string): string {
  return badge.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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
    businessName: "Knect Fitness",
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
  { name: "Knect Fitness", slug: "hub-city-fitness", category: "health", tagline: "Where Compton gets strong", iconName: "heart-pulse", stat: "1.2K", statLabel: "members" },
  { name: "Glow Up Beauty", slug: "glow-up-beauty", category: "beauty", tagline: "Look good, feel good", iconName: "sparkle", stat: "4.9", statLabel: "rating" },
  { name: "Compton Auto Care", slug: "compton-auto-care", category: "auto", tagline: "Trusted since 2005", iconName: "wrench", stat: "18yrs", statLabel: "serving" },
];

const quickActions: { label: string; iconName: IconName; filter: string; color: string }[] = [
  { label: "Deals", iconName: "flame", filter: "deals", color: "#EF4444" },
  { label: "New", iconName: "sparkle", filter: "new", color: "#8B5CF6" },
  { label: "Top Rated", iconName: "star", filter: "top", color: "#F2A900" },
  { label: "Black Owned", iconName: "verified", filter: "black_owned", color: "#22C55E" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BusinessPage() {
  const activeCity = useActiveCity();
  const [activeCategory, setActiveCategory] = useState("all");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedOwnership, setSelectedOwnership] = useState<string[]>([]);
  const [specials, setSpecials] = useState<FoodSpecial[]>([]);
  const [promotions, setPromotions] = useState<FoodPromotion[]>([]);
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load cities once
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("cities")
      .select("slug, name, launch_status")
      .eq("launch_status", "live")
      .order("name")
      .then(({ data }) => {
        if (data) setCities(data.map((c) => ({ slug: c.slug, name: c.name })));
      });
  }, []);

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

      // Also fetch any active food_specials and food_promotions (some may be for non-restaurant businesses)
      const [{ data: sData }, { data: pData }] = await Promise.all([
        supabase
          .from("food_specials")
          .select("*, business:businesses(id, name, slug, image_urls, category)")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("food_promotions")
          .select("*, business:businesses(id, name, slug, image_urls, category)")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      setSpecials((sData as FoodSpecial[]) ?? []);
      setPromotions((pData as FoodPromotion[]) ?? []);
      setLoading(false);
    }
    fetchData();
  }, [activeCategory, activeCity?.id]);

  const filtered = useMemo(() => {
    let result = businesses;

    // City filter (empty = all)
    if (selectedCities.length > 0) {
      result = result.filter((b) => b.city?.slug && selectedCities.includes(b.city.slug));
    }

    // Ownership filter (empty = all; match ANY selected badge)
    if (selectedOwnership.length > 0) {
      result = result.filter((b) =>
        selectedOwnership.some((badge) => b.badges?.includes(badge))
      );
    }

    // Quick filter
    if (quickFilter === "new") {
      result = result.filter((b) => b.badges?.includes("new_business"));
    } else if (quickFilter === "top") {
      result = result.filter((b) => b.rating_avg >= 4.5);
    } else if (quickFilter === "black_owned") {
      result = result.filter((b) => b.badges?.includes("black_owned"));
    }
    // "deals" filter shows all businesses but highlights the deals section

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
  }, [businesses, search, quickFilter, selectedCities, selectedOwnership]);

  const featured = filtered.filter((b) => b.is_featured);
  const regular = filtered.filter((b) => !b.is_featured);
  const newBusinesses = businesses.filter((b) => b.badges?.includes("new_business"));
  const totalCount = businesses.length;

  // Unique badges across all loaded businesses
  const allBadges = useMemo(() => {
    const set = new Set<string>();
    businesses.forEach((b) => b.badges?.forEach((badge) => set.add(badge)));
    return Array.from(set).sort();
  }, [businesses]);

  // Check if it's "today" for deals
  const dayOfWeek = new Date().toLocaleDateString("en-US", { weekday: "long" });

  return (
    <div className="animate-fade-in pb-safe">
      {/* ── Cinematic Hero ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/12 via-deep to-hc-purple/8" />
        <div className="absolute inset-0 pattern-dots opacity-30" />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-midnight to-transparent" />

        <div className="relative z-10 px-5 pt-6 pb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center">
              <Icon name="store" size={18} className="text-gold" />
            </div>
            <p className="text-[10px] text-gold font-bold uppercase tracking-[0.2em]">Shop Local</p>
          </div>

          <h1 className="font-display text-[28px] font-bold leading-tight mb-1">
            Local <span className="text-gold-gradient">Businesses</span>
          </h1>
          <p className="text-sm text-txt-secondary mb-5">
            {selectedCities.length === 1
              ? `${cities.find((c) => c.slug === selectedCities[0])?.name || "Your city"} — filter by category or ownership.`
              : "Every city, every category — filter by ownership and more."}
          </p>

          {/* Quick Action Pills */}
          <div className="flex gap-2">
            {quickActions.map((action) => (
              <button
                key={action.filter}
                onClick={() => setQuickFilter(quickFilter === action.filter ? null : action.filter)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all press"
                style={{
                  background: quickFilter === action.filter ? `${action.color}20` : "rgba(22,22,24,0.7)",
                  borderColor: quickFilter === action.filter ? `${action.color}40` : "rgba(255,255,255,0.06)",
                }}
              >
                <Icon name={action.iconName} size={14} style={{ color: quickFilter === action.filter ? action.color : undefined }} />
                <span className="text-[11px] font-bold" style={{ color: quickFilter === action.filter ? action.color : undefined }}>
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stats Strip ── */}
      <div className="px-5 mb-5">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Businesses", value: totalCount || "50+", color: "#F2A900" },
            { label: "Categories", value: categories.length - 1, color: "#8B5CF6" },
            { label: "City Badges", value: allBadges.length || "10", color: "#22C55E" },
            { label: "Deals", value: localDeals.length, color: "#EF4444" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl bg-card border border-border-subtle p-2.5 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: stat.color }} />
              <p className="font-heading font-bold text-base leading-none mb-0.5" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-[8px] text-txt-secondary font-semibold uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── City + Ownership Filter ── */}
      <div className="mb-5">
        <CityOwnershipFilter
          cities={cities}
          selectedCities={selectedCities}
          onCityToggle={(slug) =>
            setSelectedCities((prev) =>
              prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
            )
          }
          onClearCities={() => setSelectedCities([])}
          ownership={DEFAULT_OWNERSHIP_OPTIONS}
          selectedOwnership={selectedOwnership}
          onOwnershipToggle={(badge) =>
            setSelectedOwnership((prev) =>
              prev.includes(badge) ? prev.filter((b) => b !== badge) : [...prev, badge]
            )
          }
        />
      </div>

      {/* ── Today's Deals & Specials ── */}
      {(quickFilter === null || quickFilter === "deals") && (
        <section className="mb-6">
          <div className="px-5 flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full bg-compton-red" />
            <h2 className="font-heading font-bold text-base">Today&apos;s Deals</h2>
            <div className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-compton-red/10 border border-compton-red/20">
              <Icon name="flame" size={10} className="text-compton-red" />
              <span className="text-[9px] font-bold text-compton-red">{localDeals.length} active</span>
            </div>
          </div>
          <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
            {localDeals.map((deal, i) => (
              <DealCard key={deal.id} deal={deal} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ── Trending ── */}
      {activeCategory === "all" && !search && !quickFilter && (
        <section className="mb-6">
          <div className="px-5 flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full bg-gold" />
            <h2 className="font-heading font-bold text-base">Trending in {activeCity?.name ?? "your city"}</h2>
            <span className="text-[10px] text-txt-secondary ml-auto flex items-center gap-1"><Icon name="trending" size={10} /> This week</span>
          </div>
          <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
            {trendingBusinesses.map((biz, i) => (
              <Link
                key={biz.slug}
                href={`/business/${biz.slug}`}
                className="shrink-0 w-[160px] animate-slide-in press"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="rounded-2xl bg-card border border-border-subtle p-3.5 hover:border-gold/20 transition-colors relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: categoryColors[biz.category] || "#F2A900" }} />
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5" style={{ background: `${categoryColors[biz.category]}15` }}>
                    <Icon name={biz.iconName} size={20} style={{ color: categoryColors[biz.category] }} />
                  </div>
                  <h3 className="font-heading font-bold text-[12px] mb-0.5 truncate">{biz.name}</h3>
                  <p className="text-[10px] text-txt-secondary mb-2 line-clamp-1">{biz.tagline}</p>
                  <div className="flex items-center gap-1">
                    <span className="font-heading font-bold text-sm" style={{ color: categoryColors[biz.category] }}>{biz.stat}</span>
                    <span className="text-[9px] text-txt-secondary">{biz.statLabel}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Search Bar ── */}
      <div className="px-5 mb-4">
        <div className="flex items-center gap-3 bg-surface border border-border-subtle rounded-2xl px-4 py-3 focus-within:border-gold/30 transition-all">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-txt-secondary shrink-0">
            <circle cx="8" cy="8" r="5" />
            <path d="M12 12l4 4" />
          </svg>
          <input
            type="text"
            placeholder="Search businesses, badges, services..."
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
            icon={<Icon name={cat.iconName} size={14} />}
            active={activeCategory === cat.value}
            onClick={() => { setActiveCategory(cat.value); setQuickFilter(null); }}
          />
        ))}
      </div>

      {loading ? (
        <div className="px-5 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* ── Featured Businesses (horizontal scroller) ── */}
          {activeCategory === "all" && featured.length > 0 && !quickFilter && (
            <section className="mb-6">
              <div className="px-5 flex items-center gap-2 mb-3">
                <EditorialHeader kicker="SHOP LOCAL" title="Featured" />
                <span className="text-xs text-txt-secondary ml-auto">{featured.length} businesses</span>
              </div>
              <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
                {featured.map((biz, i) => (
                  <FeaturedCard key={biz.id} biz={biz} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* ── Promo Codes & Offers ── */}
          {activeCategory === "all" && !search && !quickFilter && (
            <section className="mb-6 px-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 rounded-full bg-hc-purple" />
                <h2 className="font-heading font-bold text-base">Promo Codes</h2>
                <span className="text-[10px] text-txt-secondary ml-auto">Use at checkout</span>
              </div>
              <div className="space-y-2.5">
                {localDeals.filter((d) => d.promoCode).map((deal) => (
                  <div
                    key={deal.id}
                    className="rounded-xl bg-card border border-border-subtle p-3.5 relative overflow-hidden hover:border-hc-purple/20 transition-colors"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl" style={{ background: categoryColors[deal.category] }} />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${categoryColors[deal.category]}15` }}>
                        <Icon name={deal.iconName} size={18} style={{ color: categoryColors[deal.category] }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-txt-secondary">{deal.businessName}</p>
                        <p className="text-[12px] font-bold truncate">{deal.title}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="px-2.5 py-1 rounded-lg bg-hc-purple/10 border border-hc-purple/20 border-dashed">
                          <p className="text-[11px] font-bold text-hc-purple font-mono tracking-wider">{deal.promoCode}</p>
                        </div>
                        <p className="text-[8px] text-txt-secondary mt-0.5">Valid til {deal.validUntil}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── New ── */}
          {activeCategory === "all" && !search && !quickFilter && newBusinesses.length > 0 && (
            <section className="mb-6">
              <div className="px-5 flex items-center gap-2 mb-3">
                <div className="w-1 h-5 rounded-full bg-coral" />
                <h2 className="font-heading font-bold text-base">New in {activeCity?.name ?? "your city"}</h2>
                <div className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-coral/10 border border-coral/20">
                  <span className="text-[9px] font-bold text-coral">Just opened</span>
                </div>
              </div>
              <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
                {newBusinesses.slice(0, 6).map((biz, i) => (
                  <FeaturedCard key={biz.id} biz={biz} index={i} isNew />
                ))}
              </div>
            </section>
          )}

          {/* ── City Badges Showcase ── */}
          {activeCategory === "all" && allBadges.length > 0 && !search && !quickFilter && (
            <section className="mb-6 px-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 rounded-full bg-emerald" />
                <h2 className="font-heading font-bold text-base">Shop by Values</h2>
                <span className="text-[10px] text-txt-secondary ml-auto">City-certified</span>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {allBadges.map((badge) => {
                  const count = businesses.filter((b) => b.badges?.includes(badge)).length;
                  return (
                    <button
                      key={badge}
                      onClick={() => setSearch(badge.replace(/_/g, " "))}
                      className="shrink-0 rounded-xl bg-card border border-border-subtle px-3 py-2.5 flex items-center gap-2 press hover:border-gold/20 transition-colors"
                    >
                      <Icon name={badgeIcons[badge] || "tag"} size={16} className="text-gold" />
                      <div className="text-left">
                        <p className="text-[11px] font-bold leading-tight">{formatBadgeLabel(badge)}</p>
                        <p className="text-[9px] text-txt-secondary">{count} business{count !== 1 ? "es" : ""}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Browse by Category (grid) ── */}
          {activeCategory === "all" && !search && !quickFilter && (
            <section className="mb-6 px-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 rounded-full bg-hc-blue" />
                <h2 className="font-heading font-bold text-base">Browse by Category</h2>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {categories.filter((c) => c.value !== "all").map((cat) => {
                  const count = businesses.filter((b) => b.category === cat.value).length;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => { setActiveCategory(cat.value); setQuickFilter(null); }}
                      className="rounded-xl bg-card border border-border-subtle p-3 flex items-center gap-3 press hover:border-gold/20 transition-colors text-left relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 bottom-0 w-0.5 rounded-l-xl" style={{ background: cat.color }} />
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${cat.color}15` }}>
                        <Icon name={cat.iconName} size={18} style={{ color: cat.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold truncate">{cat.label}</p>
                        <p className="text-[10px] text-txt-secondary">{count} listed</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Why Shop Local banner ── */}
          {activeCategory === "all" && !search && !quickFilter && (
            <section className="px-5 mb-6">
              <div className="rounded-2xl bg-gradient-to-br from-emerald/8 via-card to-cyan/5 border border-emerald/15 p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald via-cyan to-transparent" />
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald/15 flex items-center justify-center shrink-0">
                    <Icon name="heart-pulse" size={20} className="text-emerald" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm mb-1">Why Shop Local?</h3>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald text-[10px]">•</span>
                        <p className="text-[11px] text-txt-secondary">68¢ of every $1 stays in {activeCity?.name ?? "your city"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald text-[10px]">•</span>
                        <p className="text-[11px] text-txt-secondary">Creates 2x more local jobs than chains</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald text-[10px]">•</span>
                        <p className="text-[11px] text-txt-secondary">Builds a stronger, self-sufficient community</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ── Divider ── */}
          {activeCategory === "all" && !search && !quickFilter && (
            <div className="px-5 mb-5">
              <div className="divider-subtle" />
            </div>
          )}

          {/* ── All Businesses List ── */}
          <section className="px-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 rounded-full" style={{ background: categoryColors[activeCategory] || "#F2A900" }} />
              <h2 className="font-heading font-bold text-base">
                {activeCategory === "all"
                  ? quickFilter === "top" ? "Top Rated" : quickFilter === "new" ? "New Businesses" : quickFilter === "black_owned" ? "Black Owned" : "All Businesses"
                  : categories.find((c) => c.value === activeCategory)?.label}
              </h2>
              <span className="ml-auto text-xs text-txt-secondary">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            <div className="space-y-3 stagger">
              {(activeCategory === "all" && !search && !quickFilter ? regular : filtered).map((biz) => (
                <BusinessRow key={biz.id} biz={biz} />
              ))}

              {/* Featured also in "All" list when no filter */}
              {activeCategory === "all" && !search && !quickFilter && featured.length > 0 && (
                <>
                  {featured.map((biz) => (
                    <BusinessRow key={biz.id} biz={biz} />
                  ))}
                </>
              )}

              {filtered.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-card mx-auto mb-4 flex items-center justify-center">
                    <Icon name="search" size={28} className="text-txt-secondary" />
                  </div>
                  <p className="text-sm font-bold mb-1">No businesses found</p>
                  <p className="text-xs text-txt-secondary">
                    Try a different search or category
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ── Advertise with Knect CTA ── */}
          <div className="px-5 mt-8 mb-3">
            <div className="rounded-2xl bg-gradient-to-r from-hc-purple/10 via-gold/5 to-transparent border border-hc-purple/15 p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-hc-purple via-gold to-transparent" />
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-hc-purple/15 flex items-center justify-center shrink-0">
                  <Icon name="megaphone" size={22} className="text-hc-purple" />
                </div>
                <div className="flex-1">
                  <p className="font-heading font-bold text-sm mb-0.5">Promote Your Business</p>
                  <p className="text-[11px] text-txt-secondary">Run deals, get featured & reach all of {activeCity?.name ?? "your city"}</p>
                </div>
                <div className="shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-hc-purple/10 flex items-center justify-center">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-hc-purple">
                      <path d="M5 2l5 5-5 5" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Own a Business CTA ── */}
          <div className="px-5 mb-4">
            <div className="rounded-2xl bg-gradient-to-r from-gold/10 via-gold/5 to-transparent border border-gold/15 p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-gold to-transparent" />
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/15 flex items-center justify-center shrink-0">
                  <Icon name="store" size={22} className="text-gold" />
                </div>
                <div className="flex-1">
                  <p className="font-heading font-bold text-sm mb-0.5">Own a Business in {activeCity?.name ?? "your city"}?</p>
                  <p className="text-[11px] text-txt-secondary">Get listed, earn city badges & connect with customers</p>
                </div>
                <div className="shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-gold">
                      <path d="M5 2l5 5-5 5" />
                    </svg>
                  </div>
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
// Deal Card (horizontal scroller)
// ---------------------------------------------------------------------------

function DealCard({ deal, index }: { deal: LocalDeal; index: number }) {
  const accentColor = categoryColors[deal.category] || "#F2A900";

  return (
    <Link
      href={`/business/${deal.businessSlug}`}
      className="shrink-0 w-[200px] animate-slide-in press"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="rounded-2xl bg-card border border-border-subtle overflow-hidden hover:border-compton-red/20 transition-colors relative">
        {/* Discount badge */}
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: accentColor }} />

        <div className="p-3.5">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${accentColor}15` }}>
              <Icon name={deal.iconName} size={18} style={{ color: accentColor }} />
            </div>
            <div className="px-2 py-0.5 rounded-lg bg-compton-red/10 border border-compton-red/20">
              <span className="text-[11px] font-bold text-compton-red">{deal.discount}</span>
            </div>
          </div>

          <h3 className="font-heading font-bold text-[12px] mb-0.5 truncate">{deal.title}</h3>
          <p className="text-[10px] text-txt-secondary mb-1.5 line-clamp-1">{deal.description}</p>

          <div className="flex items-center justify-between">
            <p className="text-[9px] text-txt-secondary truncate">{deal.businessName}</p>
            <p className="text-[8px] text-txt-secondary">{deal.validUntil}</p>
          </div>

          {deal.promoCode && (
            <div className="mt-2 px-2 py-1 rounded-md bg-hc-purple/8 border border-hc-purple/15 border-dashed text-center">
              <span className="text-[10px] font-bold text-hc-purple font-mono">{deal.promoCode}</span>
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
  const accentColor = categoryColors[biz.category] || "#F2A900";

  return (
    <Link
      href={`/business/${biz.slug}`}
      className="shrink-0 w-[220px] animate-slide-in"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="rounded-2xl bg-card border border-border-subtle overflow-hidden hover:border-gold/20 transition-colors press">
        {/* Image / Art */}
        <div className="h-[130px] relative overflow-hidden">
          {biz.image_urls?.[0] ? (
            <Image src={biz.image_urls[0]} alt={biz.name} fill className="object-cover" />
          ) : (
            <div className={`w-full h-full ${categoryArt[biz.category] ?? "art-city"}`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />

          {/* Badge */}
          <div className="absolute top-2.5 left-2.5">
            <Badge label={isNew ? "New" : "Featured"} variant={isNew ? "coral" : "gold"} shine />
          </div>

          {/* Rating pill */}
          {biz.rating_avg > 0 && (
            <div className="absolute top-2.5 right-2.5 bg-midnight/70 backdrop-blur-sm rounded-lg px-2 py-0.5 flex items-center gap-1">
              <span className="text-gold text-[10px]"><Icon name="star" size={16} className="text-gold" /></span>
              <span className="text-[10px] font-bold">{Number(biz.rating_avg).toFixed(1)}</span>
            </div>
          )}

          {/* Category accent bottom line */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: accentColor }} />
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-heading font-bold text-[13px] mb-0.5 truncate">{biz.name}</h3>
          <p className="text-[10px] text-txt-secondary mb-2 line-clamp-1">{biz.description}</p>

          {/* Badges + CTA */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {biz.badges?.slice(0, 2).map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-semibold uppercase tracking-wide border"
                  style={{
                    background: `${accentColor}10`,
                    borderColor: `${accentColor}20`,
                    color: accentColor,
                  }}
                >
                  <Icon name={badgeIcons[badge] || "tag"} size={10} />
                  {formatBadgeLabel(badge)}
                </span>
              ))}
            </div>
            {(biz.accepts_orders || biz.accepts_bookings) && (
              <div className="shrink-0 px-2 py-0.5 rounded-lg bg-gold/10 border border-gold/20">
                <span className="text-[9px] font-bold text-gold">
                  {biz.accepts_orders ? "Order" : "Book"}
                </span>
              </div>
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
  const accentColor = categoryColors[biz.category] || "#F2A900";
  const variant = categoryBadgeVariant[biz.category] || "gold";

  // Determine if open now
  const dayShort = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const todayKey = dayShort[new Date().getDay()];
  const todayHours = biz.hours?.[todayKey];
  let isOpen = false;
  let hoursLabel = "";
  if (todayHours && typeof todayHours === "object" && "open" in todayHours && "close" in todayHours) {
    hoursLabel = `${todayHours.open} - ${todayHours.close}`;
    // Simple check — parse hours
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
      isOpen = closeMin <= openMin ? (nowMin >= openMin || nowMin <= closeMin) : (nowMin >= openMin && nowMin <= closeMin);
    }
  }

  return (
    <Link href={`/business/${biz.slug}`}>
      <div className="rounded-2xl bg-card border border-border-subtle overflow-hidden hover:border-gold/20 transition-colors press relative">
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: accentColor }} />

        <div className="flex gap-0">
          {/* Thumbnail */}
          <div className="w-[100px] h-[88px] shrink-0 overflow-hidden relative">
            {biz.image_urls?.[0] ? (
              <Image src={biz.image_urls[0]} alt={biz.name} fill className="object-cover" />
            ) : (
              <div className={`w-full h-full ${categoryArt[biz.category] ?? "art-city"} flex items-center justify-center`}>
                <Icon name={categories.find((c) => c.value === biz.category)?.iconName || "store"} size={22} className="opacity-60" />
              </div>
            )}
            {biz.is_featured && (
              <div className="absolute top-1.5 left-1.5">
                <Badge label="Featured" variant="gold" shine />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 p-3">
            {/* Name + Rating */}
            <div className="flex items-start justify-between gap-2 mb-0.5">
              <h3 className="font-heading font-bold text-[13px] truncate">{biz.name}</h3>
              {biz.rating_avg > 0 && (
                <div className="flex items-center gap-1 shrink-0">
                  <Icon name="star" size={12} className="text-gold" />
                  <span className="text-[11px] font-bold">{Number(biz.rating_avg).toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-[11px] text-white/40 mb-1.5 line-clamp-1">{biz.description}</p>

            {/* Open/Closed + Address */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {hoursLabel && (
                <span className={`inline-flex items-center gap-1 text-[9px] font-semibold rounded-full px-2 py-0.5 ${
                  isOpen
                    ? "text-emerald bg-emerald/10 border border-emerald/20"
                    : "text-white/25 bg-white/[0.03] border border-white/[0.06]"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? "bg-emerald animate-pulse" : "bg-white/20"}`} />
                  {isOpen ? "Open" : "Closed"}
                </span>
              )}
              {biz.address && (
                <span className="text-[9px] text-white/25 truncate inline-flex items-center gap-0.5">
                  <Icon name="pin" size={9} /> {biz.address.split(",")[0]}
                </span>
              )}
            </div>

            {/* Bottom row: badges + Order/Book CTA */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge label={biz.category} variant={variant} />
              {biz.account_type === "ads_only" && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-semibold border bg-white/5 border-white/10 text-txt-secondary">
                  <Icon name="globe" size={9} />
                  Chain
                </span>
              )}
              {biz.badges?.slice(0, 1).map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-semibold border bg-gold/5 border-gold/15 text-gold-light"
                >
                  <Icon name={badgeIcons[badge] || "tag"} size={9} />
                  {formatBadgeLabel(badge)}
                </span>
              ))}

              {/* CTA */}
              {(biz.accepts_orders || biz.accepts_bookings) ? (
                <span className="ml-auto shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-gold/12 border border-gold/20 text-[10px] font-bold text-gold">
                  <Icon name={biz.accepts_orders ? "cart" : "calendar"} size={11} />
                  {biz.accepts_orders ? "Order" : "Book"}
                  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 1l4 4-4 4" /></svg>
                </span>
              ) : (
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/15 ml-auto shrink-0" strokeLinecap="round"><path d="M5 2l5 5-5 5" /></svg>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
