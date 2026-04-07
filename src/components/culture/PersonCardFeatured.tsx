import Link from "next/link";
import Badge from "@/components/ui/Badge";
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

interface Props {
  person: NotablePerson;
}

export default function PersonCardFeatured({ person }: Props) {
  const badge = categoryBadge[person.category] ?? { label: person.category, variant: "gold" as const };
  const achievements = (person.notable_achievements ?? []) as string[];

  return (
    <Link
      href={`/culture/people/${person.slug}`}
      className="group flex rounded-2xl border border-border-subtle bg-white/[0.02] overflow-hidden card-glow transition-all duration-300 hover:border-gold/20 hover:shadow-[0_0_20px_rgba(242,169,0,0.08)]"
    >
      {/* Image */}
      <div className="relative w-[40%] shrink-0 bg-white/5">
        {person.portrait_url ? (
          <img
            src={person.portrait_url}
            alt={person.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gold/5 to-purple-900/10 flex items-center justify-center aspect-[3/4]">
            <span className="text-4xl">👤</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
        <div className="mb-2">
          <Badge label={badge.label} variant={badge.variant} />
        </div>
        <h3 className="font-display text-xl text-white leading-tight group-hover:text-gold transition-colors duration-300">
          {person.name}
        </h3>
        {person.title && (
          <p className="text-xs text-txt-secondary mt-1">{person.title}</p>
        )}
        {person.bio && (
          <p className="text-xs text-txt-secondary mt-2 line-clamp-2 leading-relaxed">{person.bio}</p>
        )}
        {achievements.length > 0 && (
          <div className="flex items-start gap-1.5 mt-2">
            <span className="text-gold text-[10px] mt-0.5">&#9733;</span>
            <p className="text-[11px] text-white/70 line-clamp-1">{achievements[0]}</p>
          </div>
        )}
      </div>
    </Link>
  );
}
