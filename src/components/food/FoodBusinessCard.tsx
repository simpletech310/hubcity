import Link from "next/link";
import Image from "next/image";
import type { Business } from "@/types/database";
import Icon from "@/components/ui/Icon";

const categoryLabels: Record<string, string> = {
  restaurant: "Restaurant",
  food_truck: "Food Truck",
  bakery: "Bakery",
  cafe: "Cafe",
};

export default function FoodBusinessCard({ business }: { business: Business }) {
  const heroImage = business.image_urls?.[0];
  // Per-vehicle live status lives on vendor_vehicles; the
  // business-level card just shows a generic "Fleet" chip for mobile.
  const isLive = business.is_mobile_vendor === true;

  const categoryLabel = business.is_mobile_vendor
    ? "FOOD TRUCK"
    : (categoryLabels[business.category] ?? business.category).toUpperCase();

  return (
    <Link
      href={`/business/${business.slug || business.id}`}
      className="block press"
      style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
    >
      <div className="flex gap-3 p-3">
        {/* Image */}
        <div
          className="w-20 h-20 shrink-0 overflow-hidden relative"
          style={{ border: "2px solid var(--rule-strong-c)", background: "var(--paper-soft)" }}
        >
          {heroImage ? (
            <Image src={heroImage} alt={business.name} fill className="object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: "var(--ink-strong)" }}
            >
              <Icon name="utensils" size={22} style={{ color: "var(--gold-c)" }} />
            </div>
          )}
          {isLive && (
            <div
              className="absolute top-1 left-1 inline-flex items-center gap-1 px-1"
              style={{
                background: "var(--paper)",
                border: "1.5px solid var(--rule-strong-c)",
                height: 15,
              }}
            >
              <span
                className="animate-pulse"
                style={{ width: 5, height: 5, background: "var(--gold-c)", display: "inline-block" }}
              />
              <span className="c-kicker" style={{ fontSize: 8, letterSpacing: "0.14em" }}>
                LIVE
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="c-card-t truncate" style={{ fontSize: 14, color: "var(--ink-strong)" }}>
              {business.name}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              <Icon name="star" size={12} style={{ color: "var(--gold-c)" }} />
              <span className="c-meta" style={{ fontSize: 11, textTransform: "none" }}>
                {Number(business.rating_avg).toFixed(1)}
              </span>
            </div>
          </div>

          {business.description && (
            <p
              className="c-body mt-0.5 truncate"
              style={{ fontSize: 12, opacity: 0.8 }}
            >
              {business.description}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap mt-2">
            <span className="c-badge c-badge-ink" style={{ fontSize: 9 }}>
              {categoryLabel}
            </span>
            {business.is_mobile_vendor && (
              <span
                className="c-kicker inline-flex items-center gap-1"
                style={{ fontSize: 9, opacity: 0.65 }}
              >
                <Icon name="truck" size={10} />
                TRACK ON MAP
              </span>
            )}
            {!business.is_mobile_vendor && business.address && (
              <span
                className="c-kicker inline-flex items-center gap-1 truncate"
                style={{ fontSize: 9, opacity: 0.65 }}
              >
                <Icon name="pin" size={10} />
                {business.address.split(",")[0]}
              </span>
            )}
          </div>

          {business.accepts_orders && (
            <div className="mt-2">
              <span className="c-badge c-badge-gold" style={{ fontSize: 9 }}>
                ORDER NOW
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
