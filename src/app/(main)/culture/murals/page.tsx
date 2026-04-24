import { createClient } from "@/lib/supabase/server";
import CultureHero from "@/components/culture/CultureHero";
import MuralCard from "@/components/culture/MuralCard";
import Icon from "@/components/ui/Icon";

export const metadata = {
  title: "Murals | Compton Culture | Culture",
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
        imageUrl="/images/art/compton-hub-city-mural.jpg"
      />

      {/* District Filter */}
      <div className="px-5">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {DISTRICTS.map((d) => {
            const active = d === activeDistrict;
            return (
              <a
                key={d}
                href={d === "All" ? "/culture/murals" : `/culture/murals?district=${encodeURIComponent(d)}`}
                className="shrink-0 px-4 py-1.5 transition-colors"
                style={{
                  background: active ? "var(--gold-c)" : "var(--paper)",
                  color: "var(--ink-strong)",
                  border: "2px solid var(--rule-strong-c)",
                  fontFamily: "var(--font-archivo-narrow), sans-serif",
                  fontSize: 13,
                  fontWeight: active ? 800 : 600,
                  letterSpacing: "0.02em",
                }}
              >
                {d}
              </a>
            );
          })}
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
          <div
            className="text-center py-16 px-6"
            style={{
              background: "var(--paper)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            <span className="mb-4 block" style={{ color: "var(--ink-strong)" }}><Icon name="palette" size={28} /></span>
            <h3 className="c-card-t" style={{ fontSize: 18, color: "var(--ink-strong)" }}>
              No murals found
            </h3>
            <p className="c-body mt-1" style={{ fontSize: 14, color: "var(--ink-strong)", opacity: 0.7 }}>
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
