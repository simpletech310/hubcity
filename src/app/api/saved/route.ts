import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST — Toggle save/unsave an item
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { item_type, item_id } = await request.json();

    if (
      !item_type ||
      !item_id ||
      ![
        "business",
        "event",
        "resource",
        "album",
        "track",
        "group",
        "creator",
      ].includes(item_type)
    ) {
      return NextResponse.json(
        { error: "Invalid item_type or item_id" },
        { status: 400 }
      );
    }

    // Check if already saved
    const { data: existing } = await supabase
      .from("saved_items")
      .select("id")
      .match({ user_id: user.id, item_type, item_id })
      .single();

    if (existing) {
      // Unsave
      await supabase
        .from("saved_items")
        .delete()
        .match({ user_id: user.id, item_type, item_id });

      return NextResponse.json({ saved: false });
    } else {
      // Save
      const { error } = await supabase.from("saved_items").insert({
        user_id: user.id,
        item_type,
        item_id,
      });

      if (error) throw error;
      return NextResponse.json({ saved: true });
    }
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json(
      { error: "Failed to save item" },
      { status: 500 }
    );
  }
}

// GET — Check if items are saved
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ items: [] });
    }

    const { searchParams } = new URL(request.url);
    const itemType = searchParams.get("item_type");
    const itemId = searchParams.get("item_id");

    if (itemType && itemId) {
      // Check single item
      const { data } = await supabase
        .from("saved_items")
        .select("id")
        .match({ user_id: user.id, item_type: itemType, item_id: itemId })
        .single();

      return NextResponse.json({ saved: !!data });
    }

    // Get all saved items
    const { data: items } = await supabase
      .from("saved_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    return NextResponse.json({ items: items || [] });
  } catch (error) {
    console.error("Saved items error:", error);
    return NextResponse.json({ items: [] });
  }
}
