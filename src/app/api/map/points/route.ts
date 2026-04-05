import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface MapPoint {
  id: string;
  type: string;
  name: string;
  latitude: number;
  longitude: number;
  metadata: Record<string, unknown>;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const typesParam = searchParams.get("types");
    const boundsParam = searchParams.get("bounds");
    const district = searchParams.get("district");

    const requestedTypes = typesParam
      ? typesParam.split(",").map((t) => t.trim())
      : ["businesses", "events", "city_issues", "health_resources"];

    let bounds: { sw_lat: number; sw_lng: number; ne_lat: number; ne_lng: number } | null = null;
    if (boundsParam) {
      const [sw_lat, sw_lng, ne_lat, ne_lng] = boundsParam.split(",").map(Number);
      bounds = { sw_lat, sw_lng, ne_lat, ne_lng };
    }

    const points: MapPoint[] = [];

    // Fetch businesses
    if (requestedTypes.includes("businesses")) {
      let query = supabase
        .from("businesses")
        .select("id, name, latitude, longitude, category, rating, status")
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      if (bounds) {
        query = query
          .gte("latitude", bounds.sw_lat)
          .lte("latitude", bounds.ne_lat)
          .gte("longitude", bounds.sw_lng)
          .lte("longitude", bounds.ne_lng);
      }

      if (district) {
        query = query.eq("district", parseInt(district, 10));
      }

      const { data } = await query;
      if (data) {
        for (const b of data) {
          points.push({
            id: b.id,
            type: "business",
            name: b.name,
            latitude: b.latitude,
            longitude: b.longitude,
            metadata: { category: b.category, rating: b.rating, status: b.status },
          });
        }
      }
    }

    // Fetch events
    if (requestedTypes.includes("events")) {
      let query = supabase
        .from("events")
        .select("id, title, latitude, longitude, category, start_date, status")
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      if (bounds) {
        query = query
          .gte("latitude", bounds.sw_lat)
          .lte("latitude", bounds.ne_lat)
          .gte("longitude", bounds.sw_lng)
          .lte("longitude", bounds.ne_lng);
      }

      if (district) {
        query = query.eq("district", parseInt(district, 10));
      }

      const { data } = await query;
      if (data) {
        for (const e of data) {
          points.push({
            id: e.id,
            type: "event",
            name: e.title,
            latitude: e.latitude,
            longitude: e.longitude,
            metadata: { category: e.category, start_date: e.start_date, status: e.status },
          });
        }
      }
    }

    // Fetch city issues
    if (requestedTypes.includes("city_issues")) {
      let query = supabase
        .from("city_issues")
        .select("id, title, latitude, longitude, category, status, severity")
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      if (bounds) {
        query = query
          .gte("latitude", bounds.sw_lat)
          .lte("latitude", bounds.ne_lat)
          .gte("longitude", bounds.sw_lng)
          .lte("longitude", bounds.ne_lng);
      }

      if (district) {
        query = query.eq("district", parseInt(district, 10));
      }

      const { data } = await query;
      if (data) {
        for (const i of data) {
          points.push({
            id: i.id,
            type: "city_issue",
            name: i.title,
            latitude: i.latitude,
            longitude: i.longitude,
            metadata: { category: i.category, status: i.status, severity: i.severity },
          });
        }
      }
    }

    // Fetch health resources
    if (requestedTypes.includes("health_resources")) {
      let query = supabase
        .from("health_resources")
        .select("id, name, latitude, longitude, resource_type, phone, address")
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      if (bounds) {
        query = query
          .gte("latitude", bounds.sw_lat)
          .lte("latitude", bounds.ne_lat)
          .gte("longitude", bounds.sw_lng)
          .lte("longitude", bounds.ne_lng);
      }

      const { data } = await query;
      if (data) {
        for (const h of data) {
          points.push({
            id: h.id,
            type: "health_resource",
            name: h.name,
            latitude: h.latitude,
            longitude: h.longitude,
            metadata: { resource_type: h.resource_type, phone: h.phone, address: h.address },
          });
        }
      }
    }

    return NextResponse.json(points);
  } catch (error) {
    console.error("Map points error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
