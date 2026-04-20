import Link from "next/link";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";

interface BusinessSummary {
  id: string;
  slug: string | null;
  name: string;
  category: string | null;
  description: string | null;
  image_urls: string[] | null;
  rating_avg: number | null;
  rating_count: number | null;
  is_verified?: boolean | null;
  account_type: string | null;
}

interface ProfileBusinessStripProps {
  business: BusinessSummary;
}

export default function ProfileBusinessStrip({ business }: ProfileBusinessStripProps) {
  const href = `/business/${business.slug || business.id}`;
  const cover = business.image_urls?.[0] ?? null;
  const isAd = business.account_type === "ads_only";

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] mb-4">
      {/* Backdrop */}
      <div className="absolute inset-0">
        {cover ? (
          <img src={cover} alt="" className="w-full h-full object-cover opacity-50" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald/30 via-gold/20 to-midnight" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/55 to-black/80" />
      </div>

      <div className="relative p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/15 bg-white/[0.06]">
          {cover ? (
            <img src={cover} alt={business.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-emerald">
              <Icon name="store" size={20} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
              Business
            </p>
            {business.is_verified && (
              <Icon name="verified" size={11} className="text-cyan" />
            )}
          </div>
          <p className="text-[15px] font-heading font-bold truncate">{business.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {business.category && (
              <Badge label={business.category} variant="emerald" />
            )}
            {isAd && <Badge label="Ad partner" variant="gold" />}
            {business.rating_avg != null && business.rating_count != null && business.rating_count > 0 && (
              <span className="text-[10px] text-white/60 flex items-center gap-0.5">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="#F2A900"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                {business.rating_avg.toFixed(1)} ({business.rating_count})
              </span>
            )}
          </div>
        </div>
        <Link
          href={href}
          className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold bg-emerald text-midnight press hover:bg-emerald/80 transition-colors"
        >
          View
        </Link>
      </div>
    </div>
  );
}
