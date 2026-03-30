import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const subtype = searchParams.get("subtype"); // restaurant, food_truck, cart

    let query = supabase
      .from("businesses")
      .select("*")
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .order("rating_avg", { ascending: false });

    if (subtype) {
      // Filter by specific food subtype
      if (subtype === "food_truck") {
        query = query.eq("is_mobile_vendor", true).eq("category", "restaurant");
      } else if (subtype === "cart") {
        query = query.eq("is_mobile_vendor", true);
      } else {
        query = query.eq("category", subtype).eq("is_mobile_vendor", false);
      }
    } else {
      // All food businesses: restaurants, food_trucks, bakeries, cafes, or mobile vendors
      query = query.or(
        "category.in.(restaurant,food_truck,bakery,cafe),is_mobile_vendor.eq.true"
      );
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
