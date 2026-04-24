import Link from "next/link";
import Icon from "@/components/ui/Icon";

// ─────────────────────────────────────────────────────────
// TrendingStrip — horizontal scroll rail of trending reels + events
// Server component (display-only, no interactivity needed)
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
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function TrendingStrip({ reels, events }: TrendingStripProps) {
  if (reels.length === 0 && events.length === 0) return null;

  return (
    <section className="space-y-2">
      {/* Header row */}
      <div className="flex items-center justify-between px-5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
          Trending Now
        </span>
        <span className="text-[10px] text-gold flex items-center gap-1">
          <Icon name="trending" size={10} className="text-gold" />
          What&rsquo;s hot
        </span>
      </div>

      {/* Horizontal scroll container */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 px-4">

        {/* ── Reel cards (100 px wide, 9/16 aspect) ── */}
        {reels.map((reel) => (
          <Link
            key={`reel-${reel.id}`}
            href={`/reels/${reel.id}`}
            className="shrink-0 press"
            style={{ width: 100 }}
          >
            <div
              className="relative rounded-xl overflow-hidden bg-[#111]"
              style={{ aspectRatio: "9/16" }}
            >
              {/* Poster image or gradient placeholder */}
              {reel.poster_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={reel.poster_url}
                  alt={reel.caption ?? "Reel"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-coral/20 via-purple-900/20 to-gold/10" />
              )}

              {/* Dark vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

              {/* Play icon overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
                    <polygon points="6,4 20,12 6,20" />
                  </svg>
                </div>
              </div>

              {/* Reel badge — top left */}
              <div className="absolute top-1.5 left-1.5">
                <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-coral" />
                  <span className="text-[8px] font-bold text-white uppercase tracking-wider">
                    Reel
                  </span>
                </span>
              </div>

              {/* Like count — bottom left */}
              {(reel.like_count ?? 0) > 0 && (
                <div className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5">
                  <Icon name="heart-pulse" size={9} className="text-coral" />
                  <span className="text-[9px] font-semibold text-white drop-shadow">
                    {(reel.like_count ?? 0) >= 1000
                      ? `${((reel.like_count ?? 0) / 1000).toFixed(1)}k`
                      : reel.like_count}
                  </span>
                </div>
              )}
            </div>
          </Link>
        ))}

        {/* ── Event cards (160 px wide, 16/9 aspect) ── */}
        {events.map((event) => (
          <Link
            key={`event-${event.id}`}
            href={`/events/${event.id}`}
            className="shrink-0 press"
            style={{ width: 160 }}
          >
            <div
              className="relative rounded-xl overflow-hidden bg-royal"
              style={{ aspectRatio: "16/9" }}
            >
              {/* Cover image or gradient placeholder */}
              {event.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={event.cover_image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gold/10 to-purple-900/10">
                  <Icon name="calendar" size={24} className="text-white/20" />
                </div>
              )}

              {/* Dark overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

              {/* Event info — bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="text-[11px] font-bold text-white leading-snug line-clamp-2 mb-0.5">
                  {event.title}
                </p>
                {event.starts_at && (
                  <p className="text-[9px] text-gold font-semibold">
                    {formatEventDate(event.starts_at)}
                  </p>
                )}
              </div>

              {/* City badge — top right */}
              {event.cities?.name && (
                <div className="absolute top-1.5 right-1.5">
                  <span className="inline-flex items-center gap-0.5 bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                    <Icon name="map-pin" size={7} className="text-gold" />
                    <span className="text-[8px] font-semibold text-white/80 uppercase tracking-wide">
                      {event.cities.name}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
