import Link from "next/link";
import Badge from "@/components/ui/Badge";

interface FeaturedCardProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  badge?: { label: string; variant: "gold" | "emerald" | "cyan" | "coral" | "purple" };
  href: string;
  kicker?: string;
  className?: string;
  aspectRatio?: string;
}

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
      className={`group block rounded-2xl overflow-hidden border border-border-subtle bg-white/[0.02] card-glow transition-all duration-300 hover:border-gold/20 hover:shadow-[0_0_20px_rgba(242,169,0,0.08)] ${className || ""}`}
    >
      <div className={`relative ${aspectRatio} bg-white/5`}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gold/5 to-purple-900/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/40 to-transparent" />

        {badge && (
          <div className="absolute top-4 left-4">
            <Badge label={badge.label} variant={badge.variant} />
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-5">
          {kicker && (
            <span className="editorial-kicker block mb-1.5">{kicker}</span>
          )}
          <h3 className="font-display text-2xl text-white leading-tight group-hover:text-gold transition-colors duration-300">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-white/70 mt-1 line-clamp-2">{subtitle}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
