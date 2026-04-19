import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { listKnownCities } from "@/lib/cities";
import { SITE_NAME } from "@/lib/branding";

export const metadata = { title: "Choose your city" };

export default async function ChooseCityPage() {
  const cities = await listKnownCities();
  const live = cities.filter((c) => c.launch_status === "live");
  const comingSoon = cities.filter((c) => c.launch_status === "coming_soon");

  return (
    <main className="min-h-screen bg-midnight text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1510] via-[#12100a] to-midnight" />
        <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.06] via-transparent to-transparent" />
        <div className="absolute inset-0 pattern-dots opacity-10 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

        <div className="relative z-10 px-6 py-12 max-w-2xl mx-auto">
          <p className="text-[11px] font-semibold text-gold uppercase tracking-widest mb-3">
            Pick a city to explore
          </p>
          <h1 className="font-display text-4xl md:text-5xl leading-[1.05]">
            Where are we <span className="text-gold-gradient">connecting</span>?
          </h1>
          <p className="mt-4 text-sm text-txt-secondary max-w-prose">
            {SITE_NAME} is a marketplace for the culture, small businesses, and
            everyday life of your city. Pick one to browse — events, food,
            jobs, resources, and more. Verify your address later to unlock
            district programs, council updates, and resident-only features.
          </p>
        </div>
      </section>

      <section className="px-6 py-8 max-w-2xl mx-auto">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-3">
          Live now
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {live.map((c) => (
            <Link
              key={c.id}
              href={`/c/${c.slug}`}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] hover:border-gold/40 hover:bg-white/[0.04] p-5 transition"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="font-display text-xl">{c.name}</p>
                  <p className="text-[11px] text-white/40 mt-0.5">
                    {c.state} · {c.default_zip_codes.length} ZIP{c.default_zip_codes.length === 1 ? "" : "s"}
                  </p>
                </div>
                <Icon name="forward" size={16} className="text-gold" />
              </div>
            </Link>
          ))}
        </div>

        {comingSoon.length > 0 && (
          <>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white/60 mt-8 mb-3">
              Coming soon
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {comingSoon.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-white/5 bg-white/[0.01] p-5 opacity-60"
                >
                  <p className="font-display text-xl">{c.name}</p>
                  <p className="text-[11px] text-white/40 mt-0.5">
                    {c.state} · launching soon
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
