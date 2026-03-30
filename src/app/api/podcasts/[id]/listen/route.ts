import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/podcasts/[id]/listen — increment listen count
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // Read current count then increment
    const { data } = await supabase
      .from("podcasts")
      .select("listen_count")
      .eq("id", id)
      .single();

    if (data) {
      await supabase
        .from("podcasts")
        .update({ listen_count: (data.listen_count || 0) + 1 })
        .eq("id", id);
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Listen counting is fire-and-forget
    return NextResponse.json({ ok: true });
  }
}
