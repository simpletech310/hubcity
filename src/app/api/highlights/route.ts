import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: highlights, error } = await supabase
      .from("posts")
      .select(
        `
        id,
        body,
        video_url,
        image_url,
        created_at,
        author:profiles!posts_author_id_fkey(
          id,
          display_name,
          handle,
          avatar_url,
          role
        )
      `
      )
      .eq("is_highlight", true)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json({ highlights: highlights ?? [] });
  } catch (error) {
    console.error("Highlights fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch highlights" },
      { status: 500 }
    );
  }
}
