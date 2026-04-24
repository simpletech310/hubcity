import CultureHero from "@/components/culture/CultureHero";
import MuseumNav from "@/components/culture/MuseumNav";
import TimelineView from "@/components/culture/TimelineView";
import { loadCityHistory } from "@/lib/city-history";
import { getActiveCity } from "@/lib/city-context";

export const metadata = {
  title: "History | Culture Museum",
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

      <div
        className="sticky top-0 z-30"
        style={{
          background: "var(--paper)",
          borderBottom: "2px solid var(--rule-strong-c)",
        }}
      >
        <div className="px-5">
          <MuseumNav />
        </div>
      </div>

      {/* Timeline */}
      <section className="px-5">
        <div className="text-center mb-10">
          <span className="c-kicker" style={{ color: "var(--ink-strong)" }}>
            {firstYear} — {lastYear}
          </span>
          <h2 className="c-hero mt-2" style={{ color: "var(--ink-strong)", fontSize: "2rem" }}>
            A City of Firsts
          </h2>
          <p className="c-body mt-2 max-w-sm mx-auto" style={{ fontSize: 14, color: "var(--ink-strong)" }}>
            Generations of resilience, creativity, and cultural impact that
            changed the world.
          </p>
        </div>
        {timelineItems.length > 0 ? (
          <TimelineView items={timelineItems} />
        ) : (
          <p className="text-center py-12 c-serif-it" style={{ fontSize: 14, color: "var(--ink-strong)", opacity: 0.6 }}>
            We&apos;re still gathering {cityName}&apos;s history. Check back soon.
          </p>
        )}
      </section>

      {/* CTA */}
      <section className="px-5">
        <div
          className="p-6 text-center"
          style={{
            background: "var(--paper-warm)",
            border: "2px solid var(--rule-strong-c)",
          }}
        >
          <h3 className="c-hero" style={{ fontSize: "1.5rem", color: "var(--ink-strong)" }}>
            Help tell the story
          </h3>
          <p className="c-body mt-2 max-w-md mx-auto" style={{ fontSize: 14, color: "var(--ink-strong)" }}>
            Know a piece of {cityName} history that should be here? Share it
            with the Museum to help preserve the culture.
          </p>
          <a href="/culture/discussions" className="c-btn c-btn-primary c-btn-sm inline-block mt-4">
            Start a Discussion
          </a>
        </div>
      </section>
    </div>
  );
}
