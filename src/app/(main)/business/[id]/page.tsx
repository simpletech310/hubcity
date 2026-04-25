import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import SaveButton from "@/components/ui/SaveButton";
import { createClient } from "@/lib/supabase/server";
import type { Business, BusinessReview } from "@/types/database";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/branding";
import ReviewSection from "./ReviewSection";
import BusinessTabs from "./BusinessTabs";
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

  // Primary CTA — order / book / call / visit — chosen by business type
  const primaryCta: { label: string; href: string } | null = biz.accepts_bookings
    ? { label: "BOOK", href: `/business/${biz.slug || biz.id}/book` }
    : biz.accepts_orders
      ? { label: isRetail ? "SHOP" : "ORDER", href: `/business/${biz.slug || biz.id}/order` }
      : biz.phone
        ? { label: "CALL", href: `tel:${biz.phone}` }
        : biz.website
          ? { label: "VISIT", href: biz.website.startsWith("http") ? biz.website : `https://${biz.website}` }
          : biz.address
            ? { label: "DIRECTIONS", href: `https://maps.google.com/?q=${encodeURIComponent(biz.address)}` }
            : null;

  return (
    <article className="culture-surface animate-fade-in pb-safe min-h-dvh">
      {/* SEO JSON-LD */}
      <script
        type="application/ld+json"
        // Schema.org JSON-LD payload — safe content, controlled by us.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Hero · full-bleed 4:3 with bordered nav squares ── */}
      <div className="relative" style={{ aspectRatio: "4 / 3", background: "var(--ink-strong)" }}>
        <HeroGallery
          images={heroImages}
          alt={biz.name}
          fallback={<div className={`w-full h-full ${artClass} pattern-dots`} />}
        />

        {/* Back button — 36x36 bordered ink square */}
        <div className="absolute top-4 left-4 z-20">
          <Link
            href={biz.category === "restaurant" ? "/food" : "/business"}
            className="flex items-center justify-center press"
            style={{
              width: 36,
              height: 36,
              background: "var(--ink-strong)",
              color: "var(--paper)",
              border: "2px solid var(--ink-strong)",
            }}
            aria-label="Back"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M11 13L7 9l4-4" />
            </svg>
          </Link>
        </div>

        {/* Share + Save — top right */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <div
            className="flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              background: "var(--ink-strong)",
              color: "var(--paper)",
              border: "2px solid var(--ink-strong)",
            }}
          >
            <ShareQrButton
              url={profileUrl}
              title={biz.name}
              text={biz.description ?? undefined}
              accentColor="#F2A900"
            />
          </div>
          <div
            className="flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              background: "var(--ink-strong)",
              color: "var(--paper)",
              border: "2px solid var(--ink-strong)",
            }}
          >
            <SaveButton itemType="business" itemId={biz.id} />
          </div>
        </div>
      </div>

      {/* ── Gold block header strip ── */}
      <div
        className="c-gold-block"
        style={{
          padding: "12px 18px",
          borderTop: "3px solid var(--rule-strong-c)",
          borderBottom: "3px solid var(--rule-strong-c)",
        }}
      >
        <div className="c-kicker" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>§ {categoryLabel}</span>
          <OpenNowBadge hours={biz.hours} />
        </div>
      </div>

      {/* ── Name · tagline · stats ── */}
      <div style={{ padding: "22px 18px 18px" }}>
        <h1 className="c-hero" style={{ fontSize: 58, lineHeight: 0.82 }}>
          {biz.name}
        </h1>
        {biz.description && (
          <p className="c-serif-it" style={{ fontSize: 14, lineHeight: 1.5, marginTop: 16 }}>
            {biz.description}
          </p>
        )}

        <div
          style={{
            marginTop: 18,
            display: "flex",
            gap: 14,
            flexWrap: "wrap",
            alignItems: "center",
          }}
          className="c-meta"
        >
          {biz.rating_avg > 0 && (
            <span
              className="c-badge-gold"
              style={{
                padding: "4px 8px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {Number(biz.rating_avg).toFixed(1)} · {biz.rating_count}
            </span>
          )}
          <span>{categoryLabel}</span>
          <span>{cityName.toUpperCase()}</span>
          {biz.district && <span>DIST {biz.district}</span>}
        </div>
      </div>

      {/* ── Primary CTA + icon action squares ── */}
      {primaryCta && (
        <div style={{ padding: "0 18px 22px", display: "flex", gap: 10 }}>
          <Link
            href={primaryCta.href}
            {...(primaryCta.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="c-btn c-btn-primary press"
            style={{ flex: 1, textAlign: "center", padding: "14px 0", fontSize: 13 }}
          >
            {primaryCta.label}
            {biz.min_order > 0 && biz.accepts_orders ? ` · $${(biz.min_order / 100).toFixed(0)}+` : ""}
          </Link>
          {biz.phone && primaryCta.label !== "CALL" && (
            <a
              href={`tel:${biz.phone}`}
              className="c-btn-outline flex items-center justify-center press"
              style={{ width: 52, height: 48 }}
              aria-label="Call"
            >
              <Icon name="phone" size={18} />
            </a>
          )}
          {biz.address && primaryCta.label !== "DIRECTIONS" && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(biz.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="c-btn-outline flex items-center justify-center press"
              style={{ width: 52, height: 48 }}
              aria-label="Directions"
            >
              <Icon name="navigation" size={18} />
            </a>
          )}
        </div>
      )}

      {/* ── Also in: {city} chips ── */}
      {otherCities.length > 0 && (
        <div
          style={{
            padding: "0 18px 18px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span className="c-kicker" style={{ fontSize: 10 }}>ALSO IN</span>
          {otherCities.map((city) => (
            <Link key={city.slug} href={`/${city.slug}`} className="c-chip">
              {city.name}
            </Link>
          ))}
        </div>
      )}

      {/* ── City Badges ── */}
      {biz.badges && biz.badges.length > 0 && (
        <div style={{ padding: "0 18px 18px" }}>
          <div className="c-noscroll" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
            {biz.badges.map((badge) => (
              <div
                key={badge}
                className="c-badge-gold"
                style={{
                  flexShrink: 0,
                  padding: "6px 10px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Icon name={badgeIcons[badge] || "tag"} size={12} />
                <span className="c-ui" style={{ fontSize: 10 }}>{formatBadgeLabel(badge)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Chain / Ads-Only Notice ── */}
      {biz.account_type === "ads_only" && (
        <div style={{ padding: "0 18px 18px" }}>
          <div className="c-frame" style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="globe" size={16} style={{ color: "var(--ink-mute)", flexShrink: 0 }} />
            <div>
              <p className="c-kicker" style={{ fontSize: 10 }}>NATIONAL CHAIN</p>
              <p className="c-body-sm" style={{ marginTop: 2 }}>
                Visit their website or app for ordering &amp; reservations
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Pull quote · story ── */}
      {biz.story && (
        <aside style={{ padding: "8px 18px 22px" }}>
          <div style={{ borderLeft: "3px solid var(--gold-c)", paddingLeft: 18, paddingTop: 4, paddingBottom: 4 }}>
            <p className="c-serif-it" style={{ fontSize: 20, lineHeight: 1.35, color: "var(--ink-strong)" }}>
              &ldquo;{biz.story}&rdquo;
            </p>
            <p className="c-kicker" style={{ fontSize: 10, marginTop: 10, color: "var(--gold-c)" }}>
              § {biz.name.toUpperCase()} · {cityName.toUpperCase()}
            </p>
          </div>
        </aside>
      )}

      {/* ── Tabs (WORK · REVIEWS · HOURS). The Services tab was retired —
            services + bookings still render inside the WORK content below. ── */}
      <BusinessTabs
        showReviews={true}
        showHours={!!(biz.hours && Object.keys(biz.hours).length > 0)}
        work={(<>
      {/* ── WORK · 3-col photo grid with 2px ink borders ── */}
      {heroImages.length > 1 && (
        <div style={{ padding: "14px 18px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            {heroImages.slice(0, 6).map((src, i) => (
              <div key={i} className="c-frame" style={{ aspectRatio: "1 / 1", position: "relative" }}>
                <Image
                  src={src}
                  alt={`${biz.name} ${i + 1}`}
                  fill
                  sizes="(max-width: 768px) 33vw, 200px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Section · Essentials (address / phone / today / website) ── */}
      <section style={{ padding: "0 18px 24px" }}>
        <div className="c-kicker" style={{ marginBottom: 8 }}>§ THE ESSENTIALS</div>
        <div className="c-rule" style={{ marginBottom: 14 }} />

        <div className="c-frame">
          {/* Address */}
          <div
            style={{
              padding: 14,
              display: "flex",
              alignItems: "center",
              gap: 12,
              borderBottom: "1px solid var(--rule-c)",
            }}
          >
            <Icon name="pin" size={18} style={{ color: "var(--gold-c)", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="c-kicker" style={{ fontSize: 9 }}>ADDRESS</p>
              <p className="c-card-t" style={{ fontSize: 14, marginTop: 2 }}>{biz.address}</p>
              {biz.district && (
                <p className="c-meta" style={{ fontSize: 11, marginTop: 2 }}>DISTRICT {biz.district}</p>
              )}
            </div>
          </div>

          {biz.phone && (
            <a
              href={`tel:${biz.phone}`}
              className="press"
              style={{
                padding: 14,
                display: "flex",
                alignItems: "center",
                gap: 12,
                borderBottom: "1px solid var(--rule-c)",
              }}
            >
              <Icon name="phone" size={18} style={{ color: "var(--gold-c)", flexShrink: 0 }} />
              <div>
                <p className="c-kicker" style={{ fontSize: 9 }}>PHONE</p>
                <p className="c-card-t" style={{ fontSize: 14, marginTop: 2, color: "var(--gold-c)" }}>
                  {biz.phone}
                </p>
              </div>
            </a>
          )}

          {todayHours && (
            <div
              style={{
                padding: 14,
                display: "flex",
                alignItems: "center",
                gap: 12,
                borderBottom: "1px solid var(--rule-c)",
              }}
            >
              <Icon name="clock" size={18} style={{ color: "var(--gold-c)", flexShrink: 0 }} />
              <div>
                <p className="c-kicker" style={{ fontSize: 9 }}>TODAY</p>
                <p className="c-card-t" style={{ fontSize: 14, marginTop: 2 }}>
                  <span style={{ color: "var(--gold-c)" }}>Open</span>
                  <span className="c-meta" style={{ fontSize: 13, marginLeft: 6 }}>
                    {typeof todayHours === "string" ? todayHours : `${todayHours.open} — ${todayHours.close}`}
                  </span>
                </p>
              </div>
            </div>
          )}

          {biz.website && (
            <a
              href={biz.website.startsWith("http") ? biz.website : `https://${biz.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="press"
              style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}
            >
              <Icon name="globe" size={18} style={{ color: "var(--gold-c)", flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <p className="c-kicker" style={{ fontSize: 9 }}>WEBSITE</p>
                <p className="c-card-t" style={{ fontSize: 14, marginTop: 2, color: "var(--gold-c)" }}>
                  {biz.website}
                </p>
              </div>
            </a>
          )}
        </div>
      </section>

      {/* ── Services · dark ink slab with service rows ── */}
      {biz.accepts_bookings && services.length > 0 && (
        <section className="c-ink-block" style={{ padding: "24px 18px 28px" }}>
          <div className="c-kicker" style={{ color: "var(--gold-c)" }}>§ THE CHAIR</div>
          <h2 className="c-hero" style={{ fontSize: 34, marginTop: 6, color: "var(--paper)" }}>
            WHAT WE DO.
          </h2>
          <div style={{ marginTop: 12 }}>
            {services.map((svc) => (
              <div
                key={svc.id}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 12,
                  padding: "14px 0",
                  borderTop: "1px solid rgba(243,238,220,0.18)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="c-card-t" style={{ fontSize: 17, color: "var(--paper)" }}>
                    {svc.name}
                  </div>
                  {svc.description && (
                    <div
                      className="c-body-sm"
                      style={{ color: "rgba(243,238,220,0.75)", marginTop: 4 }}
                    >
                      {svc.description}
                    </div>
                  )}
                  <div
                    className="c-kicker"
                    style={{ fontSize: 9, marginTop: 4, color: "rgba(243,238,220,0.65)" }}
                  >
                    {svc.duration} MIN
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-anton), Anton, Impact, sans-serif",
                    fontSize: 22,
                    color: "var(--gold-c)",
                  }}
                >
                  ${(svc.price / 100).toFixed(0)}
                </div>
              </div>
            ))}
          </div>
          <Link
            href={`/business/${biz.slug || biz.id}/book`}
            className="c-btn c-btn-accent press"
            style={{ display: "block", marginTop: 18, textAlign: "center", padding: "14px 0" }}
          >
            BOOK APPOINTMENT
          </Link>
        </section>
      )}

      {biz.accepts_bookings && services.length === 0 && (
        <section style={{ padding: "0 18px 24px" }}>
          <Link
            href={`/business/${biz.slug || biz.id}/book`}
            className="c-btn c-btn-outline press"
            style={{ display: "block", textAlign: "center", padding: "14px 0" }}
          >
            CHECK AVAILABILITY · BOOK
          </Link>
        </section>
      )}

      {/* ── Meet the Owner ── */}
      {owner && owner.handle && (
        <section style={{ padding: "0 18px 24px" }}>
          <div className="c-kicker" style={{ marginBottom: 8 }}>§ MEET THE OWNER</div>
          <div className="c-rule" style={{ marginBottom: 14 }} />

          <Link href={`/user/${owner.handle}`} className="block press">
            <div className="c-frame" style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  className="c-frame"
                  style={{
                    width: 56,
                    height: 56,
                    flexShrink: 0,
                    background: "var(--ink-strong)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {owner.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={owner.avatar_url}
                      alt={owner.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ color: "var(--gold-c)", fontFamily: "var(--font-anton), sans-serif", fontSize: 20 }}
                    >
                      {owner.display_name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <p className="c-card-t" style={{ fontSize: 18 }}>{owner.display_name}</p>
                    {owner.verification_status === "verified" && (
                      <Icon name="verified" size={12} style={{ color: "var(--gold-c)" }} />
                    )}
                  </div>
                  {owner.handle && (
                    <p className="c-kicker" style={{ fontSize: 10, marginTop: 2 }}>@{owner.handle}</p>
                  )}
                  {owner.bio && (
                    <p
                      className="c-body-sm"
                      style={{
                        marginTop: 6,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {owner.bio}
                    </p>
                  )}
                </div>
                <div
                  className="c-kicker"
                  style={{ fontSize: 10, color: "var(--gold-c)", display: "flex", alignItems: "center", gap: 4 }}
                >
                  VIEW
                  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 3l4 4-4 4" />
                  </svg>
                </div>
              </div>

              {(ownerRecentPosts.length > 0 || ownerRecentEvents.length > 0) && (
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 14,
                    borderTop: "1px solid var(--rule-c)",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 6,
                  }}
                >
                  {ownerRecentPosts.slice(0, 3).map((p) => (
                    <div
                      key={p.id}
                      className="c-frame"
                      style={{ position: "relative", aspectRatio: "1 / 1", background: "var(--ink-strong)" }}
                    >
                      {p.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            padding: 6,
                            color: "var(--paper)",
                            fontSize: 9,
                            lineHeight: 1.3,
                            display: "-webkit-box",
                            WebkitLineClamp: 6,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {p.body}
                        </div>
                      )}
                      {p.media_type === "video" && (
                        <div
                          style={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            width: 14,
                            height: 14,
                            background: "var(--ink-strong)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="var(--paper)">
                            <polygon points="6,4 20,12 6,20" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                  {ownerRecentEvents.slice(0, 3 - ownerRecentPosts.slice(0, 3).length).map((e) => (
                    <div
                      key={e.id}
                      className="c-frame"
                      style={{ position: "relative", aspectRatio: "1 / 1", background: "var(--ink-strong)" }}
                    >
                      {e.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={e.image_url}
                          alt={e.title}
                          className="w-full h-full object-cover"
                          style={{ opacity: 0.8 }}
                        />
                      ) : null}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "linear-gradient(0deg, var(--ink-strong) 0%, transparent 70%)",
                        }}
                      />
                      <div style={{ position: "absolute", bottom: 4, left: 6, right: 6 }}>
                        <p className="c-kicker" style={{ fontSize: 8, color: "var(--gold-c)" }}>EVENT</p>
                        <p
                          className="c-card-t"
                          style={{
                            fontSize: 10,
                            color: "var(--paper)",
                            marginTop: 2,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {e.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Link>
        </section>
      )}

      {/* ── Deals / Coupons ── */}
      {promotions && promotions.length > 0 && (
        <section style={{ padding: "0 18px 24px" }}>
          <div className="c-kicker" style={{ marginBottom: 8 }}>
            § {isRetail ? "DEALS" : "COUPONS"}
          </div>
          <div className="c-rule" style={{ marginBottom: 14 }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {promotions.map((promo) => (
              <div key={promo.id} className="c-frame" style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <Icon name="tag" size={16} style={{ color: "var(--gold-c)", flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="c-card-t" style={{ fontSize: 16 }}>{promo.title}</p>
                    {promo.description && (
                      <p
                        className="c-body-sm"
                        style={{
                          marginTop: 4,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {promo.description}
                      </p>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                      {promo.promo_code && (
                        <span className="c-badge-gold" style={{ padding: "4px 8px", fontSize: 10 }}>
                          CODE: {promo.promo_code}
                        </span>
                      )}
                      {promo.discount_percent && (
                        <span className="c-badge-gold" style={{ padding: "4px 8px", fontSize: 10 }}>
                          {promo.discount_percent}% OFF
                        </span>
                      )}
                      {promo.discount_amount && (
                        <span className="c-badge-gold" style={{ padding: "4px 8px", fontSize: 10 }}>
                          ${(promo.discount_amount / 100).toFixed(2)} OFF
                        </span>
                      )}
                      <button
                        type="button"
                        className="c-btn c-btn-primary c-btn-sm"
                        style={{ marginLeft: "auto" }}
                      >
                        CLAIM
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Menu / Products · horizontal rail ── */}
      {menuItems && menuItems.length > 0 && (
        <section style={{ padding: "0 0 24px" }}>
          <div
            style={{
              padding: "0 18px 10px",
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <div className="c-kicker">§ {isRetail ? "PRODUCTS" : "MENU"}</div>
            <Link
              href={`/business/${biz.slug || biz.id}/order`}
              className="c-kicker"
              style={{ fontSize: 10, color: "var(--gold-c)" }}
            >
              {isRetail ? "ALL PRODUCTS →" : "FULL MENU →"}
            </Link>
          </div>
          <div className="c-rule" style={{ margin: "0 18px 14px" }} />

          <div
            className="c-noscroll"
            style={{
              display: "flex",
              gap: 10,
              overflowX: "auto",
              padding: "0 18px 4px",
              scrollSnapType: "x mandatory",
            }}
          >
            {menuItems.map((item) => (
              <Link
                key={item.id}
                href={`/business/${biz.slug || biz.id}/order`}
                className="press"
                style={{ flex: "0 0 160px", scrollSnapAlign: "start" }}
              >
                <div className="c-frame" style={{ background: "var(--paper)" }}>
                  <div style={{ position: "relative", aspectRatio: "1 / 1", background: "var(--ink-strong)" }}>
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className={`w-full h-full ${artClass} pattern-dots`} />
                    )}
                    {(item.mux_playback_id || item.video_url) && (
                      <div
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          width: 18,
                          height: 18,
                          background: "var(--ink-strong)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="var(--paper)">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
                    {item.is_digital && (
                      <div style={{ position: "absolute", bottom: 6, left: 6 }}>
                        <span className="c-badge-gold" style={{ padding: "3px 6px", fontSize: 9 }}>DIGITAL</span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: 10 }}>
                    <p className="c-card-t" style={{ fontSize: 12 }}>{item.name}</p>
                    {item.category && (
                      <p className="c-kicker" style={{ fontSize: 9, marginTop: 2 }}>{item.category}</p>
                    )}
                    <p
                      style={{
                        fontFamily: "var(--font-anton), Anton, sans-serif",
                        fontSize: 16,
                        color: "var(--gold-c)",
                        marginTop: 6,
                        lineHeight: 1,
                      }}
                    >
                      ${(item.price / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {biz.accepts_orders && (
            <div style={{ padding: "14px 18px 0" }}>
              <Link
                href={`/business/${biz.slug || biz.id}/order`}
                className="c-btn c-btn-accent press"
                style={{ display: "block", textAlign: "center", padding: "14px 0" }}
              >
                {isRetail ? "SHOP NOW" : "ORDER NOW"}
                {biz.delivery_enabled && !isRetail ? " · DELIVERY & PICKUP" : ""}
              </Link>
            </div>
          )}
        </section>
      )}

        </>)}
        reviews={(<>
      {/* ── Featured Reviews · no cards, rules between ── */}
      {typedFeatured.length > 0 && (
        <section style={{ padding: "0 18px 24px" }}>
          <div className="c-kicker" style={{ marginBottom: 8 }}>§ FEATURED REVIEWS</div>
          <div className="c-rule" style={{ marginBottom: 6 }} />

          <div>
            {typedFeatured.map((rev) => (
              <div
                key={rev.id}
                style={{ padding: "16px 0", borderTop: "2px solid var(--rule-strong-c)" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      className="c-frame"
                      style={{
                        width: 36,
                        height: 36,
                        flexShrink: 0,
                        overflow: "hidden",
                        background: "var(--paper-soft)",
                      }}
                    >
                      {rev.reviewer?.avatar_url ? (
                        <Image
                          src={rev.reviewer.avatar_url}
                          alt={rev.reviewer.display_name || ""}
                          width={36}
                          height={36}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ color: "var(--gold-c)", fontWeight: 700, fontSize: 14 }}
                        >
                          {(rev.reviewer?.display_name || "A")[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="c-kicker" style={{ fontSize: 11 }}>
                        {rev.reviewer?.display_name || "ANONYMOUS"}
                      </p>
                      <p className="c-kicker" style={{ fontSize: 9, marginTop: 2, color: "var(--ink-mute)" }}>
                        {new Date(rev.created_at)
                          .toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                          .toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Icon
                        key={star}
                        name="star"
                        size={13}
                        style={{ color: star <= rev.rating ? "var(--gold-c)" : "var(--ink-mute)" }}
                      />
                    ))}
                  </div>
                </div>
                {rev.body && (
                  <p className="c-serif-it" style={{ fontSize: 16, lineHeight: 1.4, color: "var(--ink-strong)" }}>
                    &ldquo;{rev.body}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── All Reviews (interactive) ── */}
      <div style={{ padding: "0 0 24px" }}>
        <ReviewSection businessId={biz.id} />
      </div>

        </>)}
        hours={(<>
      {/* ── Hours · ink block ── */}
      {biz.hours && Object.keys(biz.hours).length > 0 && (
        <section className="c-ink-block" style={{ padding: "24px 18px 28px" }}>
          <div className="c-kicker" style={{ color: "var(--gold-c)" }}>§ HOURS</div>
          <h2 className="c-hero" style={{ fontSize: 30, marginTop: 6, color: "var(--paper)" }}>
            WHEN WE&apos;RE OPEN.
          </h2>

          <div style={{ marginTop: 14 }}>
            {["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((day) => {
              const hours = biz.hours?.[day];
              if (!hours) return null;
              const isToday = day === today;
              const hoursStr = typeof hours === "string" ? hours : `${hours.open} — ${hours.close}`;
              return (
                <div
                  key={day}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    borderTop: "1px solid rgba(243,238,220,0.18)",
                  }}
                >
                  <span
                    className="c-kicker"
                    style={{
                      fontSize: 11,
                      color: isToday ? "var(--gold-c)" : "rgba(243,238,220,0.75)",
                    }}
                  >
                    {isToday ? "● " : ""}
                    {dayFullNames[day].toUpperCase()}
                  </span>
                  <span
                    className="c-meta"
                    style={{
                      fontSize: 12,
                      color: isToday ? "var(--paper)" : "rgba(243,238,220,0.75)",
                    }}
                  >
                    {hoursStr}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

        </>)}
      />

      {/* ── Related rail · Also in the Issue ── */}
      <section style={{ padding: "24px 0 40px" }}>
        <div className="c-kicker" style={{ padding: "0 18px 10px" }}>§ ALSO IN THE ISSUE</div>
        <div className="c-rule" style={{ margin: "0 18px 14px" }} />

        <div style={{ padding: "0 18px" }}>
          <Link
            href={biz.category === "restaurant" ? "/food" : "/business"}
            className="c-frame press block"
            style={{ padding: 18, display: "block" }}
          >
            <p className="c-kicker" style={{ color: "var(--gold-c)" }}>§ BROWSE</p>
            <p className="c-card-t" style={{ fontSize: 18, marginTop: 6 }}>
              Discover more {categoryLabel.toLowerCase()} places in {cityName}.
            </p>
            <p className="c-kicker" style={{ fontSize: 10, marginTop: 10, color: "var(--gold-c)" }}>
              ALL LISTINGS →
            </p>
          </Link>
        </div>
      </section>
    </article>
  );
}
