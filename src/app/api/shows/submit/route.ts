import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "auth required" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const show_title = typeof body.show_title === "string" ? body.show_title.trim() : "";
  const synopsis = typeof body.synopsis === "string" ? body.synopsis.trim() : "";

  if (!show_title || !synopsis) {
    return NextResponse.json(
      { error: "show_title and synopsis are required" },
      { status: 400 }
    );
  }

  const row = {
    submitter_id: user.id,
    show_title,
    synopsis,
    channel_slug: typeof body.channel_slug === "string" ? body.channel_slug : null,
    tagline: typeof body.tagline === "string" ? body.tagline : null,
    format: typeof body.format === "string" ? body.format : null,
    pilot_video_url: typeof body.pilot_video_url === "string" ? body.pilot_video_url : null,
    social_links:
      body.social_links && typeof body.social_links === "object" ? body.social_links : {},
    status: "pending" as const,
  };

  const { data, error } = await supabase
    .from("show_submissions")
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error("show_submissions insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ submission: data });
}
