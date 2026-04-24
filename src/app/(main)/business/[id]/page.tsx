import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import SaveButton from "@/components/ui/SaveButton";
import {
  EditorialNumber,
  SectionKicker,
  SnapCarousel,
  EditorialCard,
  Tag,
  IssueDivider,
} from "@/components/ui/editorial";
import { createClient } from "@/lib/supabase/server";
import type { Business, BusinessReview } from "@/types/database";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/branding";
import ReviewSection from "./ReviewSection";
import HeroGallery from "@/components/business/HeroGallery";
import ShareQrButton from "@/components/business/ShareQrButton";
import OpenNowBadge from "@/components/business/OpenNowBadge";

const categoryArt: Record<string, string> = {
  restaurant: "art-food",
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
  women_owned: "person",
  woman_owned: "person",
  hispanic_owned: "flag",
  veteran_owned: "shield",
  locally_owned: "pin",
  lgbtq_friendly: "flag",
  family_owned: "family",
  eco_friendly: "tree",
  city_certified: "landmark",
  local_favorite: "star",
  new_business: "sparkle",
  compton_original: "house",
};

const dayFullNames: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

function formatBadgeLabel(badge: string): string {
  return badge.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

async function loadBusiness(idOrSlug: string): Promise<Business | null> {
  const supabase = await createClient();
  let { data: biz } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", idOrSlug)
    .single();
  if (!biz) {
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", idOrSlug)
      .single();
    biz = data;
  }
  return (biz as Business | null) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const biz = await loadBusiness(id);
  if (!biz) {
    return { title: "Business not found" };
  }
  const url = `${SITE_DOMAIN}/business/${biz.slug || biz.id}`;
  const description =
    biz.description?.slice(0, 200) ||
    `${biz.name} on ${SITE_NAME} — ${biz.category} in ${biz.city?.name || "Compton"}.`;
  const heroImage = biz.image_urls?.[0];

  return {
    title: `${biz.name} — ${SITE_NAME}`,
    description,
    openGraph: {
      title: biz.name,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      images: heroImage ? [{ url: heroImage, width: 1200, height: 630, alt: biz.name }] : undefined,
    },
    twitter: {
      card: heroImage ? "summary_large_image" : "summary",
      title: biz.name,
      description,
      images: heroImage ? [heroImage] : undefined,
    },
    alternates: { canonical: url },
  };
}

function buildLocalBusinessJsonLd(biz: Business, profileUrl: string): Record<string, unknown> {
  const days: Record<string, string> = {
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday",
    sun: "Sunday",
  };
  const openingHoursSpecification = biz.hours
    ? Object.entries(biz.hours)
        .map(([day, value]) => {
          if (!value) return null;
          const dayOfWeek = days[day];
          if (!dayOfWeek) return null;
          return {
            "@type": "OpeningHoursSpecification",
            dayOfWeek,
            opens: value.open,
            closes: value.close,
          };
        })
        .filter(Boolean)
    : undefined;

  const obj: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": biz.category === "restaurant" ? "Restaurant" : "LocalBusiness",
    name: biz.name,
    url: profileUrl,
    image: biz.image_urls?.length ? biz.image_urls : undefined,
    address: biz.address
      ? {
          "@type": "PostalAddress",
          streetAddress: biz.address,
          addressLocality: biz.city?.name || "Compton",
          addressRegion: "CA",
          addressCountry: "US",
        }
      : undefined,
    telephone: biz.phone || undefined,
    description: biz.description || undefined,
    geo:
      biz.latitude && biz.longitude
        ? {
            "@type": "GeoCoordinates",
            latitude: biz.latitude,
            longitude: biz.longitude,
          }
        : undefined,
    openingHoursSpecification,
    aggregateRating:
      biz.rating_count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(biz.rating_avg).toFixed(1),
            reviewCount: biz.rating_count,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    priceRange: biz.min_order > 0 ? "$".repeat(Math.min(4, Math.ceil(biz.min_order / 2000))) : undefined,
  };

  // Strip undefined entries.
  for (const k of Object.keys(obj)) {
    if (obj[k] === undefined) delete obj[k];
  }
  return obj;
}

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const biz = await loadBusiness(id);
  if (!biz) notFound();

  const artClass = categoryArt[biz.category] ?? "art-city";

  const isRetail = biz.category === "retail";
  const profileUrl = `${SITE_DOMAIN}/business/${biz.slug || biz.id}`;

  // Fetch other active locations for multi-city presence
  const { data: otherLocationsRaw } = await supabase
    .from("business_locations")
    .select("city:cities(name, slug)")
    .eq("business_id", biz.id)
    .eq("is_active", true)
    .neq("is_primary", true)
    .limit(5);
  type OtherLocation = { city: { name: string; slug: string } | null };
  const otherLocations: OtherLocation[] = (otherLocationsRaw ?? []) as unknown as OtherLocation[];
  // Only include rows that have a linked city
  const otherCities = otherLocations
    .map((l) => l.city)
    .filter((c): c is { name: string; slug: string } => c !== null);

  // Fetch menu items
  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("*")
    .eq("business_id", biz.id)
    .eq("is_available", true)
    .order("sort_order")
    .limit(isRetail ? 8 : 6);

  // Owner profile + a few recent posts/events — so visitors can jump to
  // the person behind the storefront. Only runs when the business has an
  // owner linked.
  type OwnerSummary = {
    id: string;
    display_name: string;
    handle: string | null;
    avatar_url: string | null;
    bio: string | null;
    role: string | null;
    verification_status: string | null;
  };
  type RecentPost = {
    id: string;
    body: string;
    image_url: string | null;
    media_type: string | null;
    created_at: string;
  };
  type RecentEvent = {
    id: string;
    slug: string | null;
    title: string;
    image_url: string | null;
    start_date: string;
    location_name: string | null;
  };
  let owner: OwnerSummary | null = null;
  let ownerRecentPosts: RecentPost[] = [];
  let ownerRecentEvents: RecentEvent[] = [];
  if (biz.owner_id) {
    const { data: ownerRow } = await supabase
      .from("profiles")
      .select("id, display_name, handle, avatar_url, bio, role, verification_status")
      .eq("id", biz.owner_id)
      .maybeSingle();
    owner = (ownerRow as OwnerSummary | null) ?? null;

    const todayISO = new Date().toISOString().slice(0, 10);
    const [postsRes, eventsRes] = await Promise.all([
      supabase
        .from("posts")
        .select("id, body, image_url, media_type, created_at")
        .eq("author_id", biz.owner_id)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("events")
        .select("id, slug, title, image_url, start_date, location_name")
        .eq("created_by", biz.owner_id)
        .eq("is_published", true)
        .gte("start_date", todayISO)
        .order("start_date", { ascending: true })
        .limit(2),
    ]);
    ownerRecentPosts = (postsRes.data ?? []) as RecentPost[];
    ownerRecentEvents = (eventsRes.data ?? []) as RecentEvent[];
  }

  // Fetch food promotions / coupons
  const { data: promotions } = await supabase
    .from("food_promotions")
    .select("*")
    .eq("business_id", biz.id)
    .eq("is_active", true)
    .gte("valid_until", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(3);

  // Fetch services if accepts bookings
  let services: { id: string; name: string; description: string | null; duration: number; price: number }[] = [];
  if (biz.accepts_bookings) {
    const { data: svcData } = await supabase
      .from("services")
      .select("id, name, description, duration, price")
      .eq("business_id", biz.id)
      .eq("is_available", true)
      .order("sort_order")
      .limit(6);
    services = (svcData ?? []) as typeof services;
  }

  // Featured reviews — top picks (manually flagged) or otherwise the
  // top-rated reviews with a body. Limit 3.
  let { data: featuredReviews } = await supabase
    .from("business_reviews")
    .select("*, reviewer:profiles!business_reviews_reviewer_id_fkey(display_name, avatar_url)")
    .eq("business_id", biz.id)
    .eq("is_published", true)
    .eq("is_featured", true)
    .order("rating", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(3);
  if (!featuredReviews || featuredReviews.length === 0) {
    const { data: topReviews } = await supabase
      .from("business_reviews")
      .select("*, reviewer:profiles!business_reviews_reviewer_id_fkey(display_name, avatar_url)")
      .eq("business_id", biz.id)
      .eq("is_published", true)
      .gte("rating", 4)
      .not("body", "is", null)
      .order("rating", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(3);
    featuredReviews = topReviews ?? [];
  }
  const typedFeatured = (featuredReviews || []) as (BusinessReview & {
    reviewer?: { display_name: string | null; avatar_url: string | null } | null;
  })[];

  const heroImages = biz.image_urls && biz.image_urls.length > 0 ? biz.image_urls : [];
  const jsonLd = buildLocalBusinessJsonLd(biz, profileUrl);

  // Determine "today" for hours table highlight.
  const now = new Date();
  const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const today = dayNames[now.getDay()];
  const todayHours = biz.hours?.[today];

  const categoryLabel = (biz.category || "local").toUpperCase();
  const cityName = biz.city?.name || "Compton";
  const todayLine = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <article className="animate-fade-in pb-safe bg-midnight">
      {/* SEO JSON-LD */}
      <script
        type="application/ld+json"
        // Schema.org JSON-LD payload — safe content, controlled by us.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Cover ── */}
      <div className="relative">
        {/* HeroGallery is an existing component; we keep it but wrap the
            overlay content so it matches the editorial treatment. */}
        <HeroGallery
          images={heroImages}
          alt={biz.name}
          fallback={<div className={`w-full h-full ${artClass} pattern-dots`} />}
        />

        {/* Duotone + paper overlay so the hero feels like HeroBlock even
            though the carousel owns the img element. */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(0,0,0,0)_0%,rgba(0,0,0,0.5)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 via-black/20 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black via-black/80 to-transparent" />

        {/* Crop-mark ticks — editorial hero signature */}
        <svg width="22" height="22" className="absolute top-4 left-4 text-gold/70 pointer-events-none z-10" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M2 8 V2 H8" />
        </svg>
        <svg width="22" height="22" className="absolute top-4 right-4 text-gold/70 pointer-events-none z-10" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M14 2 H20 V8" />
        </svg>
        <svg width="22" height="22" className="absolute bottom-4 left-4 text-gold/50 pointer-events-none z-10" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M2 14 V20 H8" />
        </svg>
        <svg width="22" height="22" className="absolute bottom-4 right-4 text-gold/50 pointer-events-none z-10" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M20 14 V20 H14" />
        </svg>

        {/* Back button */}
        <div className="absolute top-4 left-12 z-20">
          <Link
            href={biz.category === "restaurant" ? "/food" : "/business"}
            className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center press"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-ivory">
              <path d="M11 13L7 9l4-4" />
            </svg>
          </Link>
        </div>

        {/* Save button */}
        <div className="absolute top-4 right-12 z-20">
          <SaveButton itemType="business" itemId={biz.id} />
        </div>

        {/* Rating pill (gold-only) */}
        {biz.rating_avg > 0 && (
          <div className="absolute top-16 left-5 z-10 bg-black/50 backdrop-blur-sm border border-gold/25 rounded-full px-3 py-1 flex items-center gap-1.5">
            <Icon name="star" size={12} className="text-gold" />
            <span className="text-[11px] font-bold text-ivory tabular-nums">{Number(biz.rating_avg).toFixed(1)}</span>
            <span className="text-[9px] text-ivory/60">({biz.rating_count})</span>
          </div>
        )}

        {/* Bottom content — kicker, title, gold rule, meta */}
        <div className="absolute inset-x-0 bottom-0 px-6 pb-7 z-10">
          <div className="flex items-center gap-2 mb-3">
            <SectionKicker tone="gold">{categoryLabel}</SectionKicker>
            <OpenNowBadge hours={biz.hours} />
            {biz.district && (
              <Tag tone="default" size="sm">District {biz.district}</Tag>
            )}
          </div>

          <h1 className="font-display text-[38px] sm:text-[52px] leading-[0.95] tracking-tight text-ivory max-w-[24ch]">
            {biz.name}
          </h1>

          <div className="mt-5 h-px w-16 bg-gold" />

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] uppercase tracking-editorial-tight text-ivory/70">
            <span className="text-ivory">{categoryLabel}</span>
            <span className="text-ivory/40">·</span>
            <span>{cityName}</span>
            {biz.address && (
              <>
                <span className="text-ivory/40">·</span>
                <span className="truncate max-w-[22ch]">{biz.address}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Byline Strip ── */}
      <div className="px-5 mt-6 flex items-baseline gap-4">
        <EditorialNumber n={1} size="sm" />
        <SectionKicker tone="gold">Feature · {categoryLabel}</SectionKicker>
        <span className="flex-1 h-px bg-gradient-to-r from-gold/40 via-gold/15 to-transparent" />
        <span className="text-[10px] uppercase tracking-editorial-tight text-ivory/55 whitespace-nowrap">
          {cityName} · {todayLine}
        </span>
      </div>

      {/* ── Multi-city presence ── */}
      {otherCities.length > 0 && (
        <div className="px-5 mt-4 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-editorial-tight text-ivory/50 font-semibold shrink-0">
            Also in
          </span>
          {otherCities.map((city) => (
            <Link
              key={city.slug}
              href={`/${city.slug}`}
              className="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-[11px] font-medium text-ivory/70 hover:text-ivory hover:border-gold/30 transition-colors"
            >
              {city.name}
            </Link>
          ))}
        </div>
      )}

      {/* ── City Badges ── */}
      {biz.badges && biz.badges.length > 0 && (
        <div className="px-5 mt-6">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {biz.badges.map((badge) => (
              <div
                key={badge}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-gold/5 border border-gold/25"
              >
                <Icon name={badgeIcons[badge] || "tag"} size={14} className="text-gold" />
                <span className="text-[10px] uppercase tracking-editorial-tight font-bold text-gold whitespace-nowrap">
                  {formatBadgeLabel(badge)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Chain / Ads-Only Notice ── */}
      {biz.account_type === "ads_only" && (
        <div className="px-5 mt-4">
          <EditorialCard variant="ink" border="subtle" className="px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Icon name="globe" size={16} className="text-ivory/60 shrink-0" />
              <div>
                <p className="text-[11px] font-semibold text-ivory/70 uppercase tracking-editorial-tight">National Chain</p>
                <p className="text-[10px] text-ivory/50 mt-0.5">Visit their website or app for ordering &amp; reservations</p>
              </div>
            </div>
          </EditorialCard>
        </div>
      )}

      {/* ── Body — Magazine Column (About) ── */}
      {biz.description && (
        <section className="px-5 mt-8 max-w-[68ch]">
          <p className="font-display text-[22px] leading-snug text-ivory first-letter:font-display first-letter:text-[56px] first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:text-gold first-letter:leading-none">
            {biz.description}
          </p>
        </section>
      )}

      {/* ── Pull quote — the story tagline ── */}
      {biz.story && (
        <aside className="px-5 mt-8 max-w-[68ch]">
          <div className="border-l-2 border-gold pl-5 py-2">
            <p className="font-display text-[24px] leading-snug text-ivory/90 whitespace-pre-line line-clamp-4">
              &ldquo;{biz.story}&rdquo;
            </p>
            <p className="mt-2 text-[10px] uppercase tracking-editorial text-gold">
              {biz.name} · {cityName}
            </p>
          </div>
        </aside>
      )}

      {/* ── Action Strip ── */}
      <section className="sticky top-0 z-20 bg-midnight/85 backdrop-blur-md border-b border-gold/10 mt-6">
        <div className="px-5 py-3">
          <div className="grid grid-cols-4 gap-2">
            {([
              { label: "Call", iconName: "phone" as IconName, href: biz.phone ? `tel:${biz.phone}` : undefined },
              { label: "Directions", iconName: "navigation" as IconName, href: biz.address ? `https://maps.google.com/?q=${encodeURIComponent(biz.address)}` : undefined },
              { label: "Website", iconName: "globe" as IconName, href: biz.website ? (biz.website.startsWith("http") ? biz.website : `https://${biz.website}`) : undefined },
            ]).map((action) => {
              const isExternal = action.href?.startsWith("http");
              if (!action.href) {
                return (
                  <button
                    key={action.label}
                    type="button"
                    disabled
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-gold/15 bg-transparent py-3 opacity-40 cursor-not-allowed"
                  >
                    <Icon name={action.iconName} size={18} className="text-gold" />
                    <span className="text-[9px] font-semibold text-ivory/60 uppercase tracking-editorial-tight">{action.label}</span>
                  </button>
                );
              }
              return (
                <a
                  key={action.label}
                  href={action.href}
                  {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-gold/25 bg-transparent py-3 press hover:bg-gold/5 transition-colors"
                >
                  <Icon name={action.iconName} size={18} className="text-gold" />
                  <span className="text-[9px] font-semibold text-ivory/70 uppercase tracking-editorial-tight">{action.label}</span>
                </a>
              );
            })}
            <ShareQrButton
              url={profileUrl}
              title={biz.name}
              text={biz.description ?? undefined}
              accentColor="#F2A900"
            />
          </div>
        </div>
      </section>

      {/* ── Section 01 · Info ── */}
      <section className="px-5 mt-10">
        <div className="mb-4 flex items-baseline gap-3">
          <EditorialNumber n={1} size="md" />
          <SectionKicker tone="muted">The Essentials</SectionKicker>
        </div>
        <div className="rule-hairline mb-5" />

        <EditorialCard variant="ink" border="subtle" className="overflow-hidden">
          {/* Address */}
          <div className="p-4 flex items-center gap-3.5 border-b border-white/[0.05]">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gold/10 border border-gold/20">
              <Icon name="pin" size={18} className="text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] uppercase tracking-editorial-tight text-ivory/50">Address</p>
              <p className="font-heading text-sm font-bold text-ivory truncate mt-0.5">{biz.address}</p>
              {biz.district && <p className="text-[11px] text-ivory/70 mt-0.5">District {biz.district}</p>}
            </div>
          </div>

          {biz.phone && (
            <a href={`tel:${biz.phone}`} className="p-4 flex items-center gap-3.5 border-b border-white/[0.05] press">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gold/10 border border-gold/20">
                <Icon name="phone" size={18} className="text-gold" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-editorial-tight text-ivory/50">Phone</p>
                <p className="font-heading text-sm font-bold text-gold mt-0.5">{biz.phone}</p>
              </div>
            </a>
          )}

          {todayHours && (
            <div className="p-4 flex items-center gap-3.5 border-b border-white/[0.05]">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gold/10 border border-gold/20">
                <Icon name="clock" size={18} className="text-gold" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-editorial-tight text-ivory/50">Today</p>
                <p className="font-heading text-sm font-bold mt-0.5">
                  <span className="text-gold">Open</span>
                  <span className="text-ivory/70 font-normal"> · {typeof todayHours === "string" ? todayHours : `${todayHours.open} — ${todayHours.close}`}</span>
                </p>
              </div>
            </div>
          )}

          {biz.website && (
            <a
              href={biz.website.startsWith("http") ? biz.website : `https://${biz.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 flex items-center gap-3.5 press"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gold/10 border border-gold/20">
                <Icon name="globe" size={18} className="text-gold" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-editorial-tight text-ivory/50">Website</p>
                <p className="font-heading text-sm font-bold text-gold truncate mt-0.5">{biz.website}</p>
              </div>
            </a>
          )}
        </EditorialCard>
      </section>

      {/* ── Section 02 · Services (bookable) ── */}
      {biz.accepts_bookings && services.length > 0 && (
        <section className="px-5 mt-10">
          <div className="mb-4 flex items-baseline gap-3">
            <EditorialNumber n={2} size="md" />
            <SectionKicker tone="muted">Services</SectionKicker>
            <span className="ml-auto text-[10px] uppercase tracking-editorial-tight text-ivory/55">
              {services.length} available
            </span>
          </div>
          <div className="rule-hairline mb-5" />

          <div className="space-y-2.5">
            {services.map((svc) => (
              <EditorialCard key={svc.id} variant="ink" border="subtle" className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[18px] text-ivory leading-tight truncate">{svc.name}</p>
                    {svc.description && (
                      <p className="text-[11px] text-ivory/70 mt-1 line-clamp-1">{svc.description}</p>
                    )}
                    <p className="mt-2 text-[10px] uppercase tracking-editorial-tight text-ivory/55 flex items-center gap-1.5">
                      <Icon name="clock" size={12} className="text-gold" /> {svc.duration} min
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-[22px] text-gold leading-none">
                      ${(svc.price / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              </EditorialCard>
            ))}
          </div>

          <Link
            href={`/business/${biz.slug || biz.id}/book`}
            className="block mt-4 rounded-2xl bg-gold text-midnight p-4 press"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-heading font-bold text-base leading-none">Book Appointment</p>
                <p className="text-midnight/70 text-[11px] font-semibold mt-1.5 uppercase tracking-editorial-tight">
                  Select a service and time
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-midnight/10 flex items-center justify-center">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-midnight">
                  <path d="M5 10h10M12 6l4 4-4 4" />
                </svg>
              </div>
            </div>
          </Link>
        </section>
      )}

      {biz.accepts_bookings && services.length === 0 && (
        <section className="px-5 mt-10">
          <Link
            href={`/business/${biz.slug || biz.id}/book`}
            className="block rounded-2xl border border-gold/25 bg-transparent p-4 press hover:bg-gold/5 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-heading font-bold text-base text-ivory leading-none">Book Appointment</p>
                <p className="text-ivory/70 text-[11px] font-semibold mt-1.5 uppercase tracking-editorial-tight">
                  Check availability and book
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-gold">
                  <path d="M5 10h10M12 6l4 4-4 4" />
                </svg>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* ── Section 03 · Meet the Owner ── */}
      {owner && owner.handle && (
        <section className="px-5 mt-10">
          <div className="mb-4 flex items-baseline gap-3">
            <EditorialNumber n={3} size="md" />
            <SectionKicker tone="muted">Meet the Owner</SectionKicker>
          </div>
          <div className="rule-hairline mb-5" />

          <Link href={`/user/${owner.handle}`} className="block press">
            <EditorialCard variant="glass" border="gold" className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-gold/25 bg-ink">
                  {owner.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={owner.avatar_url} alt={owner.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gold font-display text-lg">
                      {owner.display_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-display text-[20px] text-ivory leading-tight truncate">{owner.display_name}</p>
                    {owner.verification_status === "verified" && (
                      <Icon name="verified" size={12} className="text-gold" />
                    )}
                  </div>
                  {owner.handle && (
                    <p className="text-[11px] uppercase tracking-editorial-tight text-ivory/55 mt-0.5">@{owner.handle}</p>
                  )}
                  {owner.bio && (
                    <p className="text-[12px] text-ivory/70 mt-1.5 line-clamp-2">{owner.bio}</p>
                  )}
                </div>
                <div className="shrink-0 text-[10px] uppercase tracking-editorial-tight text-gold flex items-center gap-1">
                  View
                  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 3l4 4-4 4" />
                  </svg>
                </div>
              </div>

              {(ownerRecentPosts.length > 0 || ownerRecentEvents.length > 0) && (
                <div className="mt-4 pt-4 border-t border-gold/10 grid grid-cols-3 gap-2">
                  {ownerRecentPosts.slice(0, 3).map((p) => (
                    <div
                      key={p.id}
                      className="relative aspect-square rounded-lg overflow-hidden bg-ink border border-white/[0.06]"
                    >
                      {p.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full p-1.5 flex items-center text-[9px] text-ivory/70 leading-snug">
                          <span className="line-clamp-4">{p.body}</span>
                        </div>
                      )}
                      {p.media_type === "video" && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center">
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="white">
                            <polygon points="6,4 20,12 6,20" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                  {ownerRecentEvents.slice(0, 3 - ownerRecentPosts.slice(0, 3).length).map((e) => (
                    <div
                      key={e.id}
                      className="relative aspect-square rounded-lg overflow-hidden bg-ink border border-gold/15"
                    >
                      {e.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={e.image_url} alt={e.title} className="w-full h-full object-cover opacity-80" />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute bottom-1 left-1.5 right-1.5">
                        <p className="text-[8px] uppercase tracking-editorial-tight font-bold text-gold">Event</p>
                        <p className="text-[10px] font-bold text-ivory line-clamp-2 leading-tight">{e.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </EditorialCard>
          </Link>
        </section>
      )}

      {/* ── Section 04 · Deals / Coupons ── */}
      {promotions && promotions.length > 0 && (
        <section className="px-5 mt-10">
          <div className="mb-4 flex items-baseline gap-3">
            <EditorialNumber n={4} size="md" />
            <SectionKicker tone="muted">{isRetail ? "Deals" : "Coupons"}</SectionKicker>
          </div>
          <div className="rule-hairline mb-5" />

          <div className="space-y-2.5">
            {promotions.map((promo) => (
              <EditorialCard key={promo.id} variant="ink" border="gold" className="p-4">
                <div className="flex items-start gap-3">
                  <Icon name="tag" size={16} className="text-gold shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-[18px] text-ivory leading-tight">{promo.title}</p>
                    {promo.description && (
                      <p className="text-[11px] text-ivory/70 mt-1 line-clamp-2">{promo.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                      {promo.promo_code && (
                        <Tag tone="gold" size="xs">Code: {promo.promo_code}</Tag>
                      )}
                      {promo.discount_percent && (
                        <Tag tone="gold" size="xs">{promo.discount_percent}% Off</Tag>
                      )}
                      {promo.discount_amount && (
                        <Tag tone="gold" size="xs">
                          ${(promo.discount_amount / 100).toFixed(2)} Off
                        </Tag>
                      )}
                    </div>
                  </div>
                </div>
              </EditorialCard>
            ))}
          </div>
        </section>
      )}

      {/* ── Section 05 · Menu / Products (rail) ── */}
      {menuItems && menuItems.length > 0 && (
        <div className="mt-10">
          <SnapCarousel
            number={5}
            kicker={isRetail ? "Products" : "Menu"}
            seeAllHref={`/business/${biz.slug || biz.id}/order`}
            seeAllLabel={isRetail ? "All products →" : "Full menu →"}
          >
            {menuItems.map((item) => (
              <Link
                key={item.id}
                href={`/business/${biz.slug || biz.id}/order`}
                className="snap-start shrink-0 w-[160px] press"
              >
                <EditorialCard variant="ink" border="subtle" className="overflow-hidden">
                  <div className="relative aspect-square bg-ink">
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className={`w-full h-full ${artClass} pattern-dots`} />
                    )}
                    {(item.mux_playback_id || item.video_url) && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
                    {item.is_digital && (
                      <div className="absolute bottom-2 left-2">
                        <Tag tone="gold" size="xs">Digital</Tag>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-heading text-[12px] font-bold text-ivory truncate">{item.name}</p>
                    {item.category && (
                      <p className="text-[9px] uppercase tracking-editorial-tight text-ivory/55 mt-0.5 truncate">
                        {item.category}
                      </p>
                    )}
                    <p className="font-display text-[16px] text-gold leading-none mt-1.5">
                      ${(item.price / 100).toFixed(2)}
                    </p>
                  </div>
                </EditorialCard>
              </Link>
            ))}
          </SnapCarousel>

          {biz.accepts_orders && (
            <div className="px-5 mt-4">
              <Link
                href={`/business/${biz.slug || biz.id}/order`}
                className="block rounded-2xl bg-gold text-midnight p-4 press"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-heading font-bold text-base leading-none">
                      {isRetail ? "Shop Now" : "Order Now"}
                    </p>
                    <p className="text-midnight/70 text-[11px] font-semibold mt-1.5 uppercase tracking-editorial-tight">
                      {isRetail
                        ? "Browse all products"
                        : biz.delivery_enabled
                          ? "Delivery & pickup available"
                          : "Pickup available"}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-midnight/10 flex items-center justify-center">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-midnight">
                      <path d="M5 10h10M12 6l4 4-4 4" />
                    </svg>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Section 06 · Featured Reviews ── */}
      {typedFeatured.length > 0 && (
        <section className="px-5 mt-10">
          <div className="mb-4 flex items-baseline gap-3">
            <EditorialNumber n={6} size="md" />
            <SectionKicker tone="muted">Featured Reviews</SectionKicker>
          </div>
          <div className="rule-hairline mb-5" />

          <div className="space-y-3">
            {typedFeatured.map((rev) => (
              <EditorialCard key={rev.id} variant="ink" border="subtle" className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 overflow-hidden">
                      {rev.reviewer?.avatar_url ? (
                        <Image
                          src={rev.reviewer.avatar_url}
                          alt={rev.reviewer.display_name || ""}
                          width={36}
                          height={36}
                          className="w-9 h-9 object-cover"
                        />
                      ) : (
                        <span className="text-gold text-xs font-bold">
                          {(rev.reviewer?.display_name || "A")[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-heading text-sm font-bold text-ivory leading-tight">
                        {rev.reviewer?.display_name || "Anonymous"}
                      </p>
                      <p className="text-[10px] uppercase tracking-editorial-tight text-ivory/55 mt-0.5">
                        {new Date(rev.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Icon
                        key={star}
                        name="star"
                        size={13}
                        className={star <= rev.rating ? "text-gold" : "text-ivory/15"}
                      />
                    ))}
                  </div>
                </div>
                {rev.body && (
                  <p className="font-display text-[16px] text-ivory/85 leading-snug">
                    &ldquo;{rev.body}&rdquo;
                  </p>
                )}
              </EditorialCard>
            ))}
          </div>
        </section>
      )}

      {/* ── All Reviews (interactive) ── */}
      <div className="mt-10">
        <ReviewSection businessId={biz.id} />
      </div>

      {/* ── Hours ── */}
      {biz.hours && Object.keys(biz.hours).length > 0 && (
        <section className="px-5 mt-10">
          <div className="mb-4 flex items-baseline gap-3">
            <EditorialNumber n={7} size="md" />
            <SectionKicker tone="muted">Hours</SectionKicker>
          </div>
          <div className="rule-hairline mb-5" />

          <EditorialCard variant="ink" border="subtle" className="overflow-hidden">
            {["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((day) => {
              const hours = biz.hours?.[day];
              if (!hours) return null;
              const isToday = day === today;
              const hoursStr = typeof hours === "string" ? hours : `${hours.open} — ${hours.close}`;
              return (
                <div
                  key={day}
                  className={`px-4 py-3 flex items-center justify-between text-sm border-b border-white/[0.05] last:border-0 ${
                    isToday ? "bg-gold/[0.05]" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isToday && <div className="w-1.5 h-1.5 rounded-full bg-gold" />}
                    <span className={
                      isToday
                        ? "font-heading font-bold text-gold uppercase tracking-editorial-tight text-[11px]"
                        : "text-ivory/70 uppercase tracking-editorial-tight text-[11px]"
                    }>
                      {dayFullNames[day]}
                    </span>
                  </div>
                  <span className={
                    isToday
                      ? "font-heading font-bold text-ivory text-[12px]"
                      : "text-ivory/70 text-[12px]"
                  }>
                    {hoursStr}
                  </span>
                </div>
              );
            })}
          </EditorialCard>
        </section>
      )}

      {/* ── END divider ── */}
      <IssueDivider label="END" />

      {/* ── Related rail ── */}
      <SnapCarousel
        number={8}
        kicker="Also in the Issue"
        seeAllHref={biz.category === "restaurant" ? "/food" : "/business"}
        seeAllLabel="All listings →"
        className="pb-10"
      >
        <div className="snap-start shrink-0 w-[240px]">
          <EditorialCard variant="ink" border="subtle" className="p-5 h-[140px] flex flex-col justify-between">
            <SectionKicker tone="gold">Browse</SectionKicker>
            <p className="font-display text-[18px] text-ivory leading-tight">
              Discover more {categoryLabel.toLowerCase()} places in {cityName}.
            </p>
          </EditorialCard>
        </div>
      </SnapCarousel>
    </article>
  );
}
