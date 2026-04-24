import Link from "next/link";
import Icon from "@/components/ui/Icon";

// ─────────────────────────────────────────────────────────
// TrendingStrip — horizontal scroll rail of trending reels + events
// Culture blockprint: 2px ink frames, hard corners, printed labels.
// Server component.
// ─────────────────────────────────────────────────────────

export type TrendingReel = {
  id: string;
  caption: string | null;
  poster_url: string | null;
  like_count: number | null;
  created_at: string;
  author: {
    display_name: string | null;
    handle: string | null;
  } | null;
};

export type TrendingEvent = {
  id: string;
  title: string;
  cover_image_url: string | null;
  starts_at: string | null;
  city_id: string | null;
  cities: { name: string } | null;
};

interface TrendingStripProps {
  reels: TrendingReel[];
  events: TrendingEvent[];
}

function formatEventDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
}

export default function TrendingStrip({ reels, events }: TrendingStripProps) {
  if (reels.length === 0 && events.length === 0) return null;

  return (
    <section>
      {/* Header row — DM Mono kicker on paper with a bottom ink rule */}
      <div
        className="flex items-center justify-between px-[18px] pb-2"
        style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
      >
        <span className="c-kicker" style={{ opacity: 0.7 }}>
          § TRENDING NOW
        </span>
        <Link
          href="/reels"
          className="c-kicker inline-flex items-center gap-1"
          style={{ color: "var(--gold-c)" }}
        >
          <Icon name="trending" size={10} />
          WHAT&rsquo;S HOT ↗
        </Link>
      </div>

      {/* Horizontal scroll container */}
      <div
        className="flex overflow-x-auto scrollbar-hide px-[18px] py-3"
        style={{ gap: 10 }}
      >
        {/* Reel cards (104 px wide, 9/16 aspect) */}
        {reels.map((reel) => (
          <Link
            key={`reel-${reel.id}`}
            href={`/reels/${reel.id}`}
            className="shrink-0 press"
            style={{ width: 104 }}
          >
            <div
              className="relative overflow-hidden"
              style={{
                aspectRatio: "9/16",
                border: "2px solid var(--rule-strong-c)",
                background: "var(--ink-strong)",
              }}
            >
              {reel.poster_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={reel.poster_url}
                  alt={reel.caption ?? "Reel"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: "var(--ink-strong)" }}
                >
                  <Icon name="film" size={24} style={{ color: "var(--gold-c)" }} />
                </div>
              )}

              {/* Ink vignette for caption legibility */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(26,21,18,0.35) 0%, transparent 38%, transparent 62%, rgba(26,21,18,0.8) 100%)",
                }}
              />

              {/* REEL kicker — top left, printed label on paper ground */}
              <div
                className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 px-1.5"
                style={{
                  background: "var(--paper)",
                  border: "1.5px solid var(--rule-strong-c)",
                  height: 16,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    background: "var(--gold-c)",
                    display: "inline-block",
                  }}
                />
                <span
                  className="c-kicker"
                  style={{ fontSize: 8, letterSpacing: "0.16em" }}
                >
                  REEL
                </span>
              </div>

              {/* Square play tile — ink with gold triangle, no rounded glass */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 30,
                    height: 30,
                    background: "var(--gold-c)",
                    border: "2px solid var(--paper)",
                  }}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="var(--ink-strong)"
                  >
                    <polygon points="6,4 20,12 6,20" />
                  </svg>
                </div>
              </div>

              {/* Like count — bottom left in paper chip */}
              {(reel.like_count ?? 0) > 0 && (
                <div
                  className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-0.5 px-1"
                  style={{
                    background: "var(--paper)",
                    border: "1.5px solid var(--rule-strong-c)",
                    height: 15,
                  }}
                >
                  <svg
                    width="9"
                    height="9"
                    viewBox="0 0 24 24"
                    fill="var(--ink-strong)"
                    aria-hidden="true"
                  >
                    <path d="M12 21s-8-4.5-8-10.5a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-8 10.5-8 10.5z" />
                  </svg>
                  <span
                    className="c-kicker"
                    style={{ fontSize: 8, letterSpacing: "0.08em" }}
                  >
                    {(reel.like_count ?? 0) >= 1000
                      ? `${((reel.like_count ?? 0) / 1000).toFixed(1)}K`
                      : reel.like_count}
                  </span>
                </div>
              )}
            </div>
          </Link>
        ))}

        {/* Event cards (164 px wide, 16/9 aspect) */}
        {events.map((event) => (
          <Link
            key={`event-${event.id}`}
            href={`/events/${event.id}`}
            className="shrink-0 press"
            style={{ width: 164 }}
          >
            <div
              className="relative overflow-hidden"
              style={{
                aspectRatio: "16/9",
                border: "2px solid var(--rule-strong-c)",
                background: "var(--ink-strong)",
              }}
            >
              {event.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={event.cover_image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: "var(--ink-strong)" }}
                >
                  <Icon name="calendar" size={24} style={{ color: "var(--gold-c)" }} />
                </div>
              )}

              {/* Ink gradient for title legibility */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(26,21,18,0) 0%, rgba(26,21,18,0.2) 55%, rgba(26,21,18,0.88) 100%)",
                }}
              />

              {/* City kicker — top right on paper chip */}
              {event.cities?.name && (
                <div
                  className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 px-1.5"
                  style={{
                    background: "var(--paper)",
                    border: "1.5px solid var(--rule-strong-c)",
                    height: 16,
                  }}
                >
                  <span
                    className="c-kicker"
                    style={{ fontSize: 8, letterSpacing: "0.14em" }}
                  >
                    {event.cities.name.toUpperCase()}
                  </span>
                </div>
              )}

              {/* Title + date — bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-1.5">
                <p
                  className="c-card-t line-clamp-2"
                  style={{
                    fontSize: 11,
                    lineHeight: 1.15,
                    color: "var(--paper)",
                    letterSpacing: "0.005em",
                  }}
                >
                  {event.title}
                </p>
                {event.starts_at && (
                  <p
                    className="c-kicker mt-0.5"
                    style={{
                      fontSize: 8,
                      color: "var(--gold-c)",
                      letterSpacing: "0.14em",
                    }}
                  >
                    {formatEventDate(event.starts_at)}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
