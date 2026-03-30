import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStrictRateLimiter, checkRateLimit } from "@/lib/ratelimit";

const VALID_CONTENT_TYPES = ["video", "podcast", "both"];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    const { channel_name, content_type, description, portfolio_url, social_links } =
      await request.json();

    // Validate required fields
    if (!channel_name || typeof channel_name !== "string" || !channel_name.trim()) {
      return NextResponse.json(
        { error: "Channel name is required" },
        { status: 400 }
      );
    }

    if (!content_type || !VALID_CONTENT_TYPES.includes(content_type)) {
      return NextResponse.json(
        { error: "Content type must be 'video', 'podcast', or 'both'" },
        { status: 400 }
      );
    }

    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    // Check for existing pending application
    const { data: existing } = await supabase
      .from("creator_applications")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "You already have a pending application" },
        { status: 409 }
      );
    }

    // Insert application
    const { data: application, error } = await supabase
      .from("creator_applications")
      .insert({
        user_id: user.id,
        channel_name: channel_name.trim(),
        content_type,
        description: description.trim(),
        portfolio_url: portfolio_url || null,
        social_links: social_links || null,
        status: "pending",
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ application });
  } catch (error) {
    console.error("Creator application error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
