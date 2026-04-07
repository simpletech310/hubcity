import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/products/[id]/variants
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: variants, error } = await supabase
      .from("product_variants")
      .select("*")
      .eq("menu_item_id", id)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ variants: variants || [] });
  } catch (error) {
    console.error("Product variants fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch variants" }, { status: 500 });
  }
}

// POST /api/products/[id]/variants — add a variant
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify ownership through menu_item -> business
    const { data: item } = await supabase
      .from("menu_items")
      .select("id, business_id")
      .eq("id", id)
      .single();

    if (!item) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const { data: biz } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", item.business_id)
      .eq("owner_id", user.id)
      .single();

    if (!biz) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

    const body = await request.json();
    const { name, sku, price_override, stock_count, attributes, sort_order } = body;

    if (!name) {
      return NextResponse.json({ error: "Variant name is required" }, { status: 400 });
    }

    const { data: variant, error } = await supabase
      .from("product_variants")
      .insert({
        menu_item_id: id,
        name: name.trim(),
        sku: sku?.trim() || null,
        price_override: price_override ?? null,
        stock_count: stock_count ?? 0,
        attributes: attributes || {},
        sort_order: sort_order ?? 0,
        is_available: true,
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ variant });
  } catch (error) {
    console.error("Create product variant error:", error);
    return NextResponse.json({ error: "Failed to create variant" }, { status: 500 });
  }
}
