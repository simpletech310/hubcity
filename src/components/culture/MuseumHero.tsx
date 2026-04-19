import Icon, { type IconName } from "@/components/ui/Icon";

export type MuseumHeroStat = {
  icon: string;
  count: string;
  label: string;
};

export type MuseumHeroProps = {
  /** Organization name shown in the hero title. Split display uses orgNameAccent for the gold-gradient second line. */
  orgName?: string;
  /** Second line of the title, rendered in gold gradient. */
  orgNameAccent?: string;
  /** Short description under the title. */
  tagline?: string;
  /** City / kicker label above the title (e.g. "Est. 2023 · Compton, CA"). */
  kicker?: string;
  /** Small header icon (from @/components/ui/Icon). Defaults to "landmark". */
  kickerIcon?: string;
  /** Stats row. Defaults to the Compton Museum stats for backward compatibility. */
  stats?: MuseumHeroStat[];
};

const DEFAULT_STATS: MuseumHeroStat[] = [
  { icon: "palette", count: "9+", label: "Exhibitions" },
  { icon: "person", count: "60+", label: "Local Artists" },
  { icon: "users", count: "4,000+", label: "Visitors" },
];

export default function MuseumHero({
  orgName = "Compton Art &",
  orgNameAccent = "History Museum",
  tagline = "A groundbreaking space bringing together art, history, and community. Amplifying the culture of Compton and greater South Los Angeles.",
  kicker = "Est. 2023 · Compton, CA",
  kickerIcon = "landmark",
  stats = DEFAULT_STATS,
}: MuseumHeroProps = {}) {
  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative min-h-[320px] flex flex-col justify-end">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1510] via-[#12100a] to-midnight" />
        <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.04] via-transparent to-transparent" />
        <div className="absolute inset-0 pattern-dots opacity-10 pointer-events-none" />

        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

        <div className="relative z-10 px-6 pb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/25 flex items-center justify-center">
              <Icon name={kickerIcon as IconName} size={14} className="text-gold" />
            </div>
            <span className="text-[11px] font-semibold text-gold uppercase tracking-widest">
              {kicker}
            </span>
          </div>
          <h1 className="font-display text-[32px] md:text-5xl leading-[1.1] text-white">
            {orgName}
            <br />
            <span className="text-gold-gradient">{orgNameAccent}</span>
          </h1>
          <p className="mt-3 text-sm text-txt-secondary max-w-xs leading-relaxed">
            {tagline}
          </p>

          {stats.length > 0 && (
            <div className="flex items-center gap-4 mt-4">
              {stats.map((s) => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-gold/10 border border-gold/15 flex items-center justify-center">
                    <Icon name={s.icon as IconName} size={10} className="text-gold" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-white tabular-nums">{s.count}</p>
                    <p className="text-[8px] text-white/30 uppercase tracking-wider">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
