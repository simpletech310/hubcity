import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

export const metadata = {
  title: "Park Programs | Culture",
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
    <div className="culture-surface min-h-screen pb-28">
      {/* Masthead */}
      <header
        className="px-[18px] pt-5 pb-4"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <Link
          href="/parks"
          className="c-kicker inline-flex items-center gap-1.5 mb-3 press"
          style={{ color: "var(--ink-strong)", opacity: 0.65 }}
        >
          <Icon name="back" size={14} />
          § BACK TO PARKS
        </Link>
        <h1 className="c-hero" style={{ fontSize: 48, lineHeight: 0.88, letterSpacing: "-0.02em" }}>
          Programs.
        </h1>
        <p className="c-serif-it mt-2">Free recreation &amp; enrichment for all ages.</p>
      </header>

      <div className="px-5 space-y-5 mt-5">
        {/* Park Filter */}
        <div className="c-noscroll flex gap-1.5 overflow-x-auto pb-1">
          <a
            href="/parks/programs"
            className={`c-chip${!params.park ? " gold" : ""}`}
          >
            All Parks
          </a>
          {(parks ?? []).map((park) => (
            <a
              key={park.id}
              href={`/parks/programs?park=${park.id}`}
              className={`c-chip${params.park === park.id ? " gold" : ""}`}
            >
              {park.name.replace(" Park & Community Center", "").replace(" Park", "")}
            </a>
          ))}
        </div>

        {/* Programs count */}
        <p className="c-meta">
          {programsList.length} program{programsList.length !== 1 ? "s" : ""} available
        </p>

        {/* Programs List */}
        {programsList.length > 0 ? (
          <div className="space-y-3">
            {programsList.map((program) => {
              const parkData = program.parks as { id: string; name: string; slug: string } | null;
              return (
                <div
                  key={program.id}
                  className="p-4"
                  style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 flex items-center justify-center shrink-0"
                      style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
                    >
                      <Icon name="star" size={18} style={{ color: "var(--ink-strong)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="c-card-t" style={{ fontSize: 14, color: "var(--ink-strong)" }}>{program.name}</h3>
                      {parkData && (
                        <Link href={`/parks/${parkData.slug || parkData.id}`} className="c-kicker press" style={{ color: "var(--ink-strong)" }}>
                          {parkData.name}
                        </Link>
                      )}
                      {program.description && (
                        <p className="c-body mt-1.5">{program.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                        {program.schedule && (
                          <span className="c-badge-ink inline-flex items-center gap-1 px-2 py-0.5">
                            <Icon name="clock" size={9} />
                            {program.schedule}
                          </span>
                        )}
                        {program.age_range && (
                          <span className="c-badge-ink inline-flex px-2 py-0.5">
                            Ages {program.age_range}
                          </span>
                        )}
                        {program.fee && (
                          <span className="c-badge-ok inline-flex px-2 py-0.5">
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
          <div
            className="text-center py-12"
            style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
          >
            <div
              className="w-12 h-12 flex items-center justify-center mx-auto mb-3"
              style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
            >
              <Icon name="calendar" size={24} style={{ color: "var(--ink-strong)" }} />
            </div>
            <p className="c-card-t" style={{ color: "var(--ink-strong)" }}>No programs found</p>
            <p className="c-meta mt-1">Try selecting a different park.</p>
          </div>
        )}

        {/* Info footer */}
        <div
          className="p-4 text-center"
          style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
        >
          <p className="c-body">
            All programs are free for Compton residents. Registration may be required for some programs.
            Contact Parks &amp; Recreation at <a href="tel:3106055080" className="press" style={{ color: "var(--ink-strong)", textDecoration: "underline" }}>(310) 605-5080</a> for details.
          </p>
        </div>
      </div>
    </div>
  );
}
