import Link from "next/link";
import Badge from "@/components/ui/Badge";
import type { GalleryItem, GalleryItemType } from "@/types/database";

const typeBadge: Record<GalleryItemType, { label: string; variant: "gold" | "emerald" | "cyan" | "coral" | "purple" }> = {
  artwork: { label: "Artwork", variant: "gold" },
  photo: { label: "Photo", variant: "cyan" },
  artifact: { label: "Artifact", variant: "purple" },
  document: { label: "Document", variant: "emerald" },
  poster: { label: "Poster", variant: "coral" },
};

interface GalleryItemCardProps {
  item: GalleryItem;
}

export default function GalleryItemCard({ item }: GalleryItemCardProps) {
  const badge = typeBadge[item.item_type] ?? { label: item.item_type, variant: "gold" as const };

  return (
    <Link
      href={`/culture/gallery/${item.slug}`}
      className="group block relative overflow-hidden rounded-2xl border border-border-subtle card-glow transition-all duration-300 hover:border-gold/20"
    >
      <div className="relative aspect-square bg-white/5">
        {item.image_urls[0] ? (
          <img
            src={item.image_urls[0]}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center">
            <span className="text-3xl">🖼️</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-transparent to-transparent opacity-80" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3">
        <Badge label={badge.label} variant={badge.variant} />
        <h3 className="font-heading font-bold text-[13px] text-white mt-1.5 leading-tight line-clamp-2 group-hover:text-gold transition-colors">
          {item.title}
        </h3>
        {item.artist_name && (
          <p className="text-[10px] text-txt-secondary mt-0.5">
            {item.artist_name}
            {item.year_created && ` · ${item.year_created}`}
          </p>
        )}
      </div>
    </Link>
  );
}
