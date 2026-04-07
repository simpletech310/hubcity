import { createClient } from "@/lib/supabase/server";
import CultureHero from "@/components/culture/CultureHero";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";

export const metadata = {
  title: "Park Programs | Hub City",
  description: "Recreation programs across Compton parks.",
};

export default async function ParkProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ park?: string; age?: string; type?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("park_programs")
    .select("*, parks!park_programs_park_id_fkey(id, name, slug)")
    .eq("is_active", true)
    .order("name");

  if (params.park) {
    query = query.eq("park_id", params.park);
  }
  if (params.age) {
    query = query.ilike("age_range", `%${params.age}%`);
  }
  if (params.type) {
    query = query.eq("type", params.type);
  }

  const { data: programs } = await query;
  const programsList = programs ?? [];

  // Get unique parks for filter
  const { data: parks } = await supabase
    .from("parks")
    .select("id, name")
    .order("name");

  const AGE_FILTERS = ["Youth", "Teen", "Adult", "Senior", "All Ages"];
  const TYPE_FILTERS = ["Sports", "Arts", "Education", "Fitness", "Camp"];

  return (
    <div className="space-y-8 pb-20">
      <CultureHero
        title="Park Programs"
        subtitle="Recreation and enrichment programs across Compton."
        gradient="bg-gradient-to-br from-emerald-900/60 via-black to-gold/10"
      />

      {/* Filters */}
      <div className="px-5 space-y-3">
        {/* Park filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <a
            href="/parks/programs"
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              !params.park
                ? "bg-emerald-500 text-black border-emerald-500"
                : "bg-white/5 text-text-secondary border-border-subtle hover:border-emerald-500/30"
            }`}
          >
            All Parks
          </a>
          {(parks ?? []).map((park) => (
            <a
              key={park.id}
              href={`/parks/programs?park=${park.id}`}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                params.park === park.id
                  ? "bg-emerald-500 text-black border-emerald-500"
                  : "bg-white/5 text-text-secondary border-border-subtle hover:border-emerald-500/30"
              }`}
            >
              {park.name}
            </a>
          ))}
        </div>

        {/* Age filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {AGE_FILTERS.map((age) => (
            <a
              key={age}
              href={`/parks/programs?age=${encodeURIComponent(age)}${params.park ? `&park=${params.park}` : ""}`}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                params.age === age
                  ? "bg-gold text-black border-gold"
                  : "bg-white/5 text-text-secondary border-border-subtle hover:border-gold/30"
              }`}
            >
              {age}
            </a>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TYPE_FILTERS.map((type) => (
            <a
              key={type}
              href={`/parks/programs?type=${encodeURIComponent(type)}${params.park ? `&park=${params.park}` : ""}`}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                params.type === type
                  ? "bg-purple-500 text-white border-purple-500"
                  : "bg-white/5 text-text-secondary border-border-subtle hover:border-purple-500/30"
              }`}
            >
              {type}
            </a>
          ))}
        </div>
      </div>

      {/* Programs List */}
      <div className="px-5">
        {programsList.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {programsList.map((program) => (
              <Card key={program.id} hover padding>
                <h3 className="font-heading font-bold text-text-primary">
                  {program.name}
                </h3>
                {program.parks && (
                  <p className="text-xs text-gold mt-1">
                    {(program.parks as { name: string }).name}
                  </p>
                )}
                {program.description && (
                  <p className="text-sm text-text-secondary mt-2 line-clamp-2">
                    {program.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-3 text-xs">
                  {program.schedule && (
                    <span className="text-warm-gray">{program.schedule}</span>
                  )}
                  {program.age_range && (
                    <span className="px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20">
                      {program.age_range}
                    </span>
                  )}
                  {program.fee && (
                    <span className="text-emerald-400 font-semibold">
                      {program.fee}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <span className="text-4xl mb-4 block"><Icon name="document" size={28} /></span>
            <h3 className="font-heading font-bold text-text-primary text-lg">
              No programs found
            </h3>
            <p className="text-text-secondary text-sm mt-1">
              Try adjusting your filters or check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
