import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("food_specials")
      .select("*, business:businesses(id, name, slug, image_urls)")
      .eq("is_active", true)
      .gt("valid_until", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ specials: data ?? [] });
  } catch (error) {
    console.error("Food specials error:", error);
    return NextResponse.json(
      { error: "Failed to fetch specials" },
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

    const { title, description, original_price, special_price, valid_from, valid_until } =
      await request.json();

    if (!title || !original_price || !special_price || !valid_until) {
      return NextResponse.json(
        { error: "title, original_price, special_price, and valid_until are required" },
        { status: 400 }
      );
    }

    // Verify user owns a business
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

    const { data: special, error: insertError } = await supabase
      .from("food_specials")
      .insert({
        business_id: business.id,
        title,
        description: description || null,
        original_price,
        special_price,
        valid_from: valid_from || new Date().toISOString(),
        valid_until,
        is_active: true,
      })
      .select("*")
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ special });
  } catch (error) {
    console.error("Create special error:", error);
    return NextResponse.json(
      { error: "Failed to create special" },
      { status: 500 }
    );
  }
}
