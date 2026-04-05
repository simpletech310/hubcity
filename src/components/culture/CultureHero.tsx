import clsx from "clsx";

interface CultureHeroProps {
  title: string;
  subtitle?: string;
  gradient?: string;
  pattern?: boolean;
}

export default function CultureHero({
  title,
  subtitle,
  gradient = "art-mural",
  pattern = false,
}: CultureHeroProps) {
  return (
    <section
      className={clsx(
        "relative w-full overflow-hidden rounded-3xl",
        "py-16 md:py-24 px-6 md:px-12",
        gradient
      )}
    >
      {pattern && (
        <div className="pattern-dots absolute inset-0 opacity-20 pointer-events-none" />
      )}
      <div className="relative z-10 max-w-3xl">
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-text-primary leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 text-lg md:text-xl text-text-secondary max-w-xl">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
