import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStrictRateLimiter, checkRateLimit } from "@/lib/ratelimit";

// GET — fetch school posts (public, paginated)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "24"), 48);
    const offset = (page - 1) * limit;

    // Resolve slug → id
    const schoolId = await resolveSchoolId(supabase, id);
    if (!schoolId) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const { data: posts, error } = await supabase
      .from("posts")
      .select(
        "id, body, image_url, media_type, mux_playback_id, video_status, like_count, comment_count, created_at, author:profiles(id, display_name, avatar_url)"
      )
      .eq("school_id", schoolId)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Get total count
    const { count } = await supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("is_published", true);

    return NextResponse.json({
      posts: posts ?? [],
      total: count ?? 0,
      page,
      limit,
      has_more: (count ?? 0) > offset + limit,
    });
  } catch (error) {
    console.error("Fetch school posts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch school posts" },
      { status: 500 }
    );
  }
}

// POST — create a school post (school admins only)
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

    const rl = await checkRateLimit(getStrictRateLimiter(), user.id);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", reset: rl.reset },
        { status: 429 }
      );
    }

    // Resolve slug → id
    const schoolId = await resolveSchoolId(supabase, id);
    if (!schoolId) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Check school admin permission
    const isAdmin = await checkSchoolAdmin(supabase, schoolId, user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only school admins can post to this school" },
        { status: 403 }
      );
    }

    let body: string | undefined;
    let image_url: string | undefined;
    try {
      const parsed = await request.json();
      body = parsed.body;
      image_url = parsed.image_url;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    if (!body?.trim() && !image_url) {
      return NextResponse.json(
        { error: "Post must have text or an image" },
        { status: 400 }
      );
    }

    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        author_id: user.id,
        body: body?.trim() || "",
        image_url: image_url || null,
        school_id: schoolId,
      })
      .select(
        "id, body, image_url, created_at, author:profiles(id, display_name, avatar_url)"
      )
      .single();

    if (error) throw error;

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Create school post error:", error);
    return NextResponse.json(
      { error: "Failed to create school post" },
      { status: 500 }
    );
  }
}

// ── Helpers ──────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveSchoolId(supabase: any, idOrSlug: string): Promise<string | null> {
  // Try UUID first
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(idOrSlug)) {
    const { data } = await supabase
      .from("schools")
      .select("id")
      .eq("id", idOrSlug)
      .single();
    return data?.id ?? null;
  }

  // Otherwise slug
  const { data } = await supabase
    .from("schools")
    .select("id")
    .eq("slug", idOrSlug)
    .single();
  return data?.id ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function checkSchoolAdmin(supabase: any, schoolId: string, userId: string): Promise<boolean> {
  // Platform admins can always post
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profile?.role === "admin" || profile?.role === "city_official") {
    return true;
  }

  // Check school_admins table
  const { data } = await supabase
    .from("school_admins")
    .select("id")
    .eq("school_id", schoolId)
    .eq("user_id", userId)
    .limit(1);

  return data && data.length > 0;
}
