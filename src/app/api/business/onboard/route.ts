import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveCityByZip, listLiveCities } from "@/lib/cities";
import { getStrictRateLimiter, checkRateLimit } from "@/lib/ratelimit";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit(getStrictRateLimiter(), user.id);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", reset: rl.reset },
        { status: 429 }
      );
    }

    const { name, category, description, address, phone, website, hours, is_mobile_vendor } =
      await request.json();

    if (!name || !category || !address) {
      return NextResponse.json(
        { error: "name, category, and address are required" },
        { status: 400 }
      );
    }

    // Resolve ZIP → one of the live cities. Ambiguous or unknown ZIPs are rejected.
    const zipMatch = address.match(/\b(\d{5})\b/);
    if (!zipMatch) {
      return NextResponse.json(
        { error: "Could not detect a ZIP code in the address." },
        { status: 400 }
      );
    }
    const { city: matchedCity, ambiguous } = await resolveCityByZip(zipMatch[1]);
    if (!matchedCity || matchedCity.launch_status !== "live") {
      const live = await listLiveCities();
      const liveNames = live.map((c) => c.name).join(", ");
      return NextResponse.json(
        {
          error: ambiguous
            ? `ZIP ${zipMatch[1]} matches multiple cities; please contact support.`
            : `Business address must be in a supported city (${liveNames}).`,
        },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Create business record
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .insert({
        owner_id: user.id,
        city_id: matchedCity.id,
        name,
        slug,
        category,
        description: description || null,
        address,
        phone: phone || null,
        website: website || null,
        hours: hours || {},
        image_urls: [],
        badges: [],
        menu: [],
        rating_avg: 0,
        rating_count: 0,
        vote_count: 0,
        is_featured: false,
        is_published: false,
        accepts_orders: false,
        accepts_bookings: false,
        delivery_enabled: false,
        min_order: 0,
        is_mobile_vendor: is_mobile_vendor ?? false,
      })
      .select("*")
      .single();

    if (bizError) throw bizError;

    // Update user profile role to business_owner
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role: "business_owner" })
      .eq("id", user.id);

    if (profileError) {
      console.error("Failed to update profile role:", profileError);
    }

    return NextResponse.json({ business });
  } catch (error) {
    console.error("Business onboard error:", error);
    return NextResponse.json(
      { error: "Failed to create business" },
      { status: 500 }
    );
  }
}
