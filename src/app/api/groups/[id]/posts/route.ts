import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/groups/[id]/posts — list posts in a group
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: posts, error } = await supabase
      .from("group_posts")
      .select("*, author:profiles!group_posts_author_id_fkey(id, display_name, avatar_url, handle, role)")
      .eq("group_id", id)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ posts: posts || [] });
  } catch (error) {
    console.error("Fetch group posts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch group posts" },
      { status: 500 }
    );
  }
}

// POST /api/groups/[id]/posts — create a post in a group (members only)
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

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify membership
    const { data: membership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "You must be a member of this group to post" },
        { status: 403 }
      );
    }

    const { body, image_url } = await request.json();

    if (!body || typeof body !== "string" || !body.trim()) {
      return NextResponse.json(
        { error: "Post body is required" },
        { status: 400 }
      );
    }

    const { data: post, error } = await supabase
      .from("group_posts")
      .insert({
        group_id: id,
        author_id: user.id,
        body: body.trim(),
        image_url: image_url || null,
        is_published: true,
        reaction_counts: {},
      })
      .select("*, author:profiles!group_posts_author_id_fkey(id, display_name, avatar_url, handle, role)")
      .single();

    if (error) throw error;

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Create group post error:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
