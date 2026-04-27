import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/profile/onboarding-complete
 * Marks a fresh-signup citizen as onboarded. Optionally persists
 * picked interest tags + a preferred language. Pairs with the
 * /onboarding flow + middleware redirect.
 *
 * Body: { interests?: string[], preferred_language?: 'en'|'es' }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));

    const patch: Record<string, unknown> = {
      onboarded_at: new Date().toISOString(),
    };
    if (body.preferred_language === "en" || body.preferred_language === "es") {
      patch.preferred_language = body.preferred_language;
    }

    const { error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", user.id);
    if (error) throw error;

    // Interest tags: optional, persisted via the existing user_interests
    // table when category slugs match an existing culture_category. We
    // best-effort match here so the rest of the flow doesn't fail when
    // a tag doesn't have a corresponding category yet.
    if (Array.isArray(body.interests) && body.interests.length > 0) {
      const slugs = body.interests
        .filter((t: unknown) => typeof t === "string")
        .slice(0, 12);
      if (slugs.length > 0) {
        const { data: cats } = await supabase
          .from("culture_categories")
          .select("id, slug")
          .in("slug", slugs);
        if (cats && cats.length > 0) {
          await supabase.from("user_interests").upsert(
            cats.map((c) => ({
              user_id: user.id,
              category_id: c.id,
              weight: 3,
            })),
            { onConflict: "user_id,category_id" },
          );
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Onboarding complete error:", err);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 },
    );
  }
}
