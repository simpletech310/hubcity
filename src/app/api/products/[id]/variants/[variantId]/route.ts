import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const { id, variantId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership: variant -> menu_item -> business -> owner
    const { data: menuItem } = await supabase
      .from("menu_items")
      .select("id, business_id")
      .eq("id", id)
      .single();

    if (!menuItem) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", menuItem.business_id)
      .eq("owner_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    // Verify variant belongs to this menu item
    const { data: variant } = await supabase
      .from("product_variants")
      .select("id")
      .eq("id", variantId)
      .eq("menu_item_id", id)
      .single();

    if (!variant) {
      return NextResponse.json(
        { error: "Variant not found" },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("product_variants")
      .delete()
      .eq("id", variantId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete variant error:", error);
    return NextResponse.json(
      { error: "Failed to delete variant" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const { id, variantId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const { data: menuItem } = await supabase
      .from("menu_items")
      .select("id, business_id")
      .eq("id", id)
      .single();

    if (!menuItem) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", menuItem.business_id)
      .eq("owner_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const updates = await request.json();
    const allowedFields = [
      "name",
      "sku",
      "price_override",
      "stock_count",
      "attributes",
      "sort_order",
      "is_available",
    ];
    const sanitized: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in updates) {
        sanitized[key] = updates[key];
      }
    }

    const { data: updated, error } = await supabase
      .from("product_variants")
      .update(sanitized)
      .eq("id", variantId)
      .eq("menu_item_id", id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ variant: updated });
  } catch (error) {
    console.error("Update variant error:", error);
    return NextResponse.json(
      { error: "Failed to update variant" },
      { status: 500 }
    );
  }
}
