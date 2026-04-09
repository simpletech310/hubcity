import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ district: string }> }
) {
  const { district } = await params;
  const districtNum = parseInt(district);
  if (isNaN(districtNum) || districtNum < 1 || districtNum > 4) {
    return NextResponse.json({ error: "Invalid district" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: posts, error } = await supabase
    .from("district_posts")
    .select(
      "id, image_url, video_url, media_type, created_at, author:profiles!district_posts_author_id_fkey(id, display_name, avatar_url)"
    )
    .eq("district", districtNum)
    .or("image_url.not.is.null,video_url.not.is.null")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ media: posts });
}
