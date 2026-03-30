import Link from "next/link";
import Image from "next/image";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { Business } from "@/types/database";

const categoryArt: Record<string, string> = {
  restaurant: "art-food",
  food_truck: "art-food",
  bakery: "art-food",
  cafe: "art-food",
};

const categoryLabels: Record<string, string> = {
  restaurant: "Restaurant",
  food_truck: "Food Truck",
  bakery: "Bakery",
  cafe: "Cafe",
};

export default function FoodBusinessCard({ business }: { business: Business }) {
  const artClass = categoryArt[business.category] ?? "art-food";
  const heroImage = business.image_urls?.[0];
  const isLive =
    business.is_mobile_vendor && business.vendor_status === "active";

  return (
    <Link href={`/business/${business.slug || business.id}`}>
      <Card hover padding={false}>
        <div className="flex gap-3 p-3">
          {/* Image */}
          <div className="w-20 h-20 rounded-xl shrink-0 overflow-hidden relative">
            {heroImage ? (
              <Image
                src={heroImage}
                alt={business.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className={`w-full h-full ${artClass}`} />
            )}
            {isLive && (
              <div className="absolute top-1.5 left-1.5 bg-emerald/90 backdrop-blur-sm rounded-full px-1.5 py-0.5 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[8px] font-bold text-white">LIVE</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-heading font-bold text-[13px] mb-0.5 truncate">
                {business.name}
              </h3>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-gold text-xs">★</span>
                <span className="text-xs font-bold">
                  {Number(business.rating_avg).toFixed(1)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-txt-secondary mb-1.5 truncate">
              {business.description}
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                label={
                  business.is_mobile_vendor
                    ? "Food Truck"
                    : categoryLabels[business.category] ?? business.category
                }
                variant={business.is_mobile_vendor ? "coral" : "purple"}
              />
              {business.is_mobile_vendor && business.current_location_name && (
                <span className="text-[10px] text-txt-secondary truncate">
                  📍 {business.current_location_name}
                </span>
              )}
              {!business.is_mobile_vendor && business.address && (
                <span className="text-[10px] text-txt-secondary truncate">
                  📍 {business.address.split(",")[0]}
                </span>
              )}
            </div>

            {business.accepts_orders && (
              <div className="mt-2">
                <span className="inline-flex items-center gap-1 bg-gold/10 text-gold text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  Order Now
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
