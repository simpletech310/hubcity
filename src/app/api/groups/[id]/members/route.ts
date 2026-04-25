import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/groups/[id]/members
 *
 * Query params:
 *   ?status=active   (default — confirmed members only)
 *   ?status=pending  (admins use this to render the approval queue)
 *   ?status=all      (active + pending merged)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const statusParam = (url.searchParams.get("status") ?? "active").toLowerCase();
    const supabase = await createClient();

    let query = supabase
      .from("group_members")
      .select(
        "role, status, joined_at, user:profiles!group_members_user_id_fkey(id, display_name, avatar_url, handle, role)"
      )
      .eq("group_id", id)
      .order("role", { ascending: true })
      .order("joined_at", { ascending: true });

    if (statusParam === "active" || statusParam === "pending") {
      query = query.eq("status", statusParam);
    }
    // 'all' → no status filter

    const { data: members, error } = await query;

    if (error) throw error;

    return NextResponse.json({ members: members ?? [] });
  } catch (error) {
    console.error("List members error:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}
