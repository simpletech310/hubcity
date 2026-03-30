import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { business_id, name, description, price, image_url, category, sort_order } =
      await request.json();

    if (!business_id || !name || price === undefined) {
      return NextResponse.json(
        { error: "business_id, name, and price are required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", business_id)
      .eq("owner_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: "Not authorized to manage this business" },
        { status: 403 }
      );
    }

    const { data: menuItem, error } = await supabase
      .from("menu_items")
      .insert({
        business_id,
        name,
        description: description || null,
        price,
        image_url: image_url || null,
        category: category || null,
        sort_order: sort_order ?? 0,
        is_available: true,
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ menu_item: menuItem });
  } catch (error) {
    console.error("Create menu item error:", error);
    return NextResponse.json(
      { error: "Failed to create menu item" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const business_id = searchParams.get("business_id");

    if (!business_id) {
      return NextResponse.json(
        { error: "business_id query param is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: menuItems, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("business_id", business_id)
      .order("sort_order", { ascending: true })
      .order("category", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ menu_items: menuItems });
  } catch (error) {
    console.error("Get menu items error:", error);
    return NextResponse.json(
      { error: "Failed to get menu items" },
      { status: 500 }
    );
  }
}
