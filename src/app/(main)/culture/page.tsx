import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveCity } from "@/lib/city-context";
import EditorialHeader from "@/components/ui/EditorialHeader";
import FeaturedCard from "@/components/ui/FeaturedCard";
import AdZone from "@/components/ui/AdZone";
import Card from "@/components/ui/Card";
import MuseumWingCard from "@/components/culture/MuseumWingCard";
import ExhibitCard from "@/components/culture/ExhibitCard";
import GalleryItemCard from "@/components/culture/GalleryItemCard";
import PersonCard from "@/components/culture/PersonCard";
import Link from "next/link";
import Icon from "@/components/ui/Icon";

export async function generateMetadata(): Promise<Metadata> {
  const city = await getActiveCity();
  const name = city?.name ?? "Your City";
  return {
    title: `Culture | ${name} | Culture`,
    description: `Immerse yourself in ${name}'s culture — exhibits, gallery, notable people, music heritage, history, and community stories.`,
  };
}

export default async function CulturePage() {
  const city = await getActiveCity();
  if (!city) redirect("/choose-city");

  const supabase = await createClient();
  const isCompton = city.slug === "compton";

  const [
    exhibitsRes,
    galleryRes,
    peopleRes,
    eventsRes,
    exhibitCountRes,
    galleryCountRes,
    peopleCountRes,
    libraryCountRes,
  ] = await Promise.all([
    supabase
      .from("museum_exhibits")
      .select("*")
      .eq("is_published", true)
      .eq("city_id", city.id)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("gallery_items")
      .select("*")
      .eq("is_published", true)
      .eq("city_id", city.id)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("notable_people")
      .select("*")
      .eq("is_published", true)
      .eq("city_id", city.id)
      .order("display_order", { ascending: true })
      .limit(4),
    supabase
      .from("events")
      .select("id, title, start_date, location_name")
      .eq("category", "culture")
      .eq("city_id", city.id)
      .gte("start_date", new Date().toISOString())
      .order("start_date", { ascending: true })
      .limit(3),
    supabase
      .from("museum_exhibits")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true)
      .eq("city_id", city.id),
    supabase
      .from("gallery_items")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true)
      .eq("city_id", city.id),
    supabase
      .from("notable_people")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true)
      .eq("city_id", city.id),
    supabase
      .from("library_items")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true)
      .eq("city_id", city.id),
  ]);

  const exhibits = exhibitsRes.data ?? [];
  const galleryItems = galleryRes.data ?? [];
  const people = peopleRes.data ?? [];
  const events = eventsRes.data ?? [];

  const counts = {
    exhibits: exhibitCountRes.count ?? 0,
    gallery: galleryCountRes.count ?? 0,
    people: peopleCountRes.count ?? 0,
    library: libraryCountRes.count ?? 0,
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="relative px-5 pt-6 pb-6 border-b border-white/[0.08] panel-editorial">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] font-bold uppercase tracking-editorial text-gold tabular-nums">
            VOL · 01 · ISSUE HERITAGE
          </span>
          <span className="block w-1 h-1 rounded-full bg-gold/60" />
          <span className="text-[10px] font-bold uppercase tracking-editorial text-white/40">
            {city.name.toUpperCase()}
          </span>
        </div>
        <h1 className="masthead text-white text-[44px]">HERITAGE.</h1>
        <div className="mt-3 flex items-center gap-3">
          <span className="block h-[2px] w-8 bg-gold" />
          <span className="text-[10px] font-bold uppercase tracking-editorial text-ivory/60">
            The museum, muralists, and landmarks of {city.name}.
          </span>
        </div>
      </header>

      {/* Generic city culture hero — same structure for every city */}
      <section className="relative w-full overflow-hidden">
        <div className="relative min-h-[220px] flex flex-col justify-end">
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a1510] via-[#12100a] to-midnight" />
          <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.04] via-transparent to-transparent" />
          <div className="absolute inset-0 pattern-dots opacity-10 pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

          <div className="relative z-10 px-6 pb-6 pt-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/25 flex items-center justify-center">
                <Icon name="landmark" size={14} className="text-gold" />
              </div>
              <span className="text-[11px] font-semibold text-gold uppercase tracking-widest">
                {city.name}, {city.state} · Culture
              </span>
            </div>
            <h1 className="font-display text-[32px] md:text-5xl leading-[1.1] text-white">
              Culture in{" "}
              <span className="text-gold-gradient">{city.name}</span>
            </h1>
            <p className="mt-3 text-sm text-txt-secondary max-w-xs leading-relaxed">
              Exhibits, art, heritage, and the people shaping the story of {city.name}.
            </p>
          </div>
        </div>
      </section>

      {/* Explore-by-section tiles — apply to any city */}
      <section className="px-5">
        <h2 className="font-heading font-bold text-base flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full bg-gold" />
          Explore
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <MuseumWingCard
            href="/culture/exhibits"
            icon="palette"
            title="Exhibits"
            subtitle="Curated collections"
            count={counts.exhibits}
          />
          <MuseumWingCard
            href="/culture/gallery"
            icon="frame"
            title="Gallery"
            subtitle="Art & artifacts"
            count={counts.gallery}
          />
          <MuseumWingCard
            href="/culture/people"
            icon="person"
            title="People"
            subtitle="Notable figures"
            count={counts.people}
          />
          <MuseumWingCard
            href="/culture/history"
            icon="scroll"
            title="History"
            subtitle={`${city.name} timeline`}
          />
          <MuseumWingCard
            href="/culture/library"
            icon="book"
            title="Library"
            subtitle="Books & reads"
            count={counts.library}
          />
          <MuseumWingCard
            href="/culture/events"
            icon="calendar"
            title="Events"
            subtitle="Cultural calendar"
          />
          <MuseumWingCard
            href="/culture/landmarks"
            icon="map-pin"
            title="Landmarks"
            subtitle="Historic sites"
          />
        </div>
      </section>

      {/* Compton-only: feature the Compton Art & History Museum as a partner institution */}
      {isCompton && (
        <section className="px-5">
          <EditorialHeader kicker="FEATURED INSTITUTION" title="Compton Art & History Museum" />
          <div className="mt-3 rounded-2xl bg-white/[0.02] border border-border-subtle p-5">
            <p className="text-[13px] text-txt-secondary leading-relaxed">
              A groundbreaking space bringing together art, history, and community.
              Amplifying the culture of Compton and greater South Los Angeles.
            </p>
            <div className="flex items-center gap-2 mt-3 text-[11px] text-txt-secondary">
              <Icon name="map-pin" size={12} className="text-gold" />
              <span>306 W Compton Blvd. #104, Compton, CA 90220</span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-[11px] text-txt-secondary">
              <Icon name="clock" size={12} className="text-gold" />
              <span>Tue–Sat 10am–3pm</span>
              <span className="text-white/15">·</span>
              <span>(310) 627-9022</span>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <a href="https://www.comptonmuseum.org" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[11px] text-gold font-semibold press">
                <Icon name="globe" size={12} /> Visit website
              </a>
              <a href="https://www.instagram.com/comptonmuseum" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[11px] text-txt-secondary hover:text-gold transition-colors press">
                Instagram
              </a>
              <a href="https://www.facebook.com/ComptonMuseum" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[11px] text-txt-secondary hover:text-gold transition-colors press">
                Facebook
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Non-Compton empty-state hint when there's nothing city-scoped yet */}
      {!isCompton && exhibits.length === 0 && galleryItems.length === 0 && people.length === 0 && events.length === 0 && (
        <section className="px-5">
          <div className="rounded-2xl border border-dashed border-border-subtle bg-white/[0.02] p-5">
            <h3 className="font-heading font-bold text-sm flex items-center gap-2 mb-1">
              <Icon name="sparkle" size={16} className="text-gold" />
              {city.name} culture coming soon
            </h3>
            <p className="text-[12px] text-txt-secondary leading-relaxed">
              We&rsquo;re onboarding {city.name}&rsquo;s museums, galleries, and cultural organizations.
              Check back soon, or switch cities from the header to explore another.
            </p>
          </div>
        </section>
      )}

      {/* Featured Exhibit */}
      {exhibits.length > 0 && (
        <section className="px-5">
          <EditorialHeader kicker="NOW SHOWING" title="Current Exhibits" />
          <div className="space-y-3">
            {exhibits.slice(0, 1).map((exhibit) => (
              <FeaturedCard
                key={exhibit.id}
                title={exhibit.title}
                subtitle={exhibit.description?.slice(0, 120)}
                imageUrl={exhibit.cover_image_url}
                badge={exhibit.is_featured ? { label: "Featured", variant: "gold" as const } : undefined}
                href={`/culture/exhibits/${exhibit.slug || exhibit.id}`}
                kicker={exhibit.wing ?? "Exhibit"}
              />
            ))}
            {exhibits.length > 1 && (
              <div className="grid grid-cols-2 gap-3">
                {exhibits.slice(1, 3).map((exhibit) => (
                  <ExhibitCard key={exhibit.id} exhibit={exhibit} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Gallery Preview */}
      {galleryItems.length > 0 && (
        <section className="px-5">
          <EditorialHeader kicker="THE COLLECTION" title="Gallery" />
          <div className="grid grid-cols-3 gap-2">
            {galleryItems.slice(0, 6).map((item) => (
              <GalleryItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Ad Zone */}
      <div className="px-5">
        <AdZone zone="feed_banner" />
      </div>

      {/* Notable People */}
      {people.length > 0 && (
        <section className="px-5">
          <EditorialHeader
            kicker={`${city.name.toUpperCase()} LEGENDS`}
            title="Notable People"
          />
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-2">
            {people.map((person) => (
              <div key={person.id} className="min-w-[160px] max-w-[170px] shrink-0">
                <PersonCard person={person} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* History Teaser — Compton only (hardcoded "Since 1867"/Compton copy) */}
      {isCompton && (
        <section className="px-5">
          <Link
            href="/culture/history"
            className="block group relative overflow-hidden rounded-2xl border border-border-subtle p-6 card-glow transition-all duration-300 hover:border-gold/20"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-gold/3" />
            <div className="pattern-chevron absolute inset-0 opacity-5 pointer-events-none" />
            <div className="relative z-10">
              <span className="text-xs font-semibold text-gold uppercase tracking-wider">
                Since 1867
              </span>
              <h3 className="font-display text-2xl text-white mt-2">
                The Story of Compton
              </h3>
              <p className="text-txt-secondary mt-2 text-sm max-w-xs">
                From a farming settlement to the cultural capital of the West Coast. Explore the full timeline.
              </p>
              <span className="inline-block mt-4 text-gold text-sm font-semibold group-hover:translate-x-1 transition-transform">
                Explore History &rarr;
              </span>
            </div>
          </Link>
        </section>
      )}

      {/* Upcoming Cultural Events */}
      {events.length > 0 && (
        <section className="px-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-bold text-base flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-gold" />
              Upcoming Events
            </h2>
            <Link href="/culture/events" className="text-[11px] text-gold font-semibold press">
              All Events
            </Link>
          </div>
          <div className="space-y-2">
            {events.map((event) => (
              <Card key={event.id} hover padding>
                <div className="flex items-center gap-3">
                  <div className="shrink-0 w-11 h-11 rounded-xl bg-gold/10 flex flex-col items-center justify-center border border-gold/20">
                    <span className="text-[9px] text-gold font-semibold uppercase">
                      {new Date(event.start_date).toLocaleDateString("en-US", {
                        month: "short",
                      })}
                    </span>
                    <span className="text-sm font-bold text-gold leading-none">
                      {new Date(event.start_date).getDate()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-heading font-bold text-[13px] text-white truncate">
                      {event.title}
                    </h3>
                    {event.location_name && (
                      <p className="text-[11px] text-txt-secondary truncate">
                        {event.location_name}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
