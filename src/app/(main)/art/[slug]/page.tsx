import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getArtBySlug, artSpotlight } from "@/lib/art-spotlight";
import Icon from "@/components/ui/Icon";

export default async function ArtDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const art = getArtBySlug(slug);

  if (!art) notFound();

  return (
    <div className="animate-fade-in min-h-screen bg-black">
      {/* Fullscreen Art Image */}
      <div className="relative w-full" style={{ minHeight: "75vh" }}>
        <Image
          src={art.imageUrl}
          alt={art.title}
          fill
          className="object-contain"
          priority
          sizes="100vw"
        />

        {/* Top nav overlay */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent p-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center press"
            >
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M11 13L7 9l4-4" />
              </svg>
            </Link>
            <div className="flex items-center gap-2">
              <span className="bg-gold/20 border border-gold/40 rounded-full px-3 py-1 text-[10px] font-bold text-gold tracking-wider uppercase">
                Art Spotlight
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Art Info Panel */}
      <div className="relative z-10 -mt-8">
        <div className="bg-gradient-to-b from-midnight via-midnight to-deep rounded-t-3xl border-t border-gold/20 px-5 pt-6 pb-safe">
          {/* Title and Artist */}
          <div className="mb-5">
            <h1 className="font-display text-[28px] leading-tight mb-2">
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
                <div className="w-9 h-9 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center">
                  <span className="text-sm"><Icon name="palette" size={14} /></span>
                </div>
              )}
              <div>
                <p className="text-[14px] font-heading font-bold text-gold">
                  {art.artist}
                </p>
                <p className="text-[11px] text-white/40">
                  {art.medium} · {art.year}
                </p>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-white/[0.04] rounded-xl p-3 border border-white/[0.06]">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">
                Medium
              </p>
              <p className="text-[13px] font-medium">{art.medium}</p>
            </div>
            <div className="bg-white/[0.04] rounded-xl p-3 border border-white/[0.06]">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">
                Year
              </p>
              <p className="text-[13px] font-medium">{art.year}</p>
            </div>
            <div className="col-span-2 bg-white/[0.04] rounded-xl p-3 border border-white/[0.06]">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">
                Location
              </p>
              <p className="text-[13px] font-medium">{art.location}</p>
              <p className="text-[11px] text-white/40">{art.locationAddress}</p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h2 className="font-heading font-bold text-[15px] mb-2">
              About This Piece
            </h2>
            <p className="text-[13px] text-white/60 leading-relaxed">
              {art.description}
            </p>
          </div>

          {/* Artist Bio */}
          <div className="mb-6">
            <h2 className="font-heading font-bold text-[15px] mb-2">
              About the Artist
            </h2>
            <p className="text-[13px] text-white/60 leading-relaxed">
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
                  className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-[12px] font-medium press hover:bg-white/[0.1] transition-colors"
                >
                  <Icon name="globe" size={16} /> Website
                </a>
              )}
              {art.artistInstagram && (
                <a
                  href={`https://instagram.com/${art.artistInstagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-[12px] font-medium press hover:bg-white/[0.1] transition-colors"
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
                className="bg-gold/10 border border-gold/20 rounded-full px-3 py-1 text-[11px] font-medium text-gold"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-[12px] text-white/40 mb-2">
              Know the artist or have art to share?
            </p>
            <p className="text-[13px] font-medium">
              Hub City celebrates Compton&apos;s creative spirit. Submit your art
              or murals to be featured.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate static params for known art pieces
export function generateStaticParams() {
  return artSpotlight.map((art) => ({ slug: art.slug }));
}
