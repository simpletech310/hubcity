import { NextRequest, NextResponse } from "next/server";

/**
 * GIPHY proxy — keeps the API key server-side, trims GIPHY's huge response to
 * the minimum the client needs, and enforces a simple in-memory rate limit.
 *
 * Rate limit: 60 req/min per IP. In-memory counter — resets on cold start.
 * This is abuse mitigation, not a security boundary.
 */

type GiphyImage = {
  url: string;
  width: string;
  height: string;
};

type GiphyGif = {
  id: string;
  title?: string;
  images: {
    original: GiphyImage;
    fixed_width: GiphyImage;
    fixed_width_small?: GiphyImage;
    fixed_height_small?: GiphyImage;
    downsized_medium?: GiphyImage;
  };
};

type GiphyResponse = {
  data: GiphyGif[];
};

type TrimmedGif = {
  id: string;
  url: string;
  preview: string;
  alt: string;
};

// ── Rate limit (per-IP, in-memory) ─────────────────────────
const WINDOW_MS = 60_000;
const LIMIT = 60;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: LIMIT - 1 };
  }
  entry.count += 1;
  if (entry.count > LIMIT) return { ok: false, remaining: 0 };
  return { ok: true, remaining: LIMIT - entry.count };
}

// Occasional cleanup so the map doesn't grow unbounded
function sweep() {
  const now = Date.now();
  for (const [k, v] of hits) {
    if (v.resetAt < now) hits.delete(k);
  }
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.GIPHY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GIPHY API key not configured" },
      { status: 500 }
    );
  }

  // Rate limit by IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous";
  if (Math.random() < 0.05) sweep();
  const { ok, remaining } = rateLimit(ip);
  if (!ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limitRaw = request.nextUrl.searchParams.get("limit");
  const limit = Math.min(50, Math.max(1, Number(limitRaw) || 24));

  // Empty query → trending
  const endpoint = q
    ? `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(q)}&limit=${limit}&rating=pg-13&bundle=messaging_non_clips`
    : `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=${limit}&rating=pg-13&bundle=messaging_non_clips`;

  try {
    const res = await fetch(endpoint, {
      // Next caches GET fetches by default; short revalidate for freshness
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `GIPHY error (${res.status})` },
        { status: 502 }
      );
    }

    const json = (await res.json()) as GiphyResponse;
    const gifs: TrimmedGif[] = (json.data || []).map((g) => {
      const original = g.images?.original?.url ?? "";
      const preview =
        g.images?.fixed_width_small?.url ??
        g.images?.fixed_width?.url ??
        original;
      return {
        id: g.id,
        url: original,
        preview,
        alt: g.title?.trim() || "GIF",
      };
    });

    return NextResponse.json(
      { gifs },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
          "X-RateLimit-Remaining": String(remaining),
        },
      }
    );
  } catch (err) {
    console.error("GIPHY proxy error:", err);
    return NextResponse.json(
      { error: "GIPHY request failed" },
      { status: 502 }
    );
  }
}
