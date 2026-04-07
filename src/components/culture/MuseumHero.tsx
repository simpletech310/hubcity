import Icon from "@/components/ui/Icon";

export default function MuseumHero() {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Background with gold-accented dark overlay */}
      <div className="relative min-h-[320px] flex flex-col justify-end">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1510] via-[#12100a] to-midnight" />
        <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.04] via-transparent to-transparent" />
        <div className="absolute inset-0 pattern-dots opacity-10 pointer-events-none" />

        {/* Decorative gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

        {/* Content */}
        <div className="relative z-10 px-6 pb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/25 flex items-center justify-center">
              <Icon name="landmark" size={14} className="text-gold" />
            </div>
            <span className="text-[11px] font-semibold text-gold uppercase tracking-widest">
              Est. 2023 &middot; Compton, CA
            </span>
          </div>
          <h1 className="font-display text-[32px] md:text-5xl leading-[1.1] text-white">
            Compton Art &
            <br />
            <span className="text-gold-gradient">History Museum</span>
          </h1>
          <p className="mt-3 text-sm text-txt-secondary max-w-xs leading-relaxed">
            A groundbreaking space bringing together art, history, and community. Amplifying the culture of Compton and greater South Los Angeles.
          </p>

          {/* Museum stats */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-gold/10 border border-gold/15 flex items-center justify-center">
                <Icon name="palette" size={10} className="text-gold" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-white tabular-nums">9+</p>
                <p className="text-[8px] text-white/30 uppercase tracking-wider">Exhibitions</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-gold/10 border border-gold/15 flex items-center justify-center">
                <Icon name="person" size={10} className="text-gold" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-white tabular-nums">60+</p>
                <p className="text-[8px] text-white/30 uppercase tracking-wider">Local Artists</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-gold/10 border border-gold/15 flex items-center justify-center">
                <Icon name="users" size={10} className="text-gold" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-white tabular-nums">4,000+</p>
                <p className="text-[8px] text-white/30 uppercase tracking-wider">Visitors</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
