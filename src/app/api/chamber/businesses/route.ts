import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/chamber/businesses — list all businesses for chamber management
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["chamber_admin", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    let query = supabase
      .from("businesses")
      .select("id, name, slug, business_type, business_sub_type, chamber_status, chamber_notes, category, is_mobile_vendor, rating_avg, rating_count, created_at, owner:profiles!businesses_owner_id_fkey(display_name, email)")
      .order("name", { ascending: true });

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }
    if (type) {
      query = query.eq("business_type", type);
    }
    if (status) {
      query = query.eq("chamber_status", status);
    }

    const { data: businesses, error } = await query.limit(100);
    if (error) throw error;

    return NextResponse.json({ businesses: businesses || [] });
  } catch (error) {
    console.error("Chamber businesses fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch businesses" }, { status: 500 });
  }
}
