import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: comments, error } = await supabase
      .from("city_issue_comments")
      .select(
        "*, author:profiles!author_id(id, display_name, avatar_url, role)"
      )
      .eq("issue_id", id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ comments: comments ?? [] });
  } catch (error) {
    console.error("Fetch issue comments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const { id } = await params;
    const body = await request.json();

    if (!body.body?.trim()) {
      return NextResponse.json(
        { error: "Comment body is required" },
        { status: 400 }
      );
    }

    // Check if the user is a city official or admin for is_official flag
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isOfficial =
      profile?.role === "city_official" || profile?.role === "admin";

    const { data: comment, error } = await supabase
      .from("city_issue_comments")
      .insert({
        issue_id: id,
        author_id: user.id,
        body: body.body.trim(),
        is_official: isOfficial,
      })
      .select(
        "*, author:profiles!author_id(id, display_name, avatar_url, role)"
      )
      .single();

    if (error) throw error;

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Create issue comment error:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
