import Icon from "@/components/ui/Icon";

export default function MuseumHero() {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Background with overlay */}
      <div className="relative min-h-[340px] flex flex-col justify-end">
        <div className="absolute inset-0 bg-gradient-to-b from-midnight/30 via-midnight/60 to-midnight" />
        <div className="absolute inset-0 pattern-dots opacity-10 pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 px-6 pb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gold/20 border border-gold/30 flex items-center justify-center">
              <span className="text-sm"><Icon name="landmark" size={14} /></span>
            </div>
            <span className="text-[11px] font-semibold text-gold uppercase tracking-widest">
              Est. Compton, CA
            </span>
          </div>
          <h1 className="font-display text-[32px] md:text-5xl leading-[1.1] text-white">
            The Compton
            <br />
            <span className="text-gold-gradient">Museum</span>
          </h1>
          <p className="mt-3 text-sm text-txt-secondary max-w-xs leading-relaxed">
            Preserving the past. Celebrating the present. Inspiring the future.
          </p>
        </div>
      </div>
    </section>
  );
}
