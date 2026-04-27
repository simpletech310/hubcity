import Link from "next/link";
import type { NotablePerson, NotablePersonCategory } from "@/types/database";

const CATEGORY_LABEL: Record<NotablePersonCategory, string> = {
  music: "MUSIC",
  sports: "SPORTS",
  politics: "POLITICS",
  activism: "ACTIVISM",
  arts: "ARTS",
  business: "BUISINESS",
  education: "EDUCATION",
  other: "NOTABLE",
};

interface PersonCardProps {
  person: NotablePerson;
  compact?: boolean;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Editorial Hub City PersonCard. Square ink-frame avatar with a gold
 * Anton-display initial when no portrait — replaces the legacy gray
 * gradient + Icon ghost that made every portrait-less person tile look
 * empty. Two modes:
 *   compact = true → 1:1 explorer-grid tile
 *   compact = false → 3:4 portrait card with name + title + lifespan
 *                     beneath in the standard editorial vocabulary.
 */
export default function PersonCard({ person, compact = false }: PersonCardProps) {
  const lifespan = person.birth_year
    ? person.death_year
      ? `${person.birth_year} – ${person.death_year}`
      : `b. ${person.birth_year}`
    : null;
  const label = CATEGORY_LABEL[person.category] ?? person.category.toUpperCase();

  // Compact mode — 1:1 tile for the explorer grid
  if (compact) {
    return (
      <Link
        href={`/culture/people/${person.slug}`}
        className="group relative block aspect-square overflow-hidden press"
        style={{
          background: "var(--ink-strong)",
          border: "2px solid var(--rule-strong-c)",
        }}
      >
        {person.portrait_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={person.portrait_url}
            alt={person.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              color: "var(--gold-c)",
              fontFamily: "var(--font-anton), Anton, sans-serif",
              fontSize: 56,
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            {initials(person.name)}
          </div>
        )}

        {/* Bottom ink wash + name */}
        <div
          className="absolute inset-x-0 bottom-0 px-2 pt-8 pb-2"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(26,21,18,0.85) 100%)",
          }}
        >
          <p
            className="c-card-t line-clamp-2"
            style={{
              fontSize: 11,
              lineHeight: 1.15,
              color: "var(--paper)",
              letterSpacing: "0.005em",
            }}
          >
            {person.name}
          </p>
        </div>
      </Link>
    );
  }

  // Default — 3:4 portrait card with editorial info block underneath
  return (
    <Link
      href={`/culture/people/${person.slug}`}
      className="group block press"
    >
      {/* Portrait frame */}
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: "3 / 4",
          background: "var(--ink-strong)",
          border: "2px solid var(--rule-strong-c)",
        }}
      >
        {person.portrait_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={person.portrait_url}
            alt={person.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              color: "var(--gold-c)",
              fontFamily: "var(--font-anton), Anton, sans-serif",
              fontSize: 84,
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            {initials(person.name)}
          </div>
        )}

        <span className="absolute top-2 left-2 c-badge c-badge-gold" style={{ fontSize: 9 }}>
          § {label}
        </span>
      </div>

      {/* Info block underneath the portrait — editorial paper card */}
      <div
        className="px-3 py-3"
        style={{
          background: "var(--paper-warm)",
          border: "2px solid var(--rule-strong-c)",
          borderTop: "none",
        }}
      >
        <h3
          className="c-card-t line-clamp-1"
          style={{
            fontSize: 14,
            lineHeight: 1.15,
            color: "var(--ink-strong)",
          }}
        >
          {person.name}
        </h3>
        {person.title && (
          <p
            className="c-meta line-clamp-1 mt-1"
            style={{
              fontSize: 11,
              color: "var(--ink-strong)",
              opacity: 0.75,
              textTransform: "none",
            }}
          >
            {person.title}
          </p>
        )}
        {lifespan && (
          <p
            className="c-kicker mt-1 tabular-nums"
            style={{
              fontSize: 9,
              letterSpacing: "0.14em",
              color: "var(--ink-strong)",
              opacity: 0.55,
            }}
          >
            {lifespan}
          </p>
        )}
      </div>
    </Link>
  );
}
