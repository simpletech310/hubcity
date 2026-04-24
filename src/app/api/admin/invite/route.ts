import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_ROLES = ["admin", "city_official", "city_ambassador"];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // ── Auth ──────────────────────────────────────────────────────────────────
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !ADMIN_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Body ──────────────────────────────────────────────────────────────────
    const { email, role, cityId } = await request.json();

    if (!email?.trim()) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    if (!cityId) {
      return NextResponse.json({ error: "cityId is required" }, { status: 400 });
    }

    const VALID_ROLES = ["content_creator", "resource_provider", "chamber_admin"];
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // TODO: Send actual invite email via Resend / SendGrid.
    // For now, record the pending invite and return success so the UI works.
    // The invite record could be persisted to a `creator_invites` table later.
    console.log(`[invite] admin=${user.id} invited ${email} as ${role} for city=${cityId}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Invite unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
