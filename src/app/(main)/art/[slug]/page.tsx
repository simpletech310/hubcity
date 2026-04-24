import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  findArtBySlugAcrossCities,
  getArtBySlug,
} from "@/lib/art-spotlight";
import { getActiveCity } from "@/lib/city-context";
import Icon from "@/components/ui/Icon";

export const dynamic = "force-dynamic";

export default async function ArtDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const activeCity = await getActiveCity();

  // Try active city first; fall back to scanning all live cities so QR codes
  // / shared links keep working when the visitor's active city differs.
  let art = activeCity ? await getArtBySlug(slug, activeCity.id) : null;
  if (!art) {
    const found = await findArtBySlugAcrossCities(slug);
    art = found?.art ?? null;
  }

  if (!art) notFound();

  return (
    <div className="culture-surface min-h-dvh animate-fade-in">
      {/* Fullscreen Art Image */}
      <div className="relative w-full" style={{ minHeight: "75vh", background: "var(--paper-soft)" }}>
        <Image
          src={art.imageUrl}
          alt={art.title}
          fill
          className="object-contain"
          priority
          sizes="100vw"
        />

        {/* Top nav overlay */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/50 to-transparent p-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="w-10 h-10 rounded-full bg-white/80 border-2 flex items-center justify-center press"
              style={{ borderColor: "var(--ink-strong)" }}
            >
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                style={{ color: "var(--ink-strong)" }}
              >
                <path d="M11 13L7 9l4-4" />
              </svg>
            </Link>
            <div className="flex items-center gap-2">
              <span className="c-badge-gold">
                Art Spotlight
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Editorial byline strip */}
      <div className="px-5 py-5 flex items-center justify-between" style={{ borderBottom: "3px solid var(--rule-strong-c, var(--ink-strong))" }}>
        <div className="flex items-baseline gap-3">
          <span className="font-display text-[22px] leading-none tabular-nums" style={{ color: "var(--gold-c)" }}>&#8470; 01</span>
          <span className="c-kicker">FEATURE &middot; ART</span>
        </div>
        <span className="c-kicker">{art.year}</span>
      </div>

      {/* Art Info Panel */}
      <div className="relative z-10">
        <div className="px-5 pt-6 pb-safe" style={{ background: "var(--paper)" }}>
          {/* Title and Artist */}
          <div className="mb-5">
            <span className="c-kicker block mb-1">Feature</span>
            <h1 className="c-hero mb-2" style={{ color: "var(--ink-strong)" }}>
              {art.title}
            </h1>
            <div className="flex items-center gap-3">
              {art.artistImageUrl ? (
                <Image
                  src={art.artistImageUrl}
                  alt={art.artist}
                  width={36}
                  height={36}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center c-frame" style={{ background: "var(--paper-soft)" }}>
                  <span className="text-sm"><Icon name="palette" size={14} /></span>
                </div>
              )}
              <div>
                <p className="text-[14px] font-heading font-bold" style={{ color: "var(--gold-c)" }}>
                  {art.artist}
                </p>
                <p className="c-serif-it text-[12px]">
                  {art.medium} &middot; {art.year}
                </p>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="c-frame p-3" style={{ background: "var(--paper-soft)" }}>
              <p className="c-kicker mb-1">
                Medium
              </p>
              <p className="text-[13px] font-medium" style={{ color: "var(--ink-strong)" }}>{art.medium}</p>
            </div>
            <div className="c-frame p-3" style={{ background: "var(--paper-soft)" }}>
              <p className="c-kicker mb-1">
                Year
              </p>
              <p className="text-[13px] font-medium" style={{ color: "var(--ink-strong)" }}>{art.year}</p>
            </div>
            <div className="col-span-2 c-frame p-3" style={{ background: "var(--paper-soft)" }}>
              <p className="c-kicker mb-1">
                Location
              </p>
              <p className="text-[13px] font-medium" style={{ color: "var(--ink-strong)" }}>{art.location}</p>
              <p className="c-meta text-[11px]">{art.locationAddress}</p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h2 className="c-card-t mb-2" style={{ color: "var(--ink-strong)" }}>
              About This Piece
            </h2>
            <p className="c-body text-[14px] leading-relaxed">
              {art.description}
            </p>
          </div>

          {/* Artist Bio */}
          <div className="mb-6">
            <h2 className="c-card-t mb-2" style={{ color: "var(--ink-strong)" }}>
              About the Artist
            </h2>
            <p className="c-body text-[14px] leading-relaxed">
              {art.artistBio}
            </p>
          </div>

          {/* Artist Links */}
          {(art.artistWebsite || art.artistInstagram) && (
            <div className="flex gap-3 mb-6">
              {art.artistWebsite && (
                <a
                  href={art.artistWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="c-btn c-btn-outline inline-flex items-center gap-2 text-[12px]"
                >
                  <Icon name="globe" size={16} /> Website
                </a>
              )}
              {art.artistInstagram && (
                <a
                  href={`https://instagram.com/${art.artistInstagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="c-btn c-btn-outline inline-flex items-center gap-2 text-[12px]"
                >
                  <Icon name="film" size={16} /> {art.artistInstagram}
                </a>
              )}
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {art.tags.map((tag) => (
              <span
                key={tag}
                className="c-chip text-[11px]"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="c-frame p-4" style={{ background: "var(--paper-soft)" }}>
            <p className="c-kicker mb-2">
              Know the artist or have art to share?
            </p>
            <p className="c-body text-[14px] font-medium">
              Culture celebrates {art.location || "your city"}&apos;s creative
              spirit. Submit your art or murals to be featured.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

