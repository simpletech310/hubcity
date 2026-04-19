import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

export const metadata = {
  title: "Park Programs | Knect",
  description: "Free recreation programs across Compton parks.",
};

export default async function ParkProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ park?: string }>;
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

  const [{ data: programs }, { data: parks }] = await Promise.all([
    query,
    supabase.from("parks").select("id, name").order("name"),
  ]);

  const programsList = programs ?? [];

  return (
    <div className="min-h-screen bg-midnight text-white pb-28">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/8 via-midnight to-midnight" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gold/5 blur-3xl" />
        <div className="relative z-10 px-5 pt-6 pb-4">
          <Link href="/parks" className="inline-flex items-center gap-1.5 text-[12px] text-white/40 mb-3 press">
            <Icon name="back" size={14} className="text-white/40" />
            Parks & Recreation
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center">
              <Icon name="calendar" size={18} className="text-gold" />
            </div>
            <h1 className="font-heading text-[20px] font-bold text-white">Community Programs</h1>
          </div>
          <p className="text-[12px] text-white/40 ml-10">Free recreation & enrichment for all ages</p>
        </div>
      </div>

      <div className="px-5 space-y-5">
        {/* Park Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <a
            href="/parks/programs"
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-semibold transition-colors border ${
              !params.park
                ? "bg-emerald text-black border-emerald"
                : "bg-white/[0.04] text-white/50 border-white/[0.08] hover:border-emerald/30"
            }`}
          >
            All Parks
          </a>
          {(parks ?? []).map((park) => (
            <a
              key={park.id}
              href={`/parks/programs?park=${park.id}`}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-semibold transition-colors border ${
                params.park === park.id
                  ? "bg-emerald text-black border-emerald"
                  : "bg-white/[0.04] text-white/50 border-white/[0.08] hover:border-emerald/30"
              }`}
            >
              {park.name.replace(" Park & Community Center", "").replace(" Park", "")}
            </a>
          ))}
        </div>

        {/* Programs count */}
        <p className="text-[11px] text-white/30">
          {programsList.length} program{programsList.length !== 1 ? "s" : ""} available
        </p>

        {/* Programs List */}
        {programsList.length > 0 ? (
          <div className="space-y-3">
            {programsList.map((program) => {
              const parkData = program.parks as { id: string; name: string; slug: string } | null;
              return (
                <div key={program.id} className="glass-card-elevated rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                      <Icon name="star" size={18} className="text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14px] font-semibold text-white">{program.name}</h3>
                      {parkData && (
                        <Link href={`/parks/${parkData.slug || parkData.id}`} className="text-[11px] text-emerald font-medium press">
                          {parkData.name}
                        </Link>
                      )}
                      {program.description && (
                        <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed">{program.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                        {program.schedule && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-cyan bg-cyan/10 rounded-full px-2 py-0.5">
                            <Icon name="clock" size={9} className="text-cyan" />
                            {program.schedule}
                          </span>
                        )}
                        {program.age_range && (
                          <span className="text-[10px] text-hc-purple bg-hc-purple/10 rounded-full px-2 py-0.5">
                            Ages {program.age_range}
                          </span>
                        )}
                        {program.fee && (
                          <span className="text-[10px] text-emerald font-semibold bg-emerald/10 rounded-full px-2 py-0.5">
                            {program.fee}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
              <Icon name="calendar" size={24} className="text-white/20" />
            </div>
            <p className="text-[13px] font-semibold text-white/50">No programs found</p>
            <p className="text-[11px] text-white/30 mt-1">Try selecting a different park.</p>
          </div>
        )}

        {/* Info footer */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-4 text-center">
          <p className="text-[11px] text-white/30 leading-relaxed">
            All programs are free for Compton residents. Registration may be required for some programs.
            Contact Parks & Recreation at <a href="tel:3106055080" className="text-gold press">(310) 605-5080</a> for details.
          </p>
        </div>
      </div>
    </div>
  );
}
