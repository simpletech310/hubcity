import { notFound } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/server";
import {
  HeroBlock,
  EditorialNumber,
  SectionKicker,
  EditorialCard,
  Tag,
  IssueDivider,
} from "@/components/ui/editorial";
import PullQuote from "@/components/ui/PullQuote";
import type {
  Business,
  MenuItem,
  FoodSpecial,
  VendorStatus,
  VendorVehicle,
} from "@/types/database";

type StatusTone = "emerald" | "gold" | "coral" | "ghost";

const statusConfig: Record<
  VendorStatus,
  { label: string; tone: StatusTone; pulse: boolean }
> = {
  active: { label: "Open Now", tone: "emerald", pulse: true },
  open: { label: "Open Now", tone: "emerald", pulse: true },
  en_route: { label: "On the way", tone: "gold", pulse: true },
  inactive: { label: "Offline", tone: "ghost", pulse: false },
  closed: { label: "Closed", tone: "ghost", pulse: false },
  sold_out: { label: "Sold Out", tone: "coral", pulse: false },
  cancelled: { label: "Cancelled", tone: "coral", pulse: false },
};

const dotClass: Record<StatusTone, string> = {
  emerald: "bg-emerald",
  gold: "bg-gold",
  coral: "bg-coral",
  ghost: "bg-ivory/40",
};

const textClass: Record<StatusTone, string> = {
  emerald: "text-emerald",
  gold: "text-gold",
  coral: "text-coral",
  ghost: "text-ivory/50",
};

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

function fmtTime(t: string) {
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:${m} ${ampm}`;
}

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Resolve business by slug first, then by id
  let { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", id)
    .eq("is_mobile_vendor", true)
    .single();

  if (!business) {
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", id)
      .eq("is_mobile_vendor", true)
      .single();
    business = data;
  }

  if (!business) notFound();

  const biz = business as Business;
  const heroImage = biz.image_urls?.[0];

  // Fetch the business's fleet (all active vehicles)
  const { data: rawVehicles } = await supabase
    .from("vendor_vehicles")
    .select("*")
    .eq("business_id", biz.id)
    .eq("is_active", true)
    .order("created_at");

  const vehicles = (rawVehicles as VendorVehicle[]) ?? [];

  // Pick a "headline" vehicle to render the status badge at the top
  const priority: VendorStatus[] = ["open", "active", "en_route", "sold_out", "closed", "inactive", "cancelled"];
  const headline =
    vehicles.slice().sort((a, b) => {
      const ai = priority.indexOf(a.vendor_status);
      const bi = priority.indexOf(b.vendor_status);
      return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    })[0] ?? null;
  const headlineStatus = headline ? statusConfig[headline.vendor_status] : null;

  // Fetch menu items + specials (same as before)
  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("*")
    .eq("business_id", biz.id)
    .eq("is_available", true)
    .order("sort_order")
    .limit(10);

  const { data: specials } = await supabase
    .from("food_specials")
    .select("*")
    .eq("business_id", biz.id)
    .eq("is_active", true)
    .gt("valid_until", new Date().toISOString());

  const menu = (menuItems as MenuItem[]) ?? [];
  const activeSpecials = (specials as FoodSpecial[]) ?? [];

  // Build the numbered-section order dynamically so the № labels stay sequential
  const numberedSections: string[] = ["menu"];
  if (activeSpecials.length > 0) numberedSections.push("specials");
  numberedSections.push("hours");
  if (vehicles.length > 0) numberedSections.push("fleet");
  const sectionIndex = (key: string) => numberedSections.indexOf(key) + 1;

  const today = new Date().getDay();
  const categoryLabel = biz.category ? biz.category.replace(/_/g, " ") : "Food Vendor";

  return (
    <div className="culture-surface min-h-dvh animate-fade-in pb-24">
      {/* Back chip (minimal) */}
      <div className="px-5 pt-4 pb-3">
        <Link
          href="/food"
          className="inline-flex items-center gap-1.5 text-gold text-[11px] font-bold uppercase tracking-editorial press"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M9 11L5 7l4-4" />
          </svg>
          Food
        </Link>
      </div>

      {/* --- COVER --- */}
      <HeroBlock image={heroImage} aspect="3/2" alt={biz.name}>
        {/* Top-right status */}
        <div className="absolute top-6 right-10 flex items-center gap-2">
          <Tag tone="gold" size="xs">
            {vehicles.length > 1 ? "Fleet" : "Food Truck"}
          </Tag>
          {biz.badges?.includes("verified") && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[9px] font-semibold uppercase tracking-[0.12em] bg-cyan/10 border border-cyan/30 text-cyan"
              title="Verified"
            >
              <Icon name="verified" size={10} strokeWidth={2.4} />
              Verified
            </span>
          )}
        </div>

        {/* Bottom overlay — name + category + live status */}
        <div className="absolute inset-x-0 bottom-0 px-6 pb-7">
          <span className="c-kicker block mb-1" style={{ color: "var(--gold-c)" }}>{categoryLabel}</span>
          <h1 className="c-hero text-white" style={{ color: "#fff", textShadow: "0 2px 24px rgba(0,0,0,0.5)" }}>
            {biz.name}
          </h1>
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <span className="c-serif-it text-[14px]" style={{ color: "#fff" }}>
              {categoryLabel}
            </span>
            {headlineStatus && (
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${dotClass[headlineStatus.tone]} ${
                    headlineStatus.pulse ? "animate-pulse" : ""
                  }`}
                />
                <span className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${textClass[headlineStatus.tone]}`}>
                  {headlineStatus.label}
                </span>
              </span>
            )}
            {biz.rating_count && biz.rating_count > 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ivory/85">
                <Icon name="star" size={12} className="text-gold" />
                <span className="text-gold">{Number(biz.rating_avg).toFixed(1)}</span>
                <span className="text-ivory/50">({biz.rating_count})</span>
              </span>
            ) : null}
          </div>
        </div>
      </HeroBlock>

      {/* --- BYLINE STRIP --- */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: "3px solid var(--rule-strong-c, var(--ink-strong))" }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3 min-w-0">
            <EditorialNumber n={1} size="md" />
            <SectionKicker tone="gold">VENDOR</SectionKicker>
            <span className="block h-px w-10 bg-gold/60" />
            <SectionKicker tone="muted">
              {vehicles.length > 1 ? `Fleet · ${vehicles.length} Vehicles` : "Mobile Vendor"}
            </SectionKicker>
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {biz.accepts_orders && <Tag tone="gold" size="xs">Orders</Tag>}
            {headline?.current_location_name && (
              <Tag tone="default" size="xs">
                <Icon name="pin" size={9} className="text-gold mr-1" />
                {headline.current_location_name.length > 18
                  ? headline.current_location_name.slice(0, 18) + "..."
                  : headline.current_location_name}
              </Tag>
            )}
          </div>
        </div>
      </div>

      {/* --- PULL QUOTE (tagline / description) --- */}
      {biz.description && (
        <div className="px-6 py-8">
          <PullQuote
            quote={biz.description}
            attribution={biz.name}
            size="lg"
          />
        </div>
      )}

      {/* --- № 01 MENU --- */}
      {menu.length > 0 && (
        <section>
          <div className="px-5 mb-3 flex items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-3 min-w-0">
              <EditorialNumber n={sectionIndex("menu")} size="md" />
              <SectionKicker tone="muted">Menu</SectionKicker>
            </div>
            {biz.accepts_orders && (
              <Link
                href={`/business/${biz.slug || biz.id}/order`}
                className="text-[10px] font-bold tracking-editorial-tight uppercase text-gold press whitespace-nowrap"
              >
                Full Menu →
              </Link>
            )}
          </div>
          <div className="px-5 mb-4">
            <div className="rule-hairline" />
          </div>
          <div className="px-5 space-y-2">
            {menu.map((item) => (
              <EditorialCard key={item.id} variant="ink" border="subtle" className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-[18px] leading-tight text-ivory truncate">
                      {item.name}
                    </h3>
                    {item.category && (
                      <p className="mt-1 text-[10px] uppercase tracking-editorial text-ivory/50">
                        {item.category}
                      </p>
                    )}
                    {item.description && (
                      <p className="mt-1.5 text-[12px] text-ivory/70 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <span className="font-display text-[20px] text-gold tabular-nums shrink-0">
                    ${(item.price / 100).toFixed(2)}
                  </span>
                </div>
              </EditorialCard>
            ))}
          </div>
        </section>
      )}

      {/* --- № 02 SPECIALS --- */}
      {activeSpecials.length > 0 && (
        <>
          <IssueDivider />
          <section>
            <div className="px-5 mb-3 flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-3 min-w-0">
                <EditorialNumber n={sectionIndex("specials")} size="md" />
                <SectionKicker tone="muted">Active Specials</SectionKicker>
              </div>
              <span className="text-[10px] font-bold tracking-editorial-tight uppercase text-ivory/40 tabular-nums">
                {activeSpecials.length}
              </span>
            </div>
            <div className="px-5 mb-4">
              <div className="rule-hairline" />
            </div>
            <div className="px-5 space-y-2">
              {activeSpecials.map((special) => {
                const savings = special.original_price - special.special_price;
                const pctOff =
                  special.original_price > 0
                    ? Math.round((savings / special.original_price) * 100)
                    : 0;
                return (
                  <EditorialCard
                    key={special.id}
                    variant="ink"
                    border="gold"
                    className="p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Tag tone="gold" size="xs">Special</Tag>
                          {pctOff > 0 && (
                            <span className="text-[10px] font-bold uppercase tracking-editorial-tight text-gold">
                              {pctOff}% off
                            </span>
                          )}
                        </div>
                        <h3 className="font-display text-[18px] leading-tight text-ivory truncate">
                          {special.title}
                        </h3>
                        {special.description && (
                          <p className="mt-1 text-[12px] text-ivory/70 leading-relaxed line-clamp-2">
                            {special.description}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-[11px] text-ivory/50 line-through tabular-nums">
                          ${(special.original_price / 100).toFixed(2)}
                        </div>
                        <div className="font-display text-[22px] text-gold tabular-nums leading-none mt-0.5">
                          ${(special.special_price / 100).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </EditorialCard>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* --- № XX HOURS & LOCATION --- */}
      <IssueDivider />
      <section>
        <div className="px-5 mb-3 flex items-baseline gap-3">
          <EditorialNumber n={sectionIndex("hours")} size="md" />
          <SectionKicker tone="muted">Hours &amp; Location</SectionKicker>
        </div>
        <div className="px-5 mb-4">
          <div className="rule-hairline" />
        </div>
        <div className="px-5">
          <EditorialCard variant="ink" border="subtle" className="p-5">
            <div className="space-y-4">
              {headline?.current_location_name ? (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/25 flex items-center justify-center shrink-0">
                    <Icon name="pin" size={14} className="text-gold" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-editorial text-ivory/50 font-bold">
                      Current Stop
                    </p>
                    <p className="mt-0.5 text-[14px] text-ivory/85 leading-tight">
                      {headline.current_location_name}
                    </p>
                    {headline.location_updated_at && (
                      <p className="mt-0.5 text-[11px] text-ivory/50">
                        Updated {timeAgo(headline.location_updated_at)}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                    <Icon name="pin" size={14} className="text-ivory/50" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-editorial text-ivory/50 font-bold">
                      Location
                    </p>
                    <p className="mt-0.5 text-[13px] text-ivory/70">
                      Check the fleet below for today&apos;s stops
                    </p>
                  </div>
                </div>
              )}

              {biz.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                    <Icon name="phone" size={14} className="text-gold" />
                  </div>
                  <a href={`tel:${biz.phone}`} className="text-[14px] font-medium text-gold">
                    {biz.phone}
                  </a>
                </div>
              )}

              {biz.website && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                    <Icon name="globe" size={14} className="text-gold" />
                  </div>
                  <a
                    href={biz.website.startsWith("http") ? biz.website : `https://${biz.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[14px] font-medium text-gold truncate"
                  >
                    {biz.website}
                  </a>
                </div>
              )}
            </div>
          </EditorialCard>
        </div>
      </section>

      {/* --- № XX FLEET (per-vehicle route + directions) --- */}
      {vehicles.length > 0 && (
        <>
          <IssueDivider />
          <section>
            <div className="px-5 mb-3 flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-3 min-w-0">
                <EditorialNumber n={sectionIndex("fleet")} size="md" />
                <SectionKicker tone="muted">
                  {vehicles.length > 1 ? "Fleet" : "Current Vehicle"}
                </SectionKicker>
              </div>
              <span className="text-[10px] font-bold tracking-editorial-tight uppercase text-ivory/40 tabular-nums">
                {vehicles.length}
              </span>
            </div>
            <div className="px-5 mb-4">
              <div className="rule-hairline" />
            </div>
            <div className="px-5 space-y-3">
              {vehicles.map((v) => {
                const status = statusConfig[v.vendor_status] ?? statusConfig.inactive;
                const typeLabel = v.vehicle_type === "cart" ? "Cart" : "Truck";
                const todaysStops = (v.vendor_route ?? [])
                  .filter((s) => s.day_of_week === today)
                  .sort((a, b) => a.start_time.localeCompare(b.start_time));
                const directionsHref =
                  v.current_lat != null && v.current_lng != null
                    ? `https://www.google.com/maps/dir/?api=1&destination=${v.current_lat},${v.current_lng}`
                    : null;

                return (
                  <EditorialCard key={v.id} variant="ink" border="subtle" className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/25 flex items-center justify-center shrink-0">
                        <Icon
                          name={v.vehicle_type === "cart" ? "cart" : "truck"}
                          size={18}
                          className="text-gold"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-display text-[16px] leading-none text-ivory truncate">
                            {v.name}
                          </h3>
                          <span className="text-[10px] uppercase tracking-editorial text-ivory/40 shrink-0">
                            {typeLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${dotClass[status.tone]} ${
                              status.pulse ? "animate-pulse" : ""
                            }`}
                          />
                          <span className={`text-[11px] font-semibold uppercase tracking-[0.1em] ${textClass[status.tone]}`}>
                            {status.label}
                          </span>
                          {v.location_updated_at && (
                            <span className="text-[10px] text-ivory/40">
                              &middot; {timeAgo(v.location_updated_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {v.current_location_name && (
                      <p className="text-[12px] text-ivory/85 flex items-center gap-1.5 mb-3">
                        <Icon name="pin" size={12} className="text-gold shrink-0" />
                        <span className="truncate">{v.current_location_name}</span>
                      </p>
                    )}

                    {todaysStops.length > 0 && (
                      <div className="rounded-lg bg-black/30 border border-white/[0.04] p-3 mb-3">
                        <p className="text-[9px] uppercase tracking-editorial text-gold font-bold mb-1.5">
                          Today &mdash; {dayNames[today]}
                        </p>
                        <div className="space-y-1">
                          {todaysStops.map((stop, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between text-[11px] text-ivory/70"
                            >
                              <span className="truncate">{stop.name}</span>
                              <span className="shrink-0 tabular-nums text-ivory/50">
                                {fmtTime(stop.start_time)} &ndash; {fmtTime(stop.end_time)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {directionsHref && (
                      <a
                        href={directionsHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center py-2 rounded-xl bg-transparent border border-gold/40 text-gold text-[12px] font-bold uppercase tracking-editorial press hover:bg-gold/10 transition-colors"
                      >
                        Get directions
                      </a>
                    )}
                  </EditorialCard>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* --- CTA footer --- */}
      <IssueDivider label="END" />

      {biz.accepts_orders ? (
        <div className="px-5">
          <Link
            href={`/business/${biz.slug || biz.id}/order`}
            className="block w-full text-center py-3.5 bg-gold text-midnight font-bold text-sm press hover:bg-gold-light transition-colors uppercase tracking-[0.14em]"
          >
            Order Now
          </Link>
          <p className="mt-3 text-center text-[10px] uppercase tracking-editorial" style={{ color: "var(--ink-mute)" }}>
            Delivered to your table. Straight from the kitchen.
          </p>
        </div>
      ) : (
        <div className="px-6 flex items-center justify-between text-[10px] font-semibold tracking-editorial uppercase" style={{ color: "var(--ink-mute)" }}>
          <span className="flex items-center gap-2">
            <Icon name="truck" size={12} className="text-gold" />
            {categoryLabel}
          </span>
          <span className="tabular-nums" style={{ color: "var(--ink-soft)" }}>
            {biz.slug ? `@${biz.slug}` : ""}
          </span>
        </div>
      )}
    </div>
  );
}
