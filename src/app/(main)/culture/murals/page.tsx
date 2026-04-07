import { createClient } from "@/lib/supabase/server";
import CultureHero from "@/components/culture/CultureHero";
import MuralCard from "@/components/culture/MuralCard";
import Icon from "@/components/ui/Icon";

export const metadata = {
  title: "Murals | Compton Culture | Hub City",
  description: "Explore murals across Compton's neighborhoods.",
};

const DISTRICTS = [
  "All",
  "Downtown",
  "Willowbrook",
  "East Compton",
  "West Compton",
  "North Compton",
  "South Compton",
];

export default async function MuralsPage({
  searchParams,
}: {
  searchParams: Promise<{ district?: string }>;
}) {
  const params = await searchParams;
  const activeDistrict = params.district || "All";
  const supabase = await createClient();

  let query = supabase
    .from("murals")
    .select("*")
    .order("created_at", { ascending: false });

  if (activeDistrict !== "All") {
    query = query.eq("district", activeDistrict);
  }

  const { data: murals } = await query;
  const muralsList = murals ?? [];

  return (
    <div className="space-y-8 pb-20">
      <CultureHero
        title="Compton Murals"
        subtitle="Public art across every neighborhood."
        gradient="art-mural"
      />

      {/* District Filter */}
      <div className="px-5">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {DISTRICTS.map((d) => (
            <a
              key={d}
              href={d === "All" ? "/culture/murals" : `/culture/murals?district=${encodeURIComponent(d)}`}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                d === activeDistrict
                  ? "bg-gold text-black border-gold"
                  : "bg-white/5 text-text-secondary border-border-subtle hover:border-gold/30"
              }`}
            >
              {d}
            </a>
          ))}
        </div>
      </div>

      {/* Mural Grid */}
      <div className="px-5">
        {muralsList.length > 0 ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {muralsList.map((mural) => (
              <MuralCard key={mural.id} mural={mural} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <span className="text-4xl mb-4 block"><Icon name="palette" size={28} /></span>
            <h3 className="font-heading font-bold text-text-primary text-lg">
              No murals found
            </h3>
            <p className="text-text-secondary text-sm mt-1">
              {activeDistrict !== "All"
                ? `No murals listed for ${activeDistrict} yet.`
                : "Murals will appear here as they are added."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
