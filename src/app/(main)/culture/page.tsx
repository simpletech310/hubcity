import { createClient } from "@/lib/supabase/server";
import SectionHeader from "@/components/layout/SectionHeader";
import Card from "@/components/ui/Card";
import MuseumHero from "@/components/culture/MuseumHero";
import MuseumNav from "@/components/culture/MuseumNav";
import MuseumWingCard from "@/components/culture/MuseumWingCard";
import ExhibitCard from "@/components/culture/ExhibitCard";
import GalleryItemCard from "@/components/culture/GalleryItemCard";
import PersonCard from "@/components/culture/PersonCard";
import Link from "next/link";

export const metadata = {
  title: "The Compton Museum | Hub City",
  description:
    "Immerse yourself in Compton's rich culture — exhibits, gallery, notable people, music heritage, history, and community stories curated by the Compton Museum.",
};

export default async function CulturePage() {
  const supabase = await createClient();

  const [
    exhibitsRes,
    galleryRes,
    peopleRes,
    libraryRes,
    muralsRes,
    eventsRes,
    exhibitCountRes,
    galleryCountRes,
    peopleCountRes,
    libraryCountRes,
    muralsCountRes,
  ] = await Promise.all([
    // Featured exhibit
    supabase
      .from("museum_exhibits")
      .select("*")
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(3),
    // Recent gallery items
    supabase
      .from("gallery_items")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(6),
    // Featured people
    supabase
      .from("notable_people")
      .select("*")
      .eq("is_published", true)
      .order("display_order", { ascending: true })
      .limit(4),
    // Library count
    supabase
      .from("library_items")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),
    // Murals
    supabase
      .from("murals")
      .select("id", { count: "exact", head: true }),
    // Upcoming cultural events
    supabase
      .from("events")
      .select("id, title, start_date, location_name")
      .eq("category", "culture")
      .gte("start_date", new Date().toISOString())
      .order("start_date", { ascending: true })
      .limit(3),
    // Counts for wing cards
    supabase.from("museum_exhibits").select("id", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("gallery_items").select("id", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("notable_people").select("id", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("library_items").select("id", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("murals").select("id", { count: "exact", head: true }),
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
    murals: muralsCountRes.count ?? 0,
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Museum Hero */}
      <MuseumHero />

      {/* Museum Navigation */}
      <div className="px-5">
        <MuseumNav />
      </div>

      {/* Featured Exhibit */}
      {exhibits.length > 0 && (
        <section className="px-5">
          <SectionHeader
            title="Current Exhibits"
            linkText="View All"
            linkHref="/culture/exhibits"
          />
          <div className="space-y-3">
            {exhibits.slice(0, 1).map((exhibit) => (
              <ExhibitCard key={exhibit.id} exhibit={exhibit} featured />
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

      {/* Museum Wings Grid */}
      <section className="px-5">
        <SectionHeader title="Explore the Museum" />
        <div className="grid grid-cols-3 gap-2.5">
          <MuseumWingCard
            href="/culture/exhibits"
            icon="🎨"
            title="Exhibits"
            subtitle="Curated collections"
            count={counts.exhibits}
          />
          <MuseumWingCard
            href="/culture/gallery"
            icon="🖼️"
            title="Gallery"
            subtitle="Art & artifacts"
            count={counts.gallery}
          />
          <MuseumWingCard
            href="/culture/people"
            icon="👤"
            title="People"
            subtitle="Notable figures"
            count={counts.people}
          />
          <MuseumWingCard
            href="/culture/history"
            icon="📜"
            title="History"
            subtitle="Compton timeline"
          />
          <MuseumWingCard
            href="/culture/media"
            icon="🎬"
            title="Media"
            subtitle="Videos & films"
          />
          <MuseumWingCard
            href="/culture/library"
            icon="📚"
            title="Library"
            subtitle="Books & reads"
            count={counts.library}
          />
          <MuseumWingCard
            href="/culture/discussions"
            icon="💬"
            title="Discuss"
            subtitle="Community talks"
          />
          <MuseumWingCard
            href="/culture/murals"
            icon="🎭"
            title="Murals"
            subtitle="Street art"
            count={counts.murals}
          />
          <MuseumWingCard
            href="/culture/calendar"
            icon="📅"
            title="Events"
            subtitle="Cultural calendar"
          />
        </div>
      </section>

      {/* Gallery Preview */}
      {galleryItems.length > 0 && (
        <section className="px-5">
          <SectionHeader
            title="From the Gallery"
            linkText="View All"
            linkHref="/culture/gallery"
          />
          <div className="grid grid-cols-3 gap-2">
            {galleryItems.slice(0, 6).map((item) => (
              <GalleryItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Notable People */}
      {people.length > 0 && (
        <section className="px-5">
          <SectionHeader
            title="Notable People"
            linkText="View All"
            linkHref="/culture/people"
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

      {/* History Teaser */}
      <section className="px-5">
        <Link
          href="/culture/history"
          className="block group relative overflow-hidden rounded-2xl border border-border-subtle p-6 card-glow transition-all duration-300 hover:border-gold/20"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-purple-900/10" />
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

      {/* Upcoming Cultural Events */}
      {events.length > 0 && (
        <section className="px-5">
          <SectionHeader
            title="Upcoming Events"
            linkText="Full Calendar"
            linkHref="/culture/calendar"
          />
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

      {/* Museum Footer */}
      <section className="px-5">
        <div className="rounded-2xl bg-white/[0.02] border border-border-subtle p-5 text-center">
          <span className="text-2xl">🏛️</span>
          <h3 className="font-display text-lg text-white mt-2">
            Compton Art & History Museum
          </h3>
          <p className="text-xs text-txt-secondary mt-1">
            106 W Compton Blvd, Compton, CA
          </p>
          <p className="text-[11px] text-txt-secondary mt-3 max-w-xs mx-auto leading-relaxed">
            The digital home of Compton culture. Curated with love for the Hub City community.
          </p>
        </div>
      </section>
    </div>
  );
}
