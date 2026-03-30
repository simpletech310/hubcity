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
