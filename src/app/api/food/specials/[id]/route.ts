import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const { data: special } = await supabase
      .from("food_specials")
      .select("id, business:businesses(owner_id)")
      .eq("id", id)
      .single();

    if (
      !special ||
      !special.business ||
      (special.business as unknown as { owner_id: string }).owner_id !== user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const allowedFields = [
      "title",
      "description",
      "original_price",
      "special_price",
      "valid_from",
      "valid_until",
      "is_active",
    ];
    const updateData: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }

    const { data: updated, error } = await supabase
      .from("food_specials")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ special: updated });
  } catch (error) {
    console.error("Update special error:", error);
    return NextResponse.json(
      { error: "Failed to update special" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const { data: special } = await supabase
      .from("food_specials")
      .select("id, business:businesses(owner_id)")
      .eq("id", id)
      .single();

    if (
      !special ||
      !special.business ||
      (special.business as unknown as { owner_id: string }).owner_id !== user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
      .from("food_specials")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete special error:", error);
    return NextResponse.json(
      { error: "Failed to delete special" },
      { status: 500 }
    );
  }
}
