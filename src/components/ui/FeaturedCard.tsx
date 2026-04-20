import Link from "next/link";
import Tag from "@/components/ui/editorial/Tag";

type BadgeTone = "gold" | "emerald" | "cyan" | "coral" | "default";

interface FeaturedCardProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  badge?: { label: string; variant: BadgeTone };
  href: string;
  kicker?: string;
  className?: string;
  aspectRatio?: string;
}

/**
 * Editorial hero card — ink panel, hairline gold border, DM Serif title
 * that shifts to gold on hover. Replaces the old purple-leaning
 * gradient fallback.
 */
export default function FeaturedCard({
  title,
  subtitle,
  imageUrl,
  badge,
  href,
  kicker,
  className,
  aspectRatio = "aspect-[16/9]",
}: FeaturedCardProps) {
  return (
    <Link
      href={href}
      className={`group block rounded-2xl overflow-hidden panel-editorial transition-all duration-300 hover:border-gold/30 ${className || ""}`}
    >
      <div className={`relative ${aspectRatio} bg-ink`}>
        {imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-ink via-midnight to-black" />
        )}

        {/* Editorial vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/40 to-transparent" />

        {/* Subtle grain for print feel */}
        <div
          className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.9 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E\")",
          }}
        />

        {badge && (
          <div className="absolute top-4 left-4">
            <Tag
              tone={
                badge.variant === "gold"
                  ? "gold"
                  : badge.variant === "emerald"
                  ? "emerald"
                  : badge.variant === "cyan"
                  ? "cyan"
                  : badge.variant === "coral"
                  ? "coral"
                  : "default"
              }
            >
              {badge.label}
            </Tag>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-5">
          {kicker && (
            <span className="editorial-kicker block mb-1.5">{kicker}</span>
          )}
          <h3 className="font-display text-[26px] text-white leading-tight group-hover:text-gold transition-colors duration-300">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-ivory/70 mt-1.5 line-clamp-2">{subtitle}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
