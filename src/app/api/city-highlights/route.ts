import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ReactionEmoji } from "@/types/database";

const ALLOWED_ROLES = [
  "admin",
  "city_official",
  "city_ambassador",
  "business_owner",
  "content_creator",
  "creator",
];

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: highlights, error } = await supabase
      .from("city_highlights")
      .select(
        `
        id,
        author_id,
        media_url,
        media_type,
        caption,
        link_url,
        link_label,
        media_width,
        media_height,
        view_count,
        reaction_counts,
        is_published,
        expires_at,
        created_at,
        author:profiles!city_highlights_author_id_fkey(
          id,
          display_name,
          handle,
          avatar_url,
          role
        )
      `
      )
      .eq("is_published", true)
      .or("expires_at.is.null,expires_at.gt.now()")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    // If authenticated, fetch user's reactions
    const {
      data: { user },
    } = await supabase.auth.getUser();
    let userReactions: Record<string, ReactionEmoji[]> = {};

    if (user && highlights && highlights.length > 0) {
      const ids = highlights.map((h) => h.id);
      const { data: reactions } = await supabase
        .from("highlight_reactions")
        .select("highlight_id, emoji")
        .eq("user_id", user.id)
        .in("highlight_id", ids);

      if (reactions) {
        for (const r of reactions) {
          if (!userReactions[r.highlight_id]) {
            userReactions[r.highlight_id] = [];
          }
          userReactions[r.highlight_id].push(r.emoji as ReactionEmoji);
        }
      }
    }

    return NextResponse.json({
      highlights: highlights ?? [],
      userReactions,
    });
  } catch (error) {
    console.error("City highlights fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch highlights" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: "Not authorized to create highlights" }, { status: 403 });
    }

    const body = await request.json();
    const {
      media_url,
      media_type,
      caption,
      link_url,
      link_label,
      media_width,
      media_height,
      expires_in_hours,
    } = body;

    if (!media_url || !media_type) {
      return NextResponse.json({ error: "media_url and media_type are required" }, { status: 400 });
    }

    if (!["image", "video"].includes(media_type)) {
      return NextResponse.json({ error: "media_type must be image or video" }, { status: 400 });
    }

    // Calculate expires_at
    let expires_at: string | null = null;
    if (expires_in_hours === 0 || expires_in_hours === null) {
      // Permanent
      expires_at = null;
    } else {
      const hours = expires_in_hours ?? 168; // Default 7 days
      expires_at = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    }

    const adminClient = createAdminClient();
    const { data: highlight, error } = await adminClient
      .from("city_highlights")
      .insert({
        author_id: user.id,
        media_url,
        media_type,
        caption: caption || null,
        link_url: link_url || null,
        link_label: link_label || null,
        media_width: media_width || null,
        media_height: media_height || null,
        expires_at,
      })
      .select(
        `
        *,
        author:profiles!city_highlights_author_id_fkey(
          id,
          display_name,
          handle,
          avatar_url,
          role
        )
      `
      )
      .single();

    if (error) throw error;

    return NextResponse.json({ highlight });
  } catch (error) {
    console.error("Create highlight error:", error);
    return NextResponse.json(
      { error: "Failed to create highlight" },
      { status: 500 }
    );
  }
}
