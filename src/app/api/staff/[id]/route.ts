import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const { data: existing } = await supabase
      .from("business_staff")
      .select("business_id")
      .eq("id", id)
      .single();

    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: biz } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", existing.business_id)
      .eq("owner_id", user.id)
      .single();

    if (!biz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const allowedFields = ["name", "role", "email", "phone", "specialties", "is_active", "avatar_url"];
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowedFields) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const { data: staff, error } = await supabase
      .from("business_staff")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    // Update service links if provided
    if (body.service_ids !== undefined) {
      await supabase.from("staff_services").delete().eq("staff_id", id);
      if (body.service_ids.length > 0) {
        const links = body.service_ids.map((sid: string) => ({
          staff_id: id,
          service_id: sid,
        }));
        await supabase.from("staff_services").insert(links);
      }
    }

    return NextResponse.json({ staff });
  } catch (error) {
    console.error("Update staff error:", error);
    return NextResponse.json({ error: "Failed to update staff" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const { data: existing } = await supabase
      .from("business_staff")
      .select("business_id")
      .eq("id", id)
      .single();

    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: biz } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", existing.business_id)
      .eq("owner_id", user.id)
      .single();

    if (!biz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { error } = await supabase
      .from("business_staff")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Delete staff error:", error);
    return NextResponse.json({ error: "Failed to delete staff" }, { status: 500 });
  }
}
