import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const businessId = url.searchParams.get("business_id");

    let query = supabase
      .from("food_challenges")
      .select("*, business:businesses(id, name, slug)")
      .eq("is_active", true)
      .gte("end_date", new Date().toISOString().split("T")[0])
      .order("start_date", { ascending: true });

    if (businessId) {
      query = query.eq("business_id", businessId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ challenges: data ?? [] });
  } catch (error) {
    console.error("Food challenges error:", error);
    return NextResponse.json(
      { error: "Failed to fetch challenges" },
      { status: 500 }
    );
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      image_url,
      challenge_type,
      rules,
      prize_description,
      start_date,
      end_date,
    } = body;

    if (!name || !challenge_type || !start_date || !end_date) {
      return NextResponse.json(
        { error: "name, challenge_type, start_date, end_date are required" },
        { status: 400 }
      );
    }

    if (!["eating", "collection", "photo"].includes(challenge_type)) {
      return NextResponse.json(
        { error: "challenge_type must be eating, collection, or photo" },
        { status: 400 }
      );
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("id, category, is_mobile_vendor")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!business) {
      return NextResponse.json(
        { error: "No business found for this user" },
        { status: 403 }
      );
    }

    const isFoodVendor =
      business.category === "restaurant" || business.is_mobile_vendor === true;
    if (!isFoodVendor) {
      return NextResponse.json(
        { error: "Only food vendors can create challenges" },
        { status: 403 }
      );
    }

    let slug = slugify(name);
    if (!slug) slug = `challenge-${Date.now()}`;
    const { data: existing } = await supabase
      .from("food_challenges")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (existing) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 7)}`;
    }

    const { data: challenge, error: insertError } = await supabase
      .from("food_challenges")
      .insert({
        business_id: business.id,
        name: String(name).trim(),
        slug,
        description: String(description ?? "").trim(),
        image_url: image_url || null,
        challenge_type,
        rules: rules || null,
        prize_description: prize_description || null,
        start_date,
        end_date,
        is_active: true,
        created_by: user.id,
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("Insert challenge error:", insertError);
      return NextResponse.json(
        { error: insertError.message || "Failed to create challenge" },
        { status: 400 }
      );
    }

    return NextResponse.json({ challenge });
  } catch (error) {
    console.error("Create challenge error:", error);
    return NextResponse.json(
      { error: "Failed to create challenge" },
      { status: 500 }
    );
  }
}
