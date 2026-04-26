import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
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

    const body = await request.json().catch(() => ({}));
    const { photo_url, caption } = body as { photo_url?: string; caption?: string };

    // Confirm challenge exists + active
    const { data: challenge } = await supabase
      .from("food_challenges")
      .select("id, name, business_id, is_active")
      .eq("id", id)
      .maybeSingle();
    if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    if (!challenge.is_active) {
      return NextResponse.json({ error: "Challenge is closed" }, { status: 400 });
    }

    const { data: completion, error } = await supabase
      .from("challenge_completions")
      .insert({
        challenge_id: id,
        user_id: user.id,
        photo_url: photo_url || null,
        caption: caption || null,
      })
      .select("*")
      .single();

    if (error) {
      // 23505 = unique violation (already completed)
      if ((error as { code?: string }).code === "23505") {
        return NextResponse.json(
          { error: "You've already completed this challenge" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Notify business owner (fire-and-forget)
    if (challenge.business_id) {
      supabase
        .from("businesses")
        .select("owner_id")
        .eq("id", challenge.business_id)
        .single()
        .then(({ data: biz }) => {
          if (biz?.owner_id) {
            supabase
              .from("notifications")
              .insert({
                user_id: biz.owner_id,
                type: "business",
                title: "Someone completed your challenge",
                body: `New completion submitted for ${challenge.name}`,
                link_type: "food_challenge",
                link_id: challenge.id,
              })
              .then(({ error: notifError }) => {
                if (notifError) console.error("Notification insert error:", notifError);
              });
          }
        });
    }

    return NextResponse.json({ completion });
  } catch (err) {
    console.error("Complete challenge error:", err);
    return NextResponse.json({ error: "Failed to submit completion" }, { status: 500 });
  }
}
