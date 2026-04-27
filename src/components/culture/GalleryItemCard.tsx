import Link from "next/link";
import Image from "next/image";
import type { GalleryItem, GalleryItemType } from "@/types/database";
import Icon from "@/components/ui/Icon";

const TYPE_LABEL: Record<GalleryItemType, string> = {
  artwork: "ARTWORK",
  photo: "PHOTO",
  artifact: "ARTIFACT",
  document: "DOCUMENT",
  poster: "POSTER",
};

interface GalleryItemCardProps {
  item: GalleryItem;
}

/**
 * Editorial Hub City gallery tile. Square ink frame around the image,
 * gold § TYPE chip top-left, c-card-t title and Fraunces italic byline
 * on the bottom ink wash. Replaces the legacy `rounded-2xl border-
 * border-subtle card-glow text-white from-midnight` dark-theme card.
 */
export default function GalleryItemCard({ item }: GalleryItemCardProps) {
  const label = TYPE_LABEL[item.item_type] ?? item.item_type.toUpperCase();
  const cover = item.image_urls?.[0];

  return (
    <Link
      href={`/culture/gallery/${item.slug}`}
      className="group block relative overflow-hidden press"
      style={{
        background: "var(--ink-strong)",
        border: "2px solid var(--rule-strong-c)",
      }}
    >
      <div className="relative aspect-square w-full">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <Image
            src={cover}
            alt={item.title}
            fill
            sizes="210px"
            className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon name="frame" size={28} style={{ color: "var(--gold-c)" }} />
          </div>
        )}

        {/* Bottom ink wash for legibility */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(26,21,18,0.15) 0%, transparent 35%, rgba(26,21,18,0.92) 100%)",
          }}
        />

        {/* Type chip — top-left */}
        <span
          className="absolute top-2 left-2 c-badge c-badge-gold"
          style={{ fontSize: 9 }}
        >
          § {label}
        </span>

        {/* Title block — bottom */}
        <div className="absolute inset-x-0 bottom-0 p-2.5">
          <h3
            className="c-card-t line-clamp-2"
            style={{
              fontSize: 13,
              lineHeight: 1.15,
              letterSpacing: "0.005em",
              color: "#fff",
            }}
          >
            {item.title}
          </h3>
          {(item.artist_name || item.year_created) && (
            <p
              className="c-serif-it mt-1 line-clamp-1"
              style={{
                fontSize: 10.5,
                lineHeight: 1.3,
                color: "rgba(255,255,255,0.78)",
              }}
            >
              {[item.artist_name, item.year_created].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
