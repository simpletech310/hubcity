import { createClient } from "@/lib/supabase/server";
import ModerationClient from "./ModerationClient";

// Normalize Supabase joined-relation arrays to single objects (or null)
function firstOrNull<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null;
  return Array.isArray(val) ? (val[0] ?? null) : val;
}

export default async function AdminModerationPage() {
  const supabase = await createClient();

  // Fetch pending content reports for posts
  const { data: postReports } = await supabase
    .from("content_reports")
    .select("content_id")
    .eq("content_type", "post")
    .eq("status", "pending");

  const postIds = [...new Set((postReports ?? []).map((r) => r.content_id))];

  // Fetch pending content reports for reels
  const { data: reelReports } = await supabase
    .from("content_reports")
    .select("content_id")
    .eq("content_type", "reel")
    .eq("status", "pending");

  const reelIds = [...new Set((reelReports ?? []).map((r) => r.content_id))];

  // Fetch the actual flagged posts
  const { data: rawPosts } =
    postIds.length > 0
      ? await supabase
          .from("posts")
          .select(
            "id, body, image_url, author_id, created_at, is_published, author:profiles!posts_author_id_fkey(display_name, handle, avatar_url)"
          )
          .in("id", postIds)
          .order("created_at", { ascending: false })
          .limit(50)
      : { data: [] };

  // Fetch the actual flagged reels
  const { data: rawReels } =
    reelIds.length > 0
      ? await supabase
          .from("reels")
          .select(
            "id, caption, poster_url, author_id, created_at, is_published, author:profiles!reels_author_id_fkey(display_name, handle)"
          )
          .in("id", reelIds)
          .order("created_at", { ascending: false })
          .limit(50)
      : { data: [] };

  // Normalize joined arrays → single objects
  const flaggedPosts = (rawPosts ?? []).map((p) => ({
    ...p,
    author: firstOrNull(p.author as Parameters<typeof firstOrNull>[0]),
  }));
  const flaggedReels = (rawReels ?? []).map((r) => ({
    ...r,
    author: firstOrNull(r.author as Parameters<typeof firstOrNull>[0]),
  }));

  return (
    <ModerationClient
      posts={flaggedPosts}
      reels={flaggedReels}
    />
  );
}
