import Link from "next/link";
import {
  CultureMasthead,
  CultureMarquee,
  CultureSectionHead,
  CultureChipRow,
  CultureNumberedRow,
  CultureBottomNav,
} from "@/components/culture";

export const metadata = {
  title: "Design Preview · Culture",
  description:
    "Proof-of-concept canvas for the Culture blockprint design system.",
};

/**
 * Design Preview — showcases the Culture blockprint primitives composed
 * into a Home-feed-shaped layout. Not wired to real data yet; static
 * content so the visual system can be validated end-to-end before the
 * live pages get migrated.
 *
 * When you're ready to migrate a live screen:
 *   1. Wrap the page in `<div className="culture-surface">`
 *   2. Import primitives from `@/components/culture`
 *   3. Use `c-display`, `c-hero`, `c-title`, `c-card-t`, `c-kicker`,
 *      `c-meta`, `c-body`, `c-serif-it`, `c-ui` for typography
 *   4. Use `c-frame`, `c-frame-strong` for image borders
 *   5. Use `c-ink-block`, `c-gold-block` for inverted slabs
 */
export default function DesignPreviewPage() {
  const tonight = [
    {
      n: "01",
      tag: "LIVE",
      kicker: "8PM · HUB RADIO",
      title: "1st Sundaes Open Mic",
      meta: "142 going · Free RSVP",
    },
    {
      n: "02",
      tag: "FEAT.",
      kicker: "7PM · MUSEUM",
      title: "Compton Art Walk",
      meta: "$15 · Cash only",
    },
    {
      n: "03",
      tag: "$150",
      kicker: "9AM · KELLY PK",
      title: "Winter Cohort Kickoff",
      meta: "Ages 7–17",
    },
  ];

  return (
    <div
      className="culture-surface min-h-dvh mx-auto max-w-[430px] relative"
      style={{ paddingBottom: 120 }}
    >
      {/* Masthead */}
      <CultureMasthead
        vol="VOL.4"
        iss="ISS.14"
        date="APR 23"
        wordmark="CULTURE."
        actions={
          <>
            <Link
              href="/search"
              className="w-9 h-9 flex items-center justify-center"
              style={{
                border: "2px solid var(--rule-strong-c)",
                color: "var(--ink-strong)",
              }}
              aria-label="Search"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </Link>
            <Link
              href="/notifications"
              className="w-9 h-9 relative flex items-center justify-center"
              style={{
                background: "var(--rule-strong-c)",
                color: "var(--paper)",
              }}
              aria-label="Notifications"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 17h12l-1.5-2V11a4.5 4.5 0 0 0-9 0v4L6 17Z" />
                <path d="M10 20a2 2 0 0 0 4 0" />
              </svg>
              <span
                className="absolute"
                style={{
                  top: 5,
                  right: 5,
                  width: 8,
                  height: 8,
                  background: "var(--gold-c)",
                }}
              />
            </Link>
          </>
        }
      />

      {/* Location strip */}
      <div
        className="flex items-center gap-2 px-[18px] py-2.5"
        style={{
          background: "var(--rule-strong-c)",
          color: "var(--paper)",
        }}
      >
        <span
          className="c-live-dot"
          style={{
            width: 8,
            height: 8,
            background: "var(--green-c)",
            display: "inline-block",
          }}
        />
        <span className="c-kicker" style={{ color: "var(--paper)" }}>
          ON THE BLOCK · COMPTON 90221 · 72°
        </span>
        <span className="flex-1" />
        <span className="c-kicker" style={{ color: "var(--gold-c)" }}>
          CHANGE ↗
        </span>
      </div>

      {/* Marquee ticker */}
      <CultureMarquee
        items={[
          "1ST SUNDAES TONIGHT",
          "WICKD RESTOCKED",
          "KEVONSTAGE LIVE 8PM",
          "COHORT OPEN",
          "RUN CLUB 6AM",
          "HEALTH FAIR SAT",
        ]}
      />

      {/* Category tabs */}
      <CultureChipRow
        chips={["ALL", "FOOD", "EVENTS", "MOMENTS", "SHOPS", "CIVIC", "JOBS"]}
        activeIndex={0}
      />

      {/* HERO COVER — full-bleed poster */}
      <section
        className="relative overflow-hidden"
        style={{ aspectRatio: "1 / 1" }}
      >
        <div
          className="absolute inset-0 c-ph"
          aria-hidden
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, transparent 30%, rgba(26,21,18,0.85) 100%)",
          }}
        />
        <span
          className="c-badge c-badge-gold absolute"
          style={{ top: 14, left: 14 }}
        >
          THE PROFILE · #014
        </span>
        <div className="absolute inset-x-0 bottom-0 px-[18px] py-6">
          <h1
            style={{
              fontFamily: "var(--font-anton), Anton, sans-serif",
              fontSize: 62,
              lineHeight: 0.82,
              color: "#F3EEDC",
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Stays
            <br />
            Booked.
          </h1>
          <p
            style={{
              marginTop: 12,
              maxWidth: "80%",
              fontSize: 13,
              color: "#F3EEDC",
              fontFamily: "var(--font-body), Inter, sans-serif",
              lineHeight: 1.45,
              opacity: 0.9,
            }}
          >
            Kevon built a comedy empire without ever leaving 90221 — and the
            neighborhood never let him forget it.
          </p>
          <div className="flex items-center gap-2.5 mt-4">
            <span
              style={{
                padding: "8px 14px",
                background: "#F3EEDC",
                color: "#1a1512",
                fontFamily: "var(--font-archivo), Archivo, sans-serif",
                fontWeight: 900,
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              READ · 8 MIN
            </span>
            <span
              className="c-kicker"
              style={{ color: "rgba(243,238,220,0.7)" }}
            >
              BY JASMINE R.
            </span>
          </div>
        </div>
      </section>

      {/* Tonight section */}
      <CultureSectionHead
        kicker="§ TONIGHT · 04.23"
        title="Where the Block Goes."
      />
      <div className="px-[18px] pb-5">
        {tonight.map((e, i) => (
          <CultureNumberedRow
            key={e.n}
            n={e.n}
            tag={e.tag}
            kicker={e.kicker}
            title={e.title}
            meta={e.meta}
            topRule={i > 0}
          />
        ))}
      </div>

      {/* Dispatches — inverted ink slab */}
      <section
        className="c-ink-block"
        style={{ padding: "28px 18px 28px" }}
      >
        <div className="c-kicker" style={{ color: "var(--gold-c)" }}>
          § DISPATCHES
        </div>
        <h2
          className="c-hero mt-2"
          style={{ color: "var(--paper)" }}
        >
          Voices,
          <br />
          Unfiltered.
        </h2>
        <div className="mt-4">
          {[
            {
              kicker: "FOOD · 2H",
              t: "The one-sided beef against cream cheese frosting.",
              by: "wickdconfections",
            },
            {
              kicker: "STYLE · 4H",
              t: "What Flyla wore this week — annotated.",
              by: "beflyla",
            },
            {
              kicker: "INTERVIEW · 1D",
              t: '"The real ones know the grind." FakeSmiles back-of-house.',
              by: "fakesmilesco",
            },
          ].map((p) => (
            <div
              key={p.t}
              className="py-4"
              style={{
                borderTop: "1px solid rgba(243,238,220,0.15)",
              }}
            >
              <div
                className="c-kicker"
                style={{ color: "var(--gold-c)", fontSize: 9 }}
              >
                {p.kicker}
              </div>
              <p
                className="c-card-t mt-2"
                style={{
                  fontSize: 18,
                  color: "var(--paper)",
                  textWrap: "balance" as const,
                }}
              >
                {p.t}
              </p>
              <div
                className="c-kicker mt-2.5"
                style={{
                  opacity: 0.6,
                  fontSize: 9,
                  color: "var(--paper)",
                }}
              >
                @{p.by} · READ ↗
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pull quote — gold-bordered ink slab */}
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
        <p
          className="c-title"
          style={{ color: "var(--paper)", fontSize: 28 }}
        >
          We don&rsquo;t cover the culture. We in it.
        </p>
        <div
          className="c-kicker mt-4"
          style={{ color: "var(--gold-c)" }}
        >
          — DRE, HUB RADIO · ISS.12
        </div>
      </section>

      {/* Footer legend */}
      <div
        style={{
          padding: "24px 18px",
          borderTop: "2px solid var(--rule-strong-c)",
        }}
      >
        <div className="c-kicker mb-2" style={{ opacity: 0.5 }}>
          § DESIGN PREVIEW
        </div>
        <p
          className="c-body"
          style={{ fontSize: 12, lineHeight: 1.5 }}
        >
          This route exercises every Culture primitive: Masthead, Marquee,
          SectionHead, ChipRow, NumberedRow, ink slab, gold-bordered pull
          quote, full-bleed poster hero, and the blockprint bottom nav. The
          live app still renders in the dark-canvas theme — migration lands
          screen-by-screen in Phase 2.
        </p>
      </div>

      <CultureBottomNav active="home" />
    </div>
  );
}
