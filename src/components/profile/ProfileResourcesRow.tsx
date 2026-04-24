import Link from "next/link";
import Icon from "@/components/ui/Icon";

export interface ResourceTile {
  id: string;
  name: string;
  slug: string | null;
  category: string | null;
  status: "open" | "closed" | "upcoming" | "limited" | string;
  organization: string | null;
  image_url: string | null;
  max_spots: number | null;
  filled_spots: number;
}

interface ProfileResourcesRowProps {
  resources: ResourceTile[];
  /** Override the "See all" href (defaults to /resources). */
  seeAllHref?: string;
}

/**
 * Horizontal scroll rail of resources the profile owner provides.
 *
 * Capacity is surfaced as "X / Y spots" when max_spots is set, and the
 * status badge is derived from the combination of status + capacity:
 *  - "Waitlist" when filled_spots >= max_spots (but status is still open)
 *  - Otherwise, the explicit status string wins
 *
 * Mirrors the structural shape of ProfileProductsRow / ProfileDealsRow
 * so it slots into the editorial scroll without visual surprise.
 */
export default function ProfileResourcesRow({
  resources,
  seeAllHref = "/resources",
}: ProfileResourcesRowProps) {
  if (resources.length === 0) return null;

  return (
    <div>
      <div className="px-5 mb-3 flex items-center justify-between">
        <h2 className="font-heading font-semibold text-sm text-white/50 uppercase tracking-wider flex items-center gap-2">
          <Icon name="briefcase" size={16} className="text-cyan" /> Resources
        </h2>
        <Link
          href={seeAllHref}
          className="text-[11px] text-gold font-semibold press"
        >
          See all
        </Link>
      </div>

      <div className="-mx-5 px-5 overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 snap-x snap-mandatory pb-1">
          {resources.map((r) => {
            const href = `/resources/${r.slug || r.id}`;
            const statusMeta = resolveStatus(r);
            const capacity =
              r.max_spots != null && r.max_spots > 0
                ? `${r.filled_spots}/${r.max_spots} spots`
                : null;

            return (
              <Link
                key={r.id}
                href={href}
                className="snap-start shrink-0 w-[180px] group press"
              >
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-white/[0.05] border border-white/[0.05]">
                  {r.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.image_url}
                      alt={r.name}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-cyan/50 bg-gradient-to-br from-cyan/10 via-midnight to-midnight">
                      <Icon name="briefcase" size={28} />
                    </div>
                  )}

                  {/* Status chip (top-left) */}
                  <span
                    className={`absolute top-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[9px] font-bold uppercase tracking-[0.1em] backdrop-blur-sm ${statusMeta.classes}`}
                  >
                    <span
                      className={`w-1 h-1 rounded-full ${statusMeta.dotClass}`}
                    />
                    {statusMeta.label}
                  </span>
                </div>

                <div className="pt-2 px-0.5">
                  <p className="text-[13px] font-semibold text-white line-clamp-1">
                    {r.name}
                  </p>
                  {r.organization && (
                    <p className="text-[10px] text-white/50 line-clamp-1 mt-0.5">
                      {r.organization}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    {r.category && (
                      <span className="text-[10px] text-white/60 truncate">
                        {prettyCategory(r.category)}
                      </span>
                    )}
                    {capacity && (
                      <span className="text-[10px] text-cyan font-semibold tabular-nums shrink-0">
                        {capacity}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Derive the display status chip from the resource's explicit status +
 * its capacity. A resource that's technically "open" but full becomes
 * a "Waitlist" chip so applicants know what to expect.
 */
function resolveStatus(r: ResourceTile): {
  label: string;
  classes: string;
  dotClass: string;
} {
  const isFull =
    r.max_spots != null && r.max_spots > 0 && r.filled_spots >= r.max_spots;

  if (isFull && (r.status === "open" || r.status === "limited")) {
    return {
      label: "Waitlist",
      classes: "bg-gold/15 text-gold border border-gold/30",
      dotClass: "bg-gold",
    };
  }

  switch (r.status) {
    case "open":
      return {
        label: "Open",
        classes: "bg-emerald/15 text-emerald border border-emerald/30",
        dotClass: "bg-emerald",
      };
    case "limited":
      return {
        label: "Limited",
        classes: "bg-gold/15 text-gold border border-gold/30",
        dotClass: "bg-gold",
      };
    case "upcoming":
      return {
        label: "Upcoming",
        classes: "bg-cyan/15 text-cyan border border-cyan/30",
        dotClass: "bg-cyan",
      };
    case "closed":
    default:
      return {
        label: "Closed",
        classes: "bg-white/10 text-white/60 border border-white/15",
        dotClass: "bg-white/40",
      };
  }
}

function prettyCategory(c: string): string {
  return c.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}
