import { NextResponse } from "next/server";

const METRO_BASE = "https://api.metro.net";

export const revalidate = 3600; // Cache for 1 hour – stops rarely change

/**
 * GET /api/transit/stops?route_code=51&agency_id=LACMTA
 *
 * Returns stop list for a route from the LA Metro static API.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const route_code = searchParams.get("route_code");
  const agency_id = searchParams.get("agency_id") || "LACMTA";

  if (!route_code) {
    return NextResponse.json({ error: "route_code is required" }, { status: 400 });
  }

  try {
    const url = `${METRO_BASE}/${agency_id}/route_stops/${route_code}?daytype=all`;
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Metro API error: ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[transit/stops]", err);
    return NextResponse.json({ error: "Failed to fetch stops" }, { status: 500 });
  }
}
