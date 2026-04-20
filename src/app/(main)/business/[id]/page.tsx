import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import SaveButton from "@/components/ui/SaveButton";
import { createClient } from "@/lib/supabase/server";
import type { Business, BusinessReview } from "@/types/database";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/branding";
import ReviewSection from "./ReviewSection";
import HeroGallery from "@/components/business/HeroGallery";
import ShareQrButton from "@/components/business/ShareQrButton";
import OpenNowBadge from "@/components/business/OpenNowBadge";

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
  restaurant: "coral",
  other: "gold",
};

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

  const accentColor = categoryColors[biz.category] || "#F2A900";
  const artClass = categoryArt[biz.category] ?? "art-city";
  const variant = categoryBadgeVariant[biz.category] || "gold";

  const isRetail = biz.category === "retail";
  const profileUrl = `${SITE_DOMAIN}/business/${biz.slug || biz.id}`;

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

  return (
    <div className="animate-fade-in pb-safe">
      {/* SEO JSON-LD */}
      <script
        type="application/ld+json"
        // Schema.org JSON-LD payload — safe content, controlled by us.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Cinematic Hero Gallery ── */}
      <div className="relative">
        <HeroGallery
          images={heroImages}
          alt={biz.name}
          fallback={<div className={`w-full h-full ${artClass} pattern-dots`} />}
        />

        {/* Gradient overlay (desktop hero is taller, mobile is 256px) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-midnight via-midnight/60 to-transparent" />

        {/* Back button */}
        <div className="absolute top-4 left-4 z-10">
          <Link href={biz.category === "restaurant" ? "/food" : "/business"} className="w-9 h-9 rounded-full glass flex items-center justify-center press">
            <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M11 13L7 9l4-4" />
            </svg>
          </Link>
        </div>

        {/* Save button */}
        <div className="absolute top-4 right-4 z-10">
          <SaveButton itemType="business" itemId={biz.id} />
        </div>

        {/* Rating pill */}
        {biz.rating_avg > 0 && (
          <div className="absolute top-4 left-16 z-10 bg-midnight/70 backdrop-blur-sm rounded-lg px-2.5 py-1 flex items-center gap-1.5">
            <span className="text-gold text-xs"><Icon name="star" size={14} className="text-gold" /></span>
            <span className="text-xs font-bold">{Number(biz.rating_avg).toFixed(1)}</span>
            <span className="text-[9px] text-txt-secondary">({biz.rating_count})</span>
          </div>
        )}

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 z-10">
          {/* Category + Status */}
          <div className="flex items-center gap-2 mb-2">
            <Badge label={biz.category} variant={variant} size="md" />
            <OpenNowBadge hours={biz.hours} />
            {biz.district && (
              <Badge label={`District ${biz.district}`} variant="cyan" size="sm" />
            )}
          </div>
          <h1 className="font-heading text-2xl font-bold leading-tight drop-shadow-lg">{biz.name}</h1>
        </div>
      </div>

      {/* ── City Badges Strip ── */}
      {biz.badges && biz.badges.length > 0 && (
        <div className="px-5 mt-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {biz.badges.map((badge) => (
              <div
                key={badge}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gold/5 border border-gold/15"
              >
                <Icon name={badgeIcons[badge] || "tag"} size={14} className="text-gold" />
                <span className="text-[11px] font-bold text-gold-light whitespace-nowrap">
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
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/[0.03] border border-border-subtle">
            <Icon name="globe" size={16} className="text-txt-secondary shrink-0" />
            <div>
              <p className="text-[11px] font-semibold text-txt-secondary">National Chain</p>
              <p className="text-[10px] text-muted-gray">Visit their website or app for ordering & reservations</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky Action Bar (Call / Directions / Website / Share+QR) ── */}
      <div className="sticky top-0 z-20 bg-midnight/85 backdrop-blur-md border-b border-border-subtle">
        <div className="px-5 py-3">
          <div className="grid grid-cols-4 gap-2">
            {([
              { label: "Call", iconName: "phone" as IconName, href: biz.phone ? `tel:${biz.phone}` : undefined, disabled: !biz.phone },
              { label: "Directions", iconName: "navigation" as IconName, href: biz.address ? `https://maps.google.com/?q=${encodeURIComponent(biz.address)}` : undefined, disabled: !biz.address },
              { label: "Website", iconName: "globe" as IconName, href: biz.website ? (biz.website.startsWith("http") ? biz.website : `https://${biz.website}`) : undefined, disabled: !biz.website },
            ]).map((action) => {
              const isExternal = action.href?.startsWith("http");
              if (!action.href) {
                return (
                  <button
                    key={action.label}
                    type="button"
                    disabled
                    className="flex flex-col items-center gap-1.5 rounded-xl bg-card border border-border-subtle py-3 opacity-40 cursor-not-allowed"
                  >
                    <Icon name={action.iconName} size={18} style={{ color: accentColor }} />
                    <span className="text-[9px] font-semibold text-txt-secondary uppercase tracking-wider">{action.label}</span>
                  </button>
                );
              }
              return (
                <a
                  key={action.label}
                  href={action.href}
                  {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="flex flex-col items-center gap-1.5 rounded-xl bg-card border border-border-subtle py-3 press hover:border-gold/20 transition-colors"
                >
                  <Icon name={action.iconName} size={18} style={{ color: accentColor }} />
                  <span className="text-[9px] font-semibold text-txt-secondary uppercase tracking-wider">{action.label}</span>
                </a>
              );
            })}
            <ShareQrButton
              url={profileUrl}
              title={biz.name}
              text={biz.description ?? undefined}
              accentColor={accentColor}
            />
          </div>
        </div>
      </div>

      {/* ── About ── */}
      {biz.description && (
        <div className="px-5 mt-5">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-1 h-5 rounded-full" style={{ background: accentColor }} />
            <h2 className="font-heading font-bold text-base">About</h2>
          </div>
          <p className="text-[13px] text-txt-secondary leading-relaxed">{biz.description}</p>
        </div>
      )}

      {/* ── Our Story (long-form narrative, owner-managed) ── */}
      {biz.story && (
        <div className="px-5 mt-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full bg-gold" />
            <h2 className="font-heading font-bold text-base" style={{ fontFamily: "var(--font-serif), 'DM Serif Display', serif" }}>
              Our Story
            </h2>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-gold/[0.03] via-card to-card border border-gold/15 p-5">
            <p className="text-[13px] text-txt-primary leading-relaxed whitespace-pre-line">
              {biz.story}
            </p>
          </div>
        </div>
      )}

      {/* ── Info Card ── */}
      <div className="px-5 mt-5">
        <div className="rounded-2xl bg-card border border-border-subtle overflow-hidden">
          {/* Address */}
          <div className="p-4 flex items-center gap-3.5 border-b border-border-subtle">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accentColor}15` }}>
              <Icon name="pin" size={18} style={{ color: accentColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{biz.address}</p>
              {biz.district && <p className="text-[11px] text-txt-secondary mt-0.5">District {biz.district}</p>}
            </div>
          </div>

          {/* Phone */}
          {biz.phone && (
            <a href={`tel:${biz.phone}`} className="p-4 flex items-center gap-3.5 border-b border-border-subtle press">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accentColor}15` }}>
                <Icon name="phone" size={18} style={{ color: accentColor }} />
              </div>
              <p className="text-sm font-bold" style={{ color: accentColor }}>{biz.phone}</p>
            </a>
          )}

          {/* Hours */}
          {todayHours && (
            <div className="p-4 flex items-center gap-3.5 border-b border-border-subtle">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accentColor}15` }}>
                <Icon name="clock" size={18} style={{ color: accentColor }} />
              </div>
              <div>
                <p className="text-sm font-bold">
                  <span className="text-emerald">Open</span>
                  <span className="text-txt-secondary font-normal"> · {typeof todayHours === "string" ? todayHours : `${todayHours.open} — ${todayHours.close}`}</span>
                </p>
                <p className="text-[11px] text-txt-secondary mt-0.5">Today&apos;s hours</p>
              </div>
            </div>
          )}

          {/* Website */}
          {biz.website && (
            <a
              href={biz.website.startsWith("http") ? biz.website : `https://${biz.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 flex items-center gap-3.5 press"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accentColor}15` }}>
                <span className="text-lg"><Icon name="globe" size={20} /></span>
              </div>
              <p className="text-sm font-bold truncate" style={{ color: accentColor }}>{biz.website}</p>
            </a>
          )}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="px-5 mt-5 mb-4">
        <div className="divider-subtle" />
      </div>

      {/* ── Services / Booking Section ── */}
      {biz.accepts_bookings && services.length > 0 && (
        <div className="px-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full bg-hc-purple" />
            <h2 className="font-heading font-bold text-base">Services</h2>
            <span className="ml-auto text-xs text-txt-secondary">{services.length} available</span>
          </div>

          <div className="space-y-2.5">
            {services.map((svc) => (
              <div
                key={svc.id}
                className="rounded-2xl bg-card border border-border-subtle p-4 relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-2xl bg-hc-purple" />
                <div className="flex items-center justify-between gap-3 pl-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate">{svc.name}</p>
                    {svc.description && (
                      <p className="text-[11px] text-txt-secondary mt-0.5 line-clamp-1">{svc.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-txt-secondary flex items-center gap-1">
                        <Icon name="clock" size={16} /> {svc.duration} min
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-base font-bold text-hc-purple">
                      ${(svc.price / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Book Now CTA */}
          <Link href={`/business/${biz.slug || biz.id}/book`} className="block mt-4">
            <div className="rounded-2xl bg-gradient-to-r from-hc-purple to-hc-blue p-4 flex items-center justify-between press">
              <div>
                <p className="text-white font-bold text-base">Book Appointment</p>
                <p className="text-white/70 text-xs font-medium">Select a service and time</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 10h10M12 6l4 4-4 4" />
                </svg>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Booking CTA without services list */}
      {biz.accepts_bookings && services.length === 0 && (
        <div className="px-5 mb-6">
          <Link href={`/business/${biz.slug || biz.id}/book`} className="block">
            <div className="rounded-2xl bg-gradient-to-r from-hc-purple to-hc-blue p-4 flex items-center justify-between press">
              <div>
                <p className="text-white font-bold text-base">Book Appointment</p>
                <p className="text-white/70 text-xs font-medium">Check availability and book</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 10h10M12 6l4 4-4 4" />
                </svg>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* ── Meet the owner — links to their user profile ── */}
      {owner && owner.handle && (
        <div className="px-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full" style={{ background: accentColor }} />
            <h2 className="font-heading font-bold text-base">Meet the owner</h2>
          </div>
          <Link
            href={`/user/${owner.handle}`}
            className="block rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 press hover:bg-white/[0.06] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-gradient-to-br from-royal to-hc-purple">
                {owner.avatar_url ? (
                  <img src={owner.avatar_url} alt={owner.display_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gold font-heading font-bold text-sm">
                    {owner.display_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[14px] font-heading font-bold truncate">{owner.display_name}</p>
                  {owner.verification_status === "verified" && (
                    <Icon name="verified" size={11} className="text-cyan" />
                  )}
                </div>
                {owner.handle && (
                  <p className="text-[11px] text-white/40">@{owner.handle}</p>
                )}
                {owner.bio && (
                  <p className="text-[12px] text-white/60 mt-1 line-clamp-2">{owner.bio}</p>
                )}
              </div>
              <div className="shrink-0 text-[11px] font-bold text-white/70 flex items-center gap-1">
                View profile
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 3l4 4-4 4" />
                </svg>
              </div>
            </div>

            {(ownerRecentPosts.length > 0 || ownerRecentEvents.length > 0) && (
              <div className="mt-3 pt-3 border-t border-white/[0.04] grid grid-cols-3 gap-2">
                {ownerRecentPosts.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="relative aspect-square rounded-lg overflow-hidden bg-white/[0.04]"
                  >
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full p-1.5 flex items-center text-[9px] text-white/60 leading-snug">
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
                    className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-gold/15 to-midnight"
                  >
                    {e.image_url ? (
                      <img src={e.image_url} alt={e.title} className="w-full h-full object-cover opacity-80" />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-1 left-1 right-1">
                      <p className="text-[8px] uppercase tracking-wider font-bold text-gold">Event</p>
                      <p className="text-[10px] font-bold text-white line-clamp-2">{e.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Link>
        </div>
      )}

      {/* ── Coupons / Promotions ── */}
      {promotions && promotions.length > 0 && (
        <div className="px-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full bg-emerald" />
            <h2 className="font-heading font-bold text-base">
              {isRetail ? "Deals" : "Coupons"}
            </h2>
          </div>
          <div className="space-y-2">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className="rounded-2xl bg-emerald/5 border border-emerald/20 p-3.5 relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald rounded-l-2xl" />
                <div className="pl-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base"><Icon name="tag" size={16} /></span>
                    <h3 className="text-[13px] font-bold text-emerald">{promo.title}</h3>
                  </div>
                  {promo.description && (
                    <p className="text-[11px] text-txt-secondary mt-1 line-clamp-2">{promo.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    {promo.promo_code && (
                      <span className="text-[10px] font-bold bg-emerald/10 text-emerald px-2 py-0.5 rounded-full border border-emerald/20">
                        Code: {promo.promo_code}
                      </span>
                    )}
                    {promo.discount_percent && (
                      <span className="text-[10px] font-bold text-emerald">
                        {promo.discount_percent}% OFF
                      </span>
                    )}
                    {promo.discount_amount && (
                      <span className="text-[10px] font-bold text-emerald">
                        ${(promo.discount_amount / 100).toFixed(2)} OFF
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Menu / Products Preview ── */}
      {menuItems && menuItems.length > 0 && (
        <div className="px-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full" style={{ background: accentColor }} />
            <h2 className="font-heading font-bold text-base">
              {isRetail ? "Products" : "Menu"}
            </h2>
            <Link
              href={`/business/${biz.slug || biz.id}/order`}
              className="ml-auto text-xs font-semibold press"
              style={{ color: accentColor }}
            >
              {isRetail ? "All Products" : "Full Menu"} →
            </Link>
          </div>

          {isRetail ? (
            /* Retail: Product grid with images */
            <div className="grid grid-cols-2 gap-3">
              {menuItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/business/${biz.slug || biz.id}/order`}
                  className="rounded-2xl bg-card border border-border-subtle overflow-hidden press hover:border-gold/20 transition-colors"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square bg-midnight/50">
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-3xl opacity-20">
                          {item.is_digital ? "phone" : "cart"}
                        </span>
                      </div>
                    )}
                    {/* Video indicator */}
                    {(item.mux_playback_id || item.video_url) && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
                    {item.is_digital && (
                      <div className="absolute bottom-2 left-2 bg-blue-500/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                        Digital
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <h3 className="text-[12px] font-bold truncate">{item.name}</h3>
                    <span className="text-sm font-heading font-bold" style={{ color: accentColor }}>
                      ${(item.price / 100).toFixed(2)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            /* Restaurant: List layout */
            <div className="space-y-2">
              {menuItems.map((item) => (
                <div key={item.id} className="rounded-2xl bg-card border border-border-subtle p-3.5 flex items-center gap-3 press hover:border-gold/20 transition-colors">
                  {/* Thumbnail for items with images */}
                  {item.image_url && (
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-midnight/50">
                      <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[13px] font-bold truncate">{item.name}</h3>
                    {item.category && (
                      <p className="text-[9px] text-txt-secondary uppercase tracking-wider mt-0.5">{item.category}</p>
                    )}
                  </div>
                  <span className="font-heading font-bold shrink-0 ml-3" style={{ color: accentColor }}>
                    ${(item.price / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Order / Shop CTA */}
          {biz.accepts_orders && (
            <Link href={`/business/${biz.slug || biz.id}/order`} className="block mt-4">
              <div className="rounded-2xl bg-gradient-to-r from-gold to-gold-light p-4 flex items-center justify-between press">
                <div>
                  <p className="text-midnight font-bold text-base">
                    {isRetail ? "Shop Now" : "Order Now"}
                  </p>
                  <p className="text-midnight/70 text-xs font-medium">
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
          )}
        </div>
      )}

      {/* ── Featured Reviews (top 3 with body) ── */}
      {typedFeatured.length > 0 && (
        <div className="px-5 mb-6 mt-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full bg-gold" />
            <h2 className="font-heading font-bold text-base">Featured Reviews</h2>
          </div>
          <div className="space-y-2.5">
            {typedFeatured.map((rev) => (
              <div
                key={rev.id}
                className="rounded-2xl bg-card border border-border-subtle p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-gold/10 flex items-center justify-center shrink-0 overflow-hidden">
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
                      <p className="text-sm font-bold leading-tight">
                        {rev.reviewer?.display_name || "Anonymous"}
                      </p>
                      <p className="text-[10px] text-txt-secondary">
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
                        size={14}
                        className={star <= rev.rating ? "text-gold" : "text-white/15"}
                      />
                    ))}
                  </div>
                </div>
                {rev.body && (
                  <p className="text-[13px] text-txt-secondary leading-relaxed">
                    {rev.body}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── All Reviews (interactive) ── */}
      <ReviewSection businessId={biz.id} />

      {/* ── Hours ── */}
      {biz.hours && Object.keys(biz.hours).length > 0 && (
        <div className="px-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full bg-cyan" />
            <h2 className="font-heading font-bold text-base">Hours</h2>
          </div>
          <div className="rounded-2xl bg-card border border-border-subtle overflow-hidden">
            {["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((day) => {
              const hours = biz.hours?.[day];
              if (!hours) return null;
              const isToday = day === today;
              const hoursStr = typeof hours === "string" ? hours : `${hours.open} — ${hours.close}`;
              return (
                <div
                  key={day}
                  className={`px-4 py-2.5 flex items-center justify-between text-sm border-b border-border-subtle last:border-0 ${
                    isToday ? "bg-gold/[0.03]" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isToday && <div className="w-1.5 h-1.5 rounded-full bg-gold" />}
                    <span className={isToday ? "font-bold text-gold" : "text-txt-secondary"}>
                      {dayFullNames[day]}
                    </span>
                  </div>
                  <span className={isToday ? "font-bold" : "text-txt-secondary"}>
                    {hoursStr}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
