import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("food_tours")
      .select(
        "*, stops:food_tour_stops(*, business:businesses(id, name, slug, image_urls, address, rating_avg))"
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ tours: data ?? [] });
  } catch (error) {
    console.error("Food tours error:", error);
    return NextResponse.json(
      { error: "Failed to fetch food tours" },
      { status: 500 }
    );
  }
}
