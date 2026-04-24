import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/ui/Badge";
import AdZone from "@/components/ui/AdZone";
import PersonGallery from "@/components/culture/PersonGallery";
import RelatedPeople from "@/components/culture/RelatedPeople";
import type { NotablePersonCategory } from "@/types/database";
import Icon from "@/components/ui/Icon";

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
    <div className="culture-surface min-h-dvh pb-20">
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
            <span className="text-7xl"><Icon name="person" size={16} /></span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/60 to-transparent" style={{ top: "30%" }} />

        {/* Back button */}
        <Link
          href="/culture/people"
          className="absolute top-5 left-5 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10 press"
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
          <span className="c-kicker block mb-1" style={{ color: "var(--gold-c)" }}>Notable Person</span>
          <h1 className="c-hero leading-tight" style={{ color: "#fff", textShadow: "0 2px 24px rgba(0,0,0,0.5)" }}>{person.name}</h1>
          {person.title && (
            <p className="c-serif-it text-[15px] mt-1" style={{ color: "#fff" }}>{person.title}</p>
          )}
          {lifespan && (
            <p className="text-xs mt-1.5 font-semibold" style={{ color: "var(--gold-c)" }}>{lifespan}</p>
          )}
        </div>
      </div>

      {/* ── Quick Facts Card ── */}
      <div className="px-5">
        <div className="c-frame-strong p-4 -mt-6 relative z-10" style={{ background: "var(--paper)" }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="c-kicker">Born</p>
              <p className="text-sm font-semibold" style={{ color: "var(--ink-strong)" }}>{person.birth_year ?? "\u2014"}</p>
            </div>
            <div>
              <p className="c-kicker">Era</p>
              <p className="text-sm font-semibold" style={{ color: "var(--ink-strong)" }}>{person.era ?? "\u2014"}</p>
            </div>
            <div>
              <p className="c-kicker">Origin</p>
              <p className="text-sm font-semibold" style={{ color: "var(--ink-strong)" }}>Compton, CA</p>
            </div>
            <div>
              <p className="c-kicker">Known For</p>
              <p className="text-sm font-semibold truncate" style={{ color: "var(--ink-strong)" }}>
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
                  className={`c-body text-sm leading-relaxed ${i === 0 ? "drop-cap" : ""}`}
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
              <h2 className="c-card-t mb-4" style={{ color: "var(--ink-strong)" }}>Notable Achievements</h2>
              <div className="relative pl-5">
                {/* Timeline line */}
                <div className="absolute left-[3px] top-1 bottom-1 w-[2px]" style={{ background: "var(--gold-c)" }} />

                <div className="space-y-4">
                  {achievements.map((achievement, i) => (
                    <div key={i} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-5 top-1.5 w-[8px] h-[8px] rounded-full" style={{ background: "var(--gold-c)", border: "2px solid var(--paper)" }} />
                      <p className="c-body text-sm leading-relaxed">{achievement}</p>
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
              <h2 className="c-card-t mb-3" style={{ color: "var(--ink-strong)" }}>Learn More</h2>
              <div className="space-y-2">
                {Object.entries(links).map(([name, url]) => (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full px-4 py-3 c-frame transition-colors group"
                    style={{ background: "var(--paper-soft)" }}
                  >
                    <span className="text-sm font-semibold" style={{ color: "var(--ink-strong)" }}>
                      {name.charAt(0).toUpperCase() + name.slice(1)}
                    </span>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--gold-c)" }}>
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
            className="block c-gold-block p-4 transition-shadow"
          >
            <p className="c-kicker">Featured in</p>
            <p className="c-card-t mt-0.5" style={{ color: "var(--ink-strong)" }}>{exhibit.title}</p>
          </Link>
        )}

        {/* ── Photo Gallery ── */}
        {imageUrls.length > 0 && (
          <>
            <div className="divider-gold" />
            <div>
              <h2 className="c-card-t mb-3" style={{ color: "var(--ink-strong)" }}>Gallery</h2>
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
