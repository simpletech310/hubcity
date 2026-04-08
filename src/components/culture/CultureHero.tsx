import Image from "next/image";

interface CultureHeroProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  gradient?: string;
  pattern?: boolean;
}

export default function CultureHero({
  title,
  subtitle,
  imageUrl,
  gradient,
  pattern = false,
}: CultureHeroProps) {
  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative min-h-[220px] flex flex-col justify-end">
        {/* Background image or gradient */}
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="430px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/60 to-midnight/20" />
          </>
        ) : (
          <div className={`absolute inset-0 ${gradient || "bg-gradient-to-b from-[#1a1510] via-[#12100a] to-midnight"}`} />
        )}

        {/* Subtle pattern overlay */}
        {(pattern || !imageUrl) && (
          <div className="absolute inset-0 pattern-dots opacity-5 pointer-events-none" />
        )}

        {/* Content */}
        <div className="relative z-10 px-5 pb-5">
          <h1 className="font-display text-[28px] leading-tight text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-white/60 max-w-xs leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
