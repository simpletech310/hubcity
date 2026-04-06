import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/ui/Badge";
import type { GalleryItemType } from "@/types/database";

const typeBadge: Record<GalleryItemType, { label: string; variant: "gold" | "emerald" | "cyan" | "coral" | "purple" }> = {
  artwork: { label: "Artwork", variant: "gold" },
  photo: { label: "Photograph", variant: "cyan" },
  artifact: { label: "Artifact", variant: "purple" },
  document: { label: "Document", variant: "emerald" },
  poster: { label: "Poster", variant: "coral" },
};

export default async function GalleryItemDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  let { data: item } = await supabase
    .from("gallery_items")
    .select("*, exhibit:museum_exhibits(id, title, slug)")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!item) {
    const { data } = await supabase
      .from("gallery_items")
      .select("*, exhibit:museum_exhibits(id, title, slug)")
      .eq("id", slug)
      .eq("is_published", true)
      .single();
    item = data;
  }

  if (!item) notFound();

  const badge = typeBadge[item.item_type as GalleryItemType] ?? { label: item.item_type, variant: "gold" as const };
  const exhibit = item.exhibit as { id: string; title: string; slug: string } | null;

  return (
    <div className="pb-20">
      {/* Back */}
      <div className="px-5 pt-4 mb-4">
        <Link href="/culture/gallery" className="inline-flex items-center gap-1.5 text-gold text-sm font-semibold press">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10 12L6 8l4-4" /></svg>
          Gallery
        </Link>
      </div>

      {/* Image(s) */}
      <div className="relative aspect-square bg-white/5 mx-5 rounded-2xl overflow-hidden mb-5">
        {item.image_urls?.[0] ? (
          <img src={item.image_urls[0]} alt={item.title} className="w-full h-full object-contain bg-black" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><span className="text-5xl">🖼️</span></div>
        )}
      </div>

      {/* Multiple images thumbnails */}
      {item.image_urls?.length > 1 && (
        <div className="flex gap-2 px-5 mb-5 overflow-x-auto scrollbar-hide">
          {item.image_urls.map((url: string, i: number) => (
            <div key={i} className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-border-subtle">
              <img src={url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="px-5 space-y-4">
        <div>
          <Badge label={badge.label} variant={badge.variant} size="md" />
          <h1 className="font-display text-2xl text-white mt-2">{item.title}</h1>
        </div>

        {/* Metadata */}
        <div className="space-y-2">
          {item.artist_name && (
            <div className="flex items-center gap-2 text-sm text-txt-secondary">
              <span>🎨</span><span>Artist: <span className="text-white">{item.artist_name}</span></span>
            </div>
          )}
          {item.year_created && (
            <div className="flex items-center gap-2 text-sm text-txt-secondary">
              <span>📅</span><span>Year: <span className="text-white">{item.year_created}</span></span>
            </div>
          )}
          {item.medium && (
            <div className="flex items-center gap-2 text-sm text-txt-secondary">
              <span>🖌️</span><span>Medium: <span className="text-white">{item.medium}</span></span>
            </div>
          )}
          {item.dimensions && (
            <div className="flex items-center gap-2 text-sm text-txt-secondary">
              <span>📐</span><span>Dimensions: <span className="text-white">{item.dimensions}</span></span>
            </div>
          )}
        </div>

        {/* Description */}
        {item.description && (
          <>
            <div className="divider-subtle" />
            <div className="text-sm text-txt-secondary leading-relaxed whitespace-pre-line">
              {item.description}
            </div>
          </>
        )}

        {/* Provenance */}
        {item.provenance && (
          <>
            <div className="divider-subtle" />
            <div>
              <h2 className="font-heading font-bold text-sm mb-2">Provenance</h2>
              <p className="text-sm text-txt-secondary leading-relaxed">{item.provenance}</p>
            </div>
          </>
        )}

        {/* Exhibit link */}
        {exhibit && (
          <Link
            href={`/culture/exhibits/${exhibit.slug}`}
            className="block rounded-xl bg-gold/5 border border-gold/15 p-3 mt-4"
          >
            <p className="text-[10px] font-semibold text-gold uppercase tracking-wider">Part of</p>
            <p className="text-sm font-heading font-bold text-white mt-0.5">{exhibit.title}</p>
          </Link>
        )}
      </div>
    </div>
  );
}
