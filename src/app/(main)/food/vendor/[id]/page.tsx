import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import type { Business, MenuItem, FoodSpecial, VendorStatus } from "@/types/database";

const statusConfig: Record<
  VendorStatus,
  { label: string; color: string; dot: string }
> = {
  active: { label: "Open Now", color: "text-emerald", dot: "bg-emerald" },
  open: { label: "Open Now", color: "text-emerald", dot: "bg-emerald" },
  en_route: { label: "En Route", color: "text-gold", dot: "bg-gold" },
  inactive: { label: "Offline", color: "text-txt-secondary", dot: "bg-txt-secondary" },
  closed: { label: "Closed", color: "text-txt-secondary", dot: "bg-txt-secondary" },
  sold_out: { label: "Sold Out", color: "text-coral", dot: "bg-coral" },
  cancelled: { label: "Cancelled", color: "text-coral", dot: "bg-coral" },
};

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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

export default async function VendorDetailPage({
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
  const status = statusConfig[biz.vendor_status] ?? statusConfig.inactive;
  const updatedAgo = timeAgo(biz.location_updated_at);
  const heroImage = biz.image_urls?.[0];

  // Fetch menu items
  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("*")
    .eq("business_id", biz.id)
    .eq("is_available", true)
    .order("sort_order")
    .limit(10);

  // Fetch active specials
  const { data: specials } = await supabase
    .from("food_specials")
    .select("*")
    .eq("business_id", biz.id)
    .eq("is_active", true)
    .gt("valid_until", new Date().toISOString());

  // Fetch route schedule
  const { data: routeSchedule } = await supabase
    .from("vendor_route_schedules")
    .select("*")
    .eq("business_id", biz.id)
    .order("day_of_week")
    .order("start_time");

  return (
    <div className="animate-fade-in">
      {/* Back Button */}
      <div className="px-5 pt-4 mb-3">
        <Link
          href="/food"
          className="inline-flex items-center gap-1.5 text-gold text-sm font-semibold press"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
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
          <div className="flex items-center gap-2">
            <Badge label="Food Truck" variant="coral" size="md" />
            <div className="flex items-center gap-1.5">
              <div
                className={`w-2.5 h-2.5 rounded-full ${status.dot} ${
                  biz.vendor_status === "active" ? "animate-pulse" : ""
                }`}
              />
              <span className={`text-xs font-semibold ${status.color}`}>
                {status.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5">
        {/* Name & Rating */}
        <div className="flex items-start justify-between mb-2">
          <h1 className="font-heading text-2xl font-bold">{biz.name}</h1>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-gold">★</span>
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

        {/* Current Location */}
        {biz.current_location_name && (
          <Card className="mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📍</span>
              <div className="flex-1">
                <p className="text-sm font-bold">
                  {biz.current_location_name}
                </p>
                {updatedAgo && (
                  <p className="text-[11px] text-txt-secondary">
                    Updated {updatedAgo}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-2 h-2 rounded-full ${status.dot} ${
                    biz.vendor_status === "active" ? "animate-pulse" : ""
                  }`}
                />
                <span className={`text-[11px] font-semibold ${status.color}`}>
                  {status.label}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Weekly Route Schedule */}
        {routeSchedule && routeSchedule.length > 0 && (
          <div className="mb-5">
            <h2 className="font-heading font-bold text-base mb-3">
              Weekly Route
            </h2>
            <Card>
              <div className="space-y-2.5">
                {routeSchedule.map(
                  (
                    slot: {
                      id: string;
                      day_of_week: number;
                      start_time: string;
                      end_time: string;
                      location_name: string;
                    }
                  ) => {
                    const today = new Date().getDay();
                    const isToday = slot.day_of_week === today;
                    return (
                      <div
                        key={slot.id}
                        className={`flex items-center justify-between text-sm ${
                          isToday ? "text-gold font-semibold" : "text-txt-secondary"
                        }`}
                      >
                        <span className="w-24 shrink-0">
                          {dayNames[slot.day_of_week]}
                        </span>
                        <span className="text-xs truncate flex-1 text-right mr-3">
                          {slot.location_name}
                        </span>
                        <span className="text-[11px] shrink-0">
                          {slot.start_time} - {slot.end_time}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Active Specials */}
        {specials && specials.length > 0 && (
          <div className="mb-5">
            <h2 className="font-heading font-bold text-base mb-3">
              Active Specials
            </h2>
            <div className="space-y-2">
              {(specials as FoodSpecial[]).map((special) => (
                <Card key={special.id} hover>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[13px] font-bold">{special.title}</h3>
                      {special.description && (
                        <p className="text-[11px] text-txt-secondary">
                          {special.description}
                        </p>
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
              <Button fullWidth size="lg">
                Order Now
              </Button>
            </Link>
          </div>
        )}

        {/* Contact Info */}
        <Card className="mb-6">
          <div className="space-y-3">
            {biz.phone && (
              <div className="flex items-center gap-3">
                <span className="text-lg">📞</span>
                <a
                  href={`tel:${biz.phone}`}
                  className="text-sm font-medium text-gold"
                >
                  {biz.phone}
                </a>
              </div>
            )}
            {biz.website && (
              <div className="flex items-center gap-3">
                <span className="text-lg">🌐</span>
                <a
                  href={
                    biz.website.startsWith("http")
                      ? biz.website
                      : `https://${biz.website}`
                  }
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
