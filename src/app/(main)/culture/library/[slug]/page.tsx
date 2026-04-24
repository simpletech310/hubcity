import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/ui/Badge";
import type { LibraryItemType } from "@/types/database";
import Icon from "@/components/ui/Icon";

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
    <div className="culture-surface min-h-dvh pb-20">
      {/* Back */}
      <div className="px-5 pt-4 mb-4">
        <Link href="/culture/library" className="inline-flex items-center gap-1.5 text-sm font-semibold press" style={{ color: "var(--gold-c)" }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10 12L6 8l4-4" /></svg>
          Library
        </Link>
      </div>

      <div className="px-5">
        {/* Cover + Info */}
        <div className="flex gap-4 mb-6">
          <div className="w-28 h-40 overflow-hidden shrink-0 c-frame-strong" style={{ background: "var(--paper-soft)" }}>
            {item.cover_image_url ? (
              <img src={item.cover_image_url} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gold/10 to-purple-900/10 flex items-center justify-center">
                <span className="text-3xl"><Icon name="book" size={28} /></span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <Badge label={badge.label} variant={badge.variant} size="md" />
            <span className="c-kicker block mt-3">Library</span>
            <h1 className="c-hero mt-1 leading-tight" style={{ color: "var(--ink-strong)", fontSize: "clamp(24px, 5vw, 36px)" }}>{item.title}</h1>
            {item.author && (
              <p className="c-serif-it text-[14px] mt-1">by {item.author}</p>
            )}
            <div className="mt-2 space-y-1 c-body">
              {item.year_published && (
                <p className="text-xs">{item.year_published}</p>
              )}
              {item.publisher && (
                <p className="text-xs">{item.publisher}</p>
              )}
              {item.isbn && (
                <p className="text-[10px]">ISBN: {item.isbn}</p>
              )}
            </div>
          </div>
        </div>
        <div style={{ height: 3, background: "var(--rule-strong-c, var(--ink-strong))", margin: "8px 0 20px" }} />

        {/* Description */}
        {item.description && (
          <>
            <div className="c-body text-sm leading-relaxed whitespace-pre-line mb-5">
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
            className="c-btn c-btn-primary w-full text-center"
          >
            {item.item_type === "book" ? "Find This Book" : item.item_type === "documentary" ? "Watch" : "Read More"} &rarr;
          </a>
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
