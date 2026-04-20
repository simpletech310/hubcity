import Link from "next/link";
import Icon, { type IconName } from "@/components/ui/Icon";
import type { RelatedToLiveData, RelatedItem } from "@/lib/live/relatedToLive";

const KIND_ICON: Record<RelatedItem["kind"], IconName> = {
  event: "calendar",
  resource: "book",
  business: "store",
  promo: "tag",
  exhibit: "palette",
};

interface RelatedToLiveProps {
  data: RelatedToLiveData | null;
}

export default function RelatedToLive({ data }: RelatedToLiveProps) {
  if (!data || data.items.length === 0) return null;

  return (
    <section className="relative mb-8 -mt-2">
      {/* Section header */}
      <div className="flex items-center justify-between px-5 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-block w-1.5 h-4 rounded-full shrink-0"
            style={{ background: data.accent }}
          />
          <div className="min-w-0">
            <p
              className="text-[10px] font-bold uppercase tracking-wider truncate"
              style={{ color: data.accent }}
            >
              Because you&apos;re watching
            </p>
            <h3 className="font-heading font-bold text-[15px] leading-tight truncate">
              {data.headline}
            </h3>
          </div>
        </div>
        <span className="text-[10px] text-white/40 font-semibold shrink-0 tabular-nums">
          {data.items.length}
        </span>
      </div>

      {/* Horizontal rail */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-2.5 px-5 pb-1">
          {data.items.map((item) => {
            const icon = KIND_ICON[item.kind];
            const chipTone = item.chip?.tone ?? "gold";
            return (
              <Link
                key={item.id}
                href={item.href}
                className="shrink-0 w-[200px] rounded-2xl border border-white/[0.06] bg-card press group hover:border-white/[0.14] transition-colors overflow-hidden relative"
              >
                {/* Accent strip */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] opacity-60"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${data.accent}, transparent)`,
                  }}
                />

                {/* Image or gradient placeholder */}
                <div className="relative aspect-[4/3] w-full bg-white/[0.03] overflow-hidden">
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${data.accent}22, transparent 70%)`,
                      }}
                    >
                      <Icon name={icon} size={28} className="text-white/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Top-left chip */}
                  {item.chip && (
                    <span
                      className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm bg-black/50 text-white border ${
                        chipTone === "coral"
                          ? "border-coral/40"
                          : chipTone === "emerald"
                            ? "border-emerald/40"
                            : chipTone === "cyan"
                              ? "border-cyan/40"
                              : chipTone === "purple"
                                ? "border-hc-purple/40"
                                : chipTone === "blue"
                                  ? "border-hc-blue/40"
                                  : chipTone === "pink"
                                    ? "border-pink/40"
                                    : "border-gold/40"
                      }`}
                    >
                      {item.chip.label}
                    </span>
                  )}

                  {/* AD pill (top-right) */}
                  {item.isAd && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[8px] font-bold bg-black/70 backdrop-blur-sm text-white/80 rounded tracking-wider">
                      AD
                    </span>
                  )}
                </div>

                {/* Text */}
                <div className="p-2.5">
                  <p className="font-heading font-bold text-[12px] text-white line-clamp-1">
                    {item.title}
                  </p>
                  {item.subtitle && (
                    <p className="text-[10px] text-white/50 line-clamp-1 mt-0.5">
                      {item.subtitle}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
