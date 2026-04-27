import Image from "next/image";

interface CultureHeroProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  /** Optional kicker shown above the title — defaults to "§ CULTURE". */
  kicker?: string;
}

/**
 * Editorial masthead for the /culture sub-pages. Mirrors the magazine-
 * cover treatment used on /jobs, /events, /home — full-bleed photo with
 * an ink wash, a § kicker, a c-hero display title with the . terminator,
 * and a Fraunces italic deck. Replaces the legacy dark-themed hero that
 * used font-display + text-[28px] over a midnight gradient.
 */
export default function CultureHero({
  title,
  subtitle,
  imageUrl,
  kicker = "§ CULTURE",
}: CultureHeroProps) {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
    >
      <div className="relative min-h-[260px] flex flex-col justify-end">
        {/* Background image or paper-warm fallback */}
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
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(26,21,18,0.25) 0%, rgba(26,21,18,0.7) 70%, rgba(26,21,18,0.9) 100%)",
              }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: "var(--ink-strong)" }}
          />
        )}

        {/* Editorial content block */}
        <div className="relative z-10 px-5 pt-8 pb-6">
          <span
            className="c-kicker"
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              color: "var(--gold-c)",
              opacity: 0.95,
            }}
          >
            {kicker}
          </span>
          <h1
            className="c-hero mt-2"
            style={{
              fontSize: 44,
              lineHeight: 0.92,
              letterSpacing: "-0.018em",
              color: "#fff",
            }}
          >
            {title.toUpperCase()}.
          </h1>
          {subtitle && (
            <p
              className="c-serif-it mt-2 max-w-sm"
              style={{
                fontSize: 14,
                lineHeight: 1.45,
                color: "rgba(255,255,255,0.85)",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
