import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/ui/Badge";
import type { GalleryItemType } from "@/types/database";
import Icon from "@/components/ui/Icon";

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
    <div className="culture-surface min-h-dvh pb-20">
      {/* Back */}
      <div className="px-5 pt-4 mb-4">
        <Link href="/culture/gallery" className="inline-flex items-center gap-1.5 text-sm font-semibold press" style={{ color: "var(--gold-c)" }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10 12L6 8l4-4" /></svg>
          Gallery
        </Link>
      </div>

      {/* Image(s) */}
      <div className="relative aspect-square mx-5 overflow-hidden mb-5 c-frame-strong" style={{ background: "var(--paper-soft)" }}>
        {item.image_urls?.[0] ? (
          <img src={item.image_urls[0]} alt={item.title} className="w-full h-full object-contain bg-black" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><span className="text-5xl"><Icon name="frame" size={28} /></span></div>
        )}
      </div>

      {/* Multiple images thumbnails */}
      {item.image_urls?.length > 1 && (
        <div className="flex gap-2 px-5 mb-5 overflow-x-auto scrollbar-hide">
          {item.image_urls.map((url: string, i: number) => (
            <div
              key={i}
              className="w-16 h-16 overflow-hidden shrink-0"
              style={{ border: "2px solid var(--rule-strong-c)" }}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="px-5 space-y-4">
        <div>
          <Badge label={badge.label} variant={badge.variant} size="md" />
          <span className="c-kicker block mt-3">Gallery Item</span>
          <h1 className="c-hero mt-1" style={{ color: "var(--ink-strong)" }}>{item.title}</h1>
          <div style={{ height: 3, background: "var(--rule-strong-c, var(--ink-strong))", marginTop: 16 }} />
        </div>

        {/* Metadata */}
        <div className="space-y-2 c-body">
          {item.artist_name && (
            <div className="flex items-center gap-2 text-sm">
              <span><Icon name="palette" size={16} /></span><span>Artist: <span style={{ color: "var(--ink-strong)" }}>{item.artist_name}</span></span>
            </div>
          )}
          {item.year_created && (
            <div className="flex items-center gap-2 text-sm">
              <span><Icon name="calendar" size={16} /></span><span>Year: <span style={{ color: "var(--ink-strong)" }}>{item.year_created}</span></span>
            </div>
          )}
          {item.medium && (
            <div className="flex items-center gap-2 text-sm">
              <span><Icon name="palette" size={16} /></span><span>Medium: <span style={{ color: "var(--ink-strong)" }}>{item.medium}</span></span>
            </div>
          )}
          {item.dimensions && (
            <div className="flex items-center gap-2 text-sm">
              <span>&bull;</span><span>Dimensions: <span style={{ color: "var(--ink-strong)" }}>{item.dimensions}</span></span>
            </div>
          )}
        </div>

        {/* Description */}
        {item.description && (
          <>
            <div className="divider-subtle" />
            <div className="c-body text-sm leading-relaxed whitespace-pre-line">
              {item.description}
            </div>
          </>
        )}

        {/* Provenance */}
        {item.provenance && (
          <>
            <div className="divider-subtle" />
            <div>
              <h2 className="c-card-t text-sm mb-2" style={{ color: "var(--ink-strong)" }}>Provenance</h2>
              <p className="c-body text-sm leading-relaxed">{item.provenance}</p>
            </div>
          </>
        )}

        {/* Exhibit link */}
        {exhibit && (
          <Link
            href={`/culture/exhibits/${exhibit.slug}`}
            className="block c-gold-block p-3 mt-4"
          >
            <p className="c-kicker">Part of</p>
            <p className="c-card-t mt-0.5" style={{ color: "var(--ink-strong)" }}>{exhibit.title}</p>
          </Link>
        )}
      </div>
    </div>
  );
}
