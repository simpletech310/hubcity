import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("food_promotions")
      .select("*, business:businesses(id, name, slug, image_urls)")
      .eq("is_active", true)
      .gt("valid_until", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ promotions: data ?? [] });
  } catch (error) {
    console.error("Food promotions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch promotions" },
      { status: 500 }
    );
  }
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

    const { title, description, promo_type, promo_code, valid_from, valid_until } =
      await request.json();

    if (!title || !promo_type || !valid_until) {
      return NextResponse.json(
        { error: "title, promo_type, and valid_until are required" },
        { status: 400 }
      );
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: "No business found for this user" },
        { status: 403 }
      );
    }

    const { data: promotion, error: insertError } = await supabase
      .from("food_promotions")
      .insert({
        business_id: business.id,
        title,
        description: description || null,
        promo_type,
        promo_code: promo_code || null,
        valid_from: valid_from || new Date().toISOString(),
        valid_until,
        is_active: true,
      })
      .select("*")
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ promotion });
  } catch (error) {
    console.error("Create promotion error:", error);
    return NextResponse.json(
      { error: "Failed to create promotion" },
      { status: 500 }
    );
  }
}
