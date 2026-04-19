import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: mural } = await supabase
    .from("murals")
    .select("title, artist_name")
    .or(`id.eq.${id},slug.eq.${id}`)
    .single();

  return {
    title: mural
      ? `${mural.title}${mural.artist_name ? ` by ${mural.artist_name}` : ""} | Murals | Knect`
      : "Mural | Knect",
  };
}

export default async function MuralDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: mural } = await supabase
    .from("murals")
    .select("*")
    .or(`id.eq.${id},slug.eq.${id}`)
    .single();

  if (!mural) notFound();

  const imageUrls: string[] = mural.image_urls ?? [];
  const mapsUrl = mural.address
    ? `https://maps.google.com/?q=${encodeURIComponent(mural.address)}`
    : mural.latitude && mural.longitude
      ? `https://maps.google.com/?q=${mural.latitude},${mural.longitude}`
      : null;

  // Fetch nearby murals in the same district
  let nearbyMurals: { id: string; title: string; slug: string | null; artist_name: string | null; image_urls: string[] | null }[] = [];
  if (mural.district) {
    const { data } = await supabase
      .from("murals")
      .select("id, title, slug, artist_name, image_urls")
      .eq("district", mural.district)
      .neq("id", mural.id)
      .limit(4);
    nearbyMurals = data ?? [];
  }

  return (
    <div className="animate-fade-in pb-24">
      {/* Back */}
      <div className="px-5 pt-4 mb-3">
        <Link
          href="/culture/murals"
          className="inline-flex items-center gap-1.5 text-gold text-sm font-semibold press"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M10 12L6 8l4-4" />
          </svg>
          Murals
        </Link>
      </div>

      {/* Image Gallery */}
      {imageUrls.length > 0 ? (
        <div className="mb-6">
          {imageUrls.length === 1 ? (
            <div className="w-full aspect-[16/10] overflow-hidden">
              <img
                src={imageUrls[0]}
                alt={mural.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="flex gap-1 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
              {imageUrls.map((url: string, i: number) => (
                <div
                  key={i}
                  className="shrink-0 w-[85vw] aspect-[16/10] snap-center overflow-hidden rounded-lg first:ml-5 last:mr-5"
                >
                  <img
                    src={url}
                    alt={`${mural.title} - ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mx-5 mb-6 aspect-[16/10] rounded-2xl bg-gradient-to-br from-pink-900/40 via-purple-900/30 to-gold/10 flex items-center justify-center">
          <span className="text-7xl opacity-30"><Icon name="palette" size={16} /></span>
        </div>
      )}

      <div className="px-5">
        {/* Title & Artist */}
        <h1 className="font-display text-2xl md:text-4xl font-bold text-text-primary leading-tight">
          {mural.title}
        </h1>
        {mural.artist_name && (
          <p className="text-text-secondary text-base mt-1.5">
            by{" "}
            {mural.artist_id ? (
              <Link
                href={`/culture/artists/${mural.artist_id}`}
                className="text-gold font-semibold hover:underline"
              >
                {mural.artist_name}
              </Link>
            ) : (
              <span className="font-semibold">{mural.artist_name}</span>
            )}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-4">
          {mural.district && (
            <span className="px-3 py-1 text-[11px] font-semibold rounded-full bg-gold/10 text-gold border border-gold/20">
              {typeof mural.district === "number"
                ? `District ${mural.district}`
                : mural.district}
            </span>
          )}
          {mural.year_created && (
            <span className="px-3 py-1 text-[11px] font-semibold rounded-full bg-white/5 text-text-secondary border border-border-subtle">
              {mural.year_created}
            </span>
          )}
          <span className="px-3 py-1 text-[11px] font-semibold rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">
            Public Art
          </span>
        </div>

        {/* Description */}
        {mural.description && (
          <div className="mt-6">
            <h2 className="font-heading font-bold text-base mb-2">About This Mural</h2>
            <p className="text-text-secondary text-[14px] leading-relaxed whitespace-pre-wrap">
              {mural.description}
            </p>
          </div>
        )}

        {/* Location Info */}
        <Card className="mt-6">
          <h3 className="font-heading font-bold text-sm mb-3">Location</h3>
          <div className="space-y-3">
            {mural.address && (
              <div className="flex items-center gap-3">
                <span className="text-lg"><Icon name="pin" size={20} /></span>
                {mapsUrl ? (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gold font-medium hover:underline"
                  >
                    {mural.address}
                  </a>
                ) : (
                  <p className="text-sm text-text-secondary">{mural.address}</p>
                )}
              </div>
            )}
            {mural.latitude && mural.longitude && (
              <div className="flex items-center gap-3">
                <span className="text-lg"><Icon name="globe" size={20} /></span>
                <Link
                  href={`/map?lat=${mural.latitude}&lng=${mural.longitude}&zoom=17`}
                  className="text-sm text-gold font-medium hover:underline"
                >
                  View on Knect Map
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-3 mt-6">
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-gold text-midnight px-5 py-3 rounded-full text-sm font-bold press hover:bg-gold-light transition-colors"
            >
              <svg
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 18 18"
              >
                <path
                  d="M9 1C5.69 1 3 3.69 3 7c0 5.25 6 10 6 10s6-4.75 6-10c0-3.31-2.69-6-6-6z"
                  fill="currentColor"
                  opacity="0.2"
                />
                <path
                  d="M9 1C5.69 1 3 3.69 3 7c0 5.25 6 10 6 10s6-4.75 6-10c0-3.31-2.69-6-6-6z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle cx="9" cy="7" r="2" fill="currentColor" />
              </svg>
              Get Directions
            </a>
          )}
        </div>

        {/* Nearby Murals */}
        {nearbyMurals.length > 0 && (
          <div className="mt-10">
            <h2 className="font-heading font-bold text-lg text-text-primary mb-3">
              More in {typeof mural.district === "number" ? `District ${mural.district}` : mural.district}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {nearbyMurals.map((m) => (
                <Link
                  key={m.id}
                  href={`/culture/murals/${m.slug || m.id}`}
                  className="group rounded-xl overflow-hidden border border-border-subtle bg-card hover:border-gold/20 transition-all"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-purple-900/40 to-gold/10">
                    {m.image_urls?.[0] ? (
                      <img
                        src={m.image_urls[0]}
                        alt={m.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-3xl opacity-30"><Icon name="palette" size={28} /></span>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-text-primary truncate">
                      {m.title}
                    </p>
                    {m.artist_name && (
                      <p className="text-[10px] text-text-secondary truncate mt-0.5">
                        by {m.artist_name}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
