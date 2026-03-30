import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: podcast, error } = await supabase
      .from("podcasts")
      .select("*, channel:channels(id, name, slug, avatar_url, type)")
      .eq("id", id)
      .single();

    if (error || !podcast) {
      return NextResponse.json(
        { error: "Podcast not found" },
        { status: 404 }
      );
    }

    // Increment listen count
    await supabase
      .from("podcasts")
      .update({ listen_count: (podcast.listen_count || 0) + 1 })
      .eq("id", id);

    return NextResponse.json({ podcast });
  } catch (error) {
    console.error("Fetch podcast error:", error);
    return NextResponse.json(
      { error: "Failed to fetch podcast" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
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

    if (!profile || !["admin", "city_official"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    const allowedFields = [
      "title",
      "description",
      "audio_url",
      "duration",
      "episode_number",
      "season_number",
      "thumbnail_url",
      "transcript",
      "is_published",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (body.is_published && !updates.published_at) {
      updates.published_at = new Date().toISOString();
    }

    const { data: podcast, error } = await supabase
      .from("podcasts")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ podcast });
  } catch (error) {
    console.error("Update podcast error:", error);
    return NextResponse.json(
      { error: "Failed to update podcast" },
      { status: 500 }
    );
  }
}
