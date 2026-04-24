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
  seeAllHref?: string;
}

export default function ProfileResourcesRow({
  resources,
  seeAllHref = "/resources",
}: ProfileResourcesRowProps) {
  if (resources.length === 0) return null;

  return (
    <div>
      <div
        className="px-5 mb-3 flex items-end justify-between pb-2"
        style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
      >
        <div className="c-kicker" style={{ color: "var(--ink-mute)" }}>
          § RESOURCES
        </div>
        <Link
          href={seeAllHref}
          className="c-kicker press"
          style={{ color: "var(--ink-strong)" }}
        >
          SEE ALL →
        </Link>
      </div>

      <div className="-mx-5 px-5 overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 snap-x snap-mandatory pb-1">
          {resources.map((r) => {
            const href = `/resources/${r.slug || r.id}`;
            const statusMeta = resolveStatus(r);
            const capacity =
              r.max_spots != null && r.max_spots > 0
                ? `${r.filled_spots}/${r.max_spots} SPOTS`
                : null;

            return (
              <Link
                key={r.id}
                href={href}
                className="snap-start shrink-0 w-[180px] group press block"
              >
                <div
                  className="relative aspect-[4/3] c-frame overflow-hidden"
                  style={{ background: "var(--paper)" }}
                >
                  {r.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.image_url}
                      alt={r.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        background: "var(--ink-strong)",
                        color: "var(--gold-c)",
                      }}
                    >
                      <Icon name="briefcase" size={28} />
                    </div>
                  )}

                  <span
                    className="c-kicker absolute top-1 left-1"
                    style={{
                      background: statusMeta.bg,
                      color: statusMeta.fg,
                      padding: "2px 6px",
                      fontSize: 9,
                    }}
                  >
                    {statusMeta.label}
                  </span>
                </div>

                <div className="pt-2">
                  <p
                    className="c-card-t line-clamp-1"
                    style={{ fontSize: 14 }}
                  >
                    {r.name}
                  </p>
                  {r.organization && (
                    <p
                      className="c-kicker line-clamp-1 mt-0.5"
                      style={{ fontSize: 9, color: "var(--ink-mute)" }}
                    >
                      {r.organization}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    {r.category && (
                      <span
                        className="c-meta truncate"
                        style={{ color: "var(--ink-soft)" }}
                      >
                        {prettyCategory(r.category).toUpperCase()}
                      </span>
                    )}
                    {capacity && (
                      <span
                        className="c-meta c-tabnum shrink-0"
                        style={{ color: "var(--ink-strong)", fontWeight: 700 }}
                      >
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

function resolveStatus(r: ResourceTile): {
  label: string;
  bg: string;
  fg: string;
} {
  const isFull =
    r.max_spots != null && r.max_spots > 0 && r.filled_spots >= r.max_spots;

  if (isFull && (r.status === "open" || r.status === "limited")) {
    return {
      label: "WAITLIST",
      bg: "var(--gold-c)",
      fg: "var(--ink-strong)",
    };
  }

  switch (r.status) {
    case "open":
      return {
        label: "OPEN",
        bg: "var(--ink-strong)",
        fg: "var(--gold-c)",
      };
    case "limited":
      return {
        label: "LIMITED",
        bg: "var(--gold-c)",
        fg: "var(--ink-strong)",
      };
    case "upcoming":
      return {
        label: "UPCOMING",
        bg: "var(--paper)",
        fg: "var(--ink-strong)",
      };
    case "closed":
    default:
      return {
        label: "CLOSED",
        bg: "var(--paper)",
        fg: "var(--ink-mute)",
      };
  }
}

function prettyCategory(c: string): string {
  return c.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}
