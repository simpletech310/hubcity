import Link from "next/link";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

type Park = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  address: string | null;
  district: string | null;
  amenities: string[] | null;
  image_urls: string[] | null;
  latitude: number | null;
  longitude: number | null;
  hours: string | null;
  created_at: string;
};

const AMENITY_ICONS: Record<string, string> = {
  playground: "sparkle",
  basketball: "trophy",
  bbq: "flame",
  restrooms: "building",
  pool: "heart-pulse",
  tennis: "trophy",
  soccer: "trophy",
  baseball: "trophy",
  picnic: "theater",
  walking: "person",
  dog_park: "alert",
  gym: "trophy",
  skatepark: "sparkle",
  splash_pad: "heart-pulse",
};

interface ParkCardProps {
  park: Park;
}

export default function ParkCard({ park }: ParkCardProps) {
  const imageUrl = park.image_urls?.[0];

  return (
    <Link
      href={`/parks/${park.slug || park.id}`}
      className="group block bg-card rounded-2xl border border-border-subtle overflow-hidden card-glow transition-all duration-300 hover:border-gold/20"
    >
      <div className="aspect-[16/10] relative overflow-hidden bg-gradient-to-br from-emerald-900/40 to-emerald-600/20">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={park.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl opacity-40"><Icon name="tree" size={28} /></span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-heading font-bold text-text-primary truncate">
          {park.name}
        </h3>
        {park.address && (
          <p className="text-xs text-warm-gray mt-1 truncate">{park.address}</p>
        )}

        {/* Amenity icons */}
        {park.amenities && park.amenities.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {park.amenities.slice(0, 6).map((amenity) => (
              <span
                key={amenity}
                title={amenity.replace(/_/g, " ")}
              >
                <Icon name={(AMENITY_ICONS[amenity] || "check") as IconName} size={16} />
              </span>
            ))}
            {park.amenities.length > 6 && (
              <span className="text-[11px] text-warm-gray self-center">
                +{park.amenities.length - 6}
              </span>
            )}
          </div>
        )}

        {park.district && (
          <span className="inline-block mt-2 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {park.district}
          </span>
        )}
      </div>
    </Link>
  );
}

export type { Park };
