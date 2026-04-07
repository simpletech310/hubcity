import { createClient } from "@/lib/supabase/server";
import SectionHeader from "@/components/layout/SectionHeader";
import EditorialHeader from "@/components/ui/EditorialHeader";
import FeaturedCard from "@/components/ui/FeaturedCard";
import AdZone from "@/components/ui/AdZone";
import Card from "@/components/ui/Card";
import MuseumHero from "@/components/culture/MuseumHero";
import MuseumNav from "@/components/culture/MuseumNav";
import MuseumWingCard from "@/components/culture/MuseumWingCard";
import ExhibitCard from "@/components/culture/ExhibitCard";
import GalleryItemCard from "@/components/culture/GalleryItemCard";
import PersonCard from "@/components/culture/PersonCard";
import Link from "next/link";
import Icon from "@/components/ui/Icon";

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

      {/* Museum Wings Grid */}
      <section className="px-5">
        <SectionHeader title="Explore the Museum" />
        <div className="grid grid-cols-3 gap-2.5">
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
            subtitle="Compton timeline"
          />
          <MuseumWingCard
            href="/culture/media"
            icon="film"
            title="Media"
            subtitle="Videos & films"
          />
          <MuseumWingCard
            href="/culture/library"
            icon="book"
            title="Library"
            subtitle="Books & reads"
            count={counts.library}
          />
          <MuseumWingCard
            href="/culture/discussions"
            icon="chat"
            title="Discuss"
            subtitle="Community talks"
          />
          <MuseumWingCard
            href="/culture/murals"
            icon="theater"
            title="Murals"
            subtitle="Street art"
            count={counts.murals}
          />
          <MuseumWingCard
            href="/culture/calendar"
            icon="calendar"
            title="Events"
            subtitle="Cultural calendar"
          />
        </div>
      </section>

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
          <EditorialHeader kicker="COMPTON LEGENDS" title="Notable People" />
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
          <span className="text-2xl"><Icon name="landmark" size={24} /></span>
          <h3 className="font-display text-lg text-white mt-2">
            Compton Art & History Museum
          </h3>
          <p className="text-xs text-txt-secondary mt-1">
            306 W Compton Blvd. #104, Compton, CA 90220
          </p>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="text-[10px] text-gold/70 font-semibold">Tue–Sat 10am–3pm</span>
            <span className="text-white/10">|</span>
            <span className="text-[10px] text-txt-secondary">(310) 627-9022</span>
          </div>
          <p className="text-[11px] text-txt-secondary mt-3 max-w-xs mx-auto leading-relaxed">
            A community-based, community-centered museum amplifying the culture of Compton and greater South Los Angeles.
          </p>
          <div className="flex items-center justify-center gap-3 mt-3">
            <a href="https://www.instagram.com/comptonmuseum" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-txt-secondary hover:text-gold transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            <a href="https://www.facebook.com/ComptonMuseum" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-txt-secondary hover:text-gold transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="https://www.comptonmuseum.org" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-txt-secondary hover:text-gold transition-colors">
              <Icon name="globe" size={12} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
