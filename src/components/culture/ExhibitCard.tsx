import Link from "next/link";
import Image from "next/image";
import type { MuseumExhibit } from "@/types/database";
import Icon from "@/components/ui/Icon";

interface ExhibitCardProps {
  exhibit: MuseumExhibit;
  featured?: boolean;
}

/**
 * Hub City editorial exhibit card. Square ink frame around a cover
 * photo with a gold § ERA chip top-left, an optional FEATURED chip
 * top-right, and the title/subtitle in c-card-t / c-meta on the
 * bottom ink wash. Replaces the old rounded-2xl glass cards.
 */
export default function ExhibitCard({ exhibit, featured = false }: ExhibitCardProps) {
  return (
    <Link
      href={`/culture/exhibits/${exhibit.slug}`}
      className="group block relative overflow-hidden press"
      style={{
        background: "var(--ink-strong)",
        border: "2px solid var(--rule-strong-c)",
      }}
    >
      <div
        className="relative w-full"
        style={{ aspectRatio: featured ? "16 / 11" : "4 / 5" }}
      >
        {exhibit.cover_image_url ? (
          <Image
            src={exhibit.cover_image_url}
            alt={exhibit.title}
            fill
            className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
            sizes={featured ? "430px" : "210px"}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon name="palette" size={32} style={{ color: "var(--gold-c)" }} />
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

        {/* Era chip — top-left */}
        {exhibit.era && (
          <span
            className="absolute top-2 left-2 c-badge c-badge-gold"
            style={{ fontSize: 9 }}
          >
            § {exhibit.era}
          </span>
        )}

        {/* Featured chip — top-right */}
        {exhibit.is_featured && (
          <span
            className="absolute top-2 right-2 c-badge c-badge-gold inline-flex items-center gap-1"
            style={{ fontSize: 9 }}
          >
            <Icon name="star" size={9} />
            FEATURED
          </span>
        )}

        {/* Title block — bottom */}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <h3
            className="c-hero"
            style={{
              fontSize: featured ? 24 : 16,
              lineHeight: 0.95,
              letterSpacing: "-0.008em",
              color: "#fff",
            }}
          >
            {exhibit.title.toUpperCase()}.
          </h3>
          {exhibit.subtitle && (
            <p
              className="c-serif-it mt-1.5 line-clamp-2"
              style={{
                fontSize: featured ? 13 : 11,
                lineHeight: 1.35,
                color: "rgba(255,255,255,0.85)",
              }}
            >
              {exhibit.subtitle}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
