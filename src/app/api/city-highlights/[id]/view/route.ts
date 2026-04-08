import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: highlightId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: true }); // Silent for unauthenticated
    }

    // Upsert view (ON CONFLICT DO NOTHING)
    await supabase
      .from("highlight_views")
      .upsert(
        { highlight_id: highlightId, user_id: user.id },
        { onConflict: "highlight_id,user_id", ignoreDuplicates: true }
      );

    // Increment view count on highlight
    const { data: highlight } = await supabase
      .from("city_highlights")
      .select("view_count")
      .eq("id", highlightId)
      .single();

    if (highlight) {
      await supabase
        .from("city_highlights")
        .update({ view_count: (highlight.view_count || 0) + 1 })
        .eq("id", highlightId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Highlight view error:", error);
    return NextResponse.json({ ok: true }); // Don't fail on view tracking
  }
}
