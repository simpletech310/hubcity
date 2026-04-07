import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import type { NotablePerson, NotablePersonCategory } from "@/types/database";

const categoryBadge: Record<NotablePersonCategory, { label: string; variant: "gold" | "emerald" | "cyan" | "coral" | "purple" }> = {
  music: { label: "Music", variant: "gold" },
  sports: { label: "Sports", variant: "emerald" },
  politics: { label: "Politics", variant: "purple" },
  activism: { label: "Activism", variant: "coral" },
  arts: { label: "Arts", variant: "cyan" },
  business: { label: "Business", variant: "gold" },
  education: { label: "Education", variant: "emerald" },
  other: { label: "Notable", variant: "cyan" },
};

interface PersonCardProps {
  person: NotablePerson;
  compact?: boolean;
}

export default function PersonCard({ person, compact = false }: PersonCardProps) {
  const badge = categoryBadge[person.category] ?? { label: person.category, variant: "gold" as const };
  const lifespan = person.birth_year
    ? person.death_year
      ? `${person.birth_year} – ${person.death_year}`
      : `b. ${person.birth_year}`
    : null;

  // Compact mode: explorer grid tile — portrait fills card, name overlay at bottom
  if (compact) {
    return (
      <Link
        href={`/culture/people/${person.slug}`}
        className="group relative block aspect-square rounded-xl overflow-hidden"
      >
        {person.portrait_url ? (
          <img
            src={person.portrait_url}
            alt={person.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gold/5 to-purple-900/10 flex items-center justify-center">
            <Icon name="person" size={40} className="text-txt-secondary" />
          </div>
        )}
        {/* Bottom gradient + name */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-10 pb-2.5 px-2.5">
          <p className="font-heading font-bold text-xs text-white leading-tight group-hover:text-gold transition-colors">
            {person.name}
          </p>
        </div>
      </Link>
    );
  }

  // Default mode: full card with badge, title, lifespan
  return (
    <Link
      href={`/culture/people/${person.slug}`}
      className="group block rounded-2xl border border-border-subtle bg-white/[0.02] overflow-hidden card-glow transition-all duration-300 hover:border-gold/20"
    >
      {/* Portrait */}
      <div className="relative aspect-[3/4] bg-white/5">
        {person.portrait_url ? (
          <img
            src={person.portrait_url}
            alt={person.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gold/5 to-purple-900/10 flex items-center justify-center">
            <Icon name="person" size={40} className="text-txt-secondary" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-transparent to-transparent" />

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <Badge label={badge.label} variant={badge.variant} />
        </div>
      </div>

      {/* Info */}
      <div className="p-3 -mt-8 relative z-10">
        <h3 className="font-heading font-bold text-sm text-white group-hover:text-gold transition-colors">
          {person.name}
        </h3>
        {person.title && (
          <p className="text-[11px] text-txt-secondary mt-0.5">{person.title}</p>
        )}
        {lifespan && (
          <p className="text-[10px] text-txt-secondary mt-1">{lifespan}</p>
        )}
      </div>
    </Link>
  );
}
