import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const level = searchParams.get("level");
    const search = searchParams.get("search");

    let query = supabase
      .from("schools")
      .select("*")
      .eq("is_published", true)
      .order("name");

    if (level) {
      query = query.eq("level", level);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,address.ilike.%${search}%,mascot.ilike.%${search}%,tagline.ilike.%${search}%`
      );
    }

    const { data: schools, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      schools: schools ?? [],
      total: schools?.length ?? 0,
    });
  } catch (error) {
    console.error("Schools list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch schools" },
      { status: 500 }
    );
  }
}
