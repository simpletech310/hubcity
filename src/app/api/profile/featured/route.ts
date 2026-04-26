import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { FeaturedKind } from "@/lib/featured-media";

const VALID_KINDS: FeaturedKind[] = ["reel", "video", "post", "track", "exhibit"];

/**
 * Pin a piece of media as the user's featured slot.
 * Server enforces that the row belongs to the caller before saving.
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const kind = body.kind as FeaturedKind | undefined;
    const id = body.id as string | undefined;
    const caption = (body.caption as string | undefined) ?? null;

    if (!kind || !id) {
      return NextResponse.json({ error: "kind and id are required" }, { status: 400 });
    }
    if (!VALID_KINDS.includes(kind)) {
      return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
    }

    // Ownership check per kind.
    let owns = false;
    switch (kind) {
      case "reel": {
        const { data } = await supabase
          .from("reels")
          .select("author_id")
          .eq("id", id)
          .maybeSingle();
        owns = data?.author_id === user.id;
        break;
      }
      case "video": {
        // channel_videos belong to a channel — owner is channels.owner_id
        const { data } = await supabase
          .from("channel_videos")
          .select("channel:channels!inner(owner_id)")
          .eq("id", id)
          .maybeSingle();
        const channel = Array.isArray(data?.channel)
          ? (data?.channel[0] as { owner_id: string } | undefined)
          : ((data?.channel as { owner_id: string } | null) ?? undefined);
        owns = channel?.owner_id === user.id;
        break;
      }
      case "post": {
        const { data } = await supabase
          .from("posts")
          .select("author_id")
          .eq("id", id)
          .maybeSingle();
        owns = data?.author_id === user.id;
        break;
      }
      case "track": {
        const { data } = await supabase
          .from("tracks")
          .select("creator_id")
          .eq("id", id)
          .maybeSingle();
        owns = data?.creator_id === user.id;
        break;
      }
      case "exhibit": {
        const { data } = await supabase
          .from("profile_gallery_images")
          .select("owner_id")
          .eq("id", id)
          .maybeSingle();
        owns = data?.owner_id === user.id;
        break;
      }
    }

    if (!owns) {
      return NextResponse.json(
        { error: "You can only feature media you own" },
        { status: 403 }
      );
    }

    const { data: updated, error } = await supabase
      .from("profiles")
      .update({
        featured_kind: kind,
        featured_id: id,
        featured_caption: caption,
        featured_set_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select("featured_kind, featured_id, featured_caption, featured_set_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ featured: updated });
  } catch (err) {
    console.error("Pin featured error:", err);
    return NextResponse.json({ error: "Failed to pin featured media" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase
      .from("profiles")
      .update({
        featured_kind: null,
        featured_id: null,
        featured_caption: null,
        featured_set_at: null,
      })
      .eq("id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Clear featured error:", err);
    return NextResponse.json({ error: "Failed to clear featured media" }, { status: 500 });
  }
}
