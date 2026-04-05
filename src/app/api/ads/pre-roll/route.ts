import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/ads/pre-roll — returns a random active pre-roll ad
export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch all active pre-roll ads
    const { data: ads, error } = await supabase
      .from("video_ads")
      .select("id, mux_playback_id, title, cta_text, cta_url, business_id, duration, impression_count")
      .eq("is_active", true)
      .eq("ad_type", "pre_roll")
      .not("mux_playback_id", "is", null);

    if (error) {
      console.error("Pre-roll ad fetch error:", error);
      return NextResponse.json({ ad: null });
    }

    if (!ads || ads.length === 0) {
      return NextResponse.json({ ad: null });
    }

    // Pick a random ad
    const ad = ads[Math.floor(Math.random() * ads.length)];

    // Increment impression_count (fire and forget)
    supabase
      .from("video_ads")
      .update({ impression_count: (ad.impression_count || 0) + 1 })
      .eq("id", ad.id)
      .then(() => {});

    // Return ad without the impression_count field
    const { impression_count: _, ...adData } = ad;

    return NextResponse.json({ ad: adData });
  } catch (error) {
    console.error("Pre-roll ad error:", error);
    return NextResponse.json({ ad: null });
  }
}
