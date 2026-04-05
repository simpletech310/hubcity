import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import SaveButton from "@/components/ui/SaveButton";
import { createClient } from "@/lib/supabase/server";
import type { Business } from "@/types/database";
import ReviewSection from "./ReviewSection";

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

const badgeIcons: Record<string, string> = {
  black_owned: "✊🏿",
  women_owned: "👩🏾",
  woman_owned: "👩🏾",
  hispanic_owned: "🇲🇽",
  veteran_owned: "🎖️",
  locally_owned: "📍",
  lgbtq_friendly: "🏳️‍🌈",
  family_owned: "👨‍👩‍👧",
  eco_friendly: "🌱",
  city_certified: "🏛️",
  local_favorite: "⭐",
  new_business: "🆕",
  compton_original: "🏠",
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

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Try slug first, then id
  let { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", id)
    .single();

  if (!business) {
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", id)
      .single();
    business = data;
  }

  if (!business) notFound();

  const biz = business as Business;
  const accentColor = categoryColors[biz.category] || "#F2A900";
  const artClass = categoryArt[biz.category] ?? "art-city";
  const variant = categoryBadgeVariant[biz.category] || "gold";

  const isRetail = biz.category === "retail";

  // Fetch menu items
  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("*")
    .eq("business_id", biz.id)
    .eq("is_available", true)
    .order("sort_order")
    .limit(isRetail ? 8 : 6);

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

  // Determine if currently open
  const now = new Date();
  const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const today = dayNames[now.getDay()];
  const todayHours = biz.hours?.[today];

  return (
    <div className="animate-fade-in pb-safe">
      {/* ── Cinematic Hero ── */}
      <div className="relative h-64 overflow-hidden">
        {biz.image_urls?.[0] ? (
          <Image src={biz.image_urls[0]} alt={biz.name} fill className="object-cover" />
        ) : (
          <div className={`w-full h-full ${artClass} pattern-dots`} />
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-midnight/30 to-transparent" />

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
            <span className="text-gold text-xs">★</span>
            <span className="text-xs font-bold">{Number(biz.rating_avg).toFixed(1)}</span>
            <span className="text-[9px] text-txt-secondary">({biz.rating_count})</span>
          </div>
        )}

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 z-10">
          {/* Category + Status */}
          <div className="flex items-center gap-2 mb-2">
            <Badge label={biz.category} variant={variant} size="md" />
            {todayHours && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald/15 border border-emerald/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
                <span className="text-[10px] font-bold text-emerald">Open Now</span>
              </div>
            )}
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
                <span className="text-sm">{badgeIcons[badge] || "🏷️"}</span>
                <span className="text-[11px] font-bold text-gold-light whitespace-nowrap">
                  {formatBadgeLabel(badge)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick Actions Grid ── */}
      <div className="px-5 mt-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Call", icon: "📞", href: biz.phone ? `tel:${biz.phone}` : undefined },
            { label: "Directions", icon: "🗺️", href: biz.address ? `https://maps.google.com/?q=${encodeURIComponent(biz.address)}` : undefined },
            { label: "Website", icon: "🌐", href: biz.website ? (biz.website.startsWith("http") ? biz.website : `https://${biz.website}`) : undefined },
            { label: "Share", icon: "📤", href: undefined },
          ].map((action) => {
            const isExternal = action.href?.startsWith("http");
            const Wrapper = action.href ? "a" : "button";
            return (
              <Wrapper
                key={action.label}
                {...(action.href ? {
                  href: action.href,
                  ...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {}),
                } : {})}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-card border border-border-subtle py-3 press hover:border-gold/20 transition-colors"
              >
                <span className="text-lg">{action.icon}</span>
                <span className="text-[9px] font-semibold text-txt-secondary uppercase tracking-wider">{action.label}</span>
              </Wrapper>
            );
          })}
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

      {/* ── Info Card ── */}
      <div className="px-5 mt-5">
        <div className="rounded-2xl bg-card border border-border-subtle overflow-hidden">
          {/* Address */}
          <div className="p-4 flex items-center gap-3.5 border-b border-border-subtle">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accentColor}15` }}>
              <span className="text-lg">📍</span>
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
                <span className="text-lg">📞</span>
              </div>
              <p className="text-sm font-bold" style={{ color: accentColor }}>{biz.phone}</p>
            </a>
          )}

          {/* Hours */}
          {todayHours && (
            <div className="p-4 flex items-center gap-3.5 border-b border-border-subtle">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accentColor}15` }}>
                <span className="text-lg">🕐</span>
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
                <span className="text-lg">🌐</span>
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
                        🕐 {svc.duration} min
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
                    <span className="text-base">🏷️</span>
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
                          {item.is_digital ? "📱" : "📦"}
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

      {/* ── Reviews ── */}
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
