import Link from "next/link";
import Badge from "@/components/ui/Badge";
import type { LibraryItem, LibraryItemType } from "@/types/database";
import Icon from "@/components/ui/Icon";

const typeBadge: Record<LibraryItemType, { label: string; variant: "gold" | "emerald" | "cyan" | "coral" | "purple" }> = {
  book: { label: "Book", variant: "gold" },
  article: { label: "Article", variant: "cyan" },
  documentary: { label: "Documentary", variant: "purple" },
  academic: { label: "Academic", variant: "emerald" },
  archive: { label: "Archive", variant: "coral" },
};

interface LibraryItemCardProps {
  item: LibraryItem;
}

export default function LibraryItemCard({ item }: LibraryItemCardProps) {
  const badge = typeBadge[item.item_type] ?? { label: item.item_type, variant: "gold" as const };

  return (
    <Link
      href={`/culture/library/${item.slug}`}
      className="group flex gap-3 rounded-2xl border border-border-subtle bg-white/[0.02] p-3 card-glow transition-all duration-300 hover:border-gold/20"
    >
      {/* Cover */}
      <div className="w-16 h-24 rounded-xl overflow-hidden shrink-0 bg-white/5">
        {item.cover_image_url ? (
          <img
            src={item.cover_image_url}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gold/10 to-purple-900/10 flex items-center justify-center">
            <span className="text-2xl"><Icon name="book" size={24} /></span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-0.5">
        <Badge label={badge.label} variant={badge.variant} />
        <h3 className="font-heading font-bold text-[13px] text-white mt-1.5 leading-tight line-clamp-2 group-hover:text-gold transition-colors">
          {item.title}
        </h3>
        {item.author && (
          <p className="text-[11px] text-txt-secondary mt-0.5">
            by {item.author}
          </p>
        )}
        {item.year_published && (
          <p className="text-[10px] text-txt-secondary mt-1">
            {item.year_published}
            {item.publisher && ` · ${item.publisher}`}
          </p>
        )}
      </div>
    </Link>
  );
}
