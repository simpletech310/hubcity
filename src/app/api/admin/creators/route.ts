import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function requireAdminOrOfficial(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "city_official"].includes(profile.role)) return null;
  return user;
}

// GET /api/admin/creators — list creator applications
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const admin = await requireAdminOrOfficial(supabase);
    if (!admin) {
      return NextResponse.json(
        { error: "Admin or city official access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("creator_applications")
      .select(
        "*, applicant:user_id(id, display_name, handle, avatar_url, district)"
      )
      .order("created_at", { ascending: false });

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query = query.eq("status", status);
    }

    const { data: applications, error } = await query;

    if (error) throw error;

    // Calculate stats for the admin dashboard
    const { count: totalCount } = await supabase
      .from("creator_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved");

    const { count: pendingCount } = await supabase
      .from("creator_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const { count: activeMonthCount } = await supabase
      .from("creator_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved")
      .gte("reviewed_at", thisMonthStart.toISOString());

    return NextResponse.json({
      applications,
      stats: {
        total: totalCount ?? 0,
        pending: pendingCount ?? 0,
        activeMonth: activeMonthCount ?? 0,
      },
    });
  } catch (error) {
    console.error("Admin list creator applications error:", error);
    return NextResponse.json(
      { error: "Failed to list applications" },
      { status: 500 }
    );
  }
}
