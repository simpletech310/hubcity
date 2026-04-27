import Image from "next/image";
import Link from "next/link";

interface CultureHeroProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  /** Optional kicker shown above the title — defaults to "§ CULTURE". */
  kicker?: string;
  /** Where the back chevron returns to. Defaults to /culture. Pass null to hide. */
  backHref?: string | null;
  /** Label next to the back chevron. */
  backLabel?: string;
}

/**
 * Editorial masthead for the /culture sub-pages. Mirrors the magazine-
 * cover treatment used on /jobs, /events, /home — full-bleed photo with
 * an ink wash, a § kicker, a c-hero display title with the . terminator,
 * and a Fraunces italic deck. A small ← BACK chip sits top-left so any
 * sub-page reads as a chapter inside the museum and the user can jump
 * back to the lobby in one tap.
 */
export default function CultureHero({
  title,
  subtitle,
  imageUrl,
  kicker = "§ CULTURE",
  backHref = "/culture",
  backLabel = "MUSEUM",
}: CultureHeroProps) {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
    >
      <div className="relative min-h-[280px] flex flex-col justify-end">
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
                  "linear-gradient(180deg, rgba(26,21,18,0.35) 0%, rgba(26,21,18,0.7) 60%, rgba(26,21,18,0.92) 100%)",
              }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: "var(--ink-strong)" }}
          />
        )}

        {/* Back chevron — top-left over the masthead */}
        {backHref && (
          <Link
            href={backHref}
            className="absolute top-3 left-3 z-20 inline-flex items-center gap-1.5 press"
            style={{
              padding: "6px 10px",
              background: "var(--gold-c)",
              color: "var(--ink-strong)",
              border: "2px solid var(--ink-strong)",
              fontFamily: "var(--font-archivo), Archivo, sans-serif",
              fontWeight: 800,
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              boxShadow: "0 2px 0 rgba(0,0,0,0.25)",
            }}
          >
            <span aria-hidden style={{ fontSize: 12, lineHeight: 1 }}>←</span>
            {backLabel}
          </Link>
        )}

        {/* Editorial content block */}
        <div className="relative z-10 px-5 pt-10 pb-6">
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
