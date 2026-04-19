// City-scoped culture hub. Shows all cultural orgs + exhibits/gallery/people for this city.
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCityBySlug, listLiveCities } from "@/lib/cities";
import MuseumHero from "@/components/culture/MuseumHero";
import Icon from "@/components/ui/Icon";

type CityCulturePageProps = {
  params: Promise<{ city: string }>;
};

export async function generateMetadata({ params }: CityCulturePageProps) {
  const { city: slug } = await params;
  const city = await getCityBySlug(slug);
  return {
    title: city ? `${city.name} Culture` : "Culture",
  };
}

export default async function CityCulturePage({ params }: CityCulturePageProps) {
  const { city: slug } = await params;
  const city = await getCityBySlug(slug);
  if (!city || city.launch_status !== "live") notFound();

  const supabase = await createClient();

  // Cultural organizations with content in this city.
  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, slug, name, description, logo_url, verified")
    .eq("city_id", city.id)
    .eq("type", "cultural")
    .order("name", { ascending: true });

  const orgList = orgs ?? [];

  const [{ data: exhibits }, { data: gallery }, { data: people }] = await Promise.all([
    supabase
      .from("museum_exhibits")
      .select("id, title, slug, description, cover_image_url, tags, organization_id, category_id")
      .eq("city_id", city.id)
      .eq("is_published", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("gallery_items")
      .select("id, title, slug, description, image_urls, artist_name, tags, organization_id, category_id")
      .eq("city_id", city.id)
      .eq("is_published", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("notable_people")
      .select("id, slug, name, portrait_url, category, organization_id")
      .eq("city_id", city.id)
      .eq("is_published", true)
      .limit(12),
  ]);

  const liveCities = await listLiveCities();

  // Per-city hero copy (falls back if theme.culture_hero is absent).
  const theme = (city.theme ?? {}) as {
    culture_hero?: { kicker?: string; line1?: string; line2?: string; tagline?: string };
  };
  const hero = theme.culture_hero ?? {};

  return (
    <main className="min-h-dvh bg-midnight text-white pb-10">
      <MuseumHero
        kicker={hero.kicker ?? `Culture · ${city.name}, ${city.state}`}
        orgName={hero.line1 ?? `${city.name} Art &`}
        orgNameAccent={hero.line2 ?? "Culture"}
        tagline={
          hero.tagline ??
          `Exhibits, artists, performances, and stories from ${city.name}'s cultural organizations.`
        }
        stats={[
          { icon: "museum", count: String(orgList.length), label: "Organizations" },
          { icon: "palette", count: String((exhibits ?? []).length), label: "Exhibits" },
          { icon: "person", count: String((people ?? []).length), label: "Notable people" },
        ]}
      />

      <div className="px-5 mt-4">
        <CitySwitcher currentSlug={city.slug} cities={liveCities.map((c) => ({ slug: c.slug, name: c.name }))} />
      </div>

      {orgList.length > 0 && (
        <section className="px-5 mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-3">
            Cultural organizations in {city.name}
          </h2>
          <div className="space-y-2">
            {orgList.map((o) => (
              <Link
                key={o.id}
                href={`/c/${city.slug}/culture/${o.slug}`}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] p-4"
              >
                <div className="w-10 h-10 rounded-lg bg-gold/15 border border-gold/25 overflow-hidden flex items-center justify-center">
                  {o.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={o.logo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gold text-sm font-semibold">{o.name.slice(0, 1)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{o.name}</p>
                    {o.verified && (
                      <Icon name="verified" size={12} className="text-gold flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-white/60 line-clamp-1">{o.description}</p>
                </div>
                <Icon name="forward" size={16} className="text-white/40 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {(exhibits ?? []).length > 0 && (
        <section className="px-5 mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white/60">Exhibits</h2>
            <Link href={`/c/${city.slug}/culture/exhibits`} className="text-[11px] text-gold">
              All
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(exhibits ?? []).map((ex) => (
              <Link
                key={ex.id}
                href={`/c/${city.slug}/culture/exhibits/${ex.slug}`}
                className="rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] overflow-hidden"
              >
                <div className="aspect-[4/5] bg-gradient-to-br from-gold/15 to-midnight relative overflow-hidden">
                  {ex.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ex.cover_image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon name="palette" size={28} className="text-gold/50" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold line-clamp-2">{ex.title}</p>
                  <p className="text-[11px] text-white/50 line-clamp-2 mt-1">{ex.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {(gallery ?? []).length > 0 && (
        <section className="px-5 mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white/60">Gallery</h2>
            <Link href={`/c/${city.slug}/culture/gallery`} className="text-[11px] text-gold">
              All
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(gallery ?? []).map((g) => (
              <Link
                key={g.id}
                href={`/c/${city.slug}/culture/gallery/${g.slug}`}
                className="aspect-square rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden relative group"
              >
                {g.image_urls && g.image_urls[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={g.image_urls[0]}
                    alt={g.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gold/10 to-midnight">
                    <Icon name="frame" size={20} className="text-gold/50" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent p-2">
                  <p className="text-[10px] text-white line-clamp-1 font-medium">{g.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {(people ?? []).length > 0 && (
        <section className="px-5 mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white/60">Notable people</h2>
            <Link href={`/c/${city.slug}/culture/people`} className="text-[11px] text-gold">
              All
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5">
            {(people ?? []).map((p) => (
              <Link
                key={p.id}
                href={`/c/${city.slug}/culture/people/${p.slug}`}
                className="flex-shrink-0 w-28 rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden"
              >
                <div className="aspect-square bg-gradient-to-br from-gold/15 to-midnight">
                  {p.portrait_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.portrait_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon name="person" size={22} className="text-gold/50" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-[11px] font-semibold line-clamp-2">{p.name}</p>
                  {p.category && (
                    <p className="text-[9px] text-white/50 uppercase tracking-wider">{p.category}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {orgList.length === 0 && (exhibits ?? []).length === 0 && (
        <section className="px-5 mt-10">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center">
            <Icon name="museum" size={28} className="text-gold/50 mx-auto" />
            <p className="mt-2 text-sm text-white/70">
              No culture content has been posted for {city.name} yet.
            </p>
            <p className="mt-1 text-[12px] text-white/50">
              Are you a local gallery, museum, or cultural org? Register to start posting.
            </p>
            <Link
              href="/dashboard/organizations/new"
              className="inline-block mt-4 px-4 py-2 rounded-lg bg-gold text-midnight font-semibold text-xs"
            >
              Register an organization
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}

function CitySwitcher({
  currentSlug,
  cities,
}: {
  currentSlug: string;
  cities: { slug: string; name: string }[];
}) {
  if (cities.length <= 1) return null;
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-2">
      {cities.map((c) => {
        const active = c.slug === currentSlug;
        return (
          <Link
            key={c.slug}
            href={`/c/${c.slug}/culture`}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition ${
              active
                ? "bg-gold/15 border-gold/40 text-gold"
                : "bg-white/[0.02] border-white/10 text-white/70 hover:bg-white/[0.04]"
            }`}
          >
            {c.name}
          </Link>
        );
      })}
    </div>
  );
}
