import Link from "next/link";

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
  playground: "🛝",
  basketball: "🏀",
  bbq: "🔥",
  restrooms: "🚻",
  pool: "🏊",
  tennis: "🎾",
  soccer: "⚽",
  baseball: "⚾",
  picnic: "🎪",
  walking: "🚶",
  dog_park: "🐕",
  gym: "💪",
  skatepark: "🛹",
  splash_pad: "💦",
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
            <span className="text-4xl opacity-40">🌳</span>
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
                className="text-sm"
                title={amenity.replace(/_/g, " ")}
              >
                {AMENITY_ICONS[amenity] || "✅"}
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
