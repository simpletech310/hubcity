import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveCity } from "@/lib/city-context";
import { getCityFilter } from "@/lib/city-filter";
import CityFilterChip from "@/components/ui/CityFilterChip";
import AdZone from "@/components/ui/AdZone";
import Icon from "@/components/ui/Icon";
import {
  CultureMarquee,
  CultureChipRow,
  CultureNumberedRow,
} from "@/components/culture";

export async function generateMetadata(): Promise<Metadata> {
  const city = await getActiveCity();
  const name = city?.name ?? "Your City";
  return {
    title: `Culture | ${name} | Culture`,
    description: `Immerse yourself in ${name}'s culture — exhibits, gallery, notable people, music heritage, history, and community stories.`,
  };
}

type Exhibit = {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  wing: string | null;
  is_featured: boolean | null;
};

type GalleryItem = {
  id: string;
  slug?: string | null;
  title: string;
  image_url: string | null;
  description: string | null;
};

type NotablePerson = {
  id: string;
  slug?: string | null;
  name: string;
  headline?: string | null;
  image_url: string | null;
};

export default async function CulturePage({
  searchParams,
}: {
  searchParams?: Promise<{ city?: string | string[] }>;
}) {
  // Default scope = ALL cities. Listener narrows via the CityFilterChip
  // (?city=<slug>). The "label" city for the masthead falls back to the
  // saved home city when no filter is active.
  const sp = (await (searchParams ?? Promise.resolve({}))) as { city?: string | string[] };
  const filterCity = await getCityFilter(sp);
  const home = await getActiveCity();
  const labelCity = filterCity ?? home;
  // Stand-in city used purely for masthead labels when nothing is filtered
  // and the listener has no saved home city — keeps the existing JSX that
  // expects `city.name` working without sprinkling guards everywhere.
  const city = labelCity ?? { name: "Everywhere", slug: "all" };
  const isCompton = city.slug === "compton";

  const supabase = await createClient();

  const scopeId = filterCity?.id ?? null;
  const scope = <T,>(q: T): T => {
    if (!scopeId) return q;
    return ((q as unknown) as { eq: (k: string, v: string) => T }).eq(
      "city_id",
      scopeId,
    );
  };

  // Build a city-scoped pool of creator IDs we'll use to fetch the
  // city's living-artist pool + their studio artwork. When no city is
  // selected we let it span everywhere.
  const creatorPoolP = (async () => {
    let q = supabase
      .from("profiles")
      .select("id, display_name, handle, avatar_url, role, profile_tags, city_id")
      .in("role", ["content_creator", "city_ambassador"])
      .order("created_at", { ascending: false })
      .limit(12);
    if (scopeId) q = q.eq("city_id", scopeId);
    const { data } = await q;
    return (data ?? []) as Array<{
      id: string;
      display_name: string;
      handle: string | null;
      avatar_url: string | null;
      role: string | null;
      profile_tags: string[] | null;
      city_id: string | null;
    }>;
  })();

  const [
    exhibitsRes,
    galleryRes,
    peopleRes,
    eventsRes,
    exhibitCountRes,
    galleryCountRes,
    peopleCountRes,
    creatorPool,
  ] = await Promise.all([
    scope(
      supabase
        .from("museum_exhibits")
        .select("*")
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5),
    ),
    scope(
      supabase
        .from("gallery_items")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(6),
    ),
    scope(
      supabase
        .from("notable_people")
        .select("*")
        .eq("is_published", true)
        .order("display_order", { ascending: true })
        .limit(4),
    ),
    scope(
      supabase
        .from("events")
        .select("id, title, start_date, location_name, image_url")
        .eq("category", "culture")
        .gte("start_date", new Date().toISOString())
        .order("start_date", { ascending: true })
        .limit(6),
    ),
    scope(
      supabase
        .from("museum_exhibits")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true),
    ),
    scope(
      supabase
        .from("gallery_items")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true),
    ),
    scope(
      supabase
        .from("notable_people")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true),
    ),
    creatorPoolP,
  ]);

  const exhibits = (exhibitsRes.data ?? []) as Exhibit[];
  const galleryItems = (galleryRes.data ?? []) as GalleryItem[];
  const people = (peopleRes.data ?? []) as NotablePerson[];
  const events = (eventsRes.data ?? []) as Array<{
    id: string;
    title: string;
    start_date: string;
    location_name: string | null;
    image_url: string | null;
  }>;

  // Pull studio artworks (profile_gallery_images) from the creators
  // we just resolved. This is the visual heart of the city-scoped
  // layout — real local artists' work, not stock images.
  type StudioWork = {
    id: string;
    image_url: string;
    caption: string | null;
    owner_id: string;
    creator: { display_name: string; handle: string | null };
  };
  let studioWorks: StudioWork[] = [];
  if (creatorPool.length > 0) {
    const ownerIds = creatorPool.map((c) => c.id);
    const { data: gRows } = await supabase
      .from("profile_gallery_images")
      .select("id, image_url, caption, owner_id, display_order, created_at")
      .in("owner_id", ownerIds)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(24);
    const byId = new Map(creatorPool.map((c) => [c.id, c]));
    studioWorks = ((gRows ?? []) as Array<{
      id: string;
      image_url: string;
      caption: string | null;
      owner_id: string;
    }>)
      .map((g) => {
        const c = byId.get(g.owner_id);
        if (!c) return null;
        return {
          id: g.id,
          image_url: g.image_url,
          caption: g.caption,
          owner_id: g.owner_id,
          creator: { display_name: c.display_name, handle: c.handle },
        };
      })
      .filter((x): x is StudioWork => x !== null);
  }

  const counts = {
    exhibits: exhibitCountRes.count ?? 0,
    gallery: galleryCountRes.count ?? 0,
    people: peopleCountRes.count ?? 0,
  };

  // Feature the first exhibit as the hero longread
  const feature = exhibits[0] ?? null;

  // Reading Room cards: mix remaining exhibits + gallery + people
  type ReadingCard = {
    id: string;
    kicker: string;
    title: string;
    image: string | null;
    href: string;
    heightPx: number;
  };
  const readingCards: ReadingCard[] = [];
  exhibits.slice(1, 3).forEach((e, i) =>
    readingCards.push({
      id: `ex-${e.id}`,
      kicker: (e.wing ?? "EXHIBIT").toUpperCase(),
      title: e.title,
      image: e.cover_image_url,
      href: `/culture/exhibits/${e.slug || e.id}`,
      heightPx: i === 0 ? 220 : 190,
    }),
  );
  galleryItems.slice(0, 1).forEach((g) =>
    readingCards.push({
      id: `g-${g.id}`,
      kicker: "GALLERY",
      title: g.title ?? "Gallery piece",
      image: g.image_url,
      href: `/culture/gallery/${g.slug || g.id}`,
      heightPx: 190,
    }),
  );
  people.slice(0, 1).forEach((p) =>
    readingCards.push({
      id: `p-${p.id}`,
      kicker: "PEOPLE",
      title: p.name,
      image: p.image_url,
      href: `/culture/people/${p.slug || p.id}`,
      heightPx: 240,
    }),
  );
  while (readingCards.length < 4 && galleryItems[readingCards.length]) {
    const g = galleryItems[readingCards.length];
    readingCards.push({
      id: `g2-${g.id}`,
      kicker: "GALLERY",
      title: g.title ?? "Gallery piece",
      image: g.image_url,
      href: `/culture/gallery/${g.slug || g.id}`,
      heightPx: readingCards.length % 2 === 0 ? 220 : 190,
    });
  }

  // Sections list (navigation rail) — Library was retired so the
  // page focuses on exhibits, gallery, people, history, calendar,
  // and historic landmarks.
  const sections = [
    { href: "/culture/exhibits", label: "EXHIBITS", meta: counts.exhibits ? `${counts.exhibits} ON VIEW` : "NEW" },
    { href: "/culture/gallery", label: "GALLERY", meta: counts.gallery ? `${counts.gallery} PIECES` : "COLLECTION" },
    { href: "/culture/people", label: "PEOPLE", meta: counts.people ? `${counts.people} FIGURES` : "LEGENDS" },
    { href: "/culture/history", label: "HISTORY", meta: `${city.name.toUpperCase()} TIMELINE` },
    { href: "/culture/events", label: "EVENTS", meta: "CULTURAL CALENDAR" },
    { href: "/culture/landmarks", label: "LANDMARKS", meta: "HISTORIC SITES" },
  ];

  const cityUpper = city.name.toUpperCase();
  const issue = Math.max(1, (new Date().getDate() % 20) + 1);
  const marqueeItems = [
    `HERITAGE · ${cityUpper}`,
    "SOUND · HUB RADIO AM",
    "STYLE · FIELD GUIDE",
    "FOOD · LOCAL STAYS BOOKED",
    "ART · ON THE WALLS",
  ];

  // Split feature title across two/three lines (uppercase)
  const featureTitleRaw = feature?.title ?? "CULTURE ON THE BLOCK";
  const featureWords = featureTitleRaw.toUpperCase().split(/\s+/);
  const featureLines: string[] = (() => {
    if (featureWords.length <= 1) return featureWords;
    if (featureWords.length === 2) return featureWords;
    // 3+ words: try to break evenly
    const mid = Math.ceil(featureWords.length / 2);
    return [featureWords.slice(0, mid).join(" "), featureWords.slice(mid).join(" ")];
  })();

  return (
    <div
      className="culture-surface min-h-dvh mx-auto max-w-[430px] relative"
      style={{ paddingBottom: 120 }}
    >
      {/* Masthead block — title sits on one line at 60px so "CULTURE."
       *  fits a 430px viewport without the typewriter line-break the
       *  legacy CULT— / URE. layout used. */}
      <div className="px-[18px] pt-5 pb-6">
        <div className="c-kicker">
          § VOLUME {new Date().getFullYear() % 100} · ISSUE {issue} ·{" "}
          {new Date()
            .toLocaleDateString("en-US", { month: "long" })
            .toUpperCase()}
        </div>
        <h1
          className="c-display mt-2.5"
          style={{ fontSize: 60, lineHeight: 0.9, letterSpacing: "-0.02em" }}
        >
          CULTURE.
        </h1>
        <p
          className="c-serif-it mt-3"
          style={{ fontSize: 14, lineHeight: 1.55, maxWidth: "92%" }}
        >
          Printed weekly from {city.name}. The music, the food, the fits, the
          streets. Edited by the block, for the block.
        </p>
        <div className="mt-3"><CityFilterChip /></div>
      </div>

      {/* Marquee */}
      <CultureMarquee items={marqueeItems} />

      {/* Genre chips */}
      <CultureChipRow
        chips={[
          { label: "LONGREADS", href: "/culture" },
          { label: "HERITAGE", href: "/culture/history" },
          { label: "STYLE", href: "/culture/gallery" },
          { label: "SOUND", href: "/live" },
          { label: "FREQUENCY", href: "/frequency" },
          { label: "FOOD", href: "/food" },
          { label: "STREETS", href: "/culture/landmarks" },
          { label: "ART", href: "/culture/exhibits" },
        ]}
        activeIndex={0}
      />

      {/* Feature spread */}
      {feature && (
        <div className="px-[18px] pt-2 pb-7">
          <div className="c-kicker mb-2.5">§ HERITAGE · LONGREAD</div>
          <h2
            className="c-display"
            style={{ fontSize: 66, lineHeight: 0.82 }}
          >
            {featureLines.map((line, i) => (
              <span key={i}>
                {line}
                {i < featureLines.length - 1 && <br />}
              </span>
            ))}
          </h2>
          {feature.description && (
            <p
              className="c-serif-it mt-4"
              style={{ fontSize: 15, lineHeight: 1.4 }}
            >
              {feature.description.slice(0, 180)}
              {feature.description.length > 180 ? "…" : ""}
            </p>
          )}
          <Link
            href={`/culture/exhibits/${feature.slug || feature.id}`}
            className="block mt-4 relative c-frame-strong"
            style={{ aspectRatio: "4 / 5" }}
          >
            {feature.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={feature.cover_image_url}
                alt={feature.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full c-ph" aria-hidden />
            )}
            <span
              className="c-badge c-badge-gold absolute"
              style={{ left: -4, top: -4, padding: "5px 10px" }}
            >
              #{String(issue).padStart(3, "0")}
            </span>
          </Link>

          {/* Dropcap body */}
          {feature.description && feature.description.length > 180 && (
            <p
              className="c-dropcap mt-4"
              style={{
                fontSize: 14,
                fontFamily: "var(--font-fraunces), Fraunces, Georgia, serif",
                lineHeight: 1.55,
                color: "var(--ink-strong)",
              }}
            >
              {feature.description}
            </p>
          )}

          {/* Author row */}
          <div
            className="mt-5 py-4 flex items-center gap-3"
            style={{
              borderTop: "2px solid var(--rule-strong-c)",
              borderBottom: "2px solid var(--rule-strong-c)",
            }}
          >
            <div
              className="c-ink-block shrink-0 flex items-center justify-center"
              style={{
                width: 38,
                height: 38,
                color: "var(--gold-c)",
                fontFamily: "var(--font-archivo), Archivo, sans-serif",
                fontWeight: 900,
                fontSize: 13,
                letterSpacing: "0.05em",
              }}
            >
              HC
            </div>
            <div className="flex-1 min-w-0">
              <div className="c-card-t" style={{ fontSize: 15 }}>
                HUB CITY EDITORS
              </div>
              <div className="c-kicker mt-0.5" style={{ fontSize: 9 }}>
                {feature.wing ?? "CULTURE"} · 12 MIN
              </div>
            </div>
            <div
              className="shrink-0 flex items-center justify-center"
              style={{
                width: 38,
                height: 38,
                border: "2px solid var(--rule-strong-c)",
              }}
            >
              <Icon name="bookmark" size={16} />
            </div>
          </div>
        </div>
      )}

      {/* Reading Room 2x2 asymmetric */}
      {readingCards.length > 0 && (
        <div className="px-[18px] pb-7">
          <div className="c-kicker">§ THE READING ROOM</div>
          <div className="c-title mt-1.5">THIS WEEK.</div>
          <div
            className="mt-4 grid gap-3"
            style={{ gridTemplateColumns: "1fr 1fr" }}
          >
            {readingCards.slice(0, 4).map((card, i) => (
              <Link
                key={card.id}
                href={card.href}
                className="block"
                style={{ marginTop: i % 2 ? 22 : 0 }}
              >
                <div
                  className="c-frame"
                  style={{ height: card.heightPx, overflow: "hidden" }}
                >
                  {card.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={card.image}
                      alt={card.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full c-ph" />
                  )}
                </div>
                <div className="c-kicker mt-2" style={{ fontSize: 9 }}>
                  {card.kicker}
                </div>
                <div
                  className="c-card-t mt-1"
                  style={{
                    fontSize: 15,
                    textWrap: "balance" as const,
                  }}
                >
                  {card.title}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* § FROM THE STUDIOS — real artwork from city creators */}
      {studioWorks.length > 0 && (
        <section className="pt-2 pb-7">
          <div className="px-[18px] mb-3">
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-3">
                <span className="c-kicker" style={{ fontSize: 10, letterSpacing: "0.18em", opacity: 0.7 }}>
                  § FROM THE STUDIOS
                </span>
              </div>
              <Link
                href="/people"
                className="c-kicker"
                style={{ fontSize: 9, color: "var(--gold-c)", letterSpacing: "0.16em" }}
              >
                ALL WORK ↗
              </Link>
            </div>
            <h3 className="c-title mt-1" style={{ fontSize: 28 }}>
              The walls of {city.name}.
            </h3>
            <p className="c-serif-it mt-1" style={{ fontSize: 13, opacity: 0.75 }}>
              Recent work from local artists, photographers, and designers.
            </p>
          </div>
          <div className="overflow-x-auto scrollbar-hide pb-1">
            <div className="flex gap-3 px-[18px]">
              {studioWorks.slice(0, 12).map((w) => (
                <Link
                  key={w.id}
                  href={w.creator.handle ? `/user/${w.creator.handle}` : `/people`}
                  className="shrink-0 press"
                  style={{ width: 160 }}
                >
                  <div
                    className="relative overflow-hidden"
                    style={{
                      aspectRatio: "3 / 4",
                      background: "var(--ink-strong)",
                      border: "2px solid var(--rule-strong-c)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={w.image_url}
                      alt={w.caption ?? w.creator.display_name}
                      className="w-full h-full object-cover"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(180deg, transparent 50%, rgba(26,21,18,0.85) 100%)",
                      }}
                    />
                    <span
                      className="absolute top-2 left-2 c-badge c-badge-gold"
                      style={{ fontSize: 9 }}
                    >
                      § ART
                    </span>
                    <div className="absolute inset-x-0 bottom-0 p-2">
                      {w.caption && (
                        <p
                          className="c-card-t line-clamp-2"
                          style={{
                            fontSize: 11,
                            lineHeight: 1.15,
                            color: "var(--paper)",
                          }}
                        >
                          {w.caption}
                        </p>
                      )}
                      <p
                        className="c-kicker mt-1"
                        style={{
                          fontSize: 8,
                          letterSpacing: "0.16em",
                          color: "var(--gold-c)",
                          opacity: 0.95,
                        }}
                      >
                        @{w.creator.handle ?? w.creator.display_name.toLowerCase().replace(/\s+/g, "")}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* § ARTISTS IN RESIDENCE — local creator pool, scoped by city */}
      {creatorPool.length > 0 && (
        <section className="pt-2 pb-7">
          <div className="px-[18px] mb-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="c-kicker" style={{ fontSize: 10, letterSpacing: "0.18em", opacity: 0.7 }}>
                § ARTISTS IN RESIDENCE
              </span>
              <Link
                href="/creators"
                className="c-kicker"
                style={{ fontSize: 9, color: "var(--gold-c)", letterSpacing: "0.16em" }}
              >
                ALL CREATORS ↗
              </Link>
            </div>
            <h3 className="c-title mt-1" style={{ fontSize: 28 }}>
              Who&rsquo;s making in {city.name}.
            </h3>
            <p className="c-serif-it mt-1" style={{ fontSize: 13, opacity: 0.75 }}>
              The artists, ambassadors, and storytellers shaping the city right now.
            </p>
          </div>
          <div className="overflow-x-auto scrollbar-hide pb-1">
            <div className="flex gap-3 px-[18px]">
              {creatorPool.slice(0, 10).map((c) => {
                const initials = c.display_name
                  .split(/\s+/)
                  .map((w) => w[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                return (
                  <Link
                    key={c.id}
                    href={c.handle ? `/user/${c.handle}` : "/creators"}
                    className="shrink-0 press"
                    style={{ width: 132 }}
                  >
                    <div
                      className="relative w-full overflow-hidden"
                      style={{
                        aspectRatio: "1 / 1",
                        background: "var(--ink-strong)",
                        border: "2px solid var(--rule-strong-c)",
                      }}
                    >
                      {c.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.avatar_url}
                          alt={c.display_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{
                            color: "var(--gold-c)",
                            fontFamily: "var(--font-anton), Anton, sans-serif",
                            fontSize: 40,
                            lineHeight: 1,
                          }}
                        >
                          {initials}
                        </div>
                      )}
                    </div>
                    <p
                      className="c-card-t mt-2 truncate"
                      style={{
                        fontSize: 13,
                        color: "var(--ink-strong)",
                        lineHeight: 1.15,
                      }}
                    >
                      {c.display_name}
                    </p>
                    <p
                      className="c-kicker mt-0.5 truncate"
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.14em",
                        color: "var(--ink-strong)",
                        opacity: 0.6,
                      }}
                    >
                      {c.role === "city_ambassador" ? "AMBASSADOR" : "ARTIST"}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Ad zone */}
      <div className="px-[18px] pb-6">
        <AdZone zone="feed_banner" />
      </div>

      {/* Pull quote */}
      <section
        className="c-ink-block"
        style={{
          padding: "32px 22px",
          borderTop: "4px solid var(--gold-c)",
          borderBottom: "4px solid var(--gold-c)",
        }}
      >
        <div
          style={{
            fontSize: 80,
            lineHeight: 0.5,
            fontFamily: "var(--font-anton), Anton, sans-serif",
            color: "var(--gold-c)",
            marginBottom: 10,
          }}
        >
          &ldquo;
        </div>
        <p className="c-title" style={{ color: "var(--paper)", fontSize: 28 }}>
          We don&rsquo;t cover the culture. We in it.
        </p>
        <div className="c-kicker mt-4" style={{ color: "var(--gold-c)" }}>
          — HUB CITY · ISS.{issue}
        </div>
      </section>

      {/* § THE SECTIONS navigation list (replaces museum wing grid) */}
      <div className="px-[18px] pt-7 pb-6">
        <div className="c-kicker mb-1.5">§ THE SECTIONS</div>
        <div className="c-title mb-3" style={{ fontSize: 28 }}>
          EXPLORE.
        </div>
        <div>
          {sections.map((s, i) => (
            <CultureNumberedRow
              key={s.href}
              n={String(i + 1).padStart(2, "0")}
              kicker={s.meta}
              title={s.label}
              href={s.href}
              topRule={true}
            />
          ))}
        </div>
      </div>

      {/* Compton partner institution */}
      {isCompton && (
        <section
          className="c-ink-block"
          style={{
            padding: "28px 18px",
            borderTop: "3px solid var(--gold-c)",
          }}
        >
          <div className="c-kicker" style={{ color: "var(--gold-c)" }}>
            § FEATURED INSTITUTION
          </div>
          <h3
            className="c-hero mt-2"
            style={{ color: "var(--paper)", fontSize: 32 }}
          >
            Compton Art
            <br />
            &amp; History Museum
          </h3>
          <p
            className="mt-3"
            style={{
              fontFamily: "var(--font-body), Inter, sans-serif",
              fontSize: 13,
              lineHeight: 1.55,
              color: "rgba(243,238,220,0.75)",
            }}
          >
            A groundbreaking space bringing together art, history, and
            community. Amplifying the culture of Compton and greater South Los
            Angeles.
          </p>
          <div
            className="mt-4"
            style={{
              borderTop: "1px solid rgba(243,238,220,0.2)",
              paddingTop: 12,
              display: "flex",
              flexDirection: "column",
              gap: 6,
              fontFamily: "var(--font-dm-mono), monospace",
              fontSize: 11,
              color: "rgba(243,238,220,0.75)",
            }}
          >
            <div>306 W COMPTON BLVD. #104, COMPTON, CA 90220</div>
            <div>TUE–SAT · 10AM–3PM · (310) 627-9022</div>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <a
              href="https://www.comptonmuseum.org"
              target="_blank"
              rel="noopener noreferrer"
              className="c-btn c-btn-accent c-btn-sm"
            >
              VISIT SITE
            </a>
            <a
              href="https://www.instagram.com/comptonmuseum"
              target="_blank"
              rel="noopener noreferrer"
              className="c-kicker"
              style={{ color: "var(--gold-c)" }}
            >
              INSTAGRAM ↗
            </a>
            <a
              href="https://www.facebook.com/ComptonMuseum"
              target="_blank"
              rel="noopener noreferrer"
              className="c-kicker"
              style={{ color: "var(--gold-c)" }}
            >
              FACEBOOK ↗
            </a>
          </div>
        </section>
      )}

      {/* § EXHIBITIONS & EVENTS — visual rail with cover images */}
      {events.length > 0 && (
        <section className="pt-2 pb-8">
          <div className="px-[18px] mb-3">
            <div className="flex items-baseline justify-between gap-3">
              <span
                className="c-kicker"
                style={{ fontSize: 10, letterSpacing: "0.18em", opacity: 0.7 }}
              >
                § ON THE CALENDAR
              </span>
              <Link
                href="/events"
                className="c-kicker"
                style={{ fontSize: 9, color: "var(--gold-c)", letterSpacing: "0.16em" }}
              >
                ALL EVENTS ↗
              </Link>
            </div>
            <h3 className="c-title mt-1" style={{ fontSize: 28 }}>
              Exhibitions & openings.
            </h3>
            <p className="c-serif-it mt-1" style={{ fontSize: 13, opacity: 0.75 }}>
              Cultural programming on the {city.name} calendar.
            </p>
          </div>
          <div className="overflow-x-auto scrollbar-hide pb-1">
            <div className="flex gap-3 px-[18px]">
              {events.map((e) => {
                const d = new Date(e.start_date);
                const month = d
                  .toLocaleDateString("en-US", { month: "short" })
                  .toUpperCase();
                const day = d.getDate();
                return (
                  <Link
                    key={e.id}
                    href={`/events/${e.id}`}
                    className="shrink-0 press"
                    style={{ width: 220 }}
                  >
                    <div
                      className="relative overflow-hidden"
                      style={{
                        aspectRatio: "4 / 3",
                        background: "var(--ink-strong)",
                        border: "2px solid var(--rule-strong-c)",
                      }}
                    >
                      {e.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={e.image_url}
                          alt={e.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full c-ph" aria-hidden />
                      )}
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(180deg, transparent 40%, rgba(26,21,18,0.85) 100%)",
                        }}
                      />
                      {/* Editorial date block — top-right */}
                      <div
                        className="absolute top-2 right-2 overflow-hidden"
                        style={{
                          background: "var(--paper)",
                          border: "2px solid var(--rule-strong-c)",
                        }}
                      >
                        <div
                          className="px-2 py-0.5 c-kicker text-center"
                          style={{
                            background: "var(--gold-c)",
                            color: "var(--ink-strong)",
                            fontSize: 9,
                            letterSpacing: "0.16em",
                          }}
                        >
                          {month}
                        </div>
                        <div className="px-2 py-1 text-center">
                          <p
                            className="tabular-nums"
                            style={{
                              fontFamily:
                                "var(--font-archivo-narrow), Archivo, sans-serif",
                              fontWeight: 800,
                              fontSize: 16,
                              lineHeight: 1,
                              color: "var(--ink-strong)",
                            }}
                          >
                            {day}
                          </p>
                        </div>
                      </div>
                      {/* Title + location */}
                      <div className="absolute inset-x-0 bottom-0 p-3">
                        <p
                          className="c-card-t line-clamp-2"
                          style={{
                            fontSize: 14,
                            lineHeight: 1.15,
                            color: "var(--paper)",
                          }}
                        >
                          {e.title}
                        </p>
                        {e.location_name && (
                          <p
                            className="c-kicker mt-1 truncate"
                            style={{
                              fontSize: 9,
                              letterSpacing: "0.16em",
                              color: "var(--gold-c)",
                              opacity: 0.95,
                            }}
                          >
                            {e.location_name.toUpperCase()}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Empty state when nothing yet */}
      {!isCompton &&
        exhibits.length === 0 &&
        galleryItems.length === 0 &&
        people.length === 0 &&
        events.length === 0 && (
          <section
            className="mx-[18px] mb-6 p-5"
            style={{ border: "2px dashed var(--rule-strong-c)" }}
          >
            <div className="c-kicker mb-2">§ NOTICE</div>
            <h3 className="c-card-t" style={{ fontSize: 16 }}>
              {city.name.toUpperCase()} CULTURE — COMING SOON
            </h3>
            <p
              className="mt-2"
              style={{
                fontFamily: "var(--font-body), Inter, sans-serif",
                fontSize: 12,
                lineHeight: 1.5,
                color: "var(--ink-soft)",
              }}
            >
              We&rsquo;re onboarding {city.name}&rsquo;s museums, galleries,
              and cultural organizations. Check back soon, or switch cities
              from the header to explore another.
            </p>
          </section>
        )}

      {/* Colophon */}
      <div
        className="px-[18px] py-5"
        style={{ borderTop: "2px solid var(--rule-strong-c)" }}
      >
        <div className="flex items-center justify-between">
          <span className="c-kicker" style={{ opacity: 0.5 }}>
            HUB CITY · CULTURE · {cityUpper}
          </span>
          <span className="c-kicker" style={{ opacity: 0.5 }}>
            ISS.{issue}
          </span>
        </div>
      </div>
    </div>
  );
}
