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

      <div className="sticky top-0 z-30 bg-midnight/95 backdrop-blur-lg border-b border-border-subtle">
        <div className="px-5">
          <MuseumNav />
        </div>
      </div>

      {/* Featured Exhibits */}
      {featured.length > 0 && (
        <section className="px-5 space-y-3">
          {featured.map((exhibit) => (
            <ExhibitCard key={exhibit.id} exhibit={exhibit} featured />
          ))}
        </section>
      )}

      {/* All Exhibits */}
      <section className="px-5">
        {regular.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {regular.map((exhibit) => (
              <ExhibitCard key={exhibit.id} exhibit={exhibit} />
            ))}
          </div>
        ) : allExhibits.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl block mb-3"><Icon name="palette" size={28} /></span>
            <p className="text-sm font-medium mb-1">Exhibits coming soon</p>
            <p className="text-xs text-txt-secondary">
              The museum is preparing new collections for you to explore.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
