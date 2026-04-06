import Link from "next/link";
import type { MuseumExhibit } from "@/types/database";

interface ExhibitCardProps {
  exhibit: MuseumExhibit;
  featured?: boolean;
}

export default function ExhibitCard({ exhibit, featured = false }: ExhibitCardProps) {
  return (
    <Link
      href={`/culture/exhibits/${exhibit.slug}`}
      className="group block relative overflow-hidden rounded-2xl border border-border-subtle card-glow transition-all duration-300 hover:border-gold/20"
    >
      {/* Cover Image */}
      <div className={`relative ${featured ? "h-52" : "h-40"} bg-white/5`}>
        {exhibit.cover_image_url ? (
          <img
            src={exhibit.cover_image_url}
            alt={exhibit.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gold/10 to-purple-900/20 flex items-center justify-center">
            <span className="text-4xl">🎨</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/40 to-transparent" />

        {/* Era badge */}
        {exhibit.era && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-midnight/70 backdrop-blur-sm text-[10px] font-semibold text-gold border border-gold/20">
            {exhibit.era}
          </span>
        )}

        {/* Featured badge */}
        {exhibit.is_featured && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-gold/20 backdrop-blur-sm text-[10px] font-semibold text-gold border border-gold/30">
            Featured
          </span>
        )}
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className={`font-display ${featured ? "text-lg" : "text-base"} text-white leading-tight group-hover:text-gold transition-colors`}>
          {exhibit.title}
        </h3>
        {exhibit.subtitle && (
          <p className="text-[11px] text-txt-secondary mt-1 line-clamp-2">
            {exhibit.subtitle}
          </p>
        )}
      </div>
    </Link>
  );
}
