import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/chamber/analytics?start=YYYY-MM-DD&end=YYYY-MM-DD
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify chamber_admin or admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["chamber_admin", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start") || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const endDate = searchParams.get("end") || new Date().toISOString();

    const { data, error } = await supabase.rpc("get_chamber_analytics", {
      start_date: startDate,
      end_date: endDate,
    });

    if (error) throw error;

    return NextResponse.json({ analytics: data });
  } catch (error) {
    console.error("Chamber analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
