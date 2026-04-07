import Link from "next/link";
import Badge from "@/components/ui/Badge";

interface SpotlightProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  href: string;
  kicker?: string;
  badge?: { label: string; variant: "gold" | "emerald" | "cyan" | "coral" | "purple" };
  height?: string;
  className?: string;
}

export default function Spotlight({
  title,
  subtitle,
  imageUrl,
  href,
  kicker,
  badge,
  height = "h-[360px]",
  className,
}: SpotlightProps) {
  return (
    <Link
      href={href}
      className={`group block -mx-5 overflow-hidden relative ${height} ${className || ""}`}
    >
      {/* Background image with Ken Burns */}
      <div className="absolute inset-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover ken-burns"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gold/10 to-purple-900/20" />
        )}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/60 to-transparent" />

      {/* Badge */}
      {badge && (
        <div className="absolute top-5 right-5 z-10">
          <Badge label={badge.label} variant={badge.variant} size="md" />
        </div>
      )}

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
        {kicker && (
          <span className="editorial-kicker block mb-2">{kicker}</span>
        )}
        <h2 className="font-display text-3xl text-white leading-tight drop-shadow-lg group-hover:text-gold transition-colors duration-300">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-white/80 mt-2 max-w-sm leading-relaxed drop-shadow">
            {subtitle}
          </p>
        )}
      </div>
    </Link>
  );
}
