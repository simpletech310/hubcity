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
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    // Get current user's role + reactions
    let myRole: string | null = null;
    let userReactions: Record<string, string[]> = {};

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: membership } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", id)
        .eq("user_id", user.id)
        .single();

      myRole = membership?.role ?? null;

      // Fetch user's reactions for these posts
      if (posts && posts.length > 0) {
        const postIds = posts.map((p: { id: string }) => p.id);
        const { data: reactions } = await supabase
          .from("group_post_reactions")
          .select("group_post_id, emoji")
          .eq("user_id", user.id)
          .in("group_post_id", postIds);

        if (reactions) {
          for (const r of reactions) {
            if (!userReactions[r.group_post_id]) userReactions[r.group_post_id] = [];
            userReactions[r.group_post_id].push(r.emoji);
          }
        }
      }
    }

    return NextResponse.json({
      posts: posts || [],
      my_role: myRole,
      user_reactions: userReactions,
      user_id: user?.id ?? null,
    });
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
