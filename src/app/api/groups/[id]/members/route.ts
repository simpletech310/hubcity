import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: members, error } = await supabase
      .from("group_members")
      .select("role, joined_at, user:profiles!group_members_user_id_fkey(id, display_name, avatar_url, handle, role)")
      .eq("group_id", id)
      .order("role", { ascending: true })
      .order("joined_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ members: members ?? [] });
  } catch (error) {
    console.error("List members error:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}
