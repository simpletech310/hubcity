import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/ui/Badge";
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
    ? person.death_year ? `${person.birth_year} – ${person.death_year}` : `Born ${person.birth_year}`
    : null;
  const achievements = (person.notable_achievements ?? []) as string[];
  const links = (person.external_links ?? {}) as Record<string, string>;

  return (
    <div className="pb-20">
      {/* Back */}
      <div className="px-5 pt-4 mb-4">
        <Link href="/culture/people" className="inline-flex items-center gap-1.5 text-gold text-sm font-semibold press">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10 12L6 8l4-4" /></svg>
          People
        </Link>
      </div>

      {/* Portrait */}
      <div className="relative aspect-[4/3] mx-5 rounded-2xl overflow-hidden bg-white/5 mb-5">
        {person.portrait_url ? (
          <img src={person.portrait_url} alt={person.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gold/5 to-purple-900/10 flex items-center justify-center">
            <span className="text-6xl">👤</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-transparent to-transparent" />
      </div>

      <div className="px-5 space-y-5">
        {/* Header */}
        <div>
          <Badge label={badge.label} variant={badge.variant} size="md" />
          <h1 className="font-display text-3xl text-white mt-2">{person.name}</h1>
          {person.title && (
            <p className="text-sm text-txt-secondary mt-1">{person.title}</p>
          )}
          {lifespan && (
            <p className="text-xs text-txt-secondary mt-1">{lifespan}</p>
          )}
          {person.era && (
            <p className="text-xs text-gold mt-1">{person.era}</p>
          )}
        </div>

        {/* Bio */}
        {person.bio && (
          <>
            <div className="divider-subtle" />
            <div className="text-sm text-txt-secondary leading-relaxed whitespace-pre-line">
              {person.bio}
            </div>
          </>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <>
            <div className="divider-subtle" />
            <div>
              <h2 className="font-heading font-bold text-sm mb-3">Notable Achievements</h2>
              <div className="space-y-2">
                {achievements.map((achievement, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-gold mt-0.5">&#x2022;</span>
                    <p className="text-sm text-txt-secondary">{achievement}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* External links */}
        {Object.keys(links).length > 0 && (
          <>
            <div className="divider-subtle" />
            <div>
              <h2 className="font-heading font-bold text-sm mb-3">Learn More</h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(links).map(([name, url]) => (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-white/5 text-xs font-semibold text-gold hover:bg-white/10 transition-colors border border-border-subtle"
                  >
                    {name.charAt(0).toUpperCase() + name.slice(1)} &rarr;
                  </a>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Exhibit link */}
        {exhibit && (
          <Link
            href={`/culture/exhibits/${exhibit.slug}`}
            className="block rounded-xl bg-gold/5 border border-gold/15 p-3"
          >
            <p className="text-[10px] font-semibold text-gold uppercase tracking-wider">Featured in</p>
            <p className="text-sm font-heading font-bold text-white mt-0.5">{exhibit.title}</p>
          </Link>
        )}

        {/* Additional images */}
        {person.image_urls?.length > 0 && (
          <>
            <div className="divider-subtle" />
            <div>
              <h2 className="font-heading font-bold text-sm mb-3">Gallery</h2>
              <div className="grid grid-cols-3 gap-2">
                {(person.image_urls as string[]).map((url, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden bg-white/5">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
