import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — List all active departments ordered by sort_order
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("city_departments")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ departments: data ?? [] });
  } catch (error) {
    console.error("Departments fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch departments" },
      { status: 500 }
    );
  }
}

// POST — Create a new department (admin/city_official only)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "city_official", "city_ambassador"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { data, error } = await supabase
      .from("city_departments")
      .insert(body)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ department: data }, { status: 201 });
  } catch (error) {
    console.error("Department create error:", error);
    return NextResponse.json(
      { error: "Failed to create department" },
      { status: 500 }
    );
  }
}
