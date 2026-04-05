import { createClient } from "@/lib/supabase/server";
import CultureHero from "@/components/culture/CultureHero";
import ParkCard from "@/components/parks/ParkCard";
import Link from "next/link";

export const metadata = {
  title: "Parks & Recreation | Hub City",
  description: "Explore Compton's parks, playgrounds, and recreation facilities.",
};

const AMENITY_FILTERS = [
  { key: "playground", label: "Playground", icon: "🛝" },
  { key: "basketball", label: "Basketball", icon: "🏀" },
  { key: "bbq", label: "BBQ", icon: "🔥" },
  { key: "restrooms", label: "Restrooms", icon: "🚻" },
  { key: "pool", label: "Pool", icon: "🏊" },
  { key: "tennis", label: "Tennis", icon: "🎾" },
  { key: "soccer", label: "Soccer", icon: "⚽" },
  { key: "skatepark", label: "Skatepark", icon: "🛹" },
];

export default async function ParksPage({
  searchParams,
}: {
  searchParams: Promise<{ amenity?: string }>;
}) {
  const params = await searchParams;
  const activeAmenity = params.amenity || null;
  const supabase = await createClient();

  let query = supabase.from("parks").select("*").order("name");

  if (activeAmenity) {
    query = query.contains("amenities", [activeAmenity]);
  }

  const { data: parks } = await query;
  const parksList = parks ?? [];

  return (
    <div className="space-y-8 pb-20">
      <CultureHero
        title="Parks & Recreation"
        subtitle="Green spaces and facilities across Compton."
        gradient="bg-gradient-to-br from-emerald-900/60 via-black to-emerald-600/10"
      />

      {/* Actions bar */}
      <div className="px-5 flex items-center justify-between">
        <Link
          href="/parks/programs"
          className="text-sm font-semibold text-gold hover:text-gold/80 transition-colors"
        >
          View Programs &rarr;
        </Link>
        <Link
          href="/map?layer=parks"
          className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          View on Map
        </Link>
      </div>

      {/* Amenity Filters */}
      <div className="px-5">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <a
            href="/parks"
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              !activeAmenity
                ? "bg-emerald-500 text-black border-emerald-500"
                : "bg-white/5 text-text-secondary border-border-subtle hover:border-emerald-500/30"
            }`}
          >
            All Parks
          </a>
          {AMENITY_FILTERS.map((f) => (
            <a
              key={f.key}
              href={`/parks?amenity=${f.key}`}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border flex items-center gap-1.5 ${
                activeAmenity === f.key
                  ? "bg-emerald-500 text-black border-emerald-500"
                  : "bg-white/5 text-text-secondary border-border-subtle hover:border-emerald-500/30"
              }`}
            >
              <span>{f.icon}</span>
              {f.label}
            </a>
          ))}
        </div>
      </div>

      {/* Parks Grid */}
      <div className="px-5">
        {parksList.length > 0 ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {parksList.map((park) => (
              <ParkCard key={park.id} park={park} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <span className="text-4xl mb-4 block">🌳</span>
            <h3 className="font-heading font-bold text-text-primary text-lg">
              No parks found
            </h3>
            <p className="text-text-secondary text-sm mt-1">
              {activeAmenity
                ? `No parks with ${activeAmenity} found.`
                : "Parks will appear here as they are added."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
