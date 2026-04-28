import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/branding";

/**
 * Programmatic Open Graph image renderer.
 *
 * Returns a 1200x630 branded card (the OG/Twitter standard) so any
 * page that doesn't have its own hero image still gets a non-blank
 * unfurl when shared in Slack, iMessage, social, etc.
 *
 * Usage:
 *   /api/og?title=YOUR%20TITLE
 *   /api/og?title=Westside%20Party&kicker=FREQUENCY%20%C2%B7%20SINGLE
 *
 * Wired into <buildOg> as the fallback whenever a caller doesn't
 * supply `image`. Renders edge-side via @vercel/og so it's fast and
 * costs no Vercel image-optimization budget.
 */
export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") ?? SITE_NAME).slice(0, 120);
  const kicker = (searchParams.get("kicker") ?? SITE_TAGLINE).slice(0, 80);
  const accent = searchParams.get("accent") ?? "#F2A900"; // Hub City gold

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#1A1512",
          color: "#EDE6D6",
          padding: 80,
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Top gold rule — matches the .culture-surface header line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 12,
            background: accent,
          }}
        />
        {/* Diagonal accent bar (top-right) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 320,
            height: 12,
            background: "#EDE6D6",
          }}
        />

        {/* Kicker — small caps, gold */}
        <div
          style={{
            display: "flex",
            fontSize: 24,
            letterSpacing: 6,
            color: accent,
            textTransform: "uppercase",
            fontWeight: 800,
            marginBottom: 28,
          }}
        >
          § {kicker}
        </div>

        {/* Title — fills the card */}
        <div
          style={{
            display: "flex",
            fontSize: title.length > 60 ? 84 : title.length > 35 ? 108 : 132,
            lineHeight: 0.95,
            letterSpacing: -2,
            fontWeight: 900,
            color: "#EDE6D6",
            maxWidth: "90%",
            textTransform: "uppercase",
            wordBreak: "break-word",
          }}
        >
          {title}
        </div>

        {/* Spacer pushes branding to bottom */}
        <div style={{ flex: 1, display: "flex" }} />

        {/* Bottom branding row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            borderTop: `3px solid ${accent}`,
            paddingTop: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 56,
                fontWeight: 900,
                letterSpacing: -1.5,
                color: "#EDE6D6",
                lineHeight: 1,
              }}
            >
              {SITE_NAME.toUpperCase()}.
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 22,
                color: "#EDE6D6",
                opacity: 0.65,
                marginTop: 6,
                fontStyle: "italic",
              }}
            >
              {SITE_TAGLINE}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 18,
              letterSpacing: 4,
              color: accent,
              fontWeight: 800,
            }}
          >
            HUB CITY · COMPTON
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        // OG cards are deterministic for any (title, kicker, accent)
        // tuple, so we can let edge + browser cache them aggressively.
        // 1 day at edge, immutable at the browser — drops the CPU
        // cost of re-rendering identical cards across crawls.
        "cache-control":
          "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800, immutable",
      },
    },
  );
}
