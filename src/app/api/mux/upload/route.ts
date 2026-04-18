import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createMuxClient } from "@/lib/mux";
import { getStrictRateLimiter, checkRateLimit } from "@/lib/ratelimit";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit(getStrictRateLimiter(), user.id);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", reset: rl.reset },
        { status: 429 }
      );
    }

    // Only creators, admins, and city officials can upload
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_creator")
      .eq("id", user.id)
      .single();

    const allowedRoles = ["admin", "city_official", "city_ambassador", "content_creator"];
    if (!profile?.is_creator && !allowedRoles.includes(profile?.role || "")) {
      return NextResponse.json(
        { error: "Only creators can upload content" },
        { status: 403 }
      );
    }

    const mux = createMuxClient();

    const upload = await mux.video.uploads.create({
      cors_origin: process.env.NEXT_PUBLIC_APP_URL || "*",
      new_asset_settings: {
        playback_policy: ["public"],
        encoding_tier: "baseline",
      },
    });

    return NextResponse.json({
      upload_url: upload.url,
      upload_id: upload.id,
    });
  } catch (error) {
    console.error("Mux upload creation error:", error);
    return NextResponse.json(
      { error: "Failed to create upload" },
      { status: 500 }
    );
  }
}
