import Link from "next/link";
import Icon from "@/components/ui/Icon";

export interface PodcastShelfShow {
  show_slug: string;
  show_title: string;
  show_description: string | null;
  cover_url: string | null;
  episode_count: number;
  latest_episode_at: string | null;
}

interface Props {
  shows: PodcastShelfShow[];
  /** Where to link when there's no podcast page yet — defaults to /frequency/podcast/<slug>. */
  hrefBase?: string;
}

function formatLatest(d?: string | null): string | null {
  if (!d) return null;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/**
 * Square cover-art grid for a creator's podcast shows. Mirrors
 * `<ProfileMusicShelf>` shape: each tile is a Link into the
 * /frequency/podcast/[slug] detail page.
 *
 * Server-side renderable. Hidden when no shows.
 */
export default function ProfilePodcastShelf({
  shows,
  hrefBase = "/frequency/podcast",
}: Props) {
  if (!shows || shows.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {shows.map((s) => {
        const meta = [
          `${s.episode_count} EP${s.episode_count === 1 ? "" : "S"}`,
          formatLatest(s.latest_episode_at),
        ]
          .filter(Boolean)
          .join(" · ");
        return (
          <Link
            key={s.show_slug}
            href={`${hrefBase}/${s.show_slug}`}
            className="block press"
          >
            <div
              className="relative overflow-hidden"
              style={{
                aspectRatio: "1/1",
                background: "var(--ink-strong)",
                border: "2px solid var(--rule-strong-c)",
              }}
            >
              {s.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.cover_url}
                  alt={s.show_title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ color: "var(--gold-c)" }}
                >
                  <Icon name="podcast" size={28} />
                </div>
              )}
              <span
                className="absolute top-1.5 left-1.5 c-kicker"
                style={{
                  fontSize: 8,
                  letterSpacing: "0.14em",
                  background: "rgba(0,0,0,0.55)",
                  color: "#fff",
                  padding: "2px 5px",
                  border: "1px solid rgba(255,255,255,0.18)",
                }}
              >
                PODCAST
              </span>
            </div>
            <p
              className="c-card-t mt-2 line-clamp-1"
              style={{ fontSize: 13, color: "var(--ink-strong)" }}
            >
              {s.show_title}
            </p>
            {meta && (
              <p
                className="c-meta mt-0.5 line-clamp-1"
                style={{
                  fontSize: 11,
                  color: "var(--ink-strong)",
                  opacity: 0.65,
                }}
              >
                {meta}
              </p>
            )}
          </Link>
        );
      })}
    </div>
  );
}
