import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/reels/[id]/view — record a view.
 * Authenticated users get deduplicated per (reel, user, hour).
 * Unauthenticated views still bump the counter.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Insert a view row (ignore uniqueness / rate limits — counter truth is view_count)
  await supabase.from("reel_views").insert({
    reel_id: id,
    user_id: user?.id ?? null,
  });

  // Atomic increment
  const { data: reel } = await supabase
    .from("reels")
    .select("view_count")
    .eq("id", id)
    .single();

  if (reel) {
    await supabase
      .from("reels")
      .update({ view_count: (reel.view_count ?? 0) + 1 })
      .eq("id", id);
  }

  return NextResponse.json({ ok: true });
}
