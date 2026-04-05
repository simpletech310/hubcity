import { createClient } from "@/lib/supabase/server";
import SectionHeader from "@/components/layout/SectionHeader";
import Card from "@/components/ui/Card";
import CultureHero from "@/components/culture/CultureHero";
import MuralCard from "@/components/culture/MuralCard";
import StoryCard from "@/components/culture/StoryCard";
import Link from "next/link";

export const metadata = {
  title: "Compton Culture | Hub City",
  description:
    "Explore Compton's vibrant culture: murals, music heritage, local artists, and cultural events.",
};

export default async function CulturePage() {
  const supabase = await createClient();

  const [muralsRes, eventsRes, storiesRes] = await Promise.all([
    supabase
      .from("murals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("events")
      .select("*")
      .eq("category", "culture")
      .gte("start_date", new Date().toISOString())
      .order("start_date", { ascending: true })
      .limit(4),
    supabase
      .from("posts")
      .select("*, profiles!posts_user_id_fkey(id, display_name, avatar_url)")
      .not("story_title", "is", null)
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const murals = muralsRes.data ?? [];
  const events = eventsRes.data ?? [];
  const stories = storiesRes.data ?? [];

  return (
    <div className="space-y-10 pb-20">
      {/* Hero */}
      <CultureHero
        title="Compton Culture"
        subtitle="Art, music, and stories from the heart of Hub City."
        pattern
      />

      {/* Featured Murals */}
      <section className="px-5">
        <SectionHeader
          title="Featured Murals"
          linkText="View All"
          linkHref="/culture/murals"
        />
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide">
          {murals.length > 0 ? (
            murals.map((mural) => (
              <div key={mural.id} className="min-w-[260px] max-w-[280px] shrink-0">
                <MuralCard mural={mural} />
              </div>
            ))
          ) : (
            <Card padding>
              <p className="text-text-secondary text-sm py-8 text-center">
                No murals yet. Check back soon.
              </p>
            </Card>
          )}
        </div>
      </section>

      {/* Cultural Calendar Preview */}
      <section className="px-5">
        <SectionHeader
          title="Cultural Calendar"
          linkText="Full Calendar"
          linkHref="/culture/calendar"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {events.length > 0 ? (
            events.map((event) => (
              <Card key={event.id} hover padding>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-gold/10 flex flex-col items-center justify-center border border-gold/20">
                    <span className="text-[10px] text-gold font-semibold uppercase">
                      {new Date(event.start_date).toLocaleDateString("en-US", {
                        month: "short",
                      })}
                    </span>
                    <span className="text-sm font-bold text-gold">
                      {new Date(event.start_date).getDate()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-heading font-bold text-sm text-text-primary truncate">
                      {event.title}
                    </h3>
                    {event.location && (
                      <p className="text-xs text-warm-gray mt-0.5 truncate">
                        {event.location}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card padding>
              <p className="text-text-secondary text-sm py-4 text-center">
                No upcoming cultural events.
              </p>
            </Card>
          )}
        </div>
      </section>

      {/* Featured Stories */}
      <section className="px-5">
        <SectionHeader
          title="Featured Stories"
          subtitle="Voices from the community"
        />
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide">
          {stories.length > 0 ? (
            stories.map((post) => (
              <div key={post.id} className="min-w-[300px] shrink-0">
                <StoryCard
                  post={post}
                  author={post.profiles ?? undefined}
                />
              </div>
            ))
          ) : (
            <Card padding>
              <p className="text-text-secondary text-sm py-8 text-center">
                Community stories coming soon.
              </p>
            </Card>
          )}
        </div>
      </section>

      {/* Music Heritage Teaser */}
      <section className="px-5">
        <Link
          href="/culture/music"
          className="block group relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900/60 via-black to-gold/20 border border-border-subtle p-6 md:p-8 card-glow transition-all duration-300 hover:border-gold/20"
        >
          <div className="pattern-dots absolute inset-0 opacity-10 pointer-events-none" />
          <div className="relative z-10">
            <span className="text-xs font-semibold text-gold uppercase tracking-wider">
              Music Heritage
            </span>
            <h3 className="font-display text-2xl md:text-3xl text-text-primary mt-2">
              The Sound of Compton
            </h3>
            <p className="text-text-secondary mt-2 max-w-md text-sm">
              From the birth of West Coast hip-hop to today&apos;s new
              generation of creators. Explore the timeline.
            </p>
            <span className="inline-block mt-4 text-gold text-sm font-semibold group-hover:translate-x-1 transition-transform">
              Explore Music History &rarr;
            </span>
          </div>
        </Link>
      </section>
    </div>
  );
}
