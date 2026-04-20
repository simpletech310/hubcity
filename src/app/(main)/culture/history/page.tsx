import CultureHero from "@/components/culture/CultureHero";
import MuseumNav from "@/components/culture/MuseumNav";
import TimelineView from "@/components/culture/TimelineView";
import { loadCityHistory } from "@/lib/city-history";
import { getActiveCity } from "@/lib/city-context";

export const metadata = {
  title: "History | Knect Museum",
  description:
    "An interactive timeline of your city's history — from its founding to the present day renaissance.",
};

export default async function HistoryPage() {
  const activeCity = await getActiveCity();
  const history = await loadCityHistory(activeCity?.id ?? null);
  const cityName = activeCity?.name ?? "your city";

  const timelineItems = history.map((entry) => ({
    year: entry.year,
    title: entry.title,
    description: entry.description,
    color: entry.color ?? "#C5A04E",
  }));

  const firstYear = history[0]?.year ?? "Founding";
  const lastYear = history[history.length - 1]?.year ?? "Present";

  return (
    <div className="space-y-8 pb-20">
      <CultureHero
        title={`The Story of ${cityName}`}
        subtitle="From founding to the cultural capital it is today."
        imageUrl="/images/art/IMG_2785.jpg"
      />

      <div className="sticky top-0 z-30 bg-midnight/95 backdrop-blur-lg border-b border-border-subtle">
        <div className="px-5">
          <MuseumNav />
        </div>
      </div>

      {/* Timeline */}
      <section className="px-5">
        <div className="text-center mb-10">
          <span className="text-xs font-semibold text-gold uppercase tracking-widest">
            {firstYear} — {lastYear}
          </span>
          <h2 className="font-display text-2xl text-white mt-2">
            A City of Firsts
          </h2>
          <p className="text-sm text-txt-secondary mt-2 max-w-sm mx-auto">
            Generations of resilience, creativity, and cultural impact that
            changed the world.
          </p>
        </div>
        {timelineItems.length > 0 ? (
          <TimelineView items={timelineItems} />
        ) : (
          <p className="text-center text-sm text-white/40 py-12">
            We&apos;re still gathering {cityName}&apos;s history. Check back soon.
          </p>
        )}
      </section>

      {/* CTA */}
      <section className="px-5">
        <div className="rounded-2xl bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20 p-6 text-center">
          <h3 className="font-display text-xl text-white">
            Help tell the story
          </h3>
          <p className="text-txt-secondary text-sm mt-2 max-w-md mx-auto">
            Know a piece of {cityName} history that should be here? Share it
            with the Museum to help preserve the culture.
          </p>
          <a
            href="/culture/discussions"
            className="inline-block mt-4 px-6 py-2.5 bg-gold text-midnight font-semibold rounded-full text-sm hover:bg-gold/90 transition-colors"
          >
            Start a Discussion
          </a>
        </div>
      </section>
    </div>
  );
}
