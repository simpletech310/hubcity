import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/ui/Badge";
import type { LibraryItemType } from "@/types/database";

const typeBadge: Record<LibraryItemType, { label: string; variant: "gold" | "emerald" | "cyan" | "coral" | "purple" }> = {
  book: { label: "Book", variant: "gold" },
  article: { label: "Article", variant: "cyan" },
  documentary: { label: "Documentary", variant: "purple" },
  academic: { label: "Academic", variant: "emerald" },
  archive: { label: "Archive", variant: "coral" },
};

export default async function LibraryItemDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  let { data: item } = await supabase
    .from("library_items")
    .select("*, exhibit:museum_exhibits(id, title, slug)")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!item) {
    const { data } = await supabase
      .from("library_items")
      .select("*, exhibit:museum_exhibits(id, title, slug)")
      .eq("id", slug)
      .eq("is_published", true)
      .single();
    item = data;
  }

  if (!item) notFound();

  const badge = typeBadge[item.item_type as LibraryItemType] ?? { label: item.item_type, variant: "gold" as const };
  const exhibit = item.exhibit as { id: string; title: string; slug: string } | null;

  return (
    <div className="pb-20">
      {/* Back */}
      <div className="px-5 pt-4 mb-4">
        <Link href="/culture/library" className="inline-flex items-center gap-1.5 text-gold text-sm font-semibold press">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10 12L6 8l4-4" /></svg>
          Library
        </Link>
      </div>

      <div className="px-5">
        {/* Cover + Info */}
        <div className="flex gap-4 mb-6">
          <div className="w-28 h-40 rounded-xl overflow-hidden shrink-0 bg-white/5">
            {item.cover_image_url ? (
              <img src={item.cover_image_url} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gold/10 to-purple-900/10 flex items-center justify-center">
                <span className="text-3xl">📖</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <Badge label={badge.label} variant={badge.variant} size="md" />
            <h1 className="font-display text-xl text-white mt-2 leading-tight">{item.title}</h1>
            {item.author && (
              <p className="text-sm text-txt-secondary mt-1">by {item.author}</p>
            )}
            <div className="mt-2 space-y-1">
              {item.year_published && (
                <p className="text-xs text-txt-secondary">{item.year_published}</p>
              )}
              {item.publisher && (
                <p className="text-xs text-txt-secondary">{item.publisher}</p>
              )}
              {item.isbn && (
                <p className="text-[10px] text-txt-secondary">ISBN: {item.isbn}</p>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {item.description && (
          <>
            <div className="divider-subtle mb-5" />
            <div className="text-sm text-txt-secondary leading-relaxed whitespace-pre-line mb-5">
              {item.description}
            </div>
          </>
        )}

        {/* External link */}
        {item.external_url && (
          <a
            href={item.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 rounded-xl text-center bg-gradient-to-r from-gold to-gold-light text-midnight font-semibold text-sm press hover:opacity-90 transition-all"
          >
            {item.item_type === "book" ? "Find This Book" : item.item_type === "documentary" ? "Watch" : "Read More"} &rarr;
          </a>
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
