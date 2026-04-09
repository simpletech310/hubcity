import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_STATUSES = [
  "reported",
  "acknowledged",
  "in_progress",
  "resolved",
  "closed",
] as const;

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
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  if (status && !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  let query = supabase
    .from("city_issues")
    .select(
      "id, type, title, description, location_text, district, image_url, status, priority, upvote_count, created_at"
    )
    .eq("district", districtNum)
    .order("created_at", { ascending: false })
    .limit(30);

  if (status) {
    query = query.eq("status", status);
  }

  const { data: issues, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ issues });
}
