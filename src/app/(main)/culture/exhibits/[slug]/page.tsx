import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import MuseumNav from "@/components/culture/MuseumNav";
import GalleryItemCard from "@/components/culture/GalleryItemCard";
import PersonCard from "@/components/culture/PersonCard";
import LibraryItemCard from "@/components/culture/LibraryItemCard";
import SectionHeader from "@/components/layout/SectionHeader";

export default async function ExhibitDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  let { data: exhibit } = await supabase
    .from("museum_exhibits")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!exhibit) {
    const { data } = await supabase
      .from("museum_exhibits")
      .select("*")
      .eq("id", slug)
      .eq("is_published", true)
      .single();
    exhibit = data;
  }

  if (!exhibit) notFound();

  // Fetch related items
  const [galleryRes, peopleRes, libraryRes] = await Promise.all([
    supabase
      .from("gallery_items")
      .select("*")
      .eq("exhibit_id", exhibit.id)
      .eq("is_published", true)
      .order("display_order"),
    supabase
      .from("notable_people")
      .select("*")
      .eq("exhibit_id", exhibit.id)
      .eq("is_published", true)
      .order("display_order"),
    supabase
      .from("library_items")
      .select("*")
      .eq("exhibit_id", exhibit.id)
      .eq("is_published", true)
      .order("display_order"),
  ]);

  const galleryItems = galleryRes.data ?? [];
  const people = peopleRes.data ?? [];
  const libraryItems = libraryRes.data ?? [];

  return (
    <div className="culture-surface min-h-dvh space-y-6 pb-20">
      {/* Hero */}
      <div className="relative min-h-[280px] flex flex-col justify-end">
        {exhibit.cover_image_url ? (
          <img
            src={exhibit.cover_image_url}
            alt={exhibit.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-purple-900/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/60 to-transparent" />

        <div className="relative z-10 px-5 pb-6">
          <Link
            href="/culture/exhibits"
            className="inline-flex items-center gap-1.5 text-gold text-sm font-semibold press mb-3"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M10 12L6 8l4-4" />
            </svg>
            Exhibits
          </Link>
          {exhibit.era && (
            <span className="c-kicker block mb-2" style={{ color: "var(--gold-c)" }}>
              {exhibit.era}
            </span>
          )}
          <h1 className="c-hero leading-tight" style={{ color: "#fff", textShadow: "0 2px 24px rgba(0,0,0,0.5)" }}>
            {exhibit.title}
          </h1>
          {exhibit.subtitle && (
            <p className="c-serif-it text-[15px] mt-2" style={{ color: "#fff" }}>{exhibit.subtitle}</p>
          )}
        </div>
      </div>

      <div className="sticky top-0 z-30" style={{ background: "var(--paper)", borderBottom: "3px solid var(--rule-strong-c, var(--ink-strong))" }}>
        <div className="px-5">
          <MuseumNav />
        </div>
      </div>

      {/* Description */}
      {exhibit.description && (
        <section className="px-5">
          <div className="c-body text-sm leading-relaxed whitespace-pre-line">
            {exhibit.description}
          </div>
        </section>
      )}

      {/* Curator Note */}
      {exhibit.curator_note && (
        <section className="px-5">
          <div className="c-gold-block p-4">
            <p className="c-kicker mb-2">
              Curator&apos;s Note
            </p>
            <p className="c-serif-it text-[15px] leading-relaxed">
              &ldquo;{exhibit.curator_note}&rdquo;
            </p>
          </div>
        </section>
      )}

      {/* Gallery Items in this exhibit */}
      {galleryItems.length > 0 && (
        <section className="px-5">
          <SectionHeader title="Gallery" />
          <div className="grid grid-cols-2 gap-2">
            {galleryItems.map((item) => (
              <GalleryItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* People in this exhibit */}
      {people.length > 0 && (
        <section className="px-5">
          <SectionHeader title="Notable People" />
          <div className="grid grid-cols-2 gap-3">
            {people.map((person) => (
              <PersonCard key={person.id} person={person} />
            ))}
          </div>
        </section>
      )}

      {/* Library items */}
      {libraryItems.length > 0 && (
        <section className="px-5">
          <SectionHeader title="Related Reading" />
          <div className="space-y-2">
            {libraryItems.map((item) => (
              <LibraryItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
