import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/surveys/[id] — Get single survey with questions and author
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: survey, error } = await supabase
    .from("surveys")
    .select(
      "*, questions:survey_questions(*), author:profiles(id, display_name, avatar_url, role, verification_status)"
    )
    .eq("id", id)
    .single();

  if (error || !survey) {
    return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  }

  return NextResponse.json({ survey });
}

// PATCH /api/surveys/[id] — Update survey status/publish. Author only.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify author
    const { data: survey } = await supabase
      .from("surveys")
      .select("author_id")
      .eq("id", id)
      .single();

    if (!survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    if (survey.author_id !== user.id) {
      return NextResponse.json(
        { error: "Only the author can update this survey" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (!["draft", "active", "closed"].includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updates.status = body.status;
    }

    if (body.is_published !== undefined) {
      updates.is_published = body.is_published;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data: updated, error } = await supabase
      .from("surveys")
      .update(updates)
      .eq("id", id)
      .select(
        "*, questions:survey_questions(*), author:profiles(id, display_name, avatar_url, role, verification_status)"
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ survey: updated });
  } catch (error) {
    console.error("Survey update error:", error);
    return NextResponse.json(
      { error: "Failed to update survey" },
      { status: 500 }
    );
  }
}
