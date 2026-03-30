import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: posts, error } = await supabase
      .from("posts")
      .select("hashtags")
      .not("hashtags", "is", null)
      .gte("created_at", sevenDaysAgo)
      .eq("is_published", true)
      .limit(500);

    if (error) throw error;

    // Count hashtags in JS
    const counts: Record<string, number> = {};
    for (const post of posts || []) {
      for (const tag of (post.hashtags as string[]) || []) {
        const normalized = tag.toLowerCase();
        counts[normalized] = (counts[normalized] || 0) + 1;
      }
    }

    // Sort by count descending and take top 10
    const trending = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([hashtag, count]) => ({ hashtag, count }));

    return NextResponse.json({ trending });
  } catch (error) {
    console.error("Trending hashtags error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending hashtags" },
      { status: 500 }
    );
  }
}
