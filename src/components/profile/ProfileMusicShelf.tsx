import Link from "next/link";
import Icon from "@/components/ui/Icon";

export interface MusicShelfAlbum {
  id: string;
  slug: string;
  title: string;
  cover_art_url: string | null;
  release_type?: string | null;
  release_date?: string | null;
  track_count?: number | null;
}

interface Props {
  albums: MusicShelfAlbum[];
  /** Where to link when there's no album page yet — defaults to the album slug. */
  hrefBase?: string;
}

const TYPE_LABEL: Record<string, string> = {
  single: "Single",
  ep: "EP",
  album: "Album",
  mixtape: "Mixtape",
};

function formatYear(d?: string | null): string | null {
  if (!d) return null;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  return String(date.getFullYear());
}

/**
 * Square cover-art grid for a creator's albums / EPs / singles.
 * Server-side renderable. Each tile links to the album page.
 */
export default function ProfileMusicShelf({ albums, hrefBase = "/frequency/album" }: Props) {
  if (!albums || albums.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {albums.map((a) => {
        const year = formatYear(a.release_date);
        const typeLabel = a.release_type ? TYPE_LABEL[a.release_type] ?? a.release_type : null;
        const meta = [typeLabel, year].filter(Boolean).join(" · ");
        return (
          <Link
            key={a.id}
            href={`${hrefBase}/${a.slug}`}
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
              {a.cover_art_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.cover_art_url}
                  alt={a.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ color: "var(--gold-c)" }}
                >
                  <Icon name="music" size={28} />
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
                {(typeLabel ?? "MUSIC").toUpperCase()}
              </span>
            </div>
            <p
              className="c-card-t mt-2 line-clamp-1"
              style={{ fontSize: 13, color: "var(--ink-strong)" }}
            >
              {a.title}
            </p>
            {meta && (
              <p
                className="c-meta mt-0.5 line-clamp-1"
                style={{ fontSize: 11, color: "var(--ink-strong)", opacity: 0.65 }}
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
