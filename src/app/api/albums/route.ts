import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/**
 * POST /api/albums
 * Create a new album under the signed-in creator. Pairs with the existing
 * PATCH at /api/albums/[id]. Tracks (audio uploads) stay seed-script-only
 * for v1; this endpoint just creates the shell.
 *
 * Required body: title
 * Optional: description, release_type, cover_art_url, genre_slug, release_date,
 *           is_published
 */
export async function POST(request: Request) {
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
      .select("role, is_creator")
      .eq("id", user.id)
      .single();
    const isAdmin = profile?.role === "admin";
    const isCreator =
      profile?.is_creator === true || profile?.role === "content_creator";
    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: "Creator role required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }

    // Try to land the user's own channel for the optional channel_id link,
    // matches what the seed flow sets.
    const { data: channel } = await supabase
      .from("channels")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    // Resolve a unique slug — base + numeric suffix on collision.
    const base = slugify(title) || "untitled";
    let slug = base;
    for (let i = 1; i < 25; i += 1) {
      const { data: existing } = await supabase
        .from("albums")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!existing) break;
      slug = `${base}-${i}`;
    }

    const release_type = ["single", "ep", "album", "mixtape"].includes(
      body.release_type,
    )
      ? body.release_type
      : "single";

    const insert: Record<string, unknown> = {
      title,
      slug,
      creator_id: user.id,
      channel_id: channel?.id ?? null,
      description:
        typeof body.description === "string"
          ? body.description.trim() || null
          : null,
      release_type,
      cover_art_url:
        typeof body.cover_art_url === "string"
          ? body.cover_art_url.trim() || null
          : null,
      genre_slug:
        typeof body.genre_slug === "string"
          ? body.genre_slug.trim() || null
          : null,
      release_date:
        typeof body.release_date === "string" && body.release_date
          ? body.release_date
          : null,
      is_published: body.is_published === true,
    };

    const { data, error } = await supabase
      .from("albums")
      .insert(insert)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ album: data }, { status: 201 });
  } catch (err) {
    console.error("Album POST error:", err);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
