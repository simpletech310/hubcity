import { createClient } from "@/lib/supabase/server";
import CultureHero from "@/components/culture/CultureHero";
import MuseumNav from "@/components/culture/MuseumNav";
import ExhibitCard from "@/components/culture/ExhibitCard";
import Icon from "@/components/ui/Icon";

export const metadata = {
  title: "Exhibits | The Compton Museum | Culture",
  description: "Curated exhibits exploring Compton's culture, history, and artistic heritage.",
};

export default async function ExhibitsPage() {
  const supabase = await createClient();

  const { data: exhibits } = await supabase
    .from("museum_exhibits")
    .select("*")
    .eq("is_published", true)
    .order("is_featured", { ascending: false })
    .order("display_order", { ascending: true });

  const allExhibits = exhibits ?? [];
  const featured = allExhibits.filter((e) => e.is_featured);
  const regular = allExhibits.filter((e) => !e.is_featured);

  return (
    <div className="space-y-6 pb-20">
      <CultureHero
        title="Exhibits"
        subtitle="Curated collections exploring Compton's story."
        imageUrl="/images/art/IMG_2776.JPG"
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

      {/* Featured Exhibits */}
      {featured.length > 0 && (
        <section className="px-5">
          <div
            className="flex items-baseline gap-3 pb-2 mb-4"
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
              § FEATURED
            </span>
            <span
              className="c-badge c-badge-gold tabular-nums ml-auto"
              style={{ fontSize: 9 }}
            >
              {featured.length} {featured.length === 1 ? "EXHIBIT" : "EXHIBITS"}
            </span>
          </div>
          <div className="space-y-3">
            {featured.map((exhibit) => (
              <ExhibitCard key={exhibit.id} exhibit={exhibit} featured />
            ))}
          </div>
        </section>
      )}

      {/* All Exhibits */}
      {regular.length > 0 && (
        <section className="px-5">
          <div
            className="flex items-baseline gap-3 pb-2 mb-4"
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
              § ON VIEW
            </span>
            <span
              className="c-badge c-badge-ink tabular-nums ml-auto"
              style={{ fontSize: 9 }}
            >
              {regular.length} {regular.length === 1 ? "EXHIBIT" : "EXHIBITS"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {regular.map((exhibit) => (
              <ExhibitCard key={exhibit.id} exhibit={exhibit} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {allExhibits.length === 0 && (
        <section className="px-5">
          <div
            className="text-center py-16 px-6"
            style={{
              background: "var(--paper-warm)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            <Icon name="palette" size={32} style={{ color: "var(--ink-strong)" }} className="mx-auto mb-3" />
            <p className="c-card-t mb-1" style={{ fontSize: 14, color: "var(--ink-strong)" }}>
              Exhibits coming soon
            </p>
            <p className="c-body" style={{ fontSize: 12, color: "var(--ink-strong)", opacity: 0.7 }}>
              The museum is preparing new collections for you to explore.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
