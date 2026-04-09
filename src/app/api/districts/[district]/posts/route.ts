import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/districts/[district]/posts — list posts for a district
export async function GET(
  request: Request,
  { params }: { params: Promise<{ district: string }> }
) {
  try {
    const { district } = await params;
    const districtNum = parseInt(district, 10);
    if (isNaN(districtNum)) {
      return NextResponse.json({ error: "Invalid district number" }, { status: 400 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let query = supabase
      .from("district_posts")
      .select("*, author:profiles!district_posts_author_id_fkey(id, display_name, avatar_url, handle, role)")
      .eq("district", districtNum)
      .eq("is_published", true)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20);

    if (type && ["update", "alert", "photo"].includes(type)) {
      query = query.eq("post_type", type);
    }

    const { data: posts, error } = await query;

    if (error) throw error;

    // Get current user's reactions
    let userReactions: Record<string, string[]> = {};

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && posts && posts.length > 0) {
      const postIds = posts.map((p: { id: string }) => p.id);
      const { data: reactions } = await supabase
        .from("district_post_reactions")
        .select("district_post_id, emoji")
        .eq("user_id", user.id)
        .in("district_post_id", postIds);

      if (reactions) {
        for (const r of reactions) {
          if (!userReactions[r.district_post_id]) userReactions[r.district_post_id] = [];
          userReactions[r.district_post_id].push(r.emoji);
        }
      }
    }

    return NextResponse.json({
      posts: posts || [],
      user_reactions: userReactions,
      user_id: user?.id ?? null,
    });
  } catch (error) {
    console.error("Fetch district posts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch district posts" },
      { status: 500 }
    );
  }
}

// POST /api/districts/[district]/posts — create a district post (city officials only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ district: string }> }
) {
  try {
    const { district } = await params;
    const districtNum = parseInt(district, 10);
    if (isNaN(districtNum)) {
      return NextResponse.json({ error: "Invalid district number" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify city_official role and matching district
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, district")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "city_official") {
      return NextResponse.json(
        { error: "Only city officials can create district posts" },
        { status: 403 }
      );
    }

    if (profile.district !== districtNum) {
      return NextResponse.json(
        { error: "You can only post in your assigned district" },
        { status: 403 }
      );
    }

    const { post_type, title, body, image_url, video_url, media_type } = await request.json();

    if (!body || typeof body !== "string" || !body.trim()) {
      return NextResponse.json(
        { error: "Post body is required" },
        { status: 400 }
      );
    }

    const { data: post, error } = await supabase
      .from("district_posts")
      .insert({
        district: districtNum,
        author_id: user.id,
        post_type: post_type || "update",
        title: title || null,
        body: body.trim(),
        image_url: image_url || null,
        video_url: video_url || null,
        media_type: media_type || null,
        is_published: true,
        reaction_counts: {},
      })
      .select("*, author:profiles!district_posts_author_id_fkey(id, display_name, avatar_url, handle, role)")
      .single();

    if (error) throw error;

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Create district post error:", error);
    return NextResponse.json(
      { error: "Failed to create district post" },
      { status: 500 }
    );
  }
}
