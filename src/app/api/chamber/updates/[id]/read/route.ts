import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/chamber/updates/[id]/read — mark update as read
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase
      .from("chamber_update_reads")
      .upsert({ update_id: id, user_id: user.id }, { onConflict: "update_id,user_id" });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark read error:", error);
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
  }
}
