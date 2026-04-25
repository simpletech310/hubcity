import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type GalleryEntry = {
  id: string;
  source: "curated" | "post";
  media_type: "image" | "video";
  image_url: string | null;
  video_url: string | null;
  poster_url: string | null;
  caption: string | null;
  created_at: string;
  author: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
};

/**
 * GET /api/groups/[id]/gallery
 * Returns a merged feed of:
 *   1) Admin-curated `group_gallery_items` (newest first)
 *   2) Image / video media that group members shared as posts
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const [curatedRes, postsRes] = await Promise.all([
      supabase
        .from("group_gallery_items")
        .select(
          "id, media_type, media_url, poster_url, caption, created_at, uploaded_by, author:profiles!group_gallery_items_uploaded_by_fkey(id, display_name, avatar_url)"
        )
        .eq("group_id", id)
        .order("sort_order", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(80),
      supabase
        .from("group_posts")
        .select(
          "id, image_url, video_url, media_type, created_at, author:profiles!group_posts_author_id_fkey(id, display_name, avatar_url)"
        )
        .eq("group_id", id)
        .eq("is_published", true)
        .or("image_url.neq.,video_url.neq.")
        .order("created_at", { ascending: false })
        .limit(80),
    ]);

    if (curatedRes.error) throw curatedRes.error;
    if (postsRes.error) throw postsRes.error;

    const curated: GalleryEntry[] = (curatedRes.data ?? []).map((row) => {
      const r = row as unknown as {
        id: string;
        media_type: "image" | "video";
        media_url: string;
        poster_url: string | null;
        caption: string | null;
        created_at: string;
        author: { id: string; display_name: string; avatar_url: string | null } | null;
      };
      return {
        id: r.id,
        source: "curated",
        media_type: r.media_type,
        image_url: r.media_type === "image" ? r.media_url : null,
        video_url: r.media_type === "video" ? r.media_url : null,
        poster_url: r.poster_url,
        caption: r.caption,
        created_at: r.created_at,
        author: r.author,
      };
    });

    const fromPosts: GalleryEntry[] = (postsRes.data ?? [])
      .filter((p) => {
        const post = p as unknown as { image_url: string | null; video_url: string | null };
        return !!(post.image_url || post.video_url);
      })
      .map((p) => {
        const post = p as unknown as {
          id: string;
          image_url: string | null;
          video_url: string | null;
          media_type: string | null;
          created_at: string;
          author: { id: string; display_name: string; avatar_url: string | null } | null;
        };
        const isVideo = !!post.video_url;
        return {
          id: post.id,
          source: "post",
          media_type: isVideo ? "video" : "image",
          image_url: post.image_url,
          video_url: post.video_url,
          poster_url: null,
          caption: null,
          created_at: post.created_at,
          author: post.author,
        };
      });

    // Curated first, posts beneath. Both already sorted newest-first within
    // their slice — admins get top-of-grid placement.
    const media = [...curated, ...fromPosts];

    return NextResponse.json({ media });
  } catch (error) {
    console.error("Fetch group gallery error:", error);
    return NextResponse.json({ error: "Failed to fetch gallery" }, { status: 500 });
  }
}

/**
 * POST /api/groups/[id]/gallery
 * Admin / moderator uploads a curated image or video. Client uploads the
 * file to Supabase Storage first, then sends the resulting URL + path here.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin / moderator
    const { data: membership } = await supabase
      .from("group_members")
      .select("role, status")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (
      !membership ||
      membership.status !== "active" ||
      !["admin", "moderator"].includes(membership.role)
    ) {
      return NextResponse.json(
        { error: "Only group admins can add to the gallery" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      media_type,
      media_url,
      media_path,
      poster_url,
      poster_path,
      caption,
    } = body as {
      media_type?: string;
      media_url?: string;
      media_path?: string;
      poster_url?: string | null;
      poster_path?: string | null;
      caption?: string | null;
    };

    if (
      !media_type ||
      !media_url ||
      !media_path ||
      !["image", "video"].includes(media_type)
    ) {
      return NextResponse.json(
        { error: "media_type ('image'|'video'), media_url, media_path are required" },
        { status: 400 }
      );
    }

    const { data: item, error } = await supabase
      .from("group_gallery_items")
      .insert({
        group_id: groupId,
        uploaded_by: user.id,
        media_type,
        media_url,
        media_path,
        poster_url: poster_url ?? null,
        poster_path: poster_path ?? null,
        caption: caption?.trim() || null,
      })
      .select(
        "id, media_type, media_url, poster_url, caption, created_at, uploaded_by, author:profiles!group_gallery_items_uploaded_by_fkey(id, display_name, avatar_url)"
      )
      .single();

    if (error) throw error;

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Upload gallery item error:", error);
    return NextResponse.json(
      { error: "Failed to upload gallery item" },
      { status: 500 }
    );
  }
}
