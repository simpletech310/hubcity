import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = request.nextUrl;

  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");

  const now = new Date();
  const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1; // 1-indexed from query
  const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

  // Build date range for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const { data, error } = await supabase
    .from("events")
    .select("id, title, start_date, end_date, location, category, description")
    .eq("category", "culture")
    .gte("start_date", startDate.toISOString())
    .lte("start_date", endDate.toISOString())
    .order("start_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
