"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { SnapCarousel, Tag } from "@/components/ui/editorial";
import type {
  Business,
  FoodSpecial,
  FoodPromotion,
  FoodTour,
  FoodChallenge,
} from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { useActiveCity } from "@/hooks/useActiveCity";
import CityOwnershipFilter, {
  DEFAULT_OWNERSHIP_OPTIONS,
  type CityOption,
} from "@/components/filters/CityOwnershipFilter";
import FoodTruckTracker from "@/components/food/FoodTruckTracker";

// ─── Category Config (no more per-category colors) ────────
const categories: { label: string; value: string; iconName: IconName }[] = [
  { label: "All", value: "all", iconName: "flame" },
  { label: "Restaurants", value: "restaurant", iconName: "utensils" },
  { label: "Food Trucks", value: "food_truck", iconName: "truck" },
  { label: "Carts", value: "cart", iconName: "cart" },
];

const quickFilters: { label: string; iconName: IconName; filter: string }[] = [
  { label: "Open Now", iconName: "check", filter: "open" },
  { label: "Order Pickup", iconName: "shopping", filter: "pickup" },
  { label: "Food Trucks", iconName: "truck", filter: "trucks" },
  { label: "Deals", iconName: "tag", filter: "deals" },
];

const moodSections: { title: string; subtitle: string; iconName: IconName; filter: string }[] = [
  { title: "Late Night Eats", subtitle: "Open past 10 PM", iconName: "moon", filter: "late_night" },
  { title: "Always Open", subtitle: "24/7 spots that never close", iconName: "clock", filter: "always_open" },
  { title: "Quick Bites", subtitle: "In and out under 15 min", iconName: "bolt", filter: "quick" },
  { title: "Family Style", subtitle: "Big portions, bigger love", iconName: "family", filter: "family" },
];

const comptonfavs: { name: string; iconName: IconName; search: string }[] = [
  { name: "BBQ", iconName: "meat", search: "bbq" },
  { name: "Tacos", iconName: "taco", search: "taco" },
  { name: "Burgers", iconName: "burger", search: "burger" },
  { name: "Seafood", iconName: "shrimp", search: "seafood" },
  { name: "Wings", iconName: "wings", search: "wing" },
  { name: "Soul Food", iconName: "bowl", search: "soul" },
  { name: "Mexican", iconName: "taco", search: "mexican" },
  { name: "Desserts", iconName: "donut", search: "dessert" },
];

// ─── Helper: Parse time string like "10:00 AM" to minutes since midnight ────
function parseTimeToMin(t: string): number {
  const match = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return -1;
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const ampm = match[3]?.toUpperCase();
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

// Hours can be either { open, close } objects or "10:00 AM - 8:00 PM" strings
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseHoursEntry(h: any): { openMin: number; closeMin: number } | null {
  if (!h) return null;
  if (typeof h === "string") {
    if (h.toLowerCase() === "closed") return null;
    const parts = h.split(/\s*[-–]\s*/);
    if (parts.length < 2) return null;
    const openMin = parseTimeToMin(parts[0]);
    const closeMin = parseTimeToMin(parts[1]);
    if (openMin < 0 || closeMin < 0) return null;
    return { openMin, closeMin };
  }
  if (h.open && h.close) {
    return { openMin: parseTimeToMin(h.open), closeMin: parseTimeToMin(h.close) };
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDayKey(hours: Record<string, any>): string | null {
  const dayShort = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const dayFull = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const d = new Date().getDay();
  if (hours[dayShort[d]] !== undefined) return dayShort[d];
  if (hours[dayFull[d]] !== undefined) return dayFull[d];
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isOpenNow(hours: Record<string, any> | null): boolean {
  if (!hours || Object.keys(hours).length === 0) return false;
  const key = getDayKey(hours);
  if (!key) return false;
  const parsed = parseHoursEntry(hours[key]);
  if (!parsed) return false;
  const currentMin = new Date().getHours() * 60 + new Date().getMinutes();
  const { openMin, closeMin } = parsed;
  if (closeMin <= openMin) return currentMin >= openMin || currentMin <= closeMin; // overnight
  return currentMin >= openMin && currentMin <= closeMin;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isLateNight(hours: Record<string, any> | null): boolean {
  if (!hours || Object.keys(hours).length === 0) return false;
  const key = getDayKey(hours);
  if (!key) return false;
  const parsed = parseHoursEntry(hours[key]);
  if (!parsed) return false;
  const closeH = Math.floor(parsed.closeMin / 60);
  return closeH >= 22 || closeH <= 4;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isAlwaysOpen(hours: Record<string, any> | null): boolean {
  if (!hours || Object.keys(hours).length === 0) return false;
  const allDays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return allDays.every(day => {
    const parsed = parseHoursEntry(hours[day]);
    return parsed && parsed.openMin === 0 && parsed.closeMin === 23 * 60 + 59;
  });
}

// ─── Star Rating ───────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill={s <= Math.round(rating) ? "#F2A900" : "none"}
          stroke={s <= Math.round(rating) ? "#F2A900" : "rgba(255,255,255,0.15)"}
          strokeWidth="2"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

// ─── Section Header (numbered editorial) ───────────
function SectionHeader({
  number,
  kicker,
  subtitle,
  seeAllHref,
  seeAllLabel = "See all →",
}: {
  number: number;
  kicker: string;
  subtitle?: string;
  seeAllHref?: string;
  seeAllLabel?: string;
}) {
  const n = String(number).padStart(2, "0");
  return (
    <div className="flex items-start justify-between mb-3 gap-3">
      <div className="min-w-0">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-gold text-[22px] leading-none tabular-nums">
            № {n}
          </span>
          <span className="text-[10px] font-bold tracking-editorial uppercase text-white/50">
            {kicker}
          </span>
        </div>
        {subtitle && <p className="text-[11px] text-ivory/40 mt-1">{subtitle}</p>}
      </div>
      {seeAllHref && (
        <Link
          href={seeAllHref}
          className="shrink-0 text-[10px] font-bold tracking-editorial-tight uppercase text-gold press"
        >
          {seeAllLabel}
        </Link>
      )}
    </div>
  );
}

// ─── Food Card (editorial) ─────────────────────────
function FoodCard({ business, featured = false }: { business: Business; featured?: boolean }) {
  const heroImage = business.image_urls?.[0];
  const isLive = business.is_mobile_vendor === true;
  const open = isOpenNow(business.hours);
  const rating = Number(business.rating_avg || 0);

  if (featured) {
    return (
      <Link
        href={`/business/${business.slug || business.id}`}
        className="group block shrink-0 w-[260px] press"
      >
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden panel-editorial">
          {heroImage ? (
            <Image src={heroImage} alt={business.name} fill className="object-cover" sizes="260px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-14 h-14 rounded-xl border border-gold/25 bg-ink flex items-center justify-center">
                <Icon
                  name={business.is_mobile_vendor ? "truck" : "utensils"}
                  size={26}
                  className="text-gold"
                />
              </div>
            </div>
          )}
          {heroImage && (
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
          )}

          {/* Top-tag strip */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
            {isLive ? (
              <Tag tone="emerald" size="xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
                Live
              </Tag>
            ) : open ? (
              <Tag tone="emerald" size="xs">Open</Tag>
            ) : <span />}
            {business.accepts_orders && (
              <Tag tone="gold" size="xs" className="ml-auto">Order</Tag>
            )}
          </div>
        </div>

        <div className="mt-2.5 px-0.5">
          <h3 className="font-display text-[17px] leading-tight text-white truncate group-hover:text-gold transition-colors">
            {business.name}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <Stars rating={rating} />
            <span className="text-[11px] text-ivory/55 tabular-nums">
              {rating.toFixed(1)}
              {business.rating_count ? ` (${business.rating_count})` : ""}
            </span>
          </div>
          {business.is_mobile_vendor && (
            <p className="text-[10px] text-ivory/45 uppercase tracking-editorial-tight mt-1">
              Track live on the map
            </p>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/business/${business.slug || business.id}`}
      className="group block press"
    >
      <div className="rounded-2xl panel-editorial overflow-hidden hover:border-gold/30 transition-colors">
        <div className="flex items-stretch">
          {/* Image / ink panel with gold well */}
          <div className="w-[110px] shrink-0 relative bg-ink border-r border-white/[0.06] flex items-center justify-center">
            {heroImage ? (
              <Image src={heroImage} alt={business.name} fill className="object-cover" sizes="110px" />
            ) : (
              <div className="w-12 h-12 rounded-xl border border-gold/20 bg-black/40 flex items-center justify-center">
                <Icon
                  name={business.is_mobile_vendor ? "truck" : "utensils"}
                  size={22}
                  className="text-gold"
                />
              </div>
            )}
            {isLive && (
              <div className="absolute top-2 left-2">
                <Tag tone="emerald" size="xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
                  Live
                </Tag>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 p-3.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-[17px] leading-tight text-white group-hover:text-gold transition-colors line-clamp-1">
                {business.name}
              </h3>
              <div className="flex items-center gap-1 shrink-0 pt-0.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#F2A900">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className="text-[11px] font-bold text-gold tabular-nums">{rating.toFixed(1)}</span>
              </div>
            </div>

            {business.description && (
              <p className="text-[11px] text-ivory/50 leading-relaxed mt-1 line-clamp-1">
                {business.description}
              </p>
            )}

            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              {open && <Tag tone="emerald" size="xs">Open</Tag>}
              {business.is_mobile_vendor && <Tag tone="gold" size="xs">Food Truck</Tag>}
              {business.accepts_orders && <Tag tone="gold" size="xs">Pickup</Tag>}
              {business.min_order > 0 && (
                <span className="text-[9px] font-semibold uppercase tracking-editorial-tight text-ivory/45">
                  ${(business.min_order / 100).toFixed(0)} min
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2">
              {business.address && !business.is_mobile_vendor && (
                <span className="text-[10px] text-ivory/45 truncate">
                  {business.address.split(",")[0]}
                </span>
              )}
              {business.is_mobile_vendor && (
                <span className="text-[10px] text-ivory/45 uppercase tracking-editorial-tight truncate">
                  Track on the map
                </span>
              )}
              {business.accepts_orders && (
                <span className="ml-auto shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-editorial-tight bg-gold/15 text-gold group-hover:bg-gold group-hover:text-midnight transition-colors">
                  Order
                  <Icon name="arrow-right-thin" size={11} />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Special Deal Card (editorial) ─────────────────
function DealCard({ special }: { special: FoodSpecial }) {
  const bizName = (special.business as unknown as { name: string })?.name ?? "Local Spot";
  const bizSlug = (special.business as unknown as { slug: string })?.slug ?? "";
  const discount = special.original_price > 0
    ? Math.round(((special.original_price - special.special_price) / special.original_price) * 100)
    : 0;

  return (
    <Link
      href={bizSlug ? `/business/${bizSlug}` : "#"}
      className="group block shrink-0 w-[180px] press"
    >
      <div className="h-full rounded-2xl panel-editorial p-4 hover:border-gold/30 transition-colors">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-editorial-tight text-ivory/50 truncate">
            {bizName}
          </span>
          {discount > 0 && <Tag tone="coral" size="xs">-{discount}%</Tag>}
        </div>
        <h3 className="font-display text-[16px] leading-tight text-white line-clamp-2 mb-3 group-hover:text-gold transition-colors">
          {special.title}
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-ivory/35 text-[11px] line-through tabular-nums">
            ${(special.original_price / 100).toFixed(2)}
          </span>
          <span className="font-display text-gold text-[22px] leading-none tabular-nums">
            ${(special.special_price / 100).toFixed(2)}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Promo Card (editorial) ────────────────────────
function PromoCard({ promo }: { promo: FoodPromotion }) {
  const bizName = (promo.business as unknown as { name: string })?.name ?? "Local Business";
  const typeIcons: Record<string, IconName> = {
    bogo: "sparkle",
    discount: "dollar",
    free_item: "tag",
    bundle: "shopping",
    loyalty: "star",
  };

  const label =
    promo.promo_type === "bogo"
      ? "Buy 1 Get 1"
      : promo.promo_type === "discount"
      ? `${promo.discount_percent || ""}% Off`
      : promo.promo_type;

  return (
    <div className="rounded-2xl panel-editorial overflow-hidden">
      <div className="p-4 flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl border border-gold/20 bg-ink flex items-center justify-center shrink-0">
          <Icon name={typeIcons[promo.promo_type] || "tag"} size={22} className="text-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-editorial-tight text-ivory/45 mb-0.5">
            {bizName}
          </p>
          <h3 className="font-display text-[16px] leading-tight text-white mb-1">{promo.title}</h3>
          {promo.description && (
            <p className="text-[11px] text-ivory/55 leading-relaxed line-clamp-2 mb-2">
              {promo.description}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <Tag tone="gold" size="xs">{label}</Tag>
            {promo.promo_code && (
              <span className="text-[10px] font-mono bg-black/40 px-2 py-0.5 rounded text-gold border border-gold/20 tabular-nums">
                {promo.promo_code}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────
export default function FoodPage() {
  const activeCity = useActiveCity();
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedOwnership, setSelectedOwnership] = useState<string[]>([]);
  const [activeQuick, setActiveQuick] = useState<string | null>(null);

  // Load cities once
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("cities")
      .select("slug, name")
      .eq("launch_status", "live")
      .order("name")
      .then(({ data }) => {
        if (data) setCities(data.map((c) => ({ slug: c.slug, name: c.name })));
      });
  }, []);
  const [specials, setSpecials] = useState<FoodSpecial[]>([]);
  const [promotions, setPromotions] = useState<FoodPromotion[]>([]);
  const [tours, setTours] = useState<FoodTour[]>([]);
  const [challenges, setChallenges] = useState<FoodChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch businesses
  useEffect(() => {
    async function fetchBusinesses() {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== "all") params.set("subtype", activeTab);
      if (search) params.set("search", search);
      if (activeCity?.slug) params.set("city", activeCity.slug);
      const res = await fetch(`/api/food/businesses?${params}`);
      const data = await res.json();
      setBusinesses(data.businesses ?? []);
      setLoading(false);
    }
    fetchBusinesses();
  }, [activeTab, search, activeCity?.slug]);

  // Fetch supporting data
  useEffect(() => {
    async function fetchAll() {
      const [specialsRes, promosRes, toursRes, challengesRes] = await Promise.all([
        fetch("/api/food/specials"),
        fetch("/api/food/promotions"),
        fetch("/api/food/tours"),
        fetch("/api/food/challenges"),
      ]);
      const [sd, pd, td, cd] = await Promise.all([
        specialsRes.json(), promosRes.json(), toursRes.json(), challengesRes.json(),
      ]);
      setSpecials(sd.specials ?? []);
      setPromotions(pd.promotions ?? []);
      setTours(td.tours ?? []);
      setChallenges(cd.challenges ?? []);
    }
    fetchAll();
  }, []);

  // Apply city + ownership filters first, then derive sections from the narrowed set
  const filteredBusinesses = useMemo(() => {
    let result = businesses;
    if (selectedCities.length > 0) {
      result = result.filter((b) => b.city?.slug && selectedCities.includes(b.city.slug));
    }
    if (selectedOwnership.length > 0) {
      result = result.filter((b) =>
        selectedOwnership.some((badge) => b.badges?.includes(badge))
      );
    }
    return result;
  }, [businesses, selectedCities, selectedOwnership]);

  const featuredSpots = useMemo(() => filteredBusinesses.filter(b => b.is_featured), [filteredBusinesses]);
  const lateNight = useMemo(() => filteredBusinesses.filter(b => isLateNight(b.hours)), [filteredBusinesses]);
  const alwaysOpen = useMemo(() => filteredBusinesses.filter(b => isAlwaysOpen(b.hours)), [filteredBusinesses]);
  const withPickup = useMemo(() => filteredBusinesses.filter(b => b.accepts_orders), [filteredBusinesses]);

  return (
    <div className="culture-surface animate-fade-in pb-safe min-h-dvh">
      {/* ─── Culture Masthead — paper palette ─── */}
      <div
        className="px-[18px] pt-5 pb-4"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <div className="c-kicker" style={{ opacity: 0.65 }}>
          § ISSUE EAT · {(activeCity?.name ?? "EVERYWHERE").toUpperCase()}
        </div>
        <h1
          className="c-display mt-2"
          style={{ fontSize: 72, lineHeight: 0.82, letterSpacing: "-0.02em" }}
        >
          EAT.
        </h1>
        <p
          className="c-serif-it mt-3"
          style={{ fontSize: 14, lineHeight: 1.45 }}
        >
          The plug is local. The kitchen issue from {activeCity?.name ?? "your city"}.
        </p>
      </div>

      {/* ─── Search row (printed-rule input + ink FILTER button) ─── */}
      <div className="px-[18px] mt-4 mb-4 flex items-center gap-2">
        <div
          className="flex-1 flex items-center gap-2 px-3 py-2.5"
          style={{ border: "2px solid var(--rule-strong-c)" }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--ink-strong)" }}
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="text"
            placeholder="SEARCH RESTAURANTS, TRUCKS, DISHES"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent w-full outline-none c-kicker"
            style={{
              color: "var(--ink-strong)",
              fontSize: 11,
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ color: "var(--ink-mute)" }}
              aria-label="Clear search"
            >
              <svg
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="c-btn c-btn-primary"
          style={{ padding: "12px 14px", fontSize: 11 }}
        >
          FILTER
        </button>
      </div>

      {/* ─── Quick Filters (c-chip with gold active) ─── */}
      <div className="c-noscroll flex gap-1.5 px-[14px] overflow-x-auto pb-1 mb-4">
        {quickFilters.map((f) => {
          const isActive = activeQuick === f.filter;
          return (
            <button
              key={f.filter}
              onClick={() => {
                setActiveQuick(isActive ? null : f.filter);
                if (f.filter === "trucks") setActiveTab("food_truck");
                else if (f.filter === "pickup") setSearch("order");
              }}
              className={`c-chip${isActive ? " gold" : ""}`}
            >
              {f.label.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* ─── Secondary Filters Toggle ─── */}
      <div className="px-5 mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between panel-editorial px-4 py-3 rounded-xl border-white/[0.08] press hover:border-gold/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Icon name="tag" size={16} className="text-gold" />
            <span className="text-[11px] font-bold uppercase tracking-editorial-tight text-ivory/80">
              Advanced Filters
            </span>
            {(selectedCities.length > 0 || selectedOwnership.length > 0 || activeTab !== "all") && (
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse ml-1" />
            )}
          </div>
          <Icon name={showFilters ? "chevron-up" : "chevron-down"} size={16} className="text-ivory/40" />
        </button>
      </div>

      {/* ─── Expandable Filters ─── */}
      {showFilters && (
        <div className="mb-6 animate-fade-in space-y-5">
          {/* ─── Category Tabs (editorial, no per-category colors) ─── */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-txt-secondary font-bold mb-2 px-5">
              Type
            </p>
            <div className="flex gap-2 px-5 overflow-x-auto scrollbar-hide pb-1">
              {categories.map((cat) => {
                const isActive = activeTab === cat.value;
                return (
                  <button
                    key={cat.value}
                    onClick={() => setActiveTab(cat.value)}
                    className={`flex items-center gap-1.5 shrink-0 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-editorial-tight transition-colors press ${
                      isActive
                        ? "bg-gold text-midnight border border-gold"
                        : "panel-editorial text-ivory/70 border-white/[0.08] hover:border-gold/30"
                    }`}
                  >
                    <Icon name={cat.iconName} size={14} />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

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
      )}

      {/* ─── Food Truck Tracker (wrapped in editorial frame to absorb its own chrome) ─── */}
      <div className="px-5 mb-6">
        <div className="rounded-2xl panel-editorial overflow-hidden">
          <FoodTruckTracker />
        </div>
      </div>

      {/* ─── Local Favorites (№ 01) ─── */}
      {!search && activeTab === "all" && (
        <section className="mb-6">
          <div className="px-5">
            <SectionHeader number={1} kicker="Local Favorites" subtitle="The flavors that define our city" />
          </div>
          <div className="px-5 mb-4">
            <div className="rule-hairline" />
          </div>
          <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
            {comptonfavs.map((fav) => (
              <button
                key={fav.name}
                onClick={() => setSearch(fav.search)}
                className="flex flex-col items-center gap-2 shrink-0 press group"
              >
                <div className="w-16 h-16 rounded-2xl panel-editorial flex items-center justify-center border-gold/15 group-hover:border-gold/35 transition-colors">
                  <Icon name={fav.iconName} size={24} className="text-gold" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-editorial-tight text-ivory/60">
                  {fav.name}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ─── Today's Deals (№ 02) ─── */}
      {specials.length > 0 && (
        <SnapCarousel
          number={2}
          kicker="Today's Deals"
          seeAllHref="/food/specials"
        >
          {specials.slice(0, 8).map((special, i) => (
            <div key={special.id} className="animate-slide-in" style={{ animationDelay: `${i * 60}ms` }}>
              <DealCard special={special} />
            </div>
          ))}
        </SnapCarousel>
      )}

      {/* ─── Featured Spots (№ 03) ─── */}
      {!search && featuredSpots.length > 0 && (
        <div className="mt-6">
          <SnapCarousel
            number={3}
            kicker={`${(activeCity?.name ?? "LOCAL").toUpperCase()} FEATURED`}
          >
            {featuredSpots.map((biz) => (
              <FoodCard key={biz.id} business={biz} featured />
            ))}
          </SnapCarousel>
        </div>
      )}

      {/* ─── Order Pickup (№ 04) ─── */}
      {!search && withPickup.length > 0 && (
        <section className="px-5 mt-6 mb-6">
          <SectionHeader
            number={4}
            kicker="Order for Pickup"
            subtitle="Skip the wait — order ahead"
          />
          <div className="mb-4">
            <div className="rule-hairline" />
          </div>
          <div className="space-y-2.5 stagger">
            {withPickup.slice(0, 5).map((biz) => (
              <FoodCard key={biz.id} business={biz} />
            ))}
          </div>
        </section>
      )}

      {/* ─── Browse by Mood (№ 05) ─── */}
      {!search && activeTab === "all" && (
        <section className="px-5 mb-6">
          <SectionHeader number={5} kicker="Browse by Mood" subtitle="Pick a vibe, pick a plate" />
          <div className="mb-4">
            <div className="rule-hairline" />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {moodSections.map((mood) => {
              const count =
                mood.filter === "late_night"
                  ? lateNight.length
                  : mood.filter === "always_open"
                  ? alwaysOpen.length
                  : filteredBusinesses.length;
              return (
                <button
                  key={mood.filter}
                  className="rounded-xl panel-editorial p-4 text-left press hover:border-gold/30 transition-colors relative"
                >
                  <div className="w-9 h-9 rounded-lg border border-gold/20 bg-ink flex items-center justify-center mb-2">
                    <Icon name={mood.iconName} size={18} className="text-gold" />
                  </div>
                  <p className="font-display text-[15px] leading-tight text-white">{mood.title}</p>
                  <p className="text-[10px] text-ivory/45 uppercase tracking-editorial-tight mt-0.5">
                    {mood.subtitle}
                  </p>
                  {count > 0 && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold rounded-full px-2 py-0.5 bg-gold/15 text-gold tabular-nums">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── Late Night Eats (№ 06) ─── */}
      {!search && lateNight.length > 0 && activeTab === "all" && (
        <SnapCarousel
          number={6}
          kicker="Late Night Eats"
        >
          {lateNight.slice(0, 8).map((biz) => (
            <FoodCard key={biz.id} business={biz} featured />
          ))}
        </SnapCarousel>
      )}

      {/* ─── Promotions (№ 07) ─── */}
      {promotions.length > 0 && (
        <section className="px-5 mt-6 mb-6">
          <SectionHeader number={7} kicker="Promos & Deals" subtitle="Save on your favorites" />
          <div className="mb-4">
            <div className="rule-hairline" />
          </div>
          <div className="space-y-2.5 stagger">
            {promotions.map((promo) => (
              <PromoCard key={promo.id} promo={promo} />
            ))}
          </div>
        </section>
      )}

      {/* ─── All Food Spots (№ 08) ─── */}
      <section className="px-5 mb-6">
        <div className="flex items-start justify-between mb-3 gap-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-gold text-[22px] leading-none tabular-nums">
                № 08
              </span>
              <span className="text-[10px] font-bold tracking-editorial uppercase text-white/50">
                {search
                  ? `Results for "${search}"`
                  : activeTab === "all"
                  ? "All Food Spots"
                  : categories.find((c) => c.value === activeTab)?.label || "Food Spots"}
              </span>
            </div>
            <p className="text-[11px] text-ivory/40 mt-1 tabular-nums">{filteredBusinesses.length} spots</p>
          </div>
          {(search || activeTab !== "all" || selectedCities.length > 0 || selectedOwnership.length > 0) && (
            <button
              onClick={() => {
                setSearch("");
                setActiveTab("all");
                setSelectedCities([]);
                setSelectedOwnership([]);
              }}
              className="shrink-0 flex items-center gap-1 bg-gold/10 rounded-full px-2.5 py-1 border border-gold/25 press hover:bg-gold/15 transition-colors"
            >
              <span className="text-[10px] font-bold uppercase tracking-editorial-tight text-gold">Clear</span>
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gold" strokeLinecap="round">
                <path d="M3 3l4 4M7 3l-4 4" />
              </svg>
            </button>
          )}
        </div>
        <div className="mb-4">
          <div className="rule-hairline" />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-[100px] rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5 stagger">
            {filteredBusinesses.map((biz) => (
              <FoodCard key={biz.id} business={biz} />
            ))}
            {filteredBusinesses.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl panel-editorial flex items-center justify-center mx-auto mb-4">
                  <Icon name="utensils" size={28} className="text-gold" />
                </div>
                <p className="font-display text-[16px] text-white mb-1">No food spots found</p>
                <p className="text-[11px] text-ivory/45 uppercase tracking-editorial-tight">
                  Try a different search or category
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ─── Food Tours (№ 09) ─── */}
      {tours.length > 0 && (
        <SnapCarousel
          number={9}
          kicker="Food Tours"
          seeAllHref="/food/tours"
        >
          {tours.map((tour) => (
            <Link
              key={tour.id}
              href={`/food/tours/${tour.slug}`}
              className="group block shrink-0 w-[220px] press"
            >
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden panel-editorial">
                {tour.image_url ? (
                  <Image src={tour.image_url} alt={tour.name} fill className="object-cover" sizes="220px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-14 h-14 rounded-xl border border-gold/25 bg-ink flex items-center justify-center">
                      <Icon name="utensils" size={26} className="text-gold" />
                    </div>
                  </div>
                )}
                {tour.image_url && (
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
                )}
              </div>
              <div className="mt-2.5 px-0.5">
                <h3 className="font-display text-[16px] leading-tight text-white truncate group-hover:text-gold transition-colors">
                  {tour.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-gold font-bold uppercase tracking-editorial-tight tabular-nums">
                    {tour.stops?.length ?? 0} stops
                  </span>
                  {tour.estimated_duration != null && (
                    <span className="text-[10px] text-ivory/45 uppercase tracking-editorial-tight tabular-nums">
                      ~{tour.estimated_duration} min
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </SnapCarousel>
      )}

      {/* ─── Food Challenges (№ 10) ─── */}
      {challenges.length > 0 && (
        <section className="px-5 mt-6 mb-6">
          <SectionHeader
            number={10}
            kicker="Food Challenges"
            subtitle="Think you can handle it?"
            seeAllHref="/food/challenges"
          />
          <div className="mb-4">
            <div className="rule-hairline" />
          </div>
          <div className="space-y-2.5 stagger">
            {challenges.map((ch) => {
              const iconName: IconName =
                ch.challenge_type === "eating"
                  ? "trophy"
                  : ch.challenge_type === "photo"
                  ? "camera"
                  : "star";
              return (
                <div
                  key={ch.id}
                  className="rounded-2xl panel-editorial p-4 hover:border-gold/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl border border-gold/20 bg-ink flex items-center justify-center shrink-0">
                      <Icon name={iconName} size={22} className="text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-[16px] leading-tight text-white mb-1">
                        {ch.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Tag tone="gold" size="xs">{ch.challenge_type}</Tag>
                        {ch.participant_count > 0 && (
                          <span className="text-[10px] text-ivory/45 uppercase tracking-editorial-tight tabular-nums">
                            {ch.participant_count} joined
                          </span>
                        )}
                      </div>
                      {ch.prize_description && (
                        <p className="text-[11px] text-gold font-semibold flex items-center gap-1 mt-1">
                          <Icon name="sparkle" size={12} /> {ch.prize_description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── Bottom CTA ─── */}
      <section className="px-5 mb-8 mt-6">
        <div className="relative overflow-hidden rounded-2xl panel-editorial border-gold/25 p-5">
          <div
            className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.9 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E\")",
            }}
          />
          <div className="relative">
            <div className="w-10 h-10 rounded-xl border border-gold/25 bg-ink flex items-center justify-center mb-3">
              <Icon name="store" size={20} className="text-gold" />
            </div>
            <h3 className="font-display text-[22px] leading-tight text-white mb-1">
              Own a Food Business?
            </h3>
            <p className="text-[12px] text-ivory/55 leading-relaxed mb-4 max-w-md">
              List your restaurant, food truck, or cart on Hub City. Reach customers, manage orders, and post daily specials.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-gold text-midnight rounded-full px-4 py-2.5 text-[11px] font-bold uppercase tracking-editorial-tight press hover:bg-gold-light transition-colors"
            >
              Get Listed Free
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 7h4M7 5v4" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
