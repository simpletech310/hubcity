import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_FIELDS = [
  "name",
  "description",
  "image_url",
  "challenge_type",
  "rules",
  "prize_description",
  "start_date",
  "end_date",
  "is_active",
];

async function loadOwnedChallenge(supabase: Awaited<ReturnType<typeof createClient>>, id: string, userId: string) {
  const { data: challenge } = await supabase
    .from("food_challenges")
    .select("id, business_id, business:businesses!inner(owner_id)")
    .eq("id", id)
    .maybeSingle();
  if (!challenge) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  // business is array-or-object depending on relationship inference
  const ownerId = Array.isArray(challenge.business)
    ? (challenge.business[0] as { owner_id: string } | undefined)?.owner_id
    : (challenge.business as { owner_id: string } | null)?.owner_id;
  if (ownerId !== userId) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { challenge };
}

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
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const owned = await loadOwnedChallenge(supabase, id, user.id);
    if ("error" in owned) return owned.error;

    const body = await request.json();
    const updates: Record<string, unknown> = {};
    for (const k of ALLOWED_FIELDS) {
      if (k in body) updates[k] = body[k];
    }

    if ("challenge_type" in updates && !["eating", "collection", "photo"].includes(updates.challenge_type as string)) {
      return NextResponse.json({ error: "Invalid challenge_type" }, { status: 400 });
    }

    const { data: challenge, error } = await supabase
      .from("food_challenges")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ challenge });
  } catch (err) {
    console.error("Update challenge error:", err);
    return NextResponse.json({ error: "Failed to update challenge" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const owned = await loadOwnedChallenge(supabase, id, user.id);
    if ("error" in owned) return owned.error;

    // Soft-delete: deactivate so completion history is preserved.
    const { error } = await supabase
      .from("food_challenges")
      .update({ is_active: false })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete challenge error:", err);
    return NextResponse.json({ error: "Failed to delete challenge" }, { status: 500 });
  }
}
