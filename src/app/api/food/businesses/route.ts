import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCityBySlug } from "@/lib/cities";
import { getActiveCity } from "@/lib/city-context";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const subtype = searchParams.get("subtype"); // restaurant, food_truck, cart
    const citySlug = searchParams.get("city");

    // Resolve city: explicit slug param > active city from cookie/profile.
    let cityId: string | null = null;
    if (citySlug) {
      const c = await getCityBySlug(citySlug);
      if (c) cityId = c.id;
    } else {
      const active = await getActiveCity();
      if (active) cityId = active.id;
    }

    let query = supabase
      .from("businesses")
      .select("*, city:cities(id, slug, name)")
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .order("rating_avg", { ascending: false });

    if (cityId) {
      query = query.eq("city_id", cityId);
    }

    if (subtype) {
      if (subtype === "food_truck") {
        query = query.eq("is_mobile_vendor", true).eq("category", "restaurant");
      } else if (subtype === "cart") {
        query = query.eq("is_mobile_vendor", true);
      } else if (subtype === "restaurant") {
        query = query.eq("category", "restaurant").eq("is_mobile_vendor", false);
      } else {
        query = query.eq("category", subtype);
      }
    } else {
      // All food businesses: restaurants + mobile vendors
      query = query.eq("category", "restaurant");
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ businesses: data ?? [] });
  } catch (error) {
    console.error("Food businesses error:", error);
    return NextResponse.json(
      { error: "Failed to fetch food businesses" },
      { status: 500 }
    );
  }
}
