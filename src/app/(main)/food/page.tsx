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
import { useSearchParams } from "next/navigation";
import CityFilterChip from "@/components/ui/CityFilterChip";
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

// ─── Star Rating (Culture blockprint) ──────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill={s <= Math.round(rating) ? "var(--gold-c)" : "none"}
          stroke={s <= Math.round(rating) ? "var(--gold-c)" : "var(--ink-faint)"}
          strokeWidth="2"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

// ─── Section Header (Culture: kicker + rule) ───────
function SectionHeader({
  number,
  kicker,
  subtitle,
  seeAllHref,
  seeAllLabel = "SEE ALL →",
}: {
  number: number;
  kicker: string;
  subtitle?: string;
  seeAllHref?: string;
  seeAllLabel?: string;
}) {
  const n = String(number).padStart(2, "0");
  return (
    <div
      className="flex items-end justify-between mb-3 gap-3 pb-2"
      style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
    >
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span
            className="c-display c-tabnum"
            style={{
              fontSize: 22,
              lineHeight: 1,
              color: "var(--gold-c)",
            }}
          >
            № {n}
          </span>
          <span className="c-kicker" style={{ color: "var(--ink-mute)" }}>
            {kicker}
          </span>
        </div>
        {subtitle && (
          <p
            className="c-meta mt-0.5"
            style={{ color: "var(--ink-mute)", textTransform: "none" }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {seeAllHref && (
        <Link
          href={seeAllHref}
          className="c-kicker press shrink-0"
          style={{ color: "var(--ink-strong)" }}
        >
          {seeAllLabel}
        </Link>
      )}
    </div>
  );
}

// ─── Food Card (Culture blockprint) ────────────────
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
        <div className="relative w-full aspect-[4/3] c-frame-strong overflow-hidden">
          {heroImage ? (
            <Image src={heroImage} alt={business.name} fill className="object-cover" sizes="260px" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: "var(--ink-strong)" }}
            >
              <Icon
                name={business.is_mobile_vendor ? "truck" : "utensils"}
                size={32}
                style={{ color: "var(--gold-c)" }}
              />
            </div>
          )}

          {/* Top-tag strip */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2">
            {isLive ? (
              <span className="c-badge c-badge-live inline-flex items-center gap-1">
                <span
                  className="c-live-dot inline-block"
                  style={{ width: 6, height: 6, background: "#fff" }}
                />
                LIVE
              </span>
            ) : open ? (
              <span className="c-badge c-badge-ok">OPEN</span>
            ) : <span />}
            {business.accepts_orders && (
              <span className="c-badge c-badge-gold ml-auto">ORDER</span>
            )}
          </div>
        </div>

        <div className="mt-2.5 px-0.5">
          <h3
            className="c-card-t truncate"
            style={{ fontSize: 16, color: "var(--ink-strong)" }}
          >
            {business.name}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <Stars rating={rating} />
            <span
              className="c-meta c-tabnum"
              style={{ color: "var(--ink-soft)" }}
            >
              {rating.toFixed(1)}
              {business.rating_count ? ` (${business.rating_count})` : ""}
            </span>
          </div>
          {business.is_mobile_vendor && (
            <p
              className="c-kicker mt-1"
              style={{ color: "var(--ink-mute)", fontSize: 9 }}
            >
              TRACK LIVE ON THE MAP
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
      <div
        className="flex items-stretch overflow-hidden"
        style={{ border: "2px solid var(--rule-strong-c)" }}
      >
        {/* Image / ink panel with gold icon */}
        <div
          className="w-[110px] shrink-0 relative flex items-center justify-center"
          style={{
            background: "var(--ink-strong)",
            borderRight: "2px solid var(--rule-strong-c)",
          }}
        >
          {heroImage ? (
            <Image src={heroImage} alt={business.name} fill className="object-cover" sizes="110px" />
          ) : (
            <Icon
              name={business.is_mobile_vendor ? "truck" : "utensils"}
              size={28}
              style={{ color: "var(--gold-c)" }}
            />
          )}
          {isLive && (
            <div className="absolute top-2 left-2">
              <span className="c-badge c-badge-live inline-flex items-center gap-1">
                <span
                  className="c-live-dot inline-block"
                  style={{ width: 5, height: 5, background: "#fff" }}
                />
                LIVE
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div
          className="flex-1 min-w-0 p-3.5"
          style={{ background: "var(--paper)" }}
        >
          <div className="flex items-start justify-between gap-2">
            <h3
              className="c-card-t line-clamp-1"
              style={{ fontSize: 16, color: "var(--ink-strong)" }}
            >
              {business.name}
            </h3>
            <div className="flex items-center gap-1 shrink-0 pt-0.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--gold-c)">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span
                className="c-meta c-tabnum"
                style={{ color: "var(--gold-c)", fontWeight: 700 }}
              >
                {rating.toFixed(1)}
              </span>
            </div>
          </div>

          {business.description && (
            <p
              className="c-body-sm mt-1 line-clamp-1"
              style={{ fontSize: 11, color: "var(--ink-mute)" }}
            >
              {business.description}
            </p>
          )}

          <div className="flex items-center gap-1.5 flex-wrap mt-2">
            {open && <span className="c-badge c-badge-ok">OPEN</span>}
            {business.is_mobile_vendor && (
              <span className="c-badge c-badge-gold">FOOD TRUCK</span>
            )}
            {business.accepts_orders && (
              <span className="c-badge c-badge-gold">PICKUP</span>
            )}
            {business.min_order > 0 && (
              <span className="c-kicker" style={{ color: "var(--ink-mute)", fontSize: 9 }}>
                ${(business.min_order / 100).toFixed(0)} MIN
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2">
            {business.address && !business.is_mobile_vendor && (
              <span
                className="c-meta truncate"
                style={{ color: "var(--ink-mute)", fontSize: 10, textTransform: "none" }}
              >
                {business.address.split(",")[0]}
              </span>
            )}
            {business.is_mobile_vendor && (
              <span className="c-kicker" style={{ color: "var(--ink-mute)", fontSize: 9 }}>
                TRACK ON THE MAP
              </span>
            )}
            {business.accepts_orders && (
              <span
                className="ml-auto shrink-0 c-ui inline-flex items-center gap-1"
                style={{
                  background: "var(--ink-strong)",
                  color: "var(--gold-c)",
                  padding: "5px 10px",
                  fontSize: 10,
                }}
              >
                ORDER
                <Icon name="arrow-right-thin" size={11} />
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Special Deal Card (Culture blockprint) ────────
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
      <div
        className="h-full p-4"
        style={{
          border: "2px solid var(--rule-strong-c)",
          background: "var(--paper)",
        }}
      >
        <div className="flex items-center justify-between mb-2.5 gap-2">
          <span
            className="c-kicker truncate"
            style={{ color: "var(--ink-mute)", fontSize: 9 }}
          >
            {bizName.toUpperCase()}
          </span>
          {discount > 0 && (
            <span className="c-badge c-badge-live">−{discount}%</span>
          )}
        </div>
        <h3
          className="c-card-t line-clamp-2 mb-3"
          style={{ fontSize: 15, color: "var(--ink-strong)" }}
        >
          {special.title}
        </h3>
        <div className="flex items-baseline gap-2">
          <span
            className="c-meta c-tabnum"
            style={{
              color: "var(--ink-faint)",
              textDecoration: "line-through",
              fontSize: 11,
            }}
          >
            ${(special.original_price / 100).toFixed(2)}
          </span>
          <span
            className="c-display c-tabnum"
            style={{ fontSize: 22, lineHeight: 1, color: "var(--gold-c)" }}
          >
            ${(special.special_price / 100).toFixed(2)}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Promo Card (Culture blockprint) ───────────────
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
    <div
      className="overflow-hidden"
      style={{ border: "2px solid var(--rule-strong-c)" }}
    >
      <div className="p-4 flex items-start gap-3">
        <div
          className="w-12 h-12 shrink-0 flex items-center justify-center"
          style={{
            background: "var(--ink-strong)",
            color: "var(--gold-c)",
          }}
        >
          <Icon name={typeIcons[promo.promo_type] || "tag"} size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="c-kicker mb-1"
            style={{ color: "var(--ink-mute)", fontSize: 9 }}
          >
            {bizName.toUpperCase()}
          </p>
          <h3
            className="c-card-t mb-1"
            style={{ fontSize: 15, color: "var(--ink-strong)" }}
          >
            {promo.title}
          </h3>
          {promo.description && (
            <p
              className="c-body-sm line-clamp-2 mb-2"
              style={{ fontSize: 11, color: "var(--ink-soft)" }}
            >
              {promo.description}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="c-badge c-badge-gold">{label.toUpperCase()}</span>
            {promo.promo_code && (
              <span
                className="c-meta c-tabnum"
                style={{
                  background: "var(--ink-strong)",
                  color: "var(--gold-c)",
                  padding: "2px 6px",
                  fontSize: 10,
                  fontFamily: "var(--font-dm-mono), monospace",
                }}
              >
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
  // Default scope = ALL cities. Listener narrows via the CityFilterChip
  // which writes ?city=<slug> into the URL.
  const searchParams = useSearchParams();
  const filterCitySlug = searchParams.get("city");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const filterCityName = useMemo(() => {
    if (!filterCitySlug) return null;
    return cities.find((c) => c.slug === filterCitySlug)?.name ?? null;
  }, [filterCitySlug, cities]);
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
      if (filterCitySlug) params.set("city", filterCitySlug);
      const res = await fetch(`/api/food/businesses?${params}`);
      const data = await res.json();
      setBusinesses(data.businesses ?? []);
      setLoading(false);
    }
    fetchBusinesses();
  }, [activeTab, search, filterCitySlug]);

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
          § ISSUE EAT · {(filterCityName ?? "EVERYWHERE").toUpperCase()}
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
          The plug is local. The kitchen issue from {filterCityName ?? "your city"}.
        </p>
        <div className="mt-3"><CityFilterChip /></div>
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
          className="w-full flex items-center justify-between px-4 py-3 press"
          style={{
            border: "2px solid var(--rule-strong-c)",
            background: "var(--paper)",
          }}
        >
          <div className="flex items-center gap-2">
            <Icon name="tag" size={16} style={{ color: "var(--gold-c)" }} />
            <span className="c-kicker" style={{ color: "var(--ink-strong)" }}>
              ADVANCED FILTERS
            </span>
            {(selectedCities.length > 0 || selectedOwnership.length > 0 || activeTab !== "all") && (
              <span
                className="c-live-dot inline-block ml-1"
                style={{ width: 6, height: 6, background: "var(--gold-c)" }}
              />
            )}
          </div>
          <Icon
            name={showFilters ? "chevron-up" : "chevron-down"}
            size={16}
            style={{ color: "var(--ink-mute)" }}
          />
        </button>
      </div>

      {/* ─── Expandable Filters ─── */}
      {showFilters && (
        <div className="mb-6 animate-fade-in space-y-5">
          {/* ─── Category Tabs (editorial, no per-category colors) ─── */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] font-bold mb-2 px-5" style={{ color: "var(--ink-mute)" }}>
              Type
            </p>
            <div className="c-noscroll flex gap-1.5 px-5 overflow-x-auto pb-1">
              {categories.map((cat) => {
                const isActive = activeTab === cat.value;
                return (
                  <button
                    key={cat.value}
                    onClick={() => setActiveTab(cat.value)}
                    className={`c-chip${isActive ? " gold" : ""} inline-flex items-center gap-1.5`}
                  >
                    <Icon name={cat.iconName} size={12} />
                    {cat.label.toUpperCase()}
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

      {/* ─── Food Truck Tracker (wrapped in c-frame) ─── */}
      <div className="px-5 mb-6">
        <div className="c-frame-strong overflow-hidden">
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
            <div className="c-rule-hair" />
          </div>
          <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
            {comptonfavs.map((fav) => (
              <button
                key={fav.name}
                onClick={() => setSearch(fav.search)}
                className="flex flex-col items-center gap-2 shrink-0 press group"
              >
                <div
                  className="w-16 h-16 flex items-center justify-center"
                  style={{
                    border: "2px solid var(--rule-strong-c)",
                    background: "var(--paper)",
                    color: "var(--ink-strong)",
                  }}
                >
                  <Icon name={fav.iconName} size={24} />
                </div>
                <span
                  className="c-kicker"
                  style={{ color: "var(--ink-mute)", fontSize: 9 }}
                >
                  {fav.name.toUpperCase()}
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
            kicker={`${(filterCityName ?? "LOCAL").toUpperCase()} FEATURED`}
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
            <div className="c-rule-hair" />
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
            <div className="c-rule-hair" />
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
                  className="p-4 text-left press relative"
                  style={{
                    border: "2px solid var(--rule-strong-c)",
                    background: "var(--paper)",
                  }}
                >
                  <div
                    className="w-9 h-9 flex items-center justify-center mb-2"
                    style={{
                      background: "var(--ink-strong)",
                      color: "var(--gold-c)",
                    }}
                  >
                    <Icon name={mood.iconName} size={18} />
                  </div>
                  <p
                    className="c-card-t"
                    style={{ fontSize: 15, color: "var(--ink-strong)" }}
                  >
                    {mood.title.toUpperCase()}
                  </p>
                  <p
                    className="c-kicker mt-0.5"
                    style={{ color: "var(--ink-mute)", fontSize: 9 }}
                  >
                    {mood.subtitle.toUpperCase()}
                  </p>
                  {count > 0 && (
                    <span
                      className="c-badge c-badge-gold absolute"
                      style={{ top: 10, right: 10 }}
                    >
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
            <div className="c-rule-hair" />
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
        <div
          className="flex items-end justify-between mb-3 gap-3 pb-2"
          style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
        >
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span
                className="c-display c-tabnum"
                style={{
                  fontSize: 22,
                  lineHeight: 1,
                  color: "var(--gold-c)",
                }}
              >
                № 08
              </span>
              <span className="c-kicker" style={{ color: "var(--ink-mute)" }}>
                {search
                  ? `RESULTS FOR "${search.toUpperCase()}"`
                  : activeTab === "all"
                  ? "ALL FOOD SPOTS"
                  : (categories.find((c) => c.value === activeTab)?.label || "Food Spots").toUpperCase()}
              </span>
            </div>
            <p
              className="c-meta c-tabnum mt-0.5"
              style={{ color: "var(--ink-mute)" }}
            >
              {filteredBusinesses.length} SPOTS
            </p>
          </div>
          {(search || activeTab !== "all" || selectedCities.length > 0 || selectedOwnership.length > 0) && (
            <button
              onClick={() => {
                setSearch("");
                setActiveTab("all");
                setSelectedCities([]);
                setSelectedOwnership([]);
              }}
              className="c-kicker press shrink-0 inline-flex items-center gap-1"
              style={{
                background: "var(--ink-strong)",
                color: "var(--gold-c)",
                padding: "5px 10px",
              }}
            >
              CLEAR ×
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-[100px]"
                style={{
                  background: "var(--paper-soft)",
                  border: "2px solid var(--rule-c)",
                }}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5 stagger">
            {filteredBusinesses.map((biz) => (
              <FoodCard key={biz.id} business={biz} />
            ))}
            {filteredBusinesses.length === 0 && (
              <div className="text-center py-16">
                <div
                  className="w-16 h-16 flex items-center justify-center mx-auto mb-4"
                  style={{
                    border: "2px solid var(--rule-strong-c)",
                    color: "var(--ink-strong)",
                  }}
                >
                  <Icon name="utensils" size={28} />
                </div>
                <p
                  className="c-card-t mb-1"
                  style={{ fontSize: 16, color: "var(--ink-strong)" }}
                >
                  NO FOOD SPOTS FOUND
                </p>
                <p
                  className="c-kicker"
                  style={{ color: "var(--ink-mute)", fontSize: 9 }}
                >
                  TRY A DIFFERENT SEARCH OR CATEGORY
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
              <div className="relative w-full aspect-[4/3] c-frame-strong overflow-hidden">
                {tour.image_url ? (
                  <Image src={tour.image_url} alt={tour.name} fill className="object-cover" sizes="220px" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: "var(--ink-strong)" }}
                  >
                    <Icon name="utensils" size={28} style={{ color: "var(--gold-c)" }} />
                  </div>
                )}
              </div>
              <div className="mt-2.5 px-0.5">
                <h3
                  className="c-card-t truncate"
                  style={{ fontSize: 15, color: "var(--ink-strong)" }}
                >
                  {tour.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="c-kicker c-tabnum"
                    style={{ color: "var(--gold-c)", fontSize: 9 }}
                  >
                    {tour.stops?.length ?? 0} STOPS
                  </span>
                  {tour.estimated_duration != null && (
                    <span
                      className="c-kicker c-tabnum"
                      style={{ color: "var(--ink-mute)", fontSize: 9 }}
                    >
                      ~{tour.estimated_duration} MIN
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
            <div className="c-rule-hair" />
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
                  className="p-4"
                  style={{
                    border: "2px solid var(--rule-strong-c)",
                    background: "var(--paper)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 flex items-center justify-center shrink-0"
                      style={{
                        background: "var(--ink-strong)",
                        color: "var(--gold-c)",
                      }}
                    >
                      <Icon name={iconName} size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="c-card-t mb-1"
                        style={{ fontSize: 15, color: "var(--ink-strong)" }}
                      >
                        {ch.name.toUpperCase()}
                      </h3>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="c-badge c-badge-gold">
                          {ch.challenge_type.toUpperCase()}
                        </span>
                        {ch.participant_count > 0 && (
                          <span
                            className="c-kicker c-tabnum"
                            style={{ color: "var(--ink-mute)", fontSize: 9 }}
                          >
                            {ch.participant_count} JOINED
                          </span>
                        )}
                      </div>
                      {ch.prize_description && (
                        <p
                          className="c-kicker inline-flex items-center gap-1 mt-1"
                          style={{ color: "var(--gold-c)", fontSize: 10 }}
                        >
                          <Icon name="sparkle" size={12} /> {ch.prize_description.toUpperCase()}
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

      {/* ─── Bottom CTA (gold-block) ─── */}
      <section className="px-5 mb-8 mt-6">
        <div className="c-gold-block p-5">
          <div
            className="w-10 h-10 flex items-center justify-center mb-3"
            style={{ background: "var(--ink-strong)", color: "var(--gold-c)" }}
          >
            <Icon name="store" size={20} />
          </div>
          <div className="c-kicker mb-2" style={{ color: "var(--ink-strong)" }}>
            § OWN A FOOD BUSINESS?
          </div>
          <h3
            className="c-hero"
            style={{
              fontSize: 28,
              lineHeight: 0.94,
              color: "var(--ink-strong)",
              marginBottom: 8,
            }}
          >
            Get Listed.
            <br />
            Free.
          </h3>
          <p
            className="c-body-sm mb-4 max-w-md"
            style={{ fontSize: 12, color: "var(--ink-strong)", opacity: 0.85 }}
          >
            List your restaurant, food truck, or cart on Hub City. Reach
            customers, manage orders, and post daily specials.
          </p>
          <Link href="/signup" className="c-btn c-btn-primary">
            GET LISTED FREE →
          </Link>
        </div>
      </section>
    </div>
  );
}
