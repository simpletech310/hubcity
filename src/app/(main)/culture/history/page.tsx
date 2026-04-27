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
        <div
          className="flex items-baseline gap-3 pb-2 mb-6"
          style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
        >
          <span
            className="c-kicker"
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              color: "var(--ink-strong)",
              opacity: 0.7,
            }}
          >
            § A CITY OF FIRSTS
          </span>
          <span
            className="c-badge c-badge-gold tabular-nums ml-auto"
            style={{ fontSize: 9 }}
          >
            {firstYear} — {lastYear}
          </span>
        </div>
        <p
          className="c-serif-it mb-8 max-w-sm"
          style={{
            fontSize: 14,
            lineHeight: 1.45,
            color: "var(--ink-strong)",
            opacity: 0.75,
          }}
        >
          Generations of resilience, creativity, and cultural impact that
          changed the world.
        </p>
        {timelineItems.length > 0 ? (
          <TimelineView items={timelineItems} />
        ) : (
          <div
            className="text-center py-12 px-6"
            style={{
              background: "var(--paper-warm)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            <p
              className="c-serif-it"
              style={{
                fontSize: 14,
                color: "var(--ink-strong)",
                opacity: 0.7,
              }}
            >
              We&apos;re still gathering {cityName}&apos;s history. Check back soon.
            </p>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="px-5">
        <div
          className="p-6"
          style={{
            background: "var(--ink-strong)",
            border: "2px solid var(--rule-strong-c)",
          }}
        >
          <span
            className="c-kicker"
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              color: "var(--gold-c)",
            }}
          >
            § JOIN THE RECORD
          </span>
          <h3
            className="c-hero mt-2"
            style={{
              fontSize: 26,
              lineHeight: 0.95,
              letterSpacing: "-0.012em",
              color: "#fff",
            }}
          >
            HELP TELL THE STORY.
          </h3>
          <p
            className="c-serif-it mt-2"
            style={{
              fontSize: 14,
              lineHeight: 1.45,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            Know a piece of {cityName} history that should be here? Share it
            with the Museum to help preserve the culture.
          </p>
          <a
            href="/culture/discussions"
            className="inline-flex items-center gap-1.5 mt-4 press"
            style={{
              padding: "10px 16px",
              background: "var(--gold-c)",
              color: "var(--ink-strong)",
              border: "2px solid var(--gold-c)",
              fontFamily: "var(--font-archivo), Archivo, sans-serif",
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              boxShadow: "0 2px 0 rgba(0,0,0,0.25)",
            }}
          >
            Start a Discussion →
          </a>
        </div>
      </section>
    </div>
  );
}
