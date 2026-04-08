import Link from "next/link";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

type Park = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  address: string | null;
  district: number | string | null;
  amenities: string[] | null;
  image_urls: string[] | null;
  latitude: number | null;
  longitude: number | null;
  hours: Record<string, string> | string | null;
  phone: string | null;
  created_at: string;
};

const AMENITY_ICONS: Record<string, { icon: IconName; color: string }> = {
  playground: { icon: "baby", color: "text-pink" },
  basketball: { icon: "basketball", color: "text-orange-400" },
  bbq: { icon: "bbq", color: "text-orange-400" },
  restrooms: { icon: "restroom", color: "text-white/40" },
  pool: { icon: "swimming", color: "text-cyan" },
  tennis: { icon: "tennis", color: "text-emerald" },
  soccer: { icon: "soccer", color: "text-emerald" },
  baseball: { icon: "trophy", color: "text-gold" },
  picnic: { icon: "tree", color: "text-emerald" },
  walking: { icon: "tree", color: "text-emerald" },
  dog_park: { icon: "alert", color: "text-gold" },
  gym: { icon: "trophy", color: "text-hc-blue" },
  skatepark: { icon: "skateboard", color: "text-hc-purple" },
  splash_pad: { icon: "swimming", color: "text-cyan" },
};

const DISTRICT_COLORS: Record<number, string> = {
  1: "text-hc-blue bg-hc-blue/10 border-hc-blue/20",
  2: "text-hc-purple bg-hc-purple/10 border-hc-purple/20",
  3: "text-emerald bg-emerald/10 border-emerald/20",
  4: "text-gold bg-gold/10 border-gold/20",
};

interface ParkCardProps {
  park: Park;
}

export default function ParkCard({ park }: ParkCardProps) {
  const district = typeof park.district === "number" ? park.district : null;
  const districtStyle = district ? DISTRICT_COLORS[district] || "text-emerald bg-emerald/10 border-emerald/20" : null;

  // Parse hours
  let hoursText = "";
  if (park.hours) {
    if (typeof park.hours === "string") {
      hoursText = park.hours;
    } else if (park.hours.weekday) {
      hoursText = park.hours.weekday;
    }
  }

  return (
    <Link
      href={`/parks/${park.slug || park.id}`}
      className="block glass-card-elevated rounded-2xl p-4 press hover:border-emerald/20 transition-all"
    >
      <div className="flex items-start gap-3.5">
        {/* Park Icon */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald/15 to-emerald/5 border border-emerald/10 flex items-center justify-center shrink-0">
          <Icon name="tree" size={22} className="text-emerald" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-heading text-[14px] font-bold text-white truncate">{park.name}</h3>
              {park.address && (
                <p className="text-[11px] text-white/40 mt-0.5 truncate">{park.address}</p>
              )}
            </div>
            <Icon name="chevron-right" size={14} className="text-white/20 shrink-0 mt-1" />
          </div>

          {/* Hours */}
          {hoursText && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <Icon name="clock" size={10} className="text-emerald/60" />
              <span className="text-[10px] text-emerald/60">{hoursText}</span>
            </div>
          )}

          {/* Amenity pills */}
          {park.amenities && park.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {park.amenities.slice(0, 5).map((amenity) => {
                const detail = AMENITY_ICONS[amenity] || { icon: "check" as IconName, color: "text-white/40" };
                return (
                  <span
                    key={amenity}
                    className="inline-flex items-center gap-1 text-[9px] text-white/40 bg-white/[0.04] rounded-full px-2 py-0.5"
                    title={amenity.replace(/_/g, " ")}
                  >
                    <Icon name={detail.icon} size={10} className={detail.color} />
                    <span className="capitalize">{amenity.replace(/_/g, " ")}</span>
                  </span>
                );
              })}
              {park.amenities.length > 5 && (
                <span className="text-[9px] text-white/30 self-center ml-0.5">
                  +{park.amenities.length - 5}
                </span>
              )}
            </div>
          )}

          {/* District badge */}
          {districtStyle && (
            <span className={`inline-block mt-2 px-2 py-0.5 text-[9px] font-semibold rounded-full border ${districtStyle}`}>
              District {district}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export type { Park };
