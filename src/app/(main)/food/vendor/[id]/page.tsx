import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import type {
  Business,
  MenuItem,
  FoodSpecial,
  VendorStatus,
  VendorVehicle,
} from "@/types/database";

const statusConfig: Record<
  VendorStatus,
  { label: string; color: string; dot: string }
> = {
  active: { label: "Open Now", color: "text-emerald", dot: "bg-emerald" },
  open: { label: "Open Now", color: "text-emerald", dot: "bg-emerald" },
  en_route: { label: "On the way", color: "text-gold", dot: "bg-gold" },
  inactive: { label: "Offline", color: "text-txt-secondary", dot: "bg-txt-secondary" },
  closed: { label: "Closed", color: "text-txt-secondary", dot: "bg-txt-secondary" },
  sold_out: { label: "Sold Out", color: "text-coral", dot: "bg-coral" },
  cancelled: { label: "Cancelled", color: "text-coral", dot: "bg-coral" },
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

  return (
    <div className="animate-fade-in">
      {/* Back */}
      <div className="px-5 pt-4 mb-3">
        <Link
          href="/food"
          className="inline-flex items-center gap-1.5 text-gold text-sm font-semibold press"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M10 12L6 8l4-4" />
          </svg>
          Food
        </Link>
      </div>

      {/* Hero */}
      <div className="mx-5 h-44 rounded-2xl relative overflow-hidden mb-5">
        {heroImage ? (
          <Image src={heroImage} alt={biz.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full art-food" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/40 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge label={vehicles.length > 1 ? "Fleet" : "Food Truck"} variant="coral" size="md" />
            {headlineStatus && (
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${headlineStatus.dot} ${
                    headline?.vendor_status === "open" || headline?.vendor_status === "active"
                      ? "animate-pulse"
                      : ""
                  }`}
                />
                <span className={`text-xs font-semibold ${headlineStatus.color}`}>
                  {headlineStatus.label}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-5">
        {/* Name & Rating */}
        <div className="flex items-start justify-between mb-2">
          <h1 className="font-heading text-2xl font-bold">{biz.name}</h1>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-gold"><Icon name="star" size={16} className="text-gold" /></span>
            <span className="font-bold">
              {Number(biz.rating_avg).toFixed(1)}
            </span>
            <span className="text-xs text-txt-secondary">
              ({biz.rating_count})
            </span>
          </div>
        </div>

        {biz.description && (
          <p className="text-[13px] text-txt-secondary mb-4 leading-relaxed">
            {biz.description}
          </p>
        )}

        {/* ── Fleet ─────────────────────────────────── */}
        {vehicles.length > 0 && (
          <div className="mb-5">
            <h2 className="font-heading font-bold text-base mb-3">
              {vehicles.length > 1 ? `Fleet (${vehicles.length})` : "Current Vehicle"}
            </h2>
            <div className="space-y-3">
              {vehicles.map((v) => {
                const status = statusConfig[v.vendor_status] ?? statusConfig.inactive;
                const isLive = v.vendor_status === "open" || v.vendor_status === "active";
                const typeLabel = v.vehicle_type === "cart" ? "Cart" : "Truck";
                const today = new Date().getDay();
                const todaysStops = (v.vendor_route ?? [])
                  .filter((s) => s.day_of_week === today)
                  .sort((a, b) => a.start_time.localeCompare(b.start_time));
                const directionsHref =
                  v.current_lat != null && v.current_lng != null
                    ? `https://www.google.com/maps/dir/?api=1&destination=${v.current_lat},${v.current_lng}`
                    : null;

                return (
                  <Card key={v.id}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                        <Icon
                          name={v.vehicle_type === "cart" ? "cart" : "truck"}
                          size={18}
                          className="text-gold"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-heading font-bold text-sm truncate">
                            {v.name}
                          </h3>
                          <span className="text-[10px] text-white/40 shrink-0">{typeLabel}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-2 h-2 rounded-full ${status.dot} ${isLive ? "animate-pulse" : ""}`}
                          />
                          <span className={`text-[11px] font-semibold ${status.color}`}>
                            {status.label}
                          </span>
                          {v.location_updated_at && (
                            <span className="text-[10px] text-white/30">
                              &middot; {timeAgo(v.location_updated_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {v.current_location_name && (
                      <p className="text-[12px] text-white/80 flex items-center gap-1.5 mb-2">
                        <Icon name="pin" size={12} className="text-gold shrink-0" />
                        <span className="truncate">{v.current_location_name}</span>
                      </p>
                    )}

                    {todaysStops.length > 0 && (
                      <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-2 mb-2">
                        <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold mb-1">
                          Today &mdash; {dayNames[today]}
                        </p>
                        <div className="space-y-1">
                          {todaysStops.map((stop, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between text-[11px] text-white/70"
                            >
                              <span className="truncate">{stop.name}</span>
                              <span className="shrink-0 tabular-nums text-white/50">
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
                        className="block w-full text-center py-2 rounded-xl bg-gold text-midnight text-[12px] font-bold press hover:bg-gold-light"
                      >
                        Get directions
                      </a>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Specials */}
        {specials && specials.length > 0 && (
          <div className="mb-5">
            <h2 className="font-heading font-bold text-base mb-3">Active Specials</h2>
            <div className="space-y-2">
              {(specials as FoodSpecial[]).map((special) => (
                <Card key={special.id} hover>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[13px] font-bold">{special.title}</h3>
                      {special.description && (
                        <p className="text-[11px] text-txt-secondary">{special.description}</p>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-txt-secondary line-through">
                        ${(special.original_price / 100).toFixed(2)}
                      </span>
                      <span className="font-heading font-bold text-gold">
                        ${(special.special_price / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Menu Preview */}
        {menuItems && menuItems.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-bold text-base">Menu</h2>
              {biz.accepts_orders && (
                <Link
                  href={`/business/${biz.slug || biz.id}/order`}
                  className="text-xs text-gold font-semibold press"
                >
                  Full Menu
                </Link>
              )}
            </div>
            <div className="space-y-2">
              {(menuItems as MenuItem[]).map((item) => (
                <Card key={item.id} hover>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[13px] font-bold">{item.name}</h3>
                      {item.category && (
                        <p className="text-[10px] text-txt-secondary/70 uppercase tracking-wide">
                          {item.category}
                        </p>
                      )}
                    </div>
                    <span className="font-heading font-bold text-gold">
                      ${(item.price / 100).toFixed(2)}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {biz.accepts_orders && (
          <div className="mb-6">
            <Link href={`/business/${biz.slug || biz.id}/order`}>
              <Button fullWidth size="lg">Order Now</Button>
            </Link>
          </div>
        )}

        {/* Contact */}
        <Card className="mb-6">
          <div className="space-y-3">
            {biz.phone && (
              <div className="flex items-center gap-3">
                <span className="text-lg"><Icon name="phone" size={20} /></span>
                <a href={`tel:${biz.phone}`} className="text-sm font-medium text-gold">
                  {biz.phone}
                </a>
              </div>
            )}
            {biz.website && (
              <div className="flex items-center gap-3">
                <span className="text-lg"><Icon name="globe" size={20} /></span>
                <a
                  href={biz.website.startsWith("http") ? biz.website : `https://${biz.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-gold truncate"
                >
                  {biz.website}
                </a>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
