"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import EditorialHeader from "@/components/ui/EditorialHeader";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import Card from "@/components/ui/Card";
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

// ─── Category Config ───────────────────────────────
const categories: { label: string; value: string; iconName: IconName; color: string }[] = [
  { label: "All", value: "all", iconName: "flame", color: "#F2A900" },
  { label: "Restaurants", value: "restaurant", iconName: "utensils", color: "#FF6B6B" },
  { label: "Food Trucks", value: "food_truck", iconName: "truck", color: "#22C55E" },
  { label: "Carts", value: "cart", iconName: "cart", color: "#06B6D4" },
];

const quickFilters: { label: string; iconName: IconName; filter: string }[] = [
  { label: "Open Now", iconName: "check", filter: "open" },
  { label: "Order Pickup", iconName: "shopping", filter: "pickup" },
  { label: "Food Trucks", iconName: "truck", filter: "trucks" },
  { label: "Deals", iconName: "tag", filter: "deals" },
];

const moodSections: { title: string; subtitle: string; iconName: IconName; color: string; filter: string }[] = [
  { title: "Late Night Eats", subtitle: "Open past 10 PM", iconName: "moon", color: "#8B5CF6", filter: "late_night" },
  { title: "Always Open", subtitle: "24/7 spots that never close", iconName: "clock", color: "#06B6D4", filter: "always_open" },
  { title: "Quick Bites", subtitle: "In and out under 15 min", iconName: "bolt", color: "#F2A900", filter: "quick" },
  { title: "Family Style", subtitle: "Big portions, bigger love", iconName: "family", color: "#22C55E", filter: "family" },
];

const comptonfavs: { name: string; iconName: IconName; color: string; search: string }[] = [
  { name: "BBQ", iconName: "meat", color: "#DC2626", search: "bbq" },
  { name: "Tacos", iconName: "taco", color: "#EA580C", search: "taco" },
  { name: "Burgers", iconName: "burger", color: "#D97706", search: "burger" },
  { name: "Seafood", iconName: "shrimp", color: "#0284C7", search: "seafood" },
  { name: "Wings", iconName: "wings", color: "#B91C1C", search: "wing" },
  { name: "Soul Food", iconName: "bowl", color: "#7C3AED", search: "soul" },
  { name: "Mexican", iconName: "taco", color: "#15803D", search: "mexican" },
  { name: "Desserts", iconName: "donut", color: "#EC4899", search: "dessert" },
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
  // Try short form first (our DB uses short), then full
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

// ─── Star Rating Component ─────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width="10" height="10" viewBox="0 0 24 24" fill={s <= Math.round(rating) ? "#F2A900" : "none"} stroke={s <= Math.round(rating) ? "#F2A900" : "rgba(255,255,255,0.15)"} strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

// ─── Food Card Component ───────────────────────────
function FoodCard({ business, featured = false }: { business: Business; featured?: boolean }) {
  const heroImage = business.image_urls?.[0];
  // Per-vehicle live state lives on vendor_vehicles now; the business
  // card just flags mobile fleets generically.
  const isLive = business.is_mobile_vendor === true;
  const open = isOpenNow(business.hours);
  const rating = Number(business.rating_avg || 0);

  if (featured) {
    return (
      <Link href={`/business/${business.slug || business.id}`} className="block shrink-0 w-[260px] press">
        <div className="relative h-[180px] rounded-2xl overflow-hidden border border-border-subtle">
          {heroImage ? (
            <Image src={heroImage} alt={business.name} fill className="object-cover" sizes="260px" />
          ) : (
            <div className="w-full h-full art-food" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
            {isLive && (
              <span className="inline-flex items-center gap-1 bg-emerald/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-[9px] font-bold text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                LIVE
              </span>
            )}
            {!isLive && open && (
              <span className="inline-flex items-center gap-1 bg-emerald/20 backdrop-blur-sm border border-emerald/30 rounded-full px-2 py-0.5 text-[9px] font-semibold text-emerald">
                Open
              </span>
            )}
            {business.accepts_orders && (
              <span className="inline-flex items-center gap-1 bg-gold/20 backdrop-blur-sm border border-gold/30 rounded-full px-2 py-0.5 text-[9px] font-bold text-gold ml-auto">
                Order Now
              </span>
            )}
          </div>

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="font-heading font-bold text-sm leading-tight mb-1 drop-shadow-lg">{business.name}</h3>
            <div className="flex items-center gap-2">
              <Stars rating={rating} />
              <span className="text-[10px] text-white/50">({business.rating_count})</span>
            </div>
            {business.is_mobile_vendor && (
              <p className="text-[10px] text-white/60 mt-1 truncate">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="#F2A900" className="inline mr-0.5 -mt-px"><circle cx="12" cy="12" r="8"/></svg>
                Track live on the map
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/business/${business.slug || business.id}`} className="block press">
      <Card variant="glass" hover padding={false}>
        <div className="flex gap-0">
          {/* Image */}
          <div className="w-[110px] h-[110px] shrink-0 relative overflow-hidden">
            {heroImage ? (
              <Image src={heroImage} alt={business.name} fill className="object-cover" sizes="110px" />
            ) : (
              <div className="w-full h-full art-food flex items-center justify-center">
                <Icon name={business.is_mobile_vendor ? "truck" : "utensils"} size={24} />
              </div>
            )}
            {isLive && (
              <div className="absolute top-1.5 left-1.5 bg-emerald/90 backdrop-blur-sm rounded-full px-1.5 py-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[8px] font-bold text-white">LIVE</span>
              </div>
            )}
            {/* Top accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-coral/50 to-transparent" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 p-3">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-heading font-bold text-[13px] truncate">{business.name}</h3>
              <div className="flex items-center gap-1 shrink-0">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#F2A900"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <span className="text-[11px] font-bold">{rating.toFixed(1)}</span>
              </div>
            </div>

            {business.description && (
              <p className="text-[11px] text-white/40 line-clamp-1 mb-2">{business.description}</p>
            )}

            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              {open && (
                <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald bg-emerald/10 border border-emerald/20 rounded-full px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
                  Open
                </span>
              )}
              {business.is_mobile_vendor && (
                <span className="text-[9px] font-semibold text-coral bg-coral/10 rounded-full px-2 py-0.5">Food Truck</span>
              )}
              {business.accepts_orders && (
                <span className="text-[9px] font-semibold text-gold bg-gold/10 rounded-full px-2 py-0.5">Pickup</span>
              )}
              {business.min_order > 0 && (
                <span className="text-[9px] text-white/25">${(business.min_order / 100).toFixed(0)} min</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {business.address && !business.is_mobile_vendor && (
                <span className="text-[10px] text-white/25 truncate">{business.address.split(",")[0]}</span>
              )}
              {business.is_mobile_vendor && (
                <span className="text-[10px] text-white/25 truncate inline-flex items-center gap-0.5">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="#F2A900" className="shrink-0"><circle cx="12" cy="12" r="8"/></svg>
                  Track on the map
                </span>
              )}
              {business.accepts_orders && (
                <span className="ml-auto shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-gold/10 border border-gold/20 text-[9px] font-bold text-gold">
                  Order Now
                  <svg width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M2 1l3 3-3 3" /></svg>
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

// ─── Special Deal Card (upgraded) ──────────────────
function DealCard({ special }: { special: FoodSpecial }) {
  const bizName = (special.business as unknown as { name: string })?.name ?? "Local Spot";
  const bizSlug = (special.business as unknown as { slug: string })?.slug ?? "";
  const discount = special.original_price > 0
    ? Math.round(((special.original_price - special.special_price) / special.original_price) * 100)
    : 0;

  return (
    <Link href={bizSlug ? `/business/${bizSlug}` : "#"} className="block shrink-0 w-[180px] press">
      <Card variant="glass" hover className="h-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-white/40 truncate">{bizName}</span>
          {discount > 0 && (
            <span className="bg-coral/15 text-coral text-[10px] font-bold rounded-full px-2 py-0.5">
              -{discount}%
            </span>
          )}
        </div>
        <h3 className="font-heading font-bold text-[13px] leading-tight mb-2 line-clamp-2">{special.title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-white/30 text-xs line-through">${(special.original_price / 100).toFixed(2)}</span>
          <span className="font-heading font-bold text-gold text-lg">${(special.special_price / 100).toFixed(2)}</span>
        </div>
      </Card>
    </Link>
  );
}

// ─── Promo Card ────────────────────────────────────
function PromoCard({ promo }: { promo: FoodPromotion }) {
  const bizName = (promo.business as unknown as { name: string })?.name ?? "Local Business";
  const typeIcons: Record<string, IconName> = {
    bogo: "sparkle", discount: "dollar", free_item: "tag", bundle: "shopping", loyalty: "star",
  };
  const typeColors: Record<string, string> = {
    bogo: "#FF6B6B", discount: "#22C55E", free_item: "#06B6D4", bundle: "#F2A900", loyalty: "#8B5CF6",
  };
  const color = typeColors[promo.promo_type] || "#F2A900";

  return (
    <Card
      variant="glass"
      padding={false}
      style={{ borderColor: `${color}15` }}
    >
      <div className="p-4 flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}12` }}
        >
          <Icon name={typeIcons[promo.promo_type] || "tag"} size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-white/30 mb-0.5">{bizName}</p>
          <h3 className="font-heading font-bold text-[13px] mb-1">{promo.title}</h3>
          {promo.description && (
            <p className="text-[11px] text-white/40 line-clamp-2 mb-2">{promo.description}</p>
          )}
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-bold rounded-full px-2.5 py-0.5"
              style={{ background: `${color}15`, color }}
            >
              {promo.promo_type === "bogo" ? "Buy 1 Get 1" : promo.promo_type === "discount" ? `${promo.discount_percent || ""}% Off` : promo.promo_type}
            </span>
            {promo.promo_code && (
              <span className="text-[10px] font-mono bg-white/[0.04] px-2 py-0.5 rounded text-gold border border-white/[0.06]">
                {promo.promo_code}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────
export default function FoodPage() {
  const activeCity = useActiveCity();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedOwnership, setSelectedOwnership] = useState<string[]>([]);

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
  const openNow = useMemo(() => filteredBusinesses.filter(b => isOpenNow(b.hours)), [filteredBusinesses]);
  const lateNight = useMemo(() => filteredBusinesses.filter(b => isLateNight(b.hours)), [filteredBusinesses]);
  const alwaysOpen = useMemo(() => filteredBusinesses.filter(b => isAlwaysOpen(b.hours)), [filteredBusinesses]);
  const withPickup = useMemo(() => filteredBusinesses.filter(b => b.accepts_orders), [filteredBusinesses]);

  return (
    <div className="animate-fade-in pb-safe">
      {/* ─── Editorial Hero / Masthead ─── */}
      <div className="relative h-64 overflow-hidden">
        <Image src="/images/generated/food-hero.png" alt={`Food in ${activeCity?.name ?? "your city"}`} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/85 to-ink" />
        <div
          className="absolute inset-0 opacity-[0.07] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.9 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E\")",
          }}
        />

        <div className="absolute inset-0 flex flex-col justify-end px-5 pb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-editorial text-gold tabular-nums">
              VOL · 01 · ISSUE EAT
            </span>
            <span className="block w-1 h-1 rounded-full bg-gold/60" />
            <span className="text-[10px] font-bold uppercase tracking-editorial text-white/40">
              {activeCity?.name ?? "Local"}
            </span>
          </div>
          <h1 className="masthead text-white text-[44px]">EAT.</h1>
          <div className="mt-3 flex items-center gap-3">
            <span className="block h-[2px] w-8 bg-gold" />
            <span className="text-[10px] font-bold uppercase tracking-editorial text-ivory/60">
              The kitchen issue · {activeCity?.name ?? "your city"}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Search ─── */}
      <div className="px-5 -mt-5 mb-5 relative z-10">
        <div className="relative">
          <div className="flex items-center gap-3 bg-card border border-border-subtle rounded-2xl px-4 py-3.5 focus-within:border-gold/30 transition-all shadow-lg shadow-black/20">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-white/30 shrink-0">
              <circle cx="8" cy="8" r="5" />
              <path d="M12 12l4 4" />
            </svg>
            <input
              type="text"
              placeholder="Search restaurants, trucks, dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-white placeholder:text-white/25 w-full outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-white/30 hover:text-white press">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Quick Filters ─── */}
      <div className="flex gap-2 px-5 mb-5 overflow-x-auto scrollbar-hide pb-1">
        {quickFilters.map((f) => (
          <button
            key={f.filter}
            onClick={() => {
              if (f.filter === "trucks") setActiveTab("food_truck");
              else if (f.filter === "pickup") setSearch("order");
              else if (f.filter === "deals") { /* scroll to deals */ }
            }}
            className="flex items-center gap-1.5 shrink-0 bg-white/[0.04] border border-white/[0.06] rounded-full px-3.5 py-2 text-[11px] font-semibold text-white/60 press hover:bg-white/[0.08] transition-all"
          >
            <Icon name={f.iconName} size={14} />
            {f.label}
          </button>
        ))}
      </div>

      {/* ─── City + Ownership Filter ─── */}
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

      {/* ─── Category Tabs ─── */}
      <div className="flex gap-2 px-5 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {categories.map((cat) => {
          const isActive = activeTab === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setActiveTab(cat.value)}
              className="flex items-center gap-1.5 shrink-0 rounded-full px-4 py-2 text-[12px] font-semibold transition-all press"
              style={{
                background: isActive ? `${cat.color}20` : "transparent",
                color: isActive ? cat.color : "rgba(255,255,255,0.4)",
                border: `1px solid ${isActive ? `${cat.color}30` : "rgba(255,255,255,0.06)"}`,
              }}
            >
              <Icon name={cat.iconName} size={14} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ─── Food Truck Tracker (live map + fleet cards) ─── */}
      <FoodTruckTracker />

      {/* ─── Local Favorites ─── */}
      {!search && activeTab === "all" && (
        <section className="mb-6">
          <div className="px-5 mb-3">
            <h2 className="font-heading font-bold text-base">Local Favorites</h2>
            <p className="text-[11px] text-white/30">The flavors that define our city</p>
          </div>
          <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
            {comptonfavs.map((fav) => (
              <button
                key={fav.name}
                onClick={() => setSearch(fav.search)}
                className="flex flex-col items-center gap-2 shrink-0 press"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center border transition-all hover:scale-105"
                  style={{ background: `${fav.color}10`, borderColor: `${fav.color}20` }}
                >
                  <Icon name={fav.iconName} size={24} />
                </div>
                <span className="text-[10px] font-semibold text-white/50">{fav.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ─── Today's Deals ─── */}
      {specials.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between px-5 mb-3">
            <div>
              <h2 className="font-heading font-bold text-base flex items-center gap-2">
                <Icon name="tag" size={18} className="text-coral" /> Today&apos;s Deals
              </h2>
              <p className="text-[11px] text-white/30">Limited time specials</p>
            </div>
            <Link href="/food/specials" className="text-[11px] text-gold font-semibold press">
              See All
            </Link>
          </div>
          <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
            {specials.slice(0, 8).map((special, i) => (
              <div key={special.id} className="animate-slide-in" style={{ animationDelay: `${i * 60}ms` }}>
                <DealCard special={special} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Featured Spots (horizontal scroll) ─── */}
      {!search && featuredSpots.length > 0 && (
        <section className="mb-6">
          <div className="px-5 mb-3">
            <EditorialHeader kicker={`${(activeCity?.name ?? "LOCAL").toUpperCase()} EATS`} title="Featured" subtitle="Community favorites you can't miss" />
          </div>
          <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
            {featuredSpots.map((biz) => (
              <FoodCard key={biz.id} business={biz} featured />
            ))}
          </div>
        </section>
      )}

      {/* ─── Order Pickup ─── */}
      {!search && withPickup.length > 0 && (
        <section className="px-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-heading font-bold text-base flex items-center gap-2">
                <Icon name="shopping" size={18} /> Order for Pickup
              </h2>
              <p className="text-[11px] text-white/30">Skip the wait — order ahead</p>
            </div>
          </div>
          <div className="space-y-2.5 stagger">
            {withPickup.slice(0, 5).map((biz) => (
              <FoodCard key={biz.id} business={biz} />
            ))}
          </div>
        </section>
      )}

      {/* ─── Mood Sections ─── */}
      {!search && activeTab === "all" && (
        <section className="px-5 mb-6">
          <h2 className="font-heading font-bold text-base mb-3">Browse by Mood</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {moodSections.map((mood) => {
              const count = mood.filter === "late_night" ? lateNight.length
                : mood.filter === "always_open" ? alwaysOpen.length
                : mood.filter === "quick" ? filteredBusinesses.length
                : filteredBusinesses.length;
              return (
                <button
                  key={mood.filter}
                  onClick={() => {
                    // Set search to trigger relevant results
                    if (mood.filter === "late_night" || mood.filter === "always_open") {
                      // These use hours-based filtering, just scroll to the section
                    }
                  }}
                  className="relative overflow-hidden rounded-xl p-4 text-left press transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${mood.color}10, ${mood.color}03)`,
                    border: `1px solid ${mood.color}15`,
                  }}
                >
                  <Icon name={mood.iconName} size={24} className="block mb-1" />
                  <p className="font-heading font-bold text-[12px]" style={{ color: mood.color }}>{mood.title}</p>
                  <p className="text-[10px] text-white/30">{mood.subtitle}</p>
                  {count > 0 && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold rounded-full px-2 py-0.5" style={{ background: `${mood.color}15`, color: mood.color }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── Late Night Eats ─── */}
      {!search && lateNight.length > 0 && activeTab === "all" && (
        <section className="mb-6">
          <div className="px-5 mb-3">
            <h2 className="font-heading font-bold text-base flex items-center gap-2">
              <Icon name="moon" size={18} /> Late Night Eats
            </h2>
            <p className="text-[11px] text-white/30">Open past 10 PM for those midnight cravings</p>
          </div>
          <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
            {lateNight.slice(0, 8).map((biz) => (
              <FoodCard key={biz.id} business={biz} featured />
            ))}
          </div>
        </section>
      )}

      {/* ─── Promotions ─── */}
      {promotions.length > 0 && (
        <section className="px-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-heading font-bold text-base flex items-center gap-2">
                <Icon name="dollar" size={18} /> Promos & Deals
              </h2>
              <p className="text-[11px] text-white/30">Save on your favorites</p>
            </div>
          </div>
          <div className="space-y-2.5 stagger">
            {promotions.map((promo) => (
              <PromoCard key={promo.id} promo={promo} />
            ))}
          </div>
        </section>
      )}

      {/* ─── All Food Spots ─── */}
      <section className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-heading font-bold text-base">
              {search ? `Results for "${search}"` : activeTab === "all" ? "All Food Spots" : `${categories.find(c => c.value === activeTab)?.label || "Food Spots"}`}
            </h2>
            <p className="text-[11px] text-white/30">{filteredBusinesses.length} spots</p>
          </div>
          {(search || activeTab !== "all" || selectedCities.length > 0 || selectedOwnership.length > 0) && (
            <button
              onClick={() => { setSearch(""); setActiveTab("all"); setSelectedCities([]); setSelectedOwnership([]); }}
              className="flex items-center gap-1 bg-gold/10 rounded-full px-2.5 py-1 border border-gold/20 press"
            >
              <span className="text-[10px] font-medium text-gold">Clear</span>
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gold" strokeLinecap="round"><path d="M3 3l4 4M7 3l-4 4" /></svg>
            </button>
          )}
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
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                  <Icon name="utensils" size={30} />
                </div>
                <p className="text-sm font-semibold mb-1">No food spots found</p>
                <p className="text-xs text-white/30">Try a different search or category</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ─── Food Tours ─── */}
      {tours.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between px-5 mb-3">
            <div>
              <h2 className="font-heading font-bold text-base flex items-center gap-2">
                <Icon name="map-pin" size={18} /> Food Tours
              </h2>
              <p className="text-[11px] text-white/30">Curated culinary journeys</p>
            </div>
            <Link href="/food/tours" className="text-[11px] text-gold font-semibold press">See All</Link>
          </div>
          <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
            {tours.map((tour, i) => (
              <Link key={tour.id} href={`/food/tours/${tour.slug}`} className="block shrink-0 w-[220px] press">
                <div className="relative h-[140px] rounded-2xl overflow-hidden border border-border-subtle">
                  {tour.image_url ? (
                    <Image src={tour.image_url} alt={tour.name} fill className="object-cover" sizes="220px" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-coral/20 to-gold/10 flex items-center justify-center">
                      <Icon name="utensils" size={36} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="font-heading font-bold text-[12px] mb-1">{tour.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gold font-semibold">{tour.stops?.length ?? 0} stops</span>
                      {tour.estimated_duration != null && (
                        <span className="text-[10px] text-white/40">~{tour.estimated_duration} min</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── Food Challenges ─── */}
      {challenges.length > 0 && (
        <section className="px-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-heading font-bold text-base flex items-center gap-2">
                <Icon name="trophy" size={18} /> Food Challenges
              </h2>
              <p className="text-[11px] text-white/30">Think you can handle it?</p>
            </div>
            <Link href="/food/challenges" className="text-[11px] text-gold font-semibold press">See All</Link>
          </div>
          <div className="space-y-2.5 stagger">
            {challenges.map((ch) => {
              const typeColors: Record<string, string> = {
                eating: "#FF6B6B", collection: "#F2A900", photo: "#22C55E", tasting: "#06B6D4", review: "#8B5CF6", passport: "#EC4899",
              };
              const color = typeColors[ch.challenge_type] || "#F2A900";
              return (
                <Card key={ch.id} variant="glass" hover style={{ borderLeftWidth: 3, borderLeftColor: color }}>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}12` }}>
                      <Icon name={ch.challenge_type === "eating" ? "trophy" : ch.challenge_type === "photo" ? "camera" : "star"} size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-bold text-[13px] mb-1">{ch.name}</h3>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold rounded-full px-2 py-0.5" style={{ background: `${color}15`, color }}>{ch.challenge_type}</span>
                        {ch.participant_count > 0 && <span className="text-[10px] text-white/30">{ch.participant_count} joined</span>}
                      </div>
                      {ch.prize_description && (
                        <p className="text-[11px] text-gold font-semibold flex items-center gap-1"><Icon name="sparkle" size={12} /> {ch.prize_description}</p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── Bottom CTA ─── */}
      <section className="px-5 mb-8">
        <div className="relative overflow-hidden rounded-2xl border border-gold/20 p-5" style={{ background: "linear-gradient(135deg, rgba(242,169,0,0.08), rgba(255,107,107,0.04))" }}>
          <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
            <svg viewBox="0 0 100 100" fill="none" stroke="#F2A900" strokeWidth="1">
              <circle cx="80" cy="20" r="40" />
              <circle cx="80" cy="20" r="25" />
            </svg>
          </div>
          <div className="relative">
            <Icon name="store" size={24} className="block mb-2" />
            <h3 className="font-heading font-bold text-lg mb-1">Own a Food Business?</h3>
            <p className="text-[12px] text-white/40 leading-relaxed mb-3">
              List your restaurant, food truck, or cart on Culture. Reach customers, manage orders, and post daily specials.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-gold text-midnight rounded-full px-4 py-2.5 text-[12px] font-bold press hover:bg-gold-light transition-colors"
            >
              Get Listed Free
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 7h4M7 5v4" /></svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
