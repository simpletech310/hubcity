import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/ui/Badge";
import AdZone from "@/components/ui/AdZone";
import PersonGallery from "@/components/culture/PersonGallery";
import RelatedPeople from "@/components/culture/RelatedPeople";
import type { NotablePersonCategory } from "@/types/database";

const categoryBadge: Record<NotablePersonCategory, { label: string; variant: "gold" | "emerald" | "cyan" | "coral" | "purple" }> = {
  music: { label: "Music", variant: "gold" },
  sports: { label: "Sports", variant: "emerald" },
  politics: { label: "Politics", variant: "purple" },
  activism: { label: "Activism", variant: "coral" },
  arts: { label: "Arts", variant: "cyan" },
  business: { label: "Business", variant: "gold" },
  education: { label: "Education", variant: "emerald" },
  other: { label: "Notable", variant: "cyan" },
};

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  let { data: person } = await supabase
    .from("notable_people")
    .select("*, exhibit:museum_exhibits(id, title, slug)")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!person) {
    const { data } = await supabase
      .from("notable_people")
      .select("*, exhibit:museum_exhibits(id, title, slug)")
      .eq("id", slug)
      .eq("is_published", true)
      .single();
    person = data;
  }

  if (!person) notFound();

  const badge = categoryBadge[person.category as NotablePersonCategory] ?? { label: person.category, variant: "gold" as const };
  const exhibit = person.exhibit as { id: string; title: string; slug: string } | null;
  const lifespan = person.birth_year
    ? person.death_year ? `${person.birth_year} -- ${person.death_year}` : `Born ${person.birth_year}`
    : null;
  const achievements = (person.notable_achievements ?? []) as string[];
  const links = (person.external_links ?? {}) as Record<string, string>;
  const imageUrls = (person.image_urls ?? []) as string[];
  const bioParagraphs = person.bio ? person.bio.split(/\n\n+/) : [];

  return (
    <div className="pb-20">
      {/* ── Full-bleed Hero ── */}
      <div className="relative aspect-[3/4] overflow-hidden">
        {person.portrait_url ? (
          <img
            src={person.portrait_url}
            alt={person.name}
            className="w-full h-full object-cover ken-burns"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gold/5 to-purple-900/10 flex items-center justify-center">
            <span className="text-7xl">👤</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/60 to-transparent" style={{ top: "30%" }} />

        {/* Back button */}
        <Link
          href="/culture/people"
          className="absolute top-5 left-5 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors z-10 press"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M10 12L6 8l4-4" />
          </svg>
        </Link>

        {/* Category badge */}
        <div className="absolute top-5 right-5 z-10">
          <Badge label={badge.label} variant={badge.variant} size="sm" shine />
        </div>

        {/* Name & info over gradient */}
        <div className="absolute bottom-6 left-5 right-5 z-10">
          <h1 className="font-display text-4xl text-white leading-tight">{person.name}</h1>
          {person.title && (
            <p className="text-sm text-white/80 mt-1">{person.title}</p>
          )}
          {lifespan && (
            <p className="text-xs text-gold mt-1.5 font-semibold">{lifespan}</p>
          )}
        </div>
      </div>

      {/* ── Quick Facts Card ── */}
      <div className="px-5">
        <div className="glass-card rounded-2xl p-4 -mt-6 relative z-10">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[9px] text-txt-secondary uppercase tracking-wider">Born</p>
              <p className="text-sm font-semibold text-white">{person.birth_year ?? "\u2014"}</p>
            </div>
            <div>
              <p className="text-[9px] text-txt-secondary uppercase tracking-wider">Era</p>
              <p className="text-sm font-semibold text-white">{person.era ?? "\u2014"}</p>
            </div>
            <div>
              <p className="text-[9px] text-txt-secondary uppercase tracking-wider">Origin</p>
              <p className="text-sm font-semibold text-white">Compton, CA</p>
            </div>
            <div>
              <p className="text-[9px] text-txt-secondary uppercase tracking-wider">Known For</p>
              <p className="text-sm font-semibold text-white truncate">
                {person.title ?? (achievements.length > 0 ? achievements[0] : "\u2014")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-6 mt-6">
        {/* ── Bio with Drop Cap ── */}
        {bioParagraphs.length > 0 && (
          <>
            <div className="divider-gold" />
            <div className="space-y-4">
              {bioParagraphs.map((paragraph: string, i: number) => (
                <p
                  key={i}
                  className={`text-sm text-txt-secondary leading-relaxed ${i === 0 ? "drop-cap" : ""}`}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </>
        )}

        {/* ── Achievement Timeline ── */}
        {achievements.length > 0 && (
          <>
            <div className="divider-gold" />
            <div>
              <h2 className="font-heading font-bold text-sm mb-4">Notable Achievements</h2>
              <div className="relative pl-5">
                {/* Timeline line */}
                <div className="absolute left-[3px] top-1 bottom-1 w-[2px] bg-gold/30" />

                <div className="space-y-4">
                  {achievements.map((achievement, i) => (
                    <div key={i} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-5 top-1.5 w-[8px] h-[8px] rounded-full bg-gold border-2 border-midnight" />
                      <p className="text-sm text-txt-secondary leading-relaxed">{achievement}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Ad Zone ── */}
        <AdZone zone="event_banner" />

        {/* ── External Links ── */}
        {Object.keys(links).length > 0 && (
          <>
            <div className="divider-gold" />
            <div>
              <h2 className="font-heading font-bold text-sm mb-3">Learn More</h2>
              <div className="space-y-2">
                {Object.entries(links).map(([name, url]) => (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-white/5 border border-border-subtle hover:border-gold/20 transition-colors group"
                  >
                    <span className="text-sm font-semibold text-white group-hover:text-gold transition-colors">
                      {name.charAt(0).toUpperCase() + name.slice(1)}
                    </span>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-txt-secondary group-hover:text-gold transition-colors">
                      <path d="M5 11l6-6M5 5h6v6" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Exhibit Link ── */}
        {exhibit && (
          <Link
            href={`/culture/exhibits/${exhibit.slug}`}
            className="block rounded-xl bg-gold/5 border border-gold/15 p-4 shadow-[0_0_20px_rgba(199,167,73,0.08)] hover:shadow-[0_0_30px_rgba(199,167,73,0.15)] transition-shadow"
          >
            <p className="text-[10px] font-semibold text-gold uppercase tracking-wider">Featured in</p>
            <p className="text-sm font-heading font-bold text-white mt-0.5">{exhibit.title}</p>
          </Link>
        )}

        {/* ── Photo Gallery ── */}
        {imageUrls.length > 0 && (
          <>
            <div className="divider-gold" />
            <div>
              <h2 className="font-heading font-bold text-sm mb-3">Gallery</h2>
              <PersonGallery images={imageUrls} name={person.name} />
            </div>
          </>
        )}

        {/* ── Related People ── */}
        <div className="divider-gold" />
        <RelatedPeople category={person.category} excludeId={person.id} />
      </div>
    </div>
  );
}
