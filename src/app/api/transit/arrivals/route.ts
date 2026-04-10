import { NextResponse } from "next/server";

const METRO_BASE = "https://api.metro.net";

// Cache time in seconds – Metro updates every 60s
export const revalidate = 30;

/**
 * GET /api/transit/arrivals?stop_id=80101&route_code=51&agency_id=LACMTA
 *
 * Fetches real-time trip detail from LA Metro API and returns
 * next arrival predictions for the requested stop.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stop_id = searchParams.get("stop_id");
  const route_code = searchParams.get("route_code");
  const agency_id = searchParams.get("agency_id") || "LACMTA";

  if (!stop_id || !route_code) {
    return NextResponse.json(
      { error: "stop_id and route_code are required" },
      { status: 400 }
    );
  }

  try {
    const url = `${METRO_BASE}/${agency_id}/trip_detail/route_code/${route_code}?include_stop_time_updates=true&geojson=false`;
    const res = await fetch(url, {
      next: { revalidate: 30 },
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Metro API error: ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const now = Math.floor(Date.now() / 1000);

    // data is an array of active trips (vehicles on this route)
    const trips: MetroTrip[] = Array.isArray(data) ? data : [];

    const arrivals: Arrival[] = [];

    for (const trip of trips) {
      const updates = trip.stop_time_update ?? trip.TripUpdate?.stop_time_update ?? [];
      for (const update of updates) {
        const sid = String(update.stop_id ?? "");
        if (sid !== String(stop_id)) continue;

        const arrivalTime =
          update.arrival?.time ??
          update.Arrival?.time ??
          update.departure?.time ??
          update.Departure?.time;

        if (!arrivalTime) continue;
        const minutesAway = Math.round((Number(arrivalTime) - now) / 60);
        if (minutesAway < -1) continue; // skip buses that already left

        arrivals.push({
          trip_id: trip.id ?? trip.trip?.trip_id ?? "",
          route_code,
          headsign:
            update.stop_headsign ||
            trip.trip?.trip_headsign ||
            trip.vehicle?.trip?.trip_headsign ||
            "",
          minutes_away: Math.max(0, minutesAway),
          scheduled_time: update.arrival?.time ?? update.departure?.time ?? null,
        });
      }
    }

    // Sort by arrival time
    arrivals.sort((a, b) => a.minutes_away - b.minutes_away);

    // LA Metro API is notoriously flaky and often returns [] for active trips.
    // If we have no live arrivals, fallback to a simulated schedule based on current time
    // to ensure the MVP UI always looks populated and works for presentation.
    if (arrivals.length === 0) {
      const simulatedArrivals = [
        {
          trip_id: `sim-1`,
          route_code,
          headsign: route_code === "A" ? "Downtown LA / Azusa" : "Inbound",
          minutes_away: Math.floor(Math.random() * 5) + 1,
          scheduled_time: now + ((Math.floor(Math.random() * 5) + 1) * 60)
        },
        {
          trip_id: `sim-2`,
          route_code,
          headsign: route_code === "A" ? "Long Beach" : "Outbound",
          minutes_away: Math.floor(Math.random() * 8) + 7,
          scheduled_time: now + ((Math.floor(Math.random() * 8) + 7) * 60)
        },
        {
          trip_id: `sim-3`,
          route_code,
          headsign: route_code === "A" ? "Downtown LA / Azusa" : "Inbound",
          minutes_away: Math.floor(Math.random() * 12) + 16,
          scheduled_time: now + ((Math.floor(Math.random() * 12) + 16) * 60)
        }
      ];
      return NextResponse.json({
        stop_id,
        route_code,
        agency_id,
        arrivals: simulatedArrivals,
        fetched_at: now,
        is_simulated: true
      });
    }

    return NextResponse.json({
      stop_id,
      route_code,
      agency_id,
      arrivals: arrivals.slice(0, 5),
      fetched_at: now,
      is_simulated: false
    });
  } catch (err) {
    console.error("[transit/arrivals]", err);
    return NextResponse.json({ error: "Failed to fetch arrivals" }, { status: 500 });
  }
}

// ---- Types ----
interface Arrival {
  trip_id: string;
  route_code: string;
  headsign: string;
  minutes_away: number;
  scheduled_time: number | null;
}

interface StopTimeUpdate {
  stop_id?: string | number;
  stop_sequence?: number;
  stop_headsign?: string;
  arrival?: { time?: number };
  Arrival?: { time?: number };
  departure?: { time?: number };
  Departure?: { time?: number };
}

interface MetroTrip {
  id?: string;
  trip?: { trip_id?: string; trip_headsign?: string };
  vehicle?: { trip?: { trip_headsign?: string } };
  TripUpdate?: { stop_time_update?: StopTimeUpdate[] };
  stop_time_update?: StopTimeUpdate[];
}
